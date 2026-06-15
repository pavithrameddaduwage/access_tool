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
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const powerbi_auth_service_1 = require("./powerbi-auth.service");
let PowerBIService = PowerBIService_1 = class PowerBIService {
    constructor(authService, configService) {
        this.authService = authService;
        this.configService = configService;
        this.logger = new common_1.Logger(PowerBIService_1.name);
        this.baseUrl = this.configService.get('POWER_BI_BASE_URL', 'https://api.powerbi.com/v1.0/myorg');
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async requestWithRetry(config, retries = 3) {
        try {
            const token = await this.authService.getToken();
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${token}`,
            };
            return await (0, axios_1.default)(config);
        }
        catch (error) {
            if (error.response?.status === 429 && retries > 0) {
                const retryAfterHeader = error.response.headers['retry-after'];
                let retryAfterMs = 5000;
                if (retryAfterHeader) {
                    const seconds = parseInt(retryAfterHeader, 10);
                    if (!isNaN(seconds)) {
                        retryAfterMs = seconds * 1000;
                    }
                }
                this.logger.warn(`Rate limit (429) hit. Waiting ${retryAfterMs}ms before retrying. Retries remaining: ${retries}`);
                await this.sleep(retryAfterMs);
                return this.requestWithRetry(config, retries - 1);
            }
            throw error;
        }
    }
    async get(url, params = {}) {
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        const response = await this.requestWithRetry({
            method: 'GET',
            url: fullUrl,
            params,
        });
        return response.data;
    }
    async post(url, data = {}) {
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        const response = await this.requestWithRetry({
            method: 'POST',
            url: fullUrl,
            data,
        });
        return response.data;
    }
    async getPaginated(url, params = {}) {
        let results = [];
        let currentUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        let currentParams = { ...params };
        while (currentUrl) {
            this.logger.log(`Fetching page: ${currentUrl}`);
            const response = await this.get(currentUrl, currentParams);
            if (response && Array.isArray(response.value)) {
                results = results.concat(response.value);
            }
            else if (response && Array.isArray(response)) {
                results = results.concat(response);
            }
            const continuationToken = response?.['@odata.continuationToken'] || response?.continuationToken;
            if (continuationToken) {
                currentUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
                currentParams = { ...params, continuationToken };
            }
            else {
                currentUrl = null;
            }
        }
        return results;
    }
};
exports.PowerBIService = PowerBIService;
exports.PowerBIService = PowerBIService = PowerBIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [powerbi_auth_service_1.PowerBiAuthService,
        config_1.ConfigService])
], PowerBIService);
//# sourceMappingURL=powerbi.service.js.map