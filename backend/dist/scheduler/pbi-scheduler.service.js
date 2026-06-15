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
var PbiSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PbiSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const activity_service_1 = require("../activity/activity.service");
const workspaces_service_1 = require("../workspaces/workspaces.service");
const sync_log_service_1 = require("../sync-log/sync-log.service");
let PbiSchedulerService = PbiSchedulerService_1 = class PbiSchedulerService {
    constructor(activityService, workspacesService, syncLogService) {
        this.activityService = activityService;
        this.workspacesService = workspacesService;
        this.syncLogService = syncLogService;
        this.logger = new common_1.Logger(PbiSchedulerService_1.name);
    }
    async onApplicationBootstrap() {
        this.logger.log('Power BI Tracker Scheduler initialized. Checking startup tasks...');
        if (process.env.POWER_BI_BOOTSTRAP_SYNC !== 'true') {
            this.logger.log('Startup Power BI sync is disabled. Set POWER_BI_BOOTSTRAP_SYNC=true to enable it.');
            return;
        }
        try {
            const isWsEmpty = await this.workspacesService.isWorkspacesEmpty();
            if (isWsEmpty) {
                this.logger.log('Workspaces table is empty. Triggering initial workspace sync...');
                await this.workspacesService.syncAll();
            }
        }
        catch (err) {
            this.logger.error('Failed to run initial workspace sync on startup', err.message);
        }
        try {
            const syncLogs = await this.syncLogService.getStatus();
            const hasActivitySync = syncLogs.some(log => log.syncType === 'activity' && log.status === 'success');
            if (!hasActivitySync) {
                this.logger.log('No successful activity logs found. Starting 90-day automatic historical backfill...');
                this.activityService.triggerBackfill(90).catch(err => {
                    this.logger.error('Startup automatic backfill failed', err.stack);
                });
            }
        }
        catch (err) {
            this.logger.error('Failed to run startup backfill check', err.message);
        }
    }
    async handleWeeklyWorkspaceSync() {
        this.logger.log('Triggering weekly scheduled task: Syncing all workspaces, reports, dashboards...');
        try {
            await this.workspacesService.syncAll();
            this.logger.log('Weekly workspace sync scheduled task completed successfully.');
        }
        catch (error) {
            this.logger.error('Weekly workspace sync scheduled task failed', error.stack);
        }
    }
};
exports.PbiSchedulerService = PbiSchedulerService;
__decorate([
    (0, schedule_1.Cron)('0 0 2 * * 0'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PbiSchedulerService.prototype, "handleWeeklyWorkspaceSync", null);
exports.PbiSchedulerService = PbiSchedulerService = PbiSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [activity_service_1.ActivityService,
        workspaces_service_1.WorkspacesService,
        sync_log_service_1.SyncLogService])
], PbiSchedulerService);
//# sourceMappingURL=pbi-scheduler.service.js.map