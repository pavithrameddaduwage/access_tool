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
var PowerBiSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerBiSyncService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const date_fns_1 = require("date-fns");
const powerbi_service_1 = require("./powerbi.service");
const sync_log_service_1 = require("../sync-log/sync-log.service");
const pbi_analytics_service_1 = require("../analytics/pbi-analytics.service");
const pbi_activity_event_entity_1 = require("../activity/entities/pbi-activity-event.entity");
const component_view_count_entity_1 = require("../tracking/entities/component-view-count.entity");
const HOURS_PER_DAY = 24;
const MAX_5XX_RETRIES = 3;
const SYNC_TYPE = 'activity';
const ACTIVITY_TO_COMPONENT_TYPE = {
    ViewReport: 'report',
    ViewDashboard: 'dashboard',
    ViewDataset: 'dataset',
    ExportReport: 'report',
    FilterReport: 'report',
};
let PowerBiSyncService = PowerBiSyncService_1 = class PowerBiSyncService {
    constructor(powerBiService, syncLogService, analyticsService, activityRepo, viewCountRepo) {
        this.powerBiService = powerBiService;
        this.syncLogService = syncLogService;
        this.analyticsService = analyticsService;
        this.activityRepo = activityRepo;
        this.viewCountRepo = viewCountRepo;
        this.logger = new common_1.Logger(PowerBiSyncService_1.name);
    }
    async handleDailySync() {
        const dateStr = (0, date_fns_1.format)((0, date_fns_1.subDays)(new Date(), 1), 'yyyy-MM-dd');
        this.logger.log(`[2AM] Daily Power BI activity sync for ${dateStr}`);
        try {
            await this.syncDay(dateStr);
            await this.recalculateSessions(dateStr);
        }
        catch (err) {
            this.logger.error(`[2AM] Daily sync failed for ${dateStr}`, this.errMsg(err));
        }
    }
    async handleRetryFailedDays() {
        const failedDates = await this.getFailedDates();
        if (failedDates.length === 0) {
            this.logger.log('[3AM] No failed activity days to retry.');
            return;
        }
        this.logger.log(`[3AM] Retrying ${failedDates.length} failed day(s): ${failedDates.join(', ')}`);
        for (const dateStr of failedDates) {
            try {
                await this.syncDay(dateStr);
                await this.recalculateSessions(dateStr);
            }
            catch (err) {
                this.logger.error(`[3AM] Retry failed for ${dateStr}`, this.errMsg(err));
            }
        }
    }
    async recalculateSessions(dateStr) {
        try {
            await this.analyticsService.calculateSessionsForDate(dateStr);
            this.logger.log(`Session calculation complete for ${dateStr}.`);
        }
        catch (err) {
            this.logger.error(`Session calculation failed for ${dateStr}`, this.errMsg(err));
        }
    }
    async syncDay(dateStr) {
        const syncLog = await this.syncLogService.createLog(SYNC_TYPE, dateStr);
        let eventsFetched = 0;
        let pagesFetched = 0;
        try {
            for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
                let url = this.buildHourUrl(dateStr, hour);
                while (url) {
                    const page = await this.callWithRetry(url);
                    const entities = page.activityEventEntities ?? [];
                    pagesFetched++;
                    eventsFetched += entities.length;
                    if (entities.length > 0) {
                        await this.batchUpsert(entities);
                        await this.updateViewCountsFromAudit(entities);
                    }
                    url = page.continuationUri ?? null;
                }
            }
            await this.syncLogService.updateLog(syncLog.id, 'success', eventsFetched);
            this.logger.log(`Sync ${dateStr} complete — ${eventsFetched} events across ${pagesFetched} page(s).`);
            return eventsFetched;
        }
        catch (err) {
            await this.syncLogService.updateLog(syncLog.id, 'failed', eventsFetched, this.errMsg(err));
            throw err;
        }
    }
    buildHourUrl(dateStr, hour) {
        const start = new Date(`${dateStr}T00:00:00.000Z`);
        start.setUTCHours(hour, 0, 0, 0);
        const end = new Date(`${dateStr}T00:00:00.000Z`);
        end.setUTCHours(hour, 59, 59, 999);
        return (`/admin/activityevents?startDateTime='${start.toISOString()}'` +
            `&endDateTime='${end.toISOString()}'`);
    }
    async callWithRetry(url) {
        let attempt = 0;
        for (;;) {
            try {
                return await this.powerBiService.get(url);
            }
            catch (err) {
                const status = this.statusOf(err);
                const isTransient = status !== undefined && status >= 500 && status < 600;
                if (isTransient && attempt < MAX_5XX_RETRIES) {
                    const delayMs = 2 ** attempt * 1000;
                    attempt++;
                    this.logger.warn(`5xx (${status}) on activityevents. Backing off ${delayMs}ms (attempt ${attempt}/${MAX_5XX_RETRIES}).`);
                    await this.sleep(delayMs);
                    continue;
                }
                throw err;
            }
        }
    }
    async batchUpsert(entities) {
        const byId = new Map();
        for (const e of entities) {
            if (e.Id && (e.UserId || e.UserKey))
                byId.set(e.Id, e);
        }
        if (byId.size === 0)
            return;
        const values = Array.from(byId.values()).map((e) => {
            const userId = (e.UserId || e.UserKey);
            return {
                eventId: e.Id,
                userId,
                userEmail: (e.UserId || '').toLowerCase() || null,
                operation: e.Operation || e.Activity || 'View',
                activity: e.Activity || e.Operation || null,
                workspaceId: e.WorkspaceId || null,
                workspaceName: e.WorkSpaceName || e.WorkspaceName || null,
                reportId: e.ReportId || null,
                reportName: e.ReportName || null,
                reportType: e.ReportType || null,
                dashboardId: e.DashboardId || null,
                dashboardName: e.DashboardName || null,
                datasetId: e.DatasetId || null,
                datasetName: e.DatasetName || null,
                clientIp: e.ClientIP || null,
                userAgent: e.UserAgent || null,
                isSuccess: e.IsSuccess !== undefined ? e.IsSuccess : true,
                distributionMethod: e.DistributionMethod || null,
                consumptionMethod: e.ConsumptionMethod || null,
                creationTime: e.CreationTime ? new Date(e.CreationTime) : new Date(),
                requestId: e.RequestId || null,
                rawJson: e,
            };
        });
        await this.activityRepo
            .createQueryBuilder()
            .insert()
            .values(values)
            .onConflict(`("event_id") DO UPDATE SET
          "operation" = EXCLUDED.operation,
          "activity" = EXCLUDED.activity,
          "workspace_name" = EXCLUDED.workspace_name,
          "report_name" = EXCLUDED.report_name,
          "user_email" = EXCLUDED.user_email,
          "is_success" = EXCLUDED.is_success,
          "pulled_at" = NOW()`)
            .execute();
    }
    async updateViewCountsFromAudit(entities) {
        const deltas = new Map();
        for (const e of entities) {
            const activity = (e.Activity || e.Operation || '');
            const componentType = ACTIVITY_TO_COMPONENT_TYPE[activity];
            if (!componentType)
                continue;
            const userId = (e.UserId || e.UserKey);
            const componentId = this.pickComponentId(componentType, e);
            if (!userId || !componentId)
                continue;
            const key = `${userId}|${componentType}|${componentId}`;
            const lastViewedAt = e.CreationTime ? new Date(e.CreationTime) : new Date();
            const existing = deltas.get(key);
            if (existing) {
                existing.count++;
                if (lastViewedAt > existing.lastViewedAt)
                    existing.lastViewedAt = lastViewedAt;
            }
            else {
                deltas.set(key, {
                    userId,
                    componentType,
                    componentId,
                    componentName: this.pickComponentName(componentType, e),
                    workspaceId: e.WorkspaceId || null,
                    count: 1,
                    lastViewedAt,
                });
            }
        }
        for (const d of deltas.values()) {
            await this.upsertViewCount(d);
        }
    }
    async upsertViewCount(d) {
        await this.viewCountRepo.query(`INSERT INTO component_view_counts
         (user_id, component_type, component_id, component_name, workspace_id,
          view_count, last_viewed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (user_id, component_type, component_id)
       DO UPDATE SET
         view_count     = component_view_counts.view_count + EXCLUDED.view_count,
         component_name = COALESCE(EXCLUDED.component_name, component_view_counts.component_name),
         workspace_id   = COALESCE(EXCLUDED.workspace_id, component_view_counts.workspace_id),
         last_viewed_at = GREATEST(component_view_counts.last_viewed_at, EXCLUDED.last_viewed_at),
         updated_at     = NOW()`, [d.userId, d.componentType, d.componentId, d.componentName, d.workspaceId, d.count, d.lastViewedAt]);
    }
    pickComponentId(componentType, e) {
        switch (componentType) {
            case 'report':
                return e.ReportId || null;
            case 'dashboard':
                return e.DashboardId || null;
            case 'dataset':
                return e.DatasetId || null;
            default:
                return e.ReportId || e.DashboardId || e.DatasetId || null;
        }
    }
    pickComponentName(componentType, e) {
        switch (componentType) {
            case 'report':
                return e.ReportName || null;
            case 'dashboard':
                return e.DashboardName || null;
            case 'dataset':
                return e.DatasetName || null;
            default:
                return e.ReportName || e.DashboardName || e.DatasetName || null;
        }
    }
    async getFailedDates() {
        const logs = await this.syncLogService.getStatus();
        const succeeded = new Set();
        const failed = new Set();
        for (const log of logs) {
            if (log.syncType !== SYNC_TYPE || !log.syncDate)
                continue;
            if (log.status === 'success')
                succeeded.add(log.syncDate);
            else if (log.status === 'failed')
                failed.add(log.syncDate);
        }
        return Array.from(failed).filter((d) => !succeeded.has(d)).sort();
    }
    statusOf(err) {
        const resp = err?.response;
        return resp?.status;
    }
    errMsg(err) {
        if (err instanceof Error)
            return err.message;
        return String(err);
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.PowerBiSyncService = PowerBiSyncService;
__decorate([
    (0, schedule_1.Cron)('0 0 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBiSyncService.prototype, "handleDailySync", null);
__decorate([
    (0, schedule_1.Cron)('0 0 3 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBiSyncService.prototype, "handleRetryFailedDays", null);
exports.PowerBiSyncService = PowerBiSyncService = PowerBiSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(pbi_activity_event_entity_1.PbiActivityEvent)),
    __param(4, (0, typeorm_1.InjectRepository)(component_view_count_entity_1.ComponentViewCount)),
    __metadata("design:paramtypes", [powerbi_service_1.PowerBIService,
        sync_log_service_1.SyncLogService,
        pbi_analytics_service_1.PbiAnalyticsService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PowerBiSyncService);
//# sourceMappingURL=powerbi-sync.service.js.map