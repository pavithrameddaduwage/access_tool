import { Repository } from 'typeorm';
import { UserDashboard } from './entities/user-dashboard.entity';
import { CreateUserDashboardDto } from './dto/create-user-dashboard.dto';
import { UpdateUserDashboardDto } from './dto/update-user-dashboard.dto';
import { Dashboard } from 'src/dashboard/entities/dashboard.entity';
export declare class UserDashboardService {
    private userDashboardRepository;
    private dashboardRepository;
    constructor(userDashboardRepository: Repository<UserDashboard>, dashboardRepository: Repository<Dashboard>);
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
