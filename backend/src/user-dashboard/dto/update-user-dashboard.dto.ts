import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDashboardDto } from './create-user-dashboard.dto';
import { IsArray, IsString } from 'class-validator';

export class UpdateUserDashboardDto extends PartialType(CreateUserDashboardDto) {

    @IsArray()
  dashboardIds: number[];

  @IsString()
  userName: string;

  @IsString()
  department: string;
}
