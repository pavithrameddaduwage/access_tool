// src/powerbi-metrics/tasks/powerbi-logs-collector.task.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PowerBILogEntry, PowerBIMetricsService } from '../powerbi-metrics.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { PowerBILog } from '../entities/powerbi-log.entity';

@Injectable()
export class PowerBILogsCollectorTask {
  private readonly logger = new Logger(PowerBILogsCollectorTask.name);

  constructor(
    private readonly powerbiMetricsService: PowerBIMetricsService,
    @InjectRepository(PowerBILog)
    private readonly powerbiLogRepository: Repository<PowerBILog>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM) // Runs at 2 AM daily
  async collectPreviousDayLogs() {
    try {
      this.logger.log('Starting Power BI logs collection for previous day');
      
      // Set time range for full day (00:00:00 to 23:59:59)
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() - 1); // Yesterday
      endDate.setHours(23, 59, 59, 999);
      
      const startDate = new Date(endDate);
      startDate.setHours(0, 0, 0, 0);

      // Check if we already have data for this date range
      const existingCount = await this.powerbiLogRepository.count({
        where: {
          creationTime: Between(startDate, endDate),
          workload: 'PowerBI',
          operation: 'ViewReport',
        },
      });

      if (existingCount > 0) {
        this.logger.warn(`Already have ${existingCount} logs for this date range, skipping collection`);
        return;
      }

      // Get access token and ensure subscription
      const accessToken = await this.powerbiMetricsService.getAccessToken();
      await this.powerbiMetricsService.ensureSubscription(accessToken);
      
      // Get content URIs and fetch logs (same as your collectRawData endpoint)
      const contentUris = await this.powerbiMetricsService.getContentUris(accessToken, startDate, endDate);
      const allLogs = await Promise.all(
        contentUris.map(uri => 
          this.powerbiMetricsService.getLogEntries(uri, accessToken)
            .catch(e => {
              this.logger.error(`Failed to process URI ${uri}: ${e.message}`);
              return [];
            })
        )
      );

      // Filter and process logs
      const powerBILogs = allLogs.flat().filter(
        entry => entry.Workload === 'PowerBI' && entry.Operation === 'ViewReport'
      );

      // Additional duplicate check at the record level
      const newLogs = await this.filterExistingLogs(powerBILogs);
      
      if (newLogs.length > 0) {
        await this.powerbiMetricsService.saveRawLogs(newLogs);
        this.logger.log(`Successfully saved ${newLogs.length} new logs for ${startDate.toISOString().split('T')[0]}`);
      } else {
        this.logger.log('No new logs to save');
      }
    } catch (error) {
      this.logger.error('Failed to collect Power BI logs', error.stack);
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
}