import { PowerBIService } from './powerbi-analytics.service';
export declare class PowerBIAnalyticsController {
    private readonly powerBIService;
    constructor(powerBIService: PowerBIService);
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
}
