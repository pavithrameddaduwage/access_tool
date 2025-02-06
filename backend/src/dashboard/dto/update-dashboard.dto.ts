import { PartialType } from '@nestjs/mapped-types';
import { CreateDashboardDto } from './create-dashboard.dto';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDashboardDto extends PartialType(CreateDashboardDto) {

    @IsOptional()
    @IsString()
    dashboard?: string;
  
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    typeIds?: number[];
  
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    valueTypeIds?: number[];
    
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    workspaceIds?: number[];
}
