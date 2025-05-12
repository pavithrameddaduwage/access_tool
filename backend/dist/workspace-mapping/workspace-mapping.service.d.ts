import { Repository } from 'typeorm';
import { WorkspaceMapping } from './entities/workspace-mapping.entity';
export declare class WorkspaceMappingService {
    private readonly workspaceMappingRepository;
    constructor(workspaceMappingRepository: Repository<WorkspaceMapping>);
    private cleanWorkspaceName;
    findOrCreate(workspaceId: string, originalName: string): Promise<WorkspaceMapping>;
    getDisplayName(workspaceId: string, originalName?: string): Promise<string>;
    updateDisplayName(workspaceId: string, displayName: string): Promise<WorkspaceMapping>;
    findAll(): Promise<WorkspaceMapping[]>;
    findOne(workspaceId: string): Promise<WorkspaceMapping>;
}
