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
exports.PbiAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const pbi_analytics_service_1 = require("./pbi-analytics.service");
let PbiAnalyticsController = class PbiAnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getOverview(from, to) {
        return this.analyticsService.getOverview(from, to);
    }
    async getViews(workspaceId, from, to) {
        return this.analyticsService.getViews(workspaceId, from, to);
    }
    async getTopReports(workspaceId, from, to, limit) {
        const lim = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getTopReports(workspaceId, from, to, lim);
    }
    async getTopUsers(workspaceId, from, to, limit) {
        const lim = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getTopUsers(workspaceId, from, to, lim);
    }
    async getDuration(userId, reportId, from, to) {
        return this.analyticsService.getDuration(userId, reportId, from, to);
    }
    async getUserTimeline(userId, from, to) {
        return this.analyticsService.getUserTimeline(userId, from, to);
    }
    async getReportDetail(reportId, from, to) {
        return this.analyticsService.getReportDetail(reportId, from, to);
    }
    async getWorkspaceSummary(from, to) {
        return this.analyticsService.getWorkspaceSummary(from, to);
    }
};
exports.PbiAnalyticsController = PbiAnalyticsController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PbiAnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('views'),
    __param(0, (0, common_1.Query)('workspaceId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PbiAnalyticsController.prototype, "getViews", null);
__decorate([
    (0, common_1.Get)('top-reports'),
    __param(0, (0, common_1.Query)('workspaceId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], PbiAnalyticsController.prototype, "getTopReports", null);
__decorate([
    (0, common_1.Get)('top-users'),
    __param(0, (0, common_1.Query)('workspaceId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], PbiAnalyticsController.prototype, "getTopUsers", null);
__decorate([
    (0, common_1.Get)('duration'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('reportId')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], PbiAnalyticsController.prototype, "getDuration", null);
__decorate([
    (0, common_1.Get)('user-timeline'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PbiAnalyticsController.prototype, "getUserTimeline", null);
__decorate([
    (0, common_1.Get)('report-detail'),
    __param(0, (0, common_1.Query)('reportId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PbiAnalyticsController.prototype, "getReportDetail", null);
__decorate([
    (0, common_1.Get)('workspace-summary'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PbiAnalyticsController.prototype, "getWorkspaceSummary", null);
exports.PbiAnalyticsController = PbiAnalyticsController = __decorate([
    (0, common_1.Controller)('api/analytics'),
    __metadata("design:paramtypes", [pbi_analytics_service_1.PbiAnalyticsService])
], PbiAnalyticsController);
//# sourceMappingURL=pbi-analytics.controller.js.map