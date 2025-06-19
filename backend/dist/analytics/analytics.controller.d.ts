import { AnalyticsService } from './analytics.service';
import { LoginTrackingService } from './login-tracking.service';
import { Request } from 'express';
export declare class AnalyticsController {
    private readonly analyticsService;
    private loginTrackingService;
    constructor(analyticsService: AnalyticsService, loginTrackingService: LoginTrackingService);
    getLoginEvents(): Promise<import("./entities/login-event.entity").LoginEvent[]>;
    getDailyLoginStats(days?: number, webtool?: string, email?: string): Promise<any[]>;
    getLoginsByHour(days?: number, webtool?: string, email?: string): Promise<any[]>;
    getLoginsByDayOfWeek(days?: number, webtool?: string, email?: string): Promise<any[]>;
    getSummary(days?: number, webtool?: string, email?: string): Promise<{
        totalLogins: number;
        activeUsers: number;
    }>;
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
    recordLogin(data: {
        email: string;
        webtool: string;
        department?: string;
        location?: string;
    }, req: Request): Promise<import("./entities/login-event.entity").LoginEvent>;
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
}
