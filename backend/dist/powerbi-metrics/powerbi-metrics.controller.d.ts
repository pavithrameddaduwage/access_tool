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
    getViewsByDate(startDate: Date, endDate: Date): Promise<{
        date: string;
        count: number;
    }[]>;
    getTopReports(startDate: Date, endDate: Date, limit: number): Promise<{
        reportId: string;
        reportName: string;
        count: number;
    }[]>;
    getTopUsers(startDate: Date, endDate: Date, limit: number): Promise<{
        userId: string;
        count: number;
    }[]>;
    getUserActivityTrend(startDate: Date, endDate: Date): Promise<{
        date: string;
        count: number;
    }[]>;
    getUniqueUserCount(startDate: Date, endDate: Date): Promise<number>;
    getUniqueReportCount(startDate: Date, endDate: Date): Promise<number>;
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
    getWorkspaceViewsDistribution(userId: string, startDate: Date, endDate: Date): Promise<{
        workspaceId: string;
        workspaceName: string;
        count: number;
    }[]>;
}
