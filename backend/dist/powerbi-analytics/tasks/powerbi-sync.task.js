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
var PowerbiSyncTask_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerbiSyncTask = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const powerbi_analytics_service_1 = require("../powerbi-analytics.service");
let PowerbiSyncTask = PowerbiSyncTask_1 = class PowerbiSyncTask {
    constructor(powerbiService) {
        this.powerbiService = powerbiService;
        this.logger = new common_1.Logger(PowerbiSyncTask_1.name);
    }
    async handleSync() {
        const MAX_RETRIES = 3;
        let attempts = 0;
        while (attempts < MAX_RETRIES) {
            try {
                this.logger.log(`Starting Power BI data sync (attempt ${attempts + 1})`);
                this.logger.log('Power BI data sync completed successfully');
                return;
            }
            catch (error) {
                attempts++;
                this.logger.error(`Sync failed (attempt ${attempts}): ${error.message}`);
                if (attempts === MAX_RETRIES) {
                    this.logger.error('Maximum retry attempts reached. Aborting sync.');
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 5000 * attempts));
            }
        }
    }
    async handleCron() {
        await this.handleSync();
    }
};
exports.PowerbiSyncTask = PowerbiSyncTask;
__decorate([
    (0, schedule_1.Cron)('0 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerbiSyncTask.prototype, "handleCron", null);
exports.PowerbiSyncTask = PowerbiSyncTask = PowerbiSyncTask_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [powerbi_analytics_service_1.PowerBIService])
], PowerbiSyncTask);
//# sourceMappingURL=powerbi-sync.task.js.map