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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const powerbi_log_entity_1 = require("../entities/powerbi-log.entity");
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
            const endDate = new Date(now);
            endDate.setDate(now.getDate() - 1);
            endDate.setHours(23, 59, 59, 999);
            const startDate = new Date(endDate);
            startDate.setHours(0, 0, 0, 0);
            const existingCount = await this.powerbiLogRepository.count({
                where: {
                    creationTime: (0, typeorm_2.Between)(startDate, endDate),
                    workload: 'PowerBI',
                    operation: 'ViewReport',
                },
            });
            if (existingCount > 0) {
                this.logger.warn(`Already have ${existingCount} logs for this date range, skipping collection`);
                return;
            }
            const accessToken = await this.powerbiMetricsService.getAccessToken();
            await this.powerbiMetricsService.ensureSubscription(accessToken);
            const contentUris = await this.powerbiMetricsService.getContentUris(accessToken, startDate, endDate);
            const allLogs = await Promise.all(contentUris.map(uri => this.powerbiMetricsService.getLogEntries(uri, accessToken)
                .catch(e => {
                this.logger.error(`Failed to process URI ${uri}: ${e.message}`);
                return [];
            })));
            const powerBILogs = allLogs.flat().filter(entry => entry.Workload === 'PowerBI' && entry.Operation === 'ViewReport');
            const newLogs = await this.filterExistingLogs(powerBILogs);
            if (newLogs.length > 0) {
                await this.powerbiMetricsService.saveRawLogs(newLogs);
                this.logger.log(`Successfully saved ${newLogs.length} new logs for ${startDate.toISOString().split('T')[0]}`);
            }
            else {
                this.logger.log('No new logs to save');
            }
        }
        catch (error) {
            this.logger.error('Failed to collect Power BI logs', error.stack);
        }
    }
    async filterExistingLogs(logs) {
        const existingIds = await this.powerbiLogRepository.find({
            where: {
                id: (0, typeorm_2.In)(logs.map(l => l.Id)),
            },
            select: ['id'],
        });
        const existingIdSet = new Set(existingIds.map(l => l.id));
        return logs.filter(log => !existingIdSet.has(log.Id));
    }
};
exports.PowerBILogsCollectorTask = PowerBILogsCollectorTask;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBILogsCollectorTask.prototype, "collectPreviousDayLogs", null);
exports.PowerBILogsCollectorTask = PowerBILogsCollectorTask = PowerBILogsCollectorTask_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(powerbi_log_entity_1.PowerBILog)),
    __metadata("design:paramtypes", [powerbi_metrics_service_1.PowerBIMetricsService,
        typeorm_2.Repository])
], PowerBILogsCollectorTask);
//# sourceMappingURL=powerbi-logs-collector.task.js.map