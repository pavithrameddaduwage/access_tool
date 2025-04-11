import { PowerBIMetricsService } from '../powerbi-metrics.service';
import { Repository } from 'typeorm';
import { PowerBILog } from '../entities/powerbi-log.entity';
export declare class PowerBILogsCollectorTask {
    private readonly powerbiMetricsService;
    private readonly powerbiLogRepository;
    private readonly logger;
    constructor(powerbiMetricsService: PowerBIMetricsService, powerbiLogRepository: Repository<PowerBILog>);
    collectPreviousDayLogs(): Promise<void>;
    private filterExistingLogs;
}
