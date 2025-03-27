import { PowerBIService } from '../powerbi-analytics.service';
export declare class PowerbiSyncTask {
    private readonly powerbiService;
    private readonly logger;
    constructor(powerbiService: PowerBIService);
    handleSync(): Promise<void>;
    handleCron(): Promise<void>;
}
