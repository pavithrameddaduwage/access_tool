// src/powerbi-metrics/tasks/powerbi-logs-collector.task.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PowerBILogEntry, PowerBIMetricsService } from '../powerbi-metrics.service';
import { Between, In, Repository } from 'typeorm';
import { PowerBILog } from '../entities/powerbi-log.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PowerBILogsCollectorTask {
  private readonly logger = new Logger(PowerBILogsCollectorTask.name);

  constructor(
    private readonly powerbiMetricsService: PowerBIMetricsService,
    @InjectRepository(PowerBILog)
    private readonly powerbiLogRepository: Repository<PowerBILog>,
  ) {}

  @Cron('0 50 19 * * *')  
  async collectPreviousDayLogs() {
    try {
      this.logger.log('Starting Power BI logs collection for previous day');
      
      const now = new Date();
      
      const endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1, 
        23, 59, 59, 999
      );
      
      const startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1, 
        0, 0, 0, 0
      );

      this.logger.debug(`Date range: ${this.formatDate(startDate)} to ${this.formatDate(endDate)}`);


      const accessToken = await this.powerbiMetricsService.getAccessToken();
      await this.powerbiMetricsService.ensureSubscription(accessToken);
      const contentUris = await this.powerbiMetricsService.getContentUris(accessToken, startDate, endDate);
      
      this.logger.debug(`Found ${contentUris.length} content URIs`);

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

      const newLogs = await this.filterExistingLogs(powerBILogs);
      this.logger.debug(`Found ${newLogs.length} new logs to save`);

      if (newLogs.length > 0) {
        await this.powerbiMetricsService.saveRawLogs(newLogs);
        this.logger.log(`Successfully saved ${newLogs.length} new logs for date ${this.formatDate(startDate)}`);
      } else {
        this.logger.log('No new logs to save');
      }
    } catch (error) {
      this.logger.error('Failed to collect Power BI logs', error.stack);
      throw error; 
    }
  }

  private async filterExistingLogs(logs: PowerBILogEntry[]): Promise<PowerBILogEntry[]> {
    const existingIds = await this.powerbiLogRepository.find({
      where: {
        id: In(logs.map(l => l.Id)),
      },
      select: ['id'],
    });

    const existingIdSet = new Set(existingIds.map(l => l.id));
    return logs.filter(log => !existingIdSet.has(log.Id));
  }

  private formatDate(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' EDT';
  }
}