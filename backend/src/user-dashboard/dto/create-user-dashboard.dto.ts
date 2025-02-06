import { IsNumber, IsArray, IsString } from 'class-validator';

export class CreateUserDashboardDto {
  @IsString()
  email: string;

  @IsString()
  userName: string;

  @IsString()
  department: string;

  @IsArray()
  dashboardIds: number[];
}
