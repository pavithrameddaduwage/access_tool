import { Repository } from 'typeorm';
import { PbiWorkspace } from './entities/pbi-workspace.entity';
import { PbiReport } from './entities/pbi-report.entity';
import { PbiDashboard } from './entities/pbi-dashboard.entity';
import { PowerBIService } from '../powerbi/powerbi.service';
import { SyncLogService } from '../sync-log/sync-log.service';
export declare class WorkspacesService {
    private workspaceRepository;
    private reportRepository;
    private dashboardRepository;
    private powerBiService;
    private syncLogService;
    private readonly logger;
    constructor(workspaceRepository: Repository<PbiWorkspace>, reportRepository: Repository<PbiReport>, dashboardRepository: Repository<PbiDashboard>, powerBiService: PowerBIService, syncLogService: SyncLogService);
    syncAll(): Promise<void>;
    findAllWorkspaces(): Promise<PbiWorkspace[]>;
    findWorkspaceById(workspaceId: string): Promise<PbiWorkspace>;
    findReportsByWorkspace(workspaceId: string): Promise<PbiReport[]>;
    findDashboardsByWorkspace(workspaceId: string): Promise<PbiDashboard[]>;
    isWorkspacesEmpty(): Promise<boolean>;
}
