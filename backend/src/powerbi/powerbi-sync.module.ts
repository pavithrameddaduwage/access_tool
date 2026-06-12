import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PowerBIModule } from './powerbi.module';
import { PowerBiSyncService } from './powerbi-sync.service';
import { SyncLogModule } from '../sync-log/sync-log.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PbiActivityEvent } from '../activity/entities/pbi-activity-event.entity';
import { ComponentViewCount } from '../tracking/entities/component-view-count.entity';

/**
 * Spec-compliant Power BI audit sync (admin/activityevents) + its 2 AM / 3 AM
 * crons. Reuses the existing `activity_events` + `sync_log` tables and feeds
 * `component_view_counts`.
 */
@Module({
  imports: [
    PowerBIModule,
    SyncLogModule,
    AnalyticsModule,
    TypeOrmModule.forFeature([PbiActivityEvent, ComponentViewCount]),
  ],
  providers: [PowerBiSyncService],
  exports: [PowerBiSyncService],
})
export class PowerBiSyncModule {}
