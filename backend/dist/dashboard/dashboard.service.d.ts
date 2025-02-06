import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { Dashboard } from './entities/dashboard.entity';
import { Repository } from 'typeorm';
import { DashboardType } from './entities/dashboard-type.entity';
import { DashboardValuetype } from './entities/dashboard-valuetype.entity';
import { DashboardWorkspace } from './entities/dashboard-workspace.entity';
import { UserDashboard } from 'src/user-dashboard/entities/user-dashboard.entity';
export declare class DashboardService {
    private dashboardRepository;
    private dashboardTypeRepository;
    private dashboardValuetypeRepository;
    private dashboardWorkspaceRepository;
    private userDashboardRepository;
    constructor(dashboardRepository: Repository<Dashboard>, dashboardTypeRepository: Repository<DashboardType>, dashboardValuetypeRepository: Repository<DashboardValuetype>, dashboardWorkspaceRepository: Repository<DashboardWorkspace>, userDashboardRepository: Repository<UserDashboard>);
    create(createDashboardDto: CreateDashboardDto): Promise<Dashboard>;
    findAll(): Promise<{
        users: {
            email: string;
            userName: string;
            department: string;
        }[];
        id: number;
        dashboard: string;
        userDashboards: UserDashboard[];
        dashboardTypes: DashboardType[];
        dashboardValuetypes: DashboardValuetype[];
        dashboardWorkspaces: DashboardWorkspace[];
        group: import("../group/entities/group.entity").Group;
        groupId: number;
    }[]>;
    private getUsersForDashboard;
    findOne(id: number): Promise<Dashboard>;
    update(id: number, updateDashboardDto: UpdateDashboardDto): Promise<Dashboard>;
    private updateRelationships;
    remove(id: number): Promise<{
        message: string;
    }>;
}
