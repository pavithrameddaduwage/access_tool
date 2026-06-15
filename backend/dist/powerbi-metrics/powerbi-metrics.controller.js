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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerBIMetricsController = void 0;
const common_1 = require("@nestjs/common");
const parse_date_pipe_1 = require("./parse-date.pipe");
const powerbi_metrics_service_1 = require("./powerbi-metrics.service");
let PowerBIMetricsController = class PowerBIMetricsController {
    constructor(powerbiMetricsService) {
        this.powerbiMetricsService = powerbiMetricsService;
    }
    async getMetrics(startDate, endDate) {
        const utcStart = new Date(startDate.toISOString().replace(/\.\d{3}Z$/, 'Z'));
        const utcEnd = new Date(endDate.toISOString().replace(/\.\d{3}Z$/, 'Z'));
        const hoursDiff = Math.abs(utcEnd.getTime() - utcStart.getTime()) / (1000 * 60 * 60);
        if (hoursDiff > 24) {
            throw new common_1.BadRequestException({
                message: 'Date range must be 24 hours or less',
                maxHours: 24,
                receivedHours: hoursDiff,
                example: 'Try ?startDate=2025-04-01T00:00:00Z&endDate=2025-04-01T23:59:59Z'
            });
        }
        return this.powerbiMetricsService.getPowerBIMetrics(utcStart, utcEnd);
    }
    async getWorkspaceMetrics(workspaceId, startDate, endDate) {
        return this.powerbiMetricsService.getWorkspaceMetrics(workspaceId, startDate, endDate);
    }
    async getReportMetrics(reportId, startDate, endDate) {
        return this.powerbiMetricsService.getReportMetrics(reportId, startDate, endDate);
    }
    async collectRawData(startDate, endDate) {
        const limitTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const limitDate = new Date(limitTime);
        let adjustedStart = new Date(startDate);
        const adjustedEnd = new Date(endDate);
        if (adjustedEnd.getTime() < limitTime) {
            return {
                message: `Skipped sync: Requested end date (${endDate.toISOString()}) is older than the 7-day Office 365 API boundary (${limitDate.toISOString()}). No data could be fetched.`,
                logs: []
            };
        }
        let wasClamped = false;
        if (adjustedStart.getTime() < limitTime) {
            adjustedStart = limitDate;
            wasClamped = true;
        }
        const accessToken = await this.powerbiMetricsService.getAccessToken();
        await this.powerbiMetricsService.ensureSubscription(accessToken);
        const contentUris = await this.powerbiMetricsService.getContentUris(accessToken, adjustedStart, adjustedEnd);
        const allLogs = await Promise.all(contentUris.map(async (uri) => {
            try {
                return await this.powerbiMetricsService.getLogEntries(uri, accessToken);
            }
            catch (err) {
                console.error(`Failed to fetch logs for content URI: ${uri}`, err);
                return [];
            }
        }));
        const powerBILogs = allLogs.flat().filter(entry => entry && entry.Workload === 'PowerBI' && entry.Operation);
        await this.powerbiMetricsService.saveRawLogs(powerBILogs);
        return {
            message: `Saved ${powerBILogs.length} raw logs${wasClamped ? ' (Start date clamped to 7-day limit: ' + adjustedStart.toISOString() + ')' : ''}`,
            logs: powerBILogs.slice(0, 5)
        };
    }
    async getUniqueUserCount(startDate, endDate, workspaceId, reportId) {
        return this.powerbiMetricsService.getUniqueUserCount(startDate, endDate, workspaceId, reportId);
    }
    async getUniqueReportCount(startDate, endDate, workspaceId) {
        return this.powerbiMetricsService.getUniqueReportCount(startDate, endDate, workspaceId);
    }
    async getUserActivityTrend(startDate, endDate, workspaceId, reportId) {
        return this.powerbiMetricsService.getUserActivityTrend(startDate, endDate, workspaceId, reportId);
    }
    async getUserMetrics(userId, startDate, endDate, workspaceId, reportId) {
        return this.powerbiMetricsService.getUserMetrics(userId, startDate, endDate, workspaceId, reportId);
    }
    async getLog() {
        return this.powerbiMetricsService.getAllLogs();
    }
    async getLogs(startDate, endDate, workspaceId, reportId) {
        return this.powerbiMetricsService.getDatabaseLogEntries(startDate, endDate, workspaceId, reportId);
    }
    async getUserConsumptionMethods(userId, startDate, endDate) {
        return this.powerbiMetricsService.getUserConsumptionMethods(userId, startDate, endDate);
    }
    async getWorkspaceViewsDistribution(userId, startDate, endDate, reportId) {
        return this.powerbiMetricsService.getWorkspaceViewsDistribution(userId, startDate, endDate, reportId);
    }
    async getDistinctWorkspaces(startDate, endDate, reportId) {
        return this.powerbiMetricsService.getDistinctWorkspaces(startDate, endDate, reportId);
    }
    async getDistinctReports(startDate, endDate, workspaceId) {
        return this.powerbiMetricsService.getDistinctReports(startDate, endDate, workspaceId);
    }
    async getViewsByDate(startDate, endDate, workspaceId, reportId) {
        return this.powerbiMetricsService.getViewCountsByDate(startDate, endDate, workspaceId, reportId);
    }
    async getTopReports(startDate, endDate, limit, workspaceId) {
        return this.powerbiMetricsService.getTopReports(startDate, endDate, limit, workspaceId);
    }
    async getTopUsers(startDate, endDate, limit, workspaceId, reportId) {
        return this.powerbiMetricsService.getTopUsers(startDate, endDate, limit, workspaceId, reportId);
    }
    async getUserReportViewsDistribution(userId, startDate, endDate, workspaceId) {
        return this.powerbiMetricsService.getUserReportViewsDistribution(userId, startDate, endDate, workspaceId);
    }
    async getDailyUserReportViews(userId, date, workspaceId, reportId) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        return this.powerbiMetricsService.getUserReportViewsDistribution(userId, startDate, endDate, workspaceId);
    }
    async getUnusedReports(startDate, endDate, workspaceId) {
        return this.powerbiMetricsService.getUnusedReports(startDate, endDate, workspaceId);
    }
    async getUserNameMappings(body) {
        return this.powerbiMetricsService.getUserNameMappings(body.emails);
    }
    async getUserCounts(startDate, endDate, workspaceId, reportId) {
        return this.powerbiMetricsService.getUserCounts(startDate, endDate, workspaceId, reportId);
    }
    async recordTimeSpent(data) {
        if (!data.userId || !data.reportId || !data.tabName || typeof data.durationSeconds !== 'number') {
            throw new common_1.BadRequestException('userId, reportId, tabName, and durationSeconds are required.');
        }
        return this.powerbiMetricsService.saveTimeSpent(data);
    }
    async getUserTimeSpent(userId, startDate, endDate) {
        if (!userId) {
            throw new common_1.BadRequestException('userId is required.');
        }
        return this.powerbiMetricsService.getUserTimeSpentDistribution(userId, startDate, endDate);
    }
    async getLastRefresh() {
        return this.powerbiMetricsService.getLastRefreshTime();
    }
    async getDashboardUsage(dashboardName, startDate, endDate, workspaceId) {
        if (!dashboardName)
            throw new common_1.BadRequestException('dashboardName is required');
        return this.powerbiMetricsService.getDashboardUsage(dashboardName, workspaceId, startDate, endDate);
    }
    async getTimeSpentOverview(startDate, endDate, workspaceId) {
        return this.powerbiMetricsService.getTimeSpentOverview(startDate, endDate, workspaceId);
    }
};
exports.PowerBIMetricsController = PowerBIMetricsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('startDate', new common_1.DefaultValuePipe(new Date(Date.now() - 24 * 60 * 60 * 1000)), parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', new common_1.DefaultValuePipe(new Date()), parse_date_pipe_1.ParseISO8601DatePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('workspace'),
    __param(0, (0, common_1.Query)('workspaceId')),
    __param(1, (0, common_1.Query)('startDate', new common_1.DefaultValuePipe(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('endDate', new common_1.DefaultValuePipe(new Date()), parse_date_pipe_1.ParseISO8601DatePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Date,
        Date]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getWorkspaceMetrics", null);
__decorate([
    (0, common_1.Get)('report'),
    __param(0, (0, common_1.Query)('reportId')),
    __param(1, (0, common_1.Query)('startDate', new common_1.DefaultValuePipe(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('endDate', new common_1.DefaultValuePipe(new Date()), parse_date_pipe_1.ParseISO8601DatePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Date,
        Date]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getReportMetrics", null);
__decorate([
    (0, common_1.Get)('collect-raw'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "collectRawData", null);
__decorate([
    (0, common_1.Get)('unique-user-count'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('workspaceId')),
    __param(3, (0, common_1.Query)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, String, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUniqueUserCount", null);
__decorate([
    (0, common_1.Get)('unique-report-count'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUniqueReportCount", null);
__decorate([
    (0, common_1.Get)('user-activity-trend'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('workspaceId')),
    __param(3, (0, common_1.Query)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, String, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUserActivityTrend", null);
__decorate([
    (0, common_1.Get)('user-metrics'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(3, (0, common_1.Query)('workspaceId')),
    __param(4, (0, common_1.Query)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Date,
        Date, String, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUserMetrics", null);
__decorate([
    (0, common_1.Get)('get-log'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getLog", null);
__decorate([
    (0, common_1.Get)('logs'),
    __param(0, (0, common_1.Query)('startDate', new common_1.DefaultValuePipe(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', new common_1.DefaultValuePipe(new Date()), parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('workspaceId')),
    __param(3, (0, common_1.Query)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, String, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)('user-consumption-methods'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Date,
        Date]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUserConsumptionMethods", null);
__decorate([
    (0, common_1.Get)('workspace-views-distribution'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(3, (0, common_1.Query)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Date,
        Date, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getWorkspaceViewsDistribution", null);
__decorate([
    (0, common_1.Get)('distinct-workspaces'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getDistinctWorkspaces", null);
__decorate([
    (0, common_1.Get)('distinct-reports'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getDistinctReports", null);
__decorate([
    (0, common_1.Get)('views-by-date'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('workspaceId')),
    __param(3, (0, common_1.Query)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, String, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getViewsByDate", null);
__decorate([
    (0, common_1.Get)('top-reports'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, Number, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getTopReports", null);
__decorate([
    (0, common_1.Get)('top-users'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('workspaceId')),
    __param(4, (0, common_1.Query)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, Number, String, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getTopUsers", null);
__decorate([
    (0, common_1.Get)('user-report-views-distribution'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(3, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Date,
        Date, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUserReportViewsDistribution", null);
__decorate([
    (0, common_1.Get)('daily-user-reports'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('date', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('workspaceId')),
    __param(3, (0, common_1.Query)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Date, String, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getDailyUserReportViews", null);
__decorate([
    (0, common_1.Get)('unused-reports'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUnusedReports", null);
__decorate([
    (0, common_1.Post)('user-name-mappings'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUserNameMappings", null);
__decorate([
    (0, common_1.Get)('user-counts'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('workspaceId')),
    __param(3, (0, common_1.Query)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, String, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUserCounts", null);
__decorate([
    (0, common_1.Post)('time-spent'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "recordTimeSpent", null);
__decorate([
    (0, common_1.Get)('user-time-spent'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Date,
        Date]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUserTimeSpent", null);
__decorate([
    (0, common_1.Get)('last-refresh'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getLastRefresh", null);
__decorate([
    (0, common_1.Get)('dashboard-usage'),
    __param(0, (0, common_1.Query)('dashboardName')),
    __param(1, (0, common_1.Query)('startDate', new common_1.DefaultValuePipe(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('endDate', new common_1.DefaultValuePipe(new Date()), parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(3, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Date,
        Date, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getDashboardUsage", null);
__decorate([
    (0, common_1.Get)('time-spent-overview'),
    __param(0, (0, common_1.Query)('startDate', new common_1.DefaultValuePipe(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', new common_1.DefaultValuePipe(new Date()), parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, String]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getTimeSpentOverview", null);
exports.PowerBIMetricsController = PowerBIMetricsController = __decorate([
    (0, common_1.Controller)('powerbi-metrics'),
    __metadata("design:paramtypes", [powerbi_metrics_service_1.PowerBIMetricsService])
], PowerBIMetricsController);
//# sourceMappingURL=powerbi-metrics.controller.js.map