import { CreateDashboardDto } from './create-dashboard.dto';
declare const UpdateDashboardDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateDashboardDto>>;
export declare class UpdateDashboardDto extends UpdateDashboardDto_base {
    dashboard?: string;
    typeIds?: number[];
    valueTypeIds?: number[];
    workspaceIds?: number[];
}
export {};
