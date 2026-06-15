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
var ActivityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const pbi_activity_event_entity_1 = require("./entities/pbi-activity-event.entity");
const pbi_user_entity_1 = require("../users/entities/pbi-user.entity");
const sync_log_service_1 = require("../sync-log/sync-log.service");
const date_fns_1 = require("date-fns");
const ACTIVITIES_TO_TRACK = new Set([
    'ViewReport',
    'ViewDashboard',
    'FilterReport',
    'ExportReport',
    'PrintReport',
]);
let ActivityService = ActivityService_1 = class ActivityService {
    constructor(activityEventRepository, userRepository, syncLogService, configService) {
        this.activityEventRepository = activityEventRepository;
        this.userRepository = userRepository;
        this.syncLogService = syncLogService;
        this.configService = configService;
        this.logger = new common_1.Logger(ActivityService_1.name);
        this.isBackfilling = false;
        this.o365Token = null;
        this.o365TokenExpiry = null;
    }
    async getO365Token() {
        const now = Date.now();
        if (this.o365Token && this.o365TokenExpiry && this.o365TokenExpiry - now > 300_000) {
            return this.o365Token;
        }
        const tenantId = this.configService.get('TENANT_ID');
        const clientId = this.configService.get('CLIENT_ID');
        const clientSecret = this.configService.get('CLIENT_SECRET');
        if (!tenantId || !clientId || !clientSecret) {
            throw new Error('Azure AD credentials (TENANT_ID, CLIENT_ID, CLIENT_SECRET) are missing.');
        }
        const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('scope', 'https://manage.office.com/.default');
        const response = await axios_1.default.post(url, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        this.o365Token = response.data.access_token;
        this.o365TokenExpiry = now + response.data.expires_in * 1000;
        this.logger.log('Office 365 Management API token refreshed.');
        return this.o365Token;
    }
    async ensureSubscription(token) {
        const tenantId = this.configService.get('TENANT_ID');
        const baseUrl = `https://manage.office.com/api/v1.0/${tenantId}/activity/feed/subscriptions`;
        try {
            const listRes = await axios_1.default.get(`${baseUrl}/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const existing = (listRes.data || []).map((s) => s.contentType);
            if (existing.includes('Audit.General'))
                return;
            await axios_1.default.post(`${baseUrl}/start`, null, {
                params: { contentType: 'Audit.General' },
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            this.logger.log('Audit.General subscription created.');
        }
        catch (err) {
            if (err?.response?.data?.error?.code === 'AF20024')
                return;
            this.logger.warn(`Subscription check warning: ${err.message}`);
        }
    }
    async getContentUrisForDay(token, startDate, endDate) {
        const tenantId = this.configService.get('TENANT_ID');
        const fmt = (d) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
        const url = `https://manage.office.com/api/v1.0/${tenantId}/activity/feed/subscriptions/content` +
            `?contentType=Audit.General&startTime=${fmt(startDate)}&endTime=${fmt(endDate)}`;
        const res = await axios_1.default.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return (res.data || []).map((item) => item.contentUri);
    }
    async fetchContentBlob(token, contentUri) {
        const res = await axios_1.default.get(contentUri, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return (res.data || []).filter((e) => e.Workload === 'PowerBI' && ACTIVITIES_TO_TRACK.has(e.Activity || e.Operation));
    }
    async fetchActivityForDate(dateStr) {
        const syncLog = await this.syncLogService.createLog('activity', dateStr);
        try {
            this.logger.log(`Fetching Power BI activity logs for date: ${dateStr}`);
            const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
            const dayEnd = new Date(`${dateStr}T23:59:59.000Z`);
            const token = await this.getO365Token();
            await this.ensureSubscription(token);
            const contentUris = await this.getContentUrisForDay(token, dayStart, dayEnd);
            this.logger.log(`Found ${contentUris.length} content blobs for ${dateStr}.`);
            let totalEventsPulled = 0;
            for (const uri of contentUris) {
                let entries = [];
                try {
                    entries = await this.fetchContentBlob(token, uri);
                }
                catch (blobErr) {
                    this.logger.warn(`Failed to fetch blob ${uri}: ${blobErr.message}`);
                    continue;
                }
                for (const ev of entries) {
                    const eventId = ev.Id;
                    const userId = ev.UserId || ev.UserKey;
                    if (!eventId || !userId)
                        continue;
                    await this.activityEventRepository
                        .createQueryBuilder()
                        .insert()
                        .values({
                        eventId,
                        userId,
                        userEmail: (ev.UserId || '').toLowerCase() || null,
                        operation: ev.Operation || 'View',
                        activity: ev.Activity || ev.Operation || null,
                        workspaceId: ev.WorkspaceId || null,
                        workspaceName: ev.WorkSpaceName || ev.WorkspaceName || null,
                        reportId: ev.ReportId || null,
                        reportName: ev.ReportName || ev.ArtifactName || null,
                        reportType: ev.ReportType || null,
                        dashboardId: ev.DashboardId || null,
                        dashboardName: ev.DashboardName || null,
                        datasetId: ev.DatasetId || null,
                        datasetName: ev.DatasetName || null,
                        clientIp: ev.ClientIP || null,
                        userAgent: ev.UserAgent || null,
                        isSuccess: ev.IsSuccess !== undefined ? ev.IsSuccess : true,
                        distributionMethod: ev.DistributionMethod || null,
                        consumptionMethod: ev.ConsumptionMethod || null,
                        creationTime: ev.CreationTime ? new Date(ev.CreationTime) : new Date(),
                        requestId: ev.RequestId || null,
                        rawJson: ev,
                    })
                        .onConflict(`("event_id") DO UPDATE SET 
              "operation" = EXCLUDED.operation,
              "activity" = EXCLUDED.activity,
              "workspace_name" = EXCLUDED.workspace_name,
              "report_name" = EXCLUDED.report_name,
              "user_email" = EXCLUDED.user_email,
              "client_ip" = EXCLUDED.client_ip,
              "user_agent" = EXCLUDED.user_agent,
              "is_success" = EXCLUDED.is_success,
              "pulled_at" = NOW()`)
                        .execute();
                    const email = (ev.UserId || '').toLowerCase();
                    if (email && email.includes('@')) {
                        await this.userRepository
                            .createQueryBuilder()
                            .insert()
                            .values({
                            userId,
                            email,
                            displayName: email.split('@')[0],
                            lastSeenAt: ev.CreationTime ? new Date(ev.CreationTime) : new Date(),
                        })
                            .onConflict(`("user_id") DO UPDATE SET 
                "last_seen_at" = EXCLUDED.last_seen_at,
                "email" = EXCLUDED.email`)
                            .execute();
                    }
                    totalEventsPulled++;
                }
            }
            await this.syncLogService.updateLog(syncLog.id, 'success', totalEventsPulled);
            this.logger.log(`Completed activity fetch for ${dateStr}. Pulled ${totalEventsPulled} events.`);
            return totalEventsPulled;
        }
        catch (error) {
            this.logger.error(`Error fetching activity for date ${dateStr}`, error?.response?.data || error.message);
            await this.syncLogService.updateLog(syncLog.id, 'failed', 0, error.message);
            throw error;
        }
    }
    async triggerBackfill(days = 90) {
        if (this.isBackfilling) {
            this.logger.warn('Backfill task is already running.');
            return;
        }
        this.isBackfilling = true;
        this.runBackfillAsync(days).finally(() => {
            this.isBackfilling = false;
        });
    }
    async runBackfillAsync(days) {
        this.logger.log(`Starting historical backfill going back ${days} days...`);
        const today = new Date();
        for (let i = days; i >= 1; i--) {
            const targetDate = (0, date_fns_1.subDays)(today, i);
            const dateStr = (0, date_fns_1.format)(targetDate, 'yyyy-MM-dd');
            try {
                const alreadySynced = await this.syncLogService.findSuccessLog('activity', dateStr);
                if (alreadySynced) {
                    this.logger.log(`Date ${dateStr} already synced. Skipping.`);
                    continue;
                }
                await this.fetchActivityForDate(dateStr);
                await new Promise((resolve) => setTimeout(resolve, 1_000));
            }
            catch (err) {
                this.logger.error(`Backfill failed for date ${dateStr}. Continuing with next days.`, err.message);
            }
        }
        this.logger.log('Historical backfill completed.');
    }
    async findFiltered(filters) {
        const query = this.activityEventRepository.createQueryBuilder('event');
        if (filters.from && filters.to) {
            query.andWhere('event.creationTime BETWEEN :from AND :to', {
                from: (0, date_fns_1.startOfDay)((0, date_fns_1.parseISO)(filters.from)),
                to: (0, date_fns_1.endOfDay)((0, date_fns_1.parseISO)(filters.to)),
            });
        }
        if (filters.userId) {
            query.andWhere('event.userId = :userId', { userId: filters.userId });
        }
        if (filters.workspaceId) {
            query.andWhere('event.workspaceId = :workspaceId', { workspaceId: filters.workspaceId });
        }
        if (filters.reportId) {
            query.andWhere('event.reportId = :reportId', { reportId: filters.reportId });
        }
        query.orderBy('event.creationTime', 'DESC');
        return query.getMany();
    }
    async getSyncStatus() {
        return this.syncLogService.getStatus();
    }
    async getIsBackfilling() {
        return this.isBackfilling;
    }
};
exports.ActivityService = ActivityService;
exports.ActivityService = ActivityService = ActivityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pbi_activity_event_entity_1.PbiActivityEvent)),
    __param(1, (0, typeorm_1.InjectRepository)(pbi_user_entity_1.PbiUser)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        sync_log_service_1.SyncLogService,
        config_1.ConfigService])
], ActivityService);
//# sourceMappingURL=activity.service.js.map