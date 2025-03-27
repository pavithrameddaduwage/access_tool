import { PartialType } from '@nestjs/mapped-types';
import { CreateUserMappingDto } from './create-user-mapping.dto';

export class UpdateUserMappingDto extends PartialType(CreateUserMappingDto) {}
