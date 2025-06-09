import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getSummary(days?: number, webtool?: string): Promise<any>;
    getDailyLoginStats(days?: number, webtool?: string): Promise<{
        date: string;
        count: number;
    }[]>;
    getUserStats(email: string): Promise<{
        totalLogins: number;
        lastLogin: Date;
        loginsLast30Days: number;
    }>;
    getLoginsByHour(webtool?: string): Promise<{
        hour: number;
        count: number;
    }[]>;
    getLoginsByDayOfWeek(webtool?: string): Promise<{
        day: number;
        count: number;
    }[]>;
}
