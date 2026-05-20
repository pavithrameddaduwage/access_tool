import { PartialType } from "@nestjs/mapped-types";
import { IsArray, IsBoolean, IsString } from "class-validator";
import { CreateUserDashboardDto } from "./create-user-dashboard.dto";

export class UpdateUserDashboardDto extends PartialType(CreateUserDashboardDto) {
  @IsArray()
  dashboardIds: number[];

  @IsString()
  userName: string;

  @IsString()
  department: string;

  @IsBoolean()
  isActive: boolean; // Make this required
}