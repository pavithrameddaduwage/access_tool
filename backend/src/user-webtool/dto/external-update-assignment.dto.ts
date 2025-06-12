import { IsEmail, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class ExternalUpdateAssignmentDto {
  @IsEmail()
  email: string;

  @IsNumber()
  webtoolId: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  lastActiveAt?: Date;
}