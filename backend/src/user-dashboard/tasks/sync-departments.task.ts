import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncUserDepartmentsService } from '../sync-user-departments.service';

@Injectable()
export class SyncDepartmentsTask {
  private readonly logger = new Logger(SyncDepartmentsTask.name);

  constructor(
    private syncService: SyncUserDepartmentsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron() {
    this.logger.log('Starting department synchronization from AD...');
    
    try {
      const result = await this.syncService.syncDepartments();
      this.logger.log(
        `Department sync completed. Checked: ${result.totalUsersChecked}, Updated: ${result.usersUpdated}`
      );
    } catch (error) {
      this.logger.error('Department synchronization failed:', error.message);
    }
  }
}