import { Repository } from 'typeorm';
import { UserDashboard } from './entities/user-dashboard.entity';
import { HttpService } from '@nestjs/axios';
export declare class SyncUserDepartmentsService {
    private userDashboardRepository;
    private httpService;
    constructor(userDashboardRepository: Repository<UserDashboard>, httpService: HttpService);
    url: string;
    syncDepartments(): Promise<{
        totalUsersChecked: number;
        usersUpdated: number;
    }>;
}
