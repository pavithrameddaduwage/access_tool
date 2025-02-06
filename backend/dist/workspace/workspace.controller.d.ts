import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
export declare class WorkspaceController {
    private readonly workspaceService;
    constructor(workspaceService: WorkspaceService);
    getAllWorkspace(): Promise<import("./entities/workspace.entity").Workspace[]>;
    getWorkspaceById(id: number): Promise<import("./entities/workspace.entity").Workspace>;
    createWorkspace(createWorkspaceDto: CreateWorkspaceDto): Promise<CreateWorkspaceDto & import("./entities/workspace.entity").Workspace>;
    updateWorkspace(id: number, updateWorkspaceDto: UpdateWorkspaceDto): Promise<import("./entities/workspace.entity").Workspace & UpdateWorkspaceDto>;
    deleteWorkspace(id: number): Promise<void>;
}
