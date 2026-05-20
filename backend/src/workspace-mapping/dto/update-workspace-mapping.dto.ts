import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkspaceMappingDto } from './create-workspace-mapping.dto';

export class UpdateWorkspaceMappingDto extends PartialType(CreateWorkspaceMappingDto) {}
