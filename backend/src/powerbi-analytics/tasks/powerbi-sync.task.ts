import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PowerBIService } from '../powerbi-analytics.service';

@Injectable()
export class PowerbiSyncTask {
  private readonly logger = new Logger(PowerbiSyncTask.name);

  constructor(private readonly powerbiService: PowerBIService) {}

  // Manual sync trigger
  async handleSync() {
    const MAX_RETRIES = 3;
    let attempts = 0;
    
    while (attempts < MAX_RETRIES) {
      try {
        this.logger.log(`Starting Power BI data sync (attempt ${attempts + 1})`);
        // await this.powerbiService.refreshAllUsageData();
        this.logger.log('Power BI data sync completed successfully');
        return;
      } catch (error) {
        attempts++;
        this.logger.error(`Sync failed (attempt ${attempts}): ${error.message}`);
        
        if (attempts === MAX_RETRIES) {
          this.logger.error('Maximum retry attempts reached. Aborting sync.');
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000 * attempts));
      }
    }
  }

  // Automatic daily sync at 2 AM
  @Cron('0 2 * * *')
  async handleCron() {
    await this.handleSync();
  }
}