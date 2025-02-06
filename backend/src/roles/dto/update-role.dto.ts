import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {

    @IsString()
    @IsOptional()
    roles?: string;
  
    @IsString()
    @IsOptional()
    privileges?: string;
  
    @IsNumber()
    @IsOptional()
    webtoolId?: number;
    
}
