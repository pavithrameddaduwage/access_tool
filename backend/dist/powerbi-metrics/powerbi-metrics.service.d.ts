import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { PowerBILog } from './entities/powerbi-log.entity';
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
    private readonly powerbiLogRepository;
    constructor(httpService: HttpService, configService: ConfigService, powerbiLogRepository: Repository<PowerBILog>);
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
    private getLogsFromDatabase;
    private fetchAndProcessLogs;
    private emptyMetricsResponse;
    getAllLogEntries(startDate: Date, endDate: Date): Promise<PowerBILogEntry[]>;
    getContentUris(accessToken: string, startDate: Date, endDate: Date): Promise<string[]>;
    collectDailyLogs(): Promise<void>;
    getUniqueUserCount(startDate: Date, endDate: Date): Promise<number>;
    getUniqueReportCount(startDate: Date, endDate: Date): Promise<number>;
    private filterExistingLogs;
    getViewCountsByDate(startDate: Date, endDate: Date): Promise<{
        date: string;
        count: number;
    }[]>;
    getTopReports(startDate: Date, endDate: Date, limit?: number): Promise<{
        reportId: string;
        reportName: string;
        count: number;
    }[]>;
    getTopUsers(startDate: Date, endDate: Date, limit?: number): Promise<{
        userId: string;
        count: number;
    }[]>;
    getUserActivityTrend(startDate: Date, endDate: Date): Promise<{
        date: string;
        count: number;
    }[]>;
    getUserMetrics(userId: string, startDate: Date, endDate: Date): Promise<{
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
    private getUserReports;
    private getUserWorkspaces;
    private getUserActivityByDate;
    getWorkspaceViewsDistribution(userId: string, startDate: Date, endDate: Date): Promise<{
        workspaceId: string;
        workspaceName: string;
        count: number;
    }[]>;
}
