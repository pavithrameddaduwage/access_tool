import { CreateUserDashboardDto } from "./create-user-dashboard.dto";
declare const UpdateUserDashboardDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateUserDashboardDto>>;
export declare class UpdateUserDashboardDto extends UpdateUserDashboardDto_base {
    dashboardIds: number[];
    userName: string;
    department: string;
    isActive: boolean;
}
export {};
