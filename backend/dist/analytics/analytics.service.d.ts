import { Repository } from 'typeorm';
import { LoginEvent } from './entities/login-event.entity';
export declare class AnalyticsService {
    private readonly loginEventRepository;
    constructor(loginEventRepository: Repository<LoginEvent>);
    getDailyLogins(days?: number, webtool?: string): Promise<{
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
}
