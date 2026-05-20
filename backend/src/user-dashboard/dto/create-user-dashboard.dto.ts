import { IsNumber, IsArray, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDashboardDto {
  @IsString()
  email: string;

  @IsString()
  userName: string;

  @IsString()
  department: string;

  @IsArray()
  dashboardIds: number[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  lastActiveAt?: Date;
}
