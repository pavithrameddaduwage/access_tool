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
    async onApplicationBootstrap() {
        this.logger.log('Application bootstrap: triggering Workspace/Dashboard mappings sync to Master Data');
        await this.powerbiMetricsService.syncMappingsToMasterData();
        this.logger.log('Application bootstrap: triggering User roster sync from Power BI logs');
        await this.powerbiMetricsService.syncUsersFromLogs();
        this.logger.log('Application bootstrap: triggering initial Power BI log collection');
        this.collectRealTimeLogs().catch(err => {
            this.logger.error('Initial bootstrap log collection failed', err.stack);
        });
    }
    async collectRealTimeLogs() {
        try {
            this.logger.log('Starting real-time Power BI logs collection (last 24 hours)');
            const now = new Date();
            const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const endDate = now;
            this.logger.debug(`Time window: ${startDate.toISOString()} to ${endDate.toISOString()}`);
            const accessToken = await this.powerbiMetricsService.getAccessToken();
            this.logger.debug('Access token retrieved successfully');
            await this.powerbiMetricsService.ensureSubscription(accessToken);
            this.logger.debug('Subscription checked/ensured');
            const contentUris = await this.powerbiMetricsService.getContentUris(accessToken, startDate, endDate);
            this.logger.debug(`Found ${contentUris.length} content URIs`);
            if (contentUris.length === 0) {
                this.logger.log('No content URIs found for this period');
                return;
            }
            const allLogs = await Promise.all(contentUris.map(uri => this.powerbiMetricsService.getLogEntries(uri, accessToken)
                .catch(e => {
                this.logger.error(`Failed to process URI ${uri}: ${e.message}`);
                return [];
            })));
            const powerBILogs = allLogs.flat().filter(entry => entry.Workload === 'PowerBI' && entry.Operation === 'ViewReport');
            this.logger.debug(`Fetched ${powerBILogs.length} raw Power BI logs`);
            if (powerBILogs.length === 0) {
                this.logger.log('No Power BI ViewReport logs found');
                return;
            }
            const newLogs = await this.filterExistingLogs(powerBILogs);
            this.logger.debug(`Found ${newLogs.length} new logs to save`);
            if (newLogs.length > 0) {
                await this.powerbiMetricsService.saveRawLogs(newLogs);
                this.logger.log(`Successfully saved ${newLogs.length} new real-time logs`);
            }
            else {
                this.logger.log('No new logs to save');
            }
        }
        catch (error) {
            this.logger.error('Failed to collect real-time Power BI logs', error.stack);
        }
    }
    async filterExistingLogs(logs) {
        if (logs.length === 0)
            return [];
        const chunkSize = 500;
        const allExistingIds = new Set();
        for (let i = 0; i < logs.length; i += chunkSize) {
            const chunk = logs.slice(i, i + chunkSize);
            const existingIds = await this.powerbiLogRepository.find({
                where: {
                    id: (0, typeorm_1.In)(chunk.map(l => l.Id)),
                },
                select: ['id'],
            });
            existingIds.forEach(l => allExistingIds.add(l.id));
        }
        return logs.filter(log => !allExistingIds.has(log.Id));
    }
    formatDate(date) {
        return date.toISOString().replace('T', ' ').substring(0, 19) + ' EDT';
    }
};
exports.PowerBILogsCollectorTask = PowerBILogsCollectorTask;
__decorate([
    (0, schedule_1.Cron)('0 */10 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBILogsCollectorTask.prototype, "collectRealTimeLogs", null);
exports.PowerBILogsCollectorTask = PowerBILogsCollectorTask = PowerBILogsCollectorTask_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectRepository)(powerbi_log_entity_1.PowerBILog)),
    __metadata("design:paramtypes", [powerbi_metrics_service_1.PowerBIMetricsService,
        typeorm_1.Repository])
], PowerBILogsCollectorTask);
//# sourceMappingURL=powerbi-logs-collector.task.js.map