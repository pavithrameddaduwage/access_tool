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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PowerBILogsCollectorTask_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerBILogsCollectorTask = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const powerbi_metrics_service_1 = require("../powerbi-metrics.service");
const typeorm_1 = require("typeorm");
const powerbi_log_entity_1 = require("../entities/powerbi-log.entity");
const typeorm_2 = require("@nestjs/typeorm");
let PowerBILogsCollectorTask = PowerBILogsCollectorTask_1 = class PowerBILogsCollectorTask {
    constructor(powerbiMetricsService, powerbiLogRepository) {
        this.powerbiMetricsService = powerbiMetricsService;
        this.powerbiLogRepository = powerbiLogRepository;
        this.logger = new common_1.Logger(PowerBILogsCollectorTask_1.name);
    }
    async collectPreviousDayLogs() {
        try {
            this.logger.log('Starting Power BI logs collection for previous day');
            const now = new Date();
            const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
            const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
            console.log("date formt", startDate, endDate);
            const accessToken = await this.powerbiMetricsService.getAccessToken();
            console.log("access token retrieved: ", accessToken);
            await this.powerbiMetricsService.ensureSubscription(accessToken);
            console.log("Subscription successful");
            const contentUris = await this.powerbiMetricsService.getContentUris(accessToken, startDate, endDate);
            this.logger.debug(`Found ${contentUris.length} content URIs`);
            const allLogs = await Promise.all(contentUris.map(uri => this.powerbiMetricsService.getLogEntries(uri, accessToken)
                .catch(e => {
                this.logger.error(`Failed to process URI ${uri}: ${e.message}`);
                return [];
            })));
            const powerBILogs = allLogs.flat().filter(entry => entry.Workload === 'PowerBI' && entry.Operation === 'ViewReport');
            this.logger.debug(`Fetched ${powerBILogs.length} raw Power BI logs`);
            const newLogs = await this.filterExistingLogs(powerBILogs);
            this.logger.debug(`Found ${newLogs.length} new logs to save`);
            if (newLogs.length > 0) {
                await this.powerbiMetricsService.saveRawLogs(newLogs);
                this.logger.log(`Successfully saved ${newLogs.length} new logs for date ${this.formatDate(startDate)}`);
            }
            else {
                this.logger.log('No new logs to save');
            }
        }
        catch (error) {
            this.logger.error('Failed to collect Power BI logs', error.stack);
            throw error;
        }
    }
    async filterExistingLogs(logs) {
        const existingIds = await this.powerbiLogRepository.find({
            where: {
                id: (0, typeorm_1.In)(logs.map(l => l.Id)),
            },
            select: ['id'],
        });
        const existingIdSet = new Set(existingIds.map(l => l.id));
        return logs.filter(log => !existingIdSet.has(log.Id));
    }
    formatDate(date) {
        return date.toISOString().replace('T', ' ').substring(0, 19) + ' EDT';
    }
};
exports.PowerBILogsCollectorTask = PowerBILogsCollectorTask;
__decorate([
    (0, schedule_1.Cron)('0 58 0 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBILogsCollectorTask.prototype, "collectPreviousDayLogs", null);
exports.PowerBILogsCollectorTask = PowerBILogsCollectorTask = PowerBILogsCollectorTask_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectRepository)(powerbi_log_entity_1.PowerBILog)),
    __metadata("design:paramtypes", [powerbi_metrics_service_1.PowerBIMetricsService,
        typeorm_1.Repository])
], PowerBILogsCollectorTask);
//# sourceMappingURL=powerbi-logs-collector.task.js.map