import { Repository } from 'typeorm';
import { LoginEvent } from './entities/login-event.entity';
export declare class AnalyticsService {
    readonly loginEventRepository: Repository<LoginEvent>;
    constructor(loginEventRepository: Repository<LoginEvent>);
    getLoginEvents(): Promise<LoginEvent[]>;
    getDailyLogins(days?: number, webtool?: string, email?: string): Promise<any[]>;
    getLoginsByHour(days?: number, webtool?: string, email?: string): Promise<any[]>;
    getLoginsByDayOfWeek(days?: number, webtool?: string, email?: string): Promise<any[]>;
    getSummary(days?: number, webtool?: string, email?: string): Promise<{
        totalLogins: number;
        activeUsers: number;
    }>;
    getDepartmentLoginStats(days?: number, webtool?: string): Promise<{
        department: string;
        logins: number;
    }[]>;
    getDepartmentHourlyLogins(days?: number, webtool?: string): Promise<{
        department: string;
        hour: number;
        count: number;
    }[]>;
    getDepartmentDailyLogins(days?: number, webtool?: string): Promise<{
        department: string;
        date: string;
        count: number;
    }[]>;
}
