import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { PowerBILog } from './entities/powerbi-log.entity';
import { UserDashboard } from 'src/user-dashboard/entities/user-dashboard.entity';
import { Dashboard } from 'src/dashboard/entities/dashboard.entity';
export interface PowerBILogEntry {
    Id: string;
    RecordType: number;
    CreationTime: string;
    Operation: string;
    OrganizationId: string;
    UserType: number;
    UserKey: string;
    Workload: string;
    UserId: string;
    ClientIP?: string;
    UserAgent?: string;
    Activity?: string;
    ItemName?: string;
    WorkSpaceName?: string;
    DatasetName?: string;
    ReportName?: string;
    CapacityId?: string;
    CapacityName?: string;
    WorkspaceId?: string;
    ObjectId?: string;
    DatasetId?: string;
    ReportId?: string;
    ArtifactId?: string;
    ArtifactName?: string;
    IsSuccess?: boolean;
    ReportType?: string;
    RequestId?: string;
    ActivityId?: string;
    DistributionMethod?: string;
    ConsumptionMethod?: string;
    ArtifactKind?: string;
    RefreshEnforcementPolicy?: number;
    BillingType?: number;
}
export interface UserMetric {
    userId: string;
    email?: string;
    userName?: string;
    department?: string;
    count: number;
}
export interface UserDetail {
    id: string;
    email?: string;
    totalViews: number;
    reports: number;
    workspaces: number;
    lastActivity: string;
    activityByDate: {
        date: string;
        count: number;
    }[];
}
export interface PowerBIMetrics {
    uniqueUsers: {
        count: number;
        users: string[];
    };
    workspaces: {
        count: number;
        workspaces: Array<{
            id: string;
            name: string;
            views: number;
            uniqueViewers: number;
        }>;
    };
    reports: {
        count: number;
        reports: Array<{
            id: string;
            name: string;
            workspaceId: string;
            workspaceName: string;
            views: number;
            uniqueViewers: number;
        }>;
    };
}
export declare class PowerBIMetricsService {
    private readonly httpService;
    private readonly configService;
    private userDashboardRepository;
    private readonly powerbiLogRepository;
    private readonly dashboardRepository;
    constructor(httpService: HttpService, configService: ConfigService, userDashboardRepository: Repository<UserDashboard>, powerbiLogRepository: Repository<PowerBILog>, dashboardRepository: Repository<Dashboard>);
    private readonly logger;
    getAccessToken(): Promise<string>;
    ensureSubscription(accessToken: string): Promise<void>;
    getLogEntries(contentUri: string, accessToken: string): Promise<PowerBILogEntry[]>;
    getWorkspaceMetrics(workspaceId: string, startDate: Date, endDate: Date): Promise<any>;
    getReportMetrics(reportId: string, startDate: Date, endDate: Date): Promise<any>;
    private getViewsByDay;
    processLogEntries(entries: PowerBILogEntry[]): PowerBIMetrics;
    getPowerBIMetrics(startDate: Date, endDate: Date): Promise<PowerBIMetrics>;
    saveRawLogs(logs: PowerBILogEntry[]): Promise<void>;
    getUserReportViewsDistribution(userId: string, startDate: Date, endDate: Date, workspaceId?: string): Promise<{
        reportId: string;
        reportName: string;
        count: number;
    }[]>;
    private convertToEdtStartOfDay;
    private convertToEdtEndOfDay;
    getAllLogs(): Promise<PowerBILog[]>;
    private getLogsFromDatabase;
    private fetchAndProcessLogs;
    private emptyMetricsResponse;
    getAllLogEntries(startDate: Date, endDate: Date): Promise<PowerBILogEntry[]>;
    getContentUris(accessToken: string, startDate: Date, endDate: Date): Promise<string[]>;
    collectDailyLogs(): Promise<void>;
    private filterExistingLogs;
    getDistinctWorkspaces(startDate: Date, endDate: Date, reportId?: string): Promise<{
        id: string;
        name: string;
    }[]>;
    getViewCountsByDate(startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Promise<{
        date: string;
        count: number;
    }[]>;
    getUserActivityTrend(startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Promise<{
        date: string;
        count: number;
    }[]>;
    getDistinctReports(startDate: Date, endDate: Date, workspaceId?: string): Promise<{
        id: string;
        name: string;
        workspaceId: string;
    }[]>;
    getTopReports(startDate: Date, endDate: Date, limit?: number, workspaceId?: string): Promise<{
        reportId: string;
        reportName: string;
        count: number;
    }[]>;
    getTopUsers(startDate: Date, endDate: Date, limit?: number, workspaceId?: string, reportId?: string): Promise<{
        userId: string;
        count: number;
    }[]>;
    getUserConsumptionMethods(userId: string, startDate: Date, endDate: Date): Promise<{
        method: string;
        count: number;
    }[]>;
    getUniqueUserCount(startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Promise<number>;
    getUniqueReportCount(startDate: Date, endDate: Date, workspaceId?: string): Promise<number>;
    getUserMetrics(userId: string, startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Promise<{
        totalViews: number;
        reports: {
            reportId: string;
            reportName: string;
        }[];
        workspaces: {
            workspaceId: string;
            workspaceName: string;
        }[];
        activityByDate: {
            date: string;
            count: number;
        }[];
    }>;
    private getUserTotalViews;
    private getUserReports;
    private getUserWorkspaces;
    getUserActivityByDate(userId: string, startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Promise<{
        date: string;
        count: number;
    }[]>;
    getWorkspaceViewsDistribution(userId: string, startDate: Date, endDate: Date, reportId?: string): Promise<{
        workspaceId: string;
        workspaceName: string;
        count: number;
    }[]>;
    private normalizeWorkspaceName;
    getUnusedReports(startDate: Date, endDate: Date, workspaceId?: string): Promise<{
        id: number;
        dashboard: string;
        groupId: number | null;
    }[]>;
}
