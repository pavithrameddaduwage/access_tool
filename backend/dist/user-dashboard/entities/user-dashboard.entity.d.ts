import { Dashboard } from '../../dashboard/entities/dashboard.entity';
export declare class UserDashboard {
    id: number;
    email: string;
    userName: string;
    department: string;
    dashboard: Dashboard;
    dashboardId: number;
    isActive: boolean;
    lastActiveAt?: Date;
}
