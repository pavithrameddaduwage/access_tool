// src/powerbi-metrics/tasks/powerbi-logs-collector.task.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PowerBILogEntry, PowerBIMetricsService } from '../powerbi-metrics.service';
import { Between, In, Repository } from 'typeorm';
import { PowerBILog } from '../entities/powerbi-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment-timezone';

@Injectable()
export class PowerBILogsCollectorTask implements OnApplicationBootstrap {
  private readonly logger = new Logger(PowerBILogsCollectorTask.name);

  constructor(
    private readonly powerbiMetricsService: PowerBIMetricsService,
    @InjectRepository(PowerBILog)
    private readonly powerbiLogRepository: Repository<PowerBILog>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Application bootstrap: triggering Workspace/Dashboard mappings sync to Master Data');
    await this.powerbiMetricsService.syncMappingsToMasterData();

    this.logger.log('Application bootstrap: triggering User roster sync from Power BI logs');
    await this.powerbiMetricsService.syncUsersFromLogs();

    this.logger.log('Application bootstrap: triggering initial Power BI log collection');
    this.collectRealTimeLogs().catch(err => {
      this.logger.error('Initial bootstrap log collection failed', err.stack);
    });
  }

  @Cron('0 */10 * * * *')  
  async collectRealTimeLogs() {
    try {
      this.logger.log('Starting real-time Power BI logs collection (last 24 hours)');
      const now = new Date();
      // Start from 24 hours ago to make sure no logs are missed due to delays
      const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const endDate = now;

      this.logger.debug(`Time window: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const accessToken = await this.powerbiMetricsService.getAccessToken();
      this.logger.debug('Access token retrieved successfully');
      await this.powerbiMetricsService.ensureSubscription(accessToken);
      this.logger.debug('Subscription checked/ensured');
      
      const contentUris = await this.powerbiMetricsService.getContentUris(accessToken, startDate, endDate);
      this.logger.debug(`Found ${contentUris.length} content URIs`);

      if (contentUris.length === 0) {
        this.logger.log('No content URIs found for this period');
        return;
      }

      const allLogs = await Promise.all(
        contentUris.map(uri => 
          this.powerbiMetricsService.getLogEntries(uri, accessToken)
            .catch(e => {
              this.logger.error(`Failed to process URI ${uri}: ${e.message}`);
              return [];
            })
        )
      );

      const powerBILogs = allLogs.flat().filter(
        entry => entry.Workload === 'PowerBI' && entry.Operation === 'ViewReport'
      );

      this.logger.debug(`Fetched ${powerBILogs.length} raw Power BI logs`);

      if (powerBILogs.length === 0) {
        this.logger.log('No Power BI ViewReport logs found');
        return;
      }

      const newLogs = await this.filterExistingLogs(powerBILogs);
      this.logger.debug(`Found ${newLogs.length} new logs to save`);

      if (newLogs.length > 0) {
        await this.powerbiMetricsService.saveRawLogs(newLogs);
        this.logger.log(`Successfully saved ${newLogs.length} new real-time logs`);
      } else {
        this.logger.log('No new logs to save');
      }
    } catch (error) {
      this.logger.error('Failed to collect real-time Power BI logs', error.stack);
    }
  }

  private async filterExistingLogs(logs: PowerBILogEntry[]): Promise<PowerBILogEntry[]> {
    if (logs.length === 0) return [];
    
    // Chunk logs queries to avoid SQL IN clause limits if logs array is extremely large
    const chunkSize = 500;
    const allExistingIds = new Set<string>();

    for (let i = 0; i < logs.length; i += chunkSize) {
      const chunk = logs.slice(i, i + chunkSize);
      const existingIds = await this.powerbiLogRepository.find({
        where: {
          id: In(chunk.map(l => l.Id)),
        },
        select: ['id'],
      });
      existingIds.forEach(l => allExistingIds.add(l.id));
    }

    return logs.filter(log => !allExistingIds.has(log.Id));
  }

  private formatDate(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' EDT';
  }
}