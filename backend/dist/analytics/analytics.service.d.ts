import { Repository } from 'typeorm';
import { LoginEvent } from './entities/login-event.entity';
export declare class AnalyticsService {
    readonly loginEventRepository: Repository<LoginEvent>;
    constructor(loginEventRepository: Repository<LoginEvent>);
    getLoginEvents(): Promise<LoginEvent[]>;
    getUserStats(email: string, webtool?: string, days?: number): Promise<any>;
    getSummary(days?: number, webtool?: string, email?: string): Promise<{
        totalLogins: number;
        activeUsers: number;
    }>;
    getDailyLogins(days?: number, webtool?: string, email?: string): Promise<any[]>;
    getLoginsByHour(days?: number, webtool?: string, email?: string): Promise<any[]>;
    getLoginsByDayOfWeek(days?: number, webtool?: string, email?: string): Promise<{
        day: number;
        count: number;
    }[]>;
    getDepartmentLoginStats(days?: number, webtool?: string, email?: string): Promise<any[]>;
    getDepartmentHourlyLogins(days?: number, webtool?: string, email?: string): Promise<{
        department: string;
        hour: number;
        count: number;
    }[]>;
    getDepartmentDailyLogins(days?: number, webtool?: string, email?: string): Promise<{
        department: string;
        date: string;
        count: number;
    }[]>;
    getUserWebtoolStats(email: string, days?: number): Promise<{
        webtool: string;
        count: number;
        lastLogin: Date | null;
    }[]>;
    getTopActiveUsers(days?: number, webtool?: string): Promise<{
        email: string;
        count: number;
    }[]>;
    getTopUsedWebtools(days?: number, email?: string): Promise<{
        webtool: string;
        count: number;
    }[]>;
}
