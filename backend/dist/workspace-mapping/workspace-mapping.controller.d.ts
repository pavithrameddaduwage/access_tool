import { WorkspaceMappingService } from './workspace-mapping.service';
import { WorkspaceMapping } from './entities/workspace-mapping.entity';
export declare class WorkspaceMappingController {
    private readonly workspaceMappingService;
    constructor(workspaceMappingService: WorkspaceMappingService);
    findAll(): Promise<WorkspaceMapping[]>;
    findOne(id: string): Promise<WorkspaceMapping>;
    update(id: string, displayName: string): Promise<WorkspaceMapping>;
}
