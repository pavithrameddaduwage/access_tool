// src/user-webtool/dto/external-webtool-assignment.dto.ts
import { IsEmail, IsNumber, IsString, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class ExternalWebtoolAssignmentDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  userName: string;

  @IsString()
  department: string;

  @IsNumber()
  webtoolId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  roleIds: number[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean; 

  @IsOptional()
  lastActiveAt?: Date; 
}