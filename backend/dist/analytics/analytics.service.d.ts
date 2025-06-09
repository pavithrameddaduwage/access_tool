import { Repository } from 'typeorm';
import { LoginEvent } from './entities/login-event.entity';
export declare class AnalyticsService {
    private readonly loginEventRepository;
    constructor(loginEventRepository: Repository<LoginEvent>);
    getUserLoginStats(email: string): Promise<{
        totalLogins: number;
        lastLogin: Date;
        loginsLast30Days: number;
    }>;
    getDepartmentUsage(days?: number, webtool?: string): Promise<{
        department: string;
        count: number;
    }[]>;
    getActiveUsers(days?: number, webtool?: string): Promise<number>;
    getTotalLogins(days?: number, webtool?: string): Promise<number>;
    getLoginsByWebtool(days?: number, webtool?: string): Promise<{
        webtool: string;
        count: number;
    }[]>;
    getLoginsByDayOfWeek(targetTimezone?: string, webtool?: string, days?: number): Promise<{
        day: number;
        count: number;
    }[]>;
    getDailyLogins(days?: number, webtool?: string): Promise<{
        date: string;
        count: number;
    }[]>;
    getSummary(days?: number, webtool?: string): Promise<any>;
    getLoginsByHour(targetTimezone?: string, webtool?: string, days?: number): Promise<{
        hour: number;
        count: number;
    }[]>;
}
