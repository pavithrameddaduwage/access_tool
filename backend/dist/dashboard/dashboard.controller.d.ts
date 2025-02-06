import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    create(createDashboardDto: CreateDashboardDto): Promise<import("./entities/dashboard.entity").Dashboard>;
    findAll(): Promise<{
        users: {
            email: string;
            userName: string;
            department: string;
        }[];
        id: number;
        dashboard: string;
        userDashboards: import("../user-dashboard/entities/user-dashboard.entity").UserDashboard[];
        dashboardTypes: import("./entities/dashboard-type.entity").DashboardType[];
        dashboardValuetypes: import("./entities/dashboard-valuetype.entity").DashboardValuetype[];
        dashboardWorkspaces: import("./entities/dashboard-workspace.entity").DashboardWorkspace[];
        group: import("../group/entities/group.entity").Group;
        groupId: number;
    }[]>;
    findOne(id: string): Promise<import("./entities/dashboard.entity").Dashboard>;
    update(id: string, updateDashboardDto: UpdateDashboardDto): Promise<import("./entities/dashboard.entity").Dashboard>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
