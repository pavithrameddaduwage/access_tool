import { OnApplicationBootstrap } from '@nestjs/common';
import { PowerBIMetricsService } from '../powerbi-metrics.service';
import { Repository } from 'typeorm';
import { PowerBILog } from '../entities/powerbi-log.entity';
export declare class PowerBILogsCollectorTask implements OnApplicationBootstrap {
    private readonly powerbiMetricsService;
    private readonly powerbiLogRepository;
    private readonly logger;
    constructor(powerbiMetricsService: PowerBIMetricsService, powerbiLogRepository: Repository<PowerBILog>);
    onApplicationBootstrap(): Promise<void>;
    collectRealTimeLogs(): Promise<void>;
    private filterExistingLogs;
    private formatDate;
}
