import { ReportMappingService } from './report-mapping.service';
import { ReportMapping } from './entities/report-mapping.entity';
export declare class ReportMappingController {
    private readonly reportMappingService;
    constructor(reportMappingService: ReportMappingService);
    findAll(workspaceId?: string): Promise<ReportMapping[]>;
    findOne(id: string): Promise<ReportMapping>;
    update(id: string, displayName: string): Promise<ReportMapping>;
}
