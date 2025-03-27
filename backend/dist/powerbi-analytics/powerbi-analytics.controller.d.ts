import { PowerBIService } from './powerbi-analytics.service';
import { UsageMetrics } from './models/usage-metrics.model';
import { Response } from 'express';
export declare class PowerBIAnalyticsController {
    private readonly powerBIService;
    constructor(powerBIService: PowerBIService);
    private readonly logger;
    getWorkspaces(): Promise<any>;
    testConnection(): Promise<{
        status: string;
        message: string;
        workspaceCount: any;
        workspaces: any;
    } | {
        status: string;
        message: any;
        workspaceCount?: undefined;
        workspaces?: undefined;
    }>;
    getMyWorkspaceAccess(): Promise<any>;
    getSpecificWorkspace(workspaceId: string): Promise<any>;
    getReports(workspaceId: string): Promise<any>;
    getAllWorkspaces(): Promise<any>;
    getReportUsageMetrics(workspaceId: string, reportId: string): Promise<any>;
    getWorkspaceUsageMetrics(workspaceId: string): Promise<{
        workspaceId: string;
        workspaceName: any;
        reports: any[];
        aggregateMetrics: {
            totalViews: any;
            totalUsers: number;
            userIds: unknown[];
            avgViewsPerDay: number;
        };
    }>;
    getAggregateMetrics(): Promise<{
        totalViews: number;
        totalUsers: number;
        reportCount: number;
        workspaceCount: number;
        topReports?: undefined;
        topWorkspaces?: undefined;
    } | {
        totalViews: any;
        totalUsers: number;
        reportCount: any;
        workspaceCount: any;
        topReports: any;
        topWorkspaces: any;
    }>;
    getData(): Promise<any>;
    getToken(): Promise<string>;
    getDatasetTables(workspaceId: string, datasetId: string): Promise<any>;
    getReportData(workspaceId: string, datasetId: string): Promise<any>;
    exportReport(workspaceId: string, reportId: string, res: Response): Promise<void>;
    executeQueries(workspaceId: string, datasetId: string, fullRequestBody: any): Promise<any>;
    getWorkspacesWithDatasets(): Promise<any[]>;
    getFilterableMetrics(workspaceIds?: string, days?: string): Promise<UsageMetrics>;
    getCombinedMetrics(workspaceIds?: any): Promise<any[]>;
    getWorkspaceReports(workspaceId: string): Promise<any>;
}
