import { ConfigService } from '@nestjs/config';
export declare class PowerBiAuthService {
    private configService;
    private readonly logger;
    private accessToken;
    private tokenExpiryTime;
    constructor(configService: ConfigService);
    getToken(): Promise<string>;
    private refreshToken;
}
