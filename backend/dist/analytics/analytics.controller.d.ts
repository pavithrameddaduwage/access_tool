import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDailyLoginStats(days?: number, webtool?: string): Promise<{
        date: string;
        count: number;
    }[]>;
    getLoginsByHour(webtool?: string): Promise<{
        hour: number;
        count: number;
    }[]>;
    getLoginsByDayOfWeek(webtool?: string): Promise<{
        day: number;
        count: number;
    }[]>;
    getSummary(days?: number, webtool?: string): Promise<{
        totalLogins: number;
        activeUsers: number;
    }>;
    getLoginEvents(): Promise<import("./entities/login-event.entity").LoginEvent[]>;
}
