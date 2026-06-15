import { Module } from '@nestjs/common';
import { PbiSchedulerService } from './pbi-scheduler.service';
import { ActivityModule } from '../activity/activity.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { SyncLogModule } from '../sync-log/sync-log.module';

@Module({
  imports: [
    ActivityModule,
    AnalyticsModule,
    WorkspacesModule,
    SyncLogModule,
  ],
  providers: [PbiSchedulerService],
})
export class PbiSchedulerModule {}
