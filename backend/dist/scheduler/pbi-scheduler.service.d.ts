import { OnApplicationBootstrap } from '@nestjs/common';
import { ActivityService } from '../activity/activity.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { SyncLogService } from '../sync-log/sync-log.service';
export declare class PbiSchedulerService implements OnApplicationBootstrap {
    private readonly activityService;
    private readonly workspacesService;
    private readonly syncLogService;
    private readonly logger;
    constructor(activityService: ActivityService, workspacesService: WorkspacesService, syncLogService: SyncLogService);
    onApplicationBootstrap(): Promise<void>;
    handleWeeklyWorkspaceSync(): Promise<void>;
}
