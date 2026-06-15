import { Repository } from 'typeorm';
import { TrackerSession } from '../tracking/entities/tracker-session.entity';
import { ComponentViewCount } from '../tracking/entities/component-view-count.entity';
import { PbiActivityEvent } from '../activity/entities/pbi-activity-event.entity';
import { PbiUser } from '../users/entities/pbi-user.entity';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
export interface OverviewResult {
    activeUsers: number;
    totalEngagedHours: number;
    avgEngagedMinPerUser: number;
    topDashboard: {
        id: string;
        name: string;
        engagedSeconds: number;
    } | null;
    mostViewedReport: {
        id: string;
        name: string | null;
        viewCount: number;
    } | null;
}
export interface TopViewRow {
    componentId: string;
    componentName: string | null;
    componentType: string;
    totalViews: number;
    uniqueViewers: number;
    lastViewedAt: Date | null;
}
export interface UserViewRow {
    componentId: string;
    componentName: string | null;
    componentType: string;
    viewCount: number;
    lastViewedAt: Date | null;
}
export interface ComponentViewerRow {
    userId: string;
    userEmail: string | null;
    viewCount: number;
    lastViewedAt: Date | null;
    totalEngagedSeconds: number;
}
export interface UserRow {
    userId: string;
    userEmail: string | null;
    department: string | null;
    totalEngagedSeconds: number;
    lastSeen: Date | null;
    sessionCount: number;
    totalViews: number;
}
export interface DashboardRow {
    dashboardId: string;
    engagedSeconds: number;
    uniqueUsers: number;
    visitCount: number;
    copyCount: number;
    scrollCount: number;
}
export interface ReportRow {
    reportId: string;
    reportName: string | null;
    viewCount: number;
    exportCount: number;
    filterCount: number;
    shareCount: number;
    printCount: number;
    uniqueUsers: number;
}
export interface UserDetailResult {
    user: {
        userId: string;
        userEmail: string | null;
        department: string | null;
        totalEngagedSeconds: number;
        totalViews: number;
    };
    sessions: Array<{
        id: string;
        dashboardId: string;
        tabName: string | null;
        startedAt: Date;
        engagedSeconds: number;
        clickCount: number;
        scrollCount: number;
        copyCount: number;
    }>;
    views: UserViewRow[];
    audit: Array<{
        activityType: string;
        reportName: string | null;
        activityAt: Date;
    }>;
}
export declare class EngagementAnalyticsService {
    private readonly sessionRepo;
    private readonly viewRepo;
    private readonly activityRepo;
    private readonly userRepo;
    constructor(sessionRepo: Repository<TrackerSession>, viewRepo: Repository<ComponentViewCount>, activityRepo: Repository<PbiActivityEvent>, userRepo: Repository<PbiUser>);
    getOverview(query: AnalyticsQueryDto): Promise<OverviewResult>;
    getTopViews(query: AnalyticsQueryDto, type?: string, limit?: number): Promise<TopViewRow[]>;
    getViewsByUser(userId: string, query: AnalyticsQueryDto): Promise<UserViewRow[]>;
    getViewsByComponent(type: string, id: string): Promise<ComponentViewerRow[]>;
    getUsers(query: AnalyticsQueryDto): Promise<UserRow[]>;
    getUserDetail(userId: string, query: AnalyticsQueryDto): Promise<UserDetailResult>;
    getDashboards(query: AnalyticsQueryDto): Promise<DashboardRow[]>;
    getReports(query: AnalyticsQueryDto): Promise<ReportRow[]>;
    private since;
    private sessionScope;
    private viewScope;
    private applyDepartmentUserFilter;
}
