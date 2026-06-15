import { ConfigService } from '@nestjs/config';
import { PowerBiAuthService } from './powerbi-auth.service';
export declare class PowerBIService {
    private authService;
    private configService;
    private readonly logger;
    private readonly baseUrl;
    constructor(authService: PowerBiAuthService, configService: ConfigService);
    private sleep;
    private requestWithRetry;
    get<T>(url: string, params?: any): Promise<T>;
    post<T>(url: string, data?: any): Promise<T>;
    getPaginated<T = any>(url: string, params?: any): Promise<T[]>;
}
