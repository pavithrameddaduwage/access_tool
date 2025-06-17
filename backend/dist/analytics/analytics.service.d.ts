import { Repository } from 'typeorm';
import { LoginEvent } from './entities/login-event.entity';
export declare class AnalyticsService {
    readonly loginEventRepository: Repository<LoginEvent>;
    constructor(loginEventRepository: Repository<LoginEvent>);
    getLoginEvents(): Promise<LoginEvent[]>;
    getUserStats(email: string, webtool?: string, days?: number): Promise<{
        username: string;
        email: string;
        department: string;
        totalLogins: number;
        mostUsedWebtool: any;
        lastLogin: Date;
        peakHour: string;
        dailyLogins: any[];
        loginsByHour: any[];
        loginsByDay: any[];
        webtoolUsage: any[];
    }>;
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
    getDailyLogins(days?: number, webtool?: string, email?: string): Promise<any[]>;
    getLoginsByHour(days?: number, webtool?: string, email?: string): Promise<any[]>;
    getLoginsByDayOfWeek(days?: number, webtool?: string, email?: string): Promise<any[]>;
}
