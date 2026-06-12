import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ActivityService } from '../activity/activity.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { SyncLogService } from '../sync-log/sync-log.service';

@Injectable()
export class PbiSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PbiSchedulerService.name);

  constructor(
    private readonly activityService: ActivityService,
    private readonly workspacesService: WorkspacesService,
    private readonly syncLogService: SyncLogService,
  ) {}

  // Trigger tasks after the application boots up
  async onApplicationBootstrap() {
    this.logger.log('Power BI Tracker Scheduler initialized. Checking startup tasks...');

    if (process.env.POWER_BI_BOOTSTRAP_SYNC !== 'true') {
      this.logger.log('Startup Power BI sync is disabled. Set POWER_BI_BOOTSTRAP_SYNC=true to enable it.');
      return;
    }

    // 1. If workspaces table is empty, run workspace sync
    try {
      const isWsEmpty = await this.workspacesService.isWorkspacesEmpty();
      if (isWsEmpty) {
        this.logger.log('Workspaces table is empty. Triggering initial workspace sync...');
        await this.workspacesService.syncAll();
      }
    } catch (err) {
      this.logger.error('Failed to run initial workspace sync on startup', err.message);
    }

    // 2. Check if historical backfill is needed (e.g. no activity logs exist)
    try {
      const syncLogs = await this.syncLogService.getStatus();
      const hasActivitySync = syncLogs.some(log => log.syncType === 'activity' && log.status === 'success');
      
      if (!hasActivitySync) {
        this.logger.log('No successful activity logs found. Starting 90-day automatic historical backfill...');
        // Trigger backfill in background
        this.activityService.triggerBackfill(90).catch(err => {
          this.logger.error('Startup automatic backfill failed', err.stack);
        });
      }
    } catch (err) {
      this.logger.error('Failed to run startup backfill check', err.message);
    }
  }

  // Daily activity fetch + session calculation now live in PowerBiSyncService
  // (2 AM sync via admin/activityevents, then session recalculation right after).
  // The old 1 AM cron was removed to avoid running session-calc before the fetch.

  // Weekly workspace sync on Sunday at 02:00 AM
  @Cron('0 0 2 * * 0')
  async handleWeeklyWorkspaceSync() {
    this.logger.log('Triggering weekly scheduled task: Syncing all workspaces, reports, dashboards...');
    try {
      await this.workspacesService.syncAll();
      this.logger.log('Weekly workspace sync scheduled task completed successfully.');
    } catch (error) {
      this.logger.error('Weekly workspace sync scheduled task failed', error.stack);
    }
  }
}
