import { PbiAnalyticsService } from './pbi-analytics.service';
import { PbiActivityEvent } from '../activity/entities/pbi-activity-event.entity';
export declare class PbiAnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: PbiAnalyticsService);
    getOverview(from?: string, to?: string): Promise<any>;
    getViews(workspaceId?: string, from?: string, to?: string): Promise<any[]>;
    getTopReports(workspaceId?: string, from?: string, to?: string, limit?: string): Promise<any[]>;
    getTopUsers(workspaceId?: string, from?: string, to?: string, limit?: string): Promise<any[]>;
    getDuration(userId?: string, reportId?: string, from?: string, to?: string): Promise<any[]>;
    getUserTimeline(userId: string, from?: string, to?: string): Promise<PbiActivityEvent[]>;
    getReportDetail(reportId: string, from?: string, to?: string): Promise<any[]>;
    getWorkspaceSummary(from?: string, to?: string): Promise<any[]>;
}
