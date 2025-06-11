import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getLoginEvents(): Promise<import("./entities/login-event.entity").LoginEvent[]>;
    getUserStats(email: string): Promise<{
        totalLogins: number;
        mostUsedWebtool: any;
        lastLogin: Date;
        peakHour: string;
        dailyLogins: any[];
        loginsByHour: any[];
        loginsByDay: any[];
    }>;
    getDailyLoginStats(days?: number, webtool?: string, email?: string): Promise<any[]>;
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
