import { UserDashboardService } from './user-dashboard.service';
import { CreateUserDashboardDto } from './dto/create-user-dashboard.dto';
import { UpdateUserDashboardDto } from './dto/update-user-dashboard.dto';
import { UserMetric } from 'src/powerbi-metrics/powerbi-metrics.service';
export declare class UserDashboardController {
    private readonly userDashboardService;
    constructor(userDashboardService: UserDashboardService);
    create(createUserDashboardDto: CreateUserDashboardDto): Promise<{
        email: string;
        userName: string;
        department: string;
        isActive: boolean;
        lastActiveAt: Date;
        dashboards: string[];
    }>;
    findAll(): Promise<unknown[]>;
    findOne(email: string): Promise<{
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
    permittedUsers(workspaceId?: string, reportId?: string): Promise<string[]>;
    getDatabaseUsersByWorkspaceAndReportID(data: {
        workspaceName: string;
        reportName: string;
    }): Promise<UserMetric[]>;
    getLastDeactivatedUsers(limit?: number): Promise<{
        email: string;
        userName: string;
        department: string;
        lastActiveAt?: Date;
    }[]>;
    syncDepartments(): Promise<{
        success: boolean;
        message: string;
        totalUsersChecked: number;
        usersUpdated: number;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        totalUsersChecked?: undefined;
        usersUpdated?: undefined;
    }>;
}
