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
var PowerBIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerBIService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const identity_1 = require("@azure/identity");
let PowerBIService = PowerBIService_1 = class PowerBIService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.apiUrl = 'https://api.powerbi.com/v1.0/myorg';
        this.logger = new common_1.Logger(PowerBIService_1.name);
        const tenantId = this.configService.get('TENANT_ID');
        const clientId = this.configService.get('CLIENT_ID');
        const clientSecret = this.configService.get('CLIENT_SECRET');
        this.logger.debug(`TenantID length: ${tenantId?.length}`);
        this.logger.debug(`ClientID length: ${clientId?.length}`);
        this.logger.debug(`ClientSecret length: ${clientSecret?.length}`);
        try {
            this.credential = new identity_1.ClientSecretCredential(tenantId, clientId, clientSecret);
            this.logger.debug('Credential object created successfully');
        }
        catch (error) {
            this.logger.error('Failed to create credential object:', error.message);
            throw error;
        }
    }
    async getAccessToken() {
        try {
            this.logger.debug('Attempting to get access token...');
            const token = await this.credential.getToken('https://analysis.windows.net/powerbi/api/.default');
            this.logger.debug(`Token starts with: ${token.token.substring(0, 10)}...`);
            this.logger.debug(`Token expires in: ${token.expiresOnTimestamp}`);
            return token.token;
        }
        catch (error) {
            this.logger.error('Failed to get access token:', error.message);
            throw error;
        }
    }
    async getWorkspaces() {
        try {
            this.logger.debug('Getting access token for workspaces request...');
            const token = await this.getAccessToken();
            this.logger.debug('Making request to Power BI API...');
            const url = `${this.apiUrl}/groups`;
            this.logger.debug(`Request URL: ${url}`);
            this.logger.debug('Request Headers:', {
                Authorization: `Bearer ${token.substring(0, 10)}...`,
                'Content-Type': 'application/json'
            });
            const response = await this.httpService.axiosRef.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            this.logger.debug('Successfully retrieved workspaces');
            return response.data.value;
        }
        catch (error) {
            if (error.response) {
                this.logger.error(`API Error Status: ${error.response.status}`);
                this.logger.error('API Error Data:', error.response.data);
                this.logger.error('API Response Headers:', JSON.stringify(error.response.headers, null, 2));
            }
            else if (error.request) {
                this.logger.error('No response received from API');
                this.logger.error(error.request);
            }
            else {
                this.logger.error('Error setting up request:', error.message);
            }
            throw new Error(`Failed to get workspaces: ${error.message}`);
        }
    }
};
exports.PowerBIService = PowerBIService;
exports.PowerBIService = PowerBIService = PowerBIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], PowerBIService);
//# sourceMappingURL=powerbi-analytics.service.js.map