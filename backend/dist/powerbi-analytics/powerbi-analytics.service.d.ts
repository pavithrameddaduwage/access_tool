import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class PowerBIService {
    private readonly httpService;
    private readonly configService;
    private readonly apiUrl;
    private credential;
    private readonly logger;
    constructor(httpService: HttpService, configService: ConfigService);
    private getAccessToken;
    getWorkspaces(): Promise<any>;
}
