import { CreateWorkspaceDto } from './create-workspace.dto';
declare const UpdateWorkspaceDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateWorkspaceDto>>;
export declare class UpdateWorkspaceDto extends UpdateWorkspaceDto_base {
    workspace?: string;
}
export {};
