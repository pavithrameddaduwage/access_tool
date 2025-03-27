import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UsageMetrics } from './models/usage-metrics.model';
import { PowerbiStorageService } from './powerbi-storage.service';
export declare class PowerBIService {
    private readonly httpService;
    private readonly configService;
    private readonly storageService;
    private readonly apiUrl;
    private credential;
    readonly logger: Logger;
    constructor(httpService: HttpService, configService: ConfigService, storageService: PowerbiStorageService);
    getMyWorkspaceAccess(): Promise<any>;
    getAccessToken(): Promise<string>;
    getWorkspaces(): Promise<any>;
    getSpecificWorkspace(workspaceId: string): Promise<any>;
    getData(): Promise<any>;
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
    private calculateAggregateMetrics;
    private calculateAverageViewsPerDay;
    private getTopReports;
    private getTopWorkspaces;
    getReportData(workspaceId: string, datasetId: string): Promise<any>;
    getDatasetTables(workspaceId: string, datasetId: string): Promise<any>;
    exportReport(workspaceId: string, reportId: string, accessToken: string): Promise<import("axios").AxiosResponse<any, any>>;
    executeQueries(workspaceId: string, datasetId: string, requestBody: any): Promise<any>;
    getReportNameMap(workspaceId: string): Promise<Map<string, string>>;
    private getAccessibleWorkspaces;
    getDatasetData(workspaceId: string, datasetId: string, query: string): Promise<any>;
    getDatasets(workspaceId: string): Promise<any>;
    getWorkspacesWithDatasets(): Promise<any[]>;
    private processActivityEvents;
    getFilteredMetrics(workspaceIds?: string[], days?: number): Promise<UsageMetrics>;
    private formatWorkspaceFilter;
    private processDatasetResponse;
    getCombinedMetrics(workspaceIds?: string[]): Promise<any[]>;
    private aggregateAcrossWorkspaces;
}
