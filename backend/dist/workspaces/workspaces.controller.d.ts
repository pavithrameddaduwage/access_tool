import { WorkspacesService } from './workspaces.service';
import { PbiWorkspace } from './entities/pbi-workspace.entity';
import { PbiReport } from './entities/pbi-report.entity';
import { PbiDashboard } from './entities/pbi-dashboard.entity';
import { Repository } from 'typeorm';
import { PbiActivityEvent } from '../activity/entities/pbi-activity-event.entity';
export declare class WorkspacesController {
    private readonly workspacesService;
    private readonly activityEventRepository;
    constructor(workspacesService: WorkspacesService, activityEventRepository: Repository<PbiActivityEvent>);
    getAllWorkspaces(): Promise<PbiWorkspace[]>;
    triggerSync(): Promise<{
        message: string;
    }>;
    getWorkspaceById(id: string): Promise<PbiWorkspace>;
    getReports(id: string): Promise<PbiReport[]>;
    getDashboards(id: string): Promise<PbiDashboard[]>;
    getWorkspaceUsers(id: string): Promise<any[]>;
}
