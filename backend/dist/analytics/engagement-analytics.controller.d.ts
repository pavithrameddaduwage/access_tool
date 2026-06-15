import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { EngagementAnalyticsService, OverviewResult, TopViewRow, UserViewRow, ComponentViewerRow, UserRow, DashboardRow, ReportRow, UserDetailResult } from './engagement-analytics.service';
export declare class EngagementAnalyticsController {
    private readonly analytics;
    constructor(analytics: EngagementAnalyticsService);
    getOverview(query: AnalyticsQueryDto): Promise<OverviewResult>;
    getDashboards(query: AnalyticsQueryDto): Promise<DashboardRow[]>;
    getReports(query: AnalyticsQueryDto): Promise<ReportRow[]>;
    getUsers(query: AnalyticsQueryDto): Promise<UserRow[]>;
    getUserDetail(id: string, query: AnalyticsQueryDto): Promise<UserDetailResult>;
    getTopViews(query: AnalyticsQueryDto, type?: string, limit?: number): Promise<TopViewRow[]>;
    getViewsByUser(userId: string, query: AnalyticsQueryDto): Promise<UserViewRow[]>;
    getViewsByComponent(type: string, id: string): Promise<ComponentViewerRow[]>;
}
