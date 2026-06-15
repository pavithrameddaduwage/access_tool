"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PowerBiAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerBiAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let PowerBiAuthService = PowerBiAuthService_1 = class PowerBiAuthService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(PowerBiAuthService_1.name);
        this.accessToken = null;
        this.tokenExpiryTime = null;
    }
    async getToken() {
        const now = Date.now();
        if (this.accessToken && this.tokenExpiryTime && this.tokenExpiryTime - now > 300000) {
            return this.accessToken;
        }
        this.logger.log('Power BI access token missing or expiring soon. Fetching new token...');
        await this.refreshToken();
        return this.accessToken;
    }
    async refreshToken() {
        const tenantId = this.configService.get('TENANT_ID');
        const clientId = this.configService.get('CLIENT_ID');
        const clientSecret = this.configService.get('CLIENT_SECRET');
        const scope = this.configService.get('POWER_BI_SCOPE', 'https://analysis.windows.net/powerbi/api/.default');
        const authUrl = this.configService.get('AUTH_URL', 'https://login.microsoftonline.com');
        if (!tenantId || !clientId || !clientSecret) {
            throw new Error('Azure AD credentials (TENANT_ID, CLIENT_ID, CLIENT_SECRET) are not fully configured in environment variables.');
        }
        const url = `${authUrl}/${tenantId}/oauth2/v2.0/token`;
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('scope', scope);
        try {
            const response = await axios_1.default.post(url, params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            const { access_token, expires_in } = response.data;
            this.accessToken = access_token;
            this.tokenExpiryTime = Date.now() + expires_in * 1000;
            this.logger.log(`Power BI token successfully fetched. Expires in ${expires_in} seconds.`);
        }
        catch (error) {
            this.logger.error('Failed to fetch Power BI OAuth2 token', error.response?.data || error.message);
            throw error;
        }
    }
};
exports.PowerBiAuthService = PowerBiAuthService;
exports.PowerBiAuthService = PowerBiAuthService = PowerBiAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PowerBiAuthService);
//# sourceMappingURL=powerbi-auth.service.js.map