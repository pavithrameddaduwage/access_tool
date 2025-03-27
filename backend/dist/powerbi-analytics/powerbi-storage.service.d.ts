import { Repository } from 'typeorm';
import { PowerbiUsage } from './entities/powerbi-usage.entity';
export declare class PowerbiStorageService {
    private readonly usageRepo;
    private readonly logger;
    constructor(usageRepo: Repository<PowerbiUsage>);
    storeUsageData(workspaceId: string, datasetId: string, rows: any[]): Promise<void>;
    getHistoricalData(params: {
        workspaces?: string[];
        startDate: Date;
        endDate: Date;
    }): Promise<PowerbiUsage[]>;
}
