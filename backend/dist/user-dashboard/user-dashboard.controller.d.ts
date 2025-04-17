import { UserDashboardService } from './user-dashboard.service';
import { CreateUserDashboardDto } from './dto/create-user-dashboard.dto';
import { UpdateUserDashboardDto } from './dto/update-user-dashboard.dto';
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
    getDatabaseUsers(): Promise<import("../powerbi-metrics/powerbi-metrics.service").UserMetric[]>;
}
