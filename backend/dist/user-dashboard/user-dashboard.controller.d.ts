import { UserDashboardService } from './user-dashboard.service';
import { CreateUserDashboardDto } from './dto/create-user-dashboard.dto';
import { UpdateUserDashboardDto } from './dto/update-user-dashboard.dto';
export declare class UserDashboardController {
    private readonly userDashboardService;
    constructor(userDashboardService: UserDashboardService);
    create(createUserDashboardDto: CreateUserDashboardDto): Promise<{
        email: string;
        dashboards: string[];
    }>;
    findAll(): Promise<unknown[]>;
    findOne(email: string): Promise<{
        email: string;
        dashboards: string[];
    }>;
    update(email: string, updateUserDashboardDto: UpdateUserDashboardDto): Promise<{
        email: string;
        dashboards: string[];
    }>;
    remove(email: string): Promise<void>;
}
