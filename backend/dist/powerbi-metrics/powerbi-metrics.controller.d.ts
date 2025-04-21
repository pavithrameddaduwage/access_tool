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
    }>;
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
        count: number;
    }[]>;
}
