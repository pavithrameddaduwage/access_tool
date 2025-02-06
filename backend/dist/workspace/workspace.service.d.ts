import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { Workspace } from './entities/workspace.entity';
import { Repository } from 'typeorm';
export declare class WorkspaceService {
    private readonly workspaceRepository;
    constructor(workspaceRepository: Repository<Workspace>);
    createWorkspace(createWorkspaceDto: CreateWorkspaceDto): Promise<CreateWorkspaceDto & Workspace>;
    getAllWorkspaces(): Promise<Workspace[]>;
    getWorkspaceById(id: number): Promise<Workspace>;
    updateWorkspace(id: number, updateWorkspaceDto: UpdateWorkspaceDto): Promise<Workspace & UpdateWorkspaceDto>;
    deleteWorkspace(id: number): Promise<void>;
}
