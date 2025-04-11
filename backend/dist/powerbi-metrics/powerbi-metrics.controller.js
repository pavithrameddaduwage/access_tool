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
        const accessToken = await this.powerbiMetricsService.getAccessToken();
        await this.powerbiMetricsService.ensureSubscription(accessToken);
        const contentUris = await this.powerbiMetricsService.getContentUris(accessToken, startDate, endDate);
        const allLogs = await Promise.all(contentUris.map(uri => this.powerbiMetricsService.getLogEntries(uri, accessToken)));
        const powerBILogs = allLogs.flat().filter(entry => entry.Workload === 'PowerBI' && entry.Operation === 'ViewReport');
        await this.powerbiMetricsService.saveRawLogs(powerBILogs);
        return {
            message: `Saved ${powerBILogs.length} raw logs`,
            logs: powerBILogs.slice(0, 5)
        };
    }
    async getViewsByDate(startDate, endDate) {
        return this.powerbiMetricsService.getViewCountsByDate(startDate, endDate);
    }
    async getTopReports(startDate, endDate, limit) {
        return this.powerbiMetricsService.getTopReports(startDate, endDate, limit);
    }
    async getTopUsers(startDate, endDate, limit) {
        return this.powerbiMetricsService.getTopUsers(startDate, endDate, limit);
    }
    async getUserActivityTrend(startDate, endDate) {
        return this.powerbiMetricsService.getUserActivityTrend(startDate, endDate);
    }
    async getUniqueUserCount(startDate, endDate) {
        return this.powerbiMetricsService.getUniqueUserCount(startDate, endDate);
    }
    async getUniqueReportCount(startDate, endDate) {
        return this.powerbiMetricsService.getUniqueReportCount(startDate, endDate);
    }
    async getUserMetrics(userId, startDate, endDate) {
        return this.powerbiMetricsService.getUserMetrics(userId, startDate, endDate);
    }
    async getWorkspaceViewsDistribution(userId, startDate, endDate) {
        return this.powerbiMetricsService.getWorkspaceViewsDistribution(userId, startDate, endDate);
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
    (0, common_1.Get)('views-by-date'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getViewsByDate", null);
__decorate([
    (0, common_1.Get)('top-reports'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), new common_1.ParseIntPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, Number]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getTopReports", null);
__decorate([
    (0, common_1.Get)('top-users'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), new common_1.ParseIntPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date, Number]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getTopUsers", null);
__decorate([
    (0, common_1.Get)('user-activity-trend'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUserActivityTrend", null);
__decorate([
    (0, common_1.Get)('unique-user-count'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUniqueUserCount", null);
__decorate([
    (0, common_1.Get)('unique-report-count'),
    __param(0, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(1, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Date,
        Date]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUniqueReportCount", null);
__decorate([
    (0, common_1.Get)('user-metrics'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Date,
        Date]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getUserMetrics", null);
__decorate([
    (0, common_1.Get)('workspace-views-distribution'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('startDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __param(2, (0, common_1.Query)('endDate', parse_date_pipe_1.ParseISO8601DatePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Date,
        Date]),
    __metadata("design:returntype", Promise)
], PowerBIMetricsController.prototype, "getWorkspaceViewsDistribution", null);
exports.PowerBIMetricsController = PowerBIMetricsController = __decorate([
    (0, common_1.Controller)('powerbi-metrics'),
    __metadata("design:paramtypes", [powerbi_metrics_service_1.PowerBIMetricsService])
], PowerBIMetricsController);
//# sourceMappingURL=powerbi-metrics.controller.js.map