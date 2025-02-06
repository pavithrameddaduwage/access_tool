import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartmentDto } from './create-department.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  department?: string;  // Assuming 'department' is the name of the department

  // Add other fields as necessary, for example:
  // @IsString()
  // @IsOptional()
  // description?: string;
}

