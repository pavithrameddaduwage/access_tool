import { PowerBIMetricsService } from './powerbi-metrics.service';
export declare class PowerBIMetricsController {
    private readonly powerbiMetricsService;
    constructor(powerbiMetricsService: PowerBIMetricsService);
    getMetrics(startDate: Date, endDate: Date): Promise<import("./powerbi-metrics.service").PowerBIMetrics>;
    getWorkspaceMetrics(workspaceId: string, startDate: Date, endDate: Date): Promise<any>;
    getReportMetrics(reportId: string, startDate: Date, endDate: Date): Promise<any>;
    collectRawData(startDate: Date, endDate: Date): Promise<{
        message: string;
        logs: import("./powerbi-metrics.service").PowerBILogEntry[];
    }>;
    getUniqueUserCount(startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Promise<number>;
    getUniqueReportCount(startDate: Date, endDate: Date, workspaceId?: string): Promise<number>;
    getUserActivityTrend(startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Promise<{
        date: string;
        count: number;
    }[]>;
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
        assignedDashboards: string[];
        estimatedTimeSpent: number;
    }>;
    getLog(): Promise<import("./entities/powerbi-log.entity").PowerBILog[]>;
    getLogs(startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Promise<import("./powerbi-metrics.service").PowerBILogEntry[]>;
    getUserConsumptionMethods(userId: string, startDate: Date, endDate: Date): Promise<{
        method: string;
        count: number;
    }[]>;
    getWorkspaceViewsDistribution(userId: string, startDate: Date, endDate: Date, reportId?: string): Promise<{
        workspaceId: string;
        workspaceName: string;
        count: number;
    }[]>;
    getDistinctWorkspaces(startDate: Date, endDate: Date, reportId?: string): Promise<{
        id: string;
        name: string;
    }[]>;
    getDistinctReports(startDate: Date, endDate: Date, workspaceId?: string): Promise<{
        id: string;
        name: string;
        workspaceId: string;
    }[]>;
    getViewsByDate(startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Promise<{
        date: string;
        count: number;
    }[]>;
    getTopReports(startDate: Date, endDate: Date, limit: number, workspaceId?: string): Promise<{
        reportId: string;
        reportName: string;
        count: number;
    }[]>;
    getTopUsers(startDate: Date, endDate: Date, limit: number, workspaceId?: string, reportId?: string): Promise<{
        userId: string;
        count: number;
    }[]>;
    getUserReportViewsDistribution(userId: string, startDate: Date, endDate: Date, workspaceId?: string): Promise<{
        reportId: string;
        reportName: string;
        workspaceName: string;
        count: number;
    }[]>;
    getDailyUserReportViews(userId: string, date: Date, workspaceId?: string, reportId?: string): Promise<{
        reportId: string;
        reportName: string;
        workspaceName: string;
        count: number;
    }[]>;
    getUnusedReports(startDate: Date, endDate: Date, workspaceId?: string): Promise<{
        id: number;
        dashboard: string;
        groupId: number | null;
    }[]>;
    getUserNameMappings(body: {
        emails: string[];
    }): Promise<{
        names: {
            [email: string]: string;
        };
        departments: {
            [email: string]: string;
        };
    }>;
    getUserCounts(startDate: Date, endDate: Date, workspaceId?: string, reportId?: string): Promise<{
        totalUsers: number;
        totalViews: number;
        zeroViewUsers: number;
        lowActivityUsers: number;
        deactivatedUsers: number;
        lastDeactivatedUsers: {
            email: string;
            name: string;
            department: string;
            deactivatedAt: Date;
        }[];
    }>;
    recordTimeSpent(data: {
        userId: string;
        reportId: string;
        reportName: string;
        workspaceId?: string;
        workspaceName?: string;
        tabName: string;
        durationSeconds: number;
    }): Promise<import("./entities/powerbi-time-spent.entity").PowerBITimeSpent>;
    getUserTimeSpent(userId: string, startDate: Date, endDate: Date): Promise<any[]>;
    getLastRefresh(): Promise<{
        lastRefreshedAt: Date;
    }>;
}
