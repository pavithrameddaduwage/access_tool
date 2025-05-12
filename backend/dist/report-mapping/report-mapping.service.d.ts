import { Repository } from 'typeorm';
import { ReportMapping } from './entities/report-mapping.entity';
import { PowerBILog } from 'src/powerbi-metrics/entities/powerbi-log.entity';
export declare class ReportMappingService {
    private readonly reportMappingRepository;
    private readonly powerbiLogRepo;
    constructor(reportMappingRepository: Repository<ReportMapping>, powerbiLogRepo: Repository<PowerBILog>);
    private cleanReportName;
    findOrCreate(reportId: string, originalName: string, workspaceId?: string): Promise<ReportMapping>;
    getDisplayName(reportId: string, originalName?: string): Promise<string>;
    updateDisplayName(reportId: string, displayName: string): Promise<ReportMapping>;
    findAll(workspaceId?: string): Promise<ReportMapping[]>;
    findOne(reportId: string): Promise<ReportMapping>;
}
