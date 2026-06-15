import { ActivityService } from './activity.service';
import { PbiActivityEvent } from './entities/pbi-activity-event.entity';
export declare class ActivityController {
    private readonly activityService;
    constructor(activityService: ActivityService);
    getFilteredActivities(from?: string, to?: string, userId?: string, workspaceId?: string, reportId?: string): Promise<PbiActivityEvent[]>;
    getSyncStatus(): Promise<any>;
    triggerBackfill(days?: string): Promise<{
        message: string;
    }>;
}
