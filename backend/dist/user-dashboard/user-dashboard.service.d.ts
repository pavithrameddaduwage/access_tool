import { Repository } from 'typeorm';
import { UserDashboard } from './entities/user-dashboard.entity';
import { CreateUserDashboardDto } from './dto/create-user-dashboard.dto';
import { UpdateUserDashboardDto } from './dto/update-user-dashboard.dto';
import { Dashboard } from 'src/dashboard/entities/dashboard.entity';
import { UserMetric } from 'src/powerbi-metrics/powerbi-metrics.service';
import { DashboardWorkspace } from 'src/dashboard/entities/dashboard-workspace.entity';
export declare class UserDashboardService {
    private userDashboardRepository;
    private dashboardRepository;
    private dashboardWorkspaceRepository;
    constructor(userDashboardRepository: Repository<UserDashboard>, dashboardRepository: Repository<Dashboard>, dashboardWorkspaceRepository: Repository<DashboardWorkspace>);
    findAll(): Promise<unknown[]>;
    findOne(email: string): Promise<{
        email: string;
        userName: string;
        department: string;
        isActive: boolean;
        lastActiveAt: Date;
        dashboards: string[];
    }>;
    create(createUserDashboardDto: CreateUserDashboardDto): Promise<{
        email: string;
        userName: string;
        department: string;
        isActive: boolean;
        lastActiveAt: Date;
        dashboards: string[];
    }>;
    update(email: string, updateUserDashboardDto: UpdateUserDashboardDto): Promise<{
        email: string;
        userName: string;
        department: string;
        isActive: boolean;
        lastActiveAt: Date;
        dashboards: string[];
    }>;
    remove(email: string): Promise<void>;
    getDatabaseUsers(): Promise<UserMetric[]>;
    getDatabaseUsersByWorkspaceAndReportID(workspaceName: string, reportName: string): Promise<UserMetric[]>;
    getPermittedUsers(workspaceName?: string, reportName?: string): Promise<string[]>;
}
