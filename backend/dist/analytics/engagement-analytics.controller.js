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
exports.EngagementAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../auth/guards/auth.guard");
const analytics_query_dto_1 = require("./dto/analytics-query.dto");
const engagement_analytics_service_1 = require("./engagement-analytics.service");
let EngagementAnalyticsController = class EngagementAnalyticsController {
    constructor(analytics) {
        this.analytics = analytics;
    }
    getOverview(query) {
        return this.analytics.getOverview(query);
    }
    getDashboards(query) {
        return this.analytics.getDashboards(query);
    }
    getReports(query) {
        return this.analytics.getReports(query);
    }
    getUsers(query) {
        return this.analytics.getUsers(query);
    }
    getUserDetail(id, query) {
        return this.analytics.getUserDetail(id, query);
    }
    getTopViews(query, type, limit) {
        return this.analytics.getTopViews(query, type, limit ?? 20);
    }
    getViewsByUser(userId, query) {
        return this.analytics.getViewsByUser(userId, query);
    }
    getViewsByComponent(type, id) {
        return this.analytics.getViewsByComponent(type, id);
    }
};
exports.EngagementAnalyticsController = EngagementAnalyticsController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_query_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], EngagementAnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('dashboards'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_query_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], EngagementAnalyticsController.prototype, "getDashboards", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_query_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], EngagementAnalyticsController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_query_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], EngagementAnalyticsController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, analytics_query_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], EngagementAnalyticsController.prototype, "getUserDetail", null);
__decorate([
    (0, common_1.Get)('views/top'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_query_dto_1.AnalyticsQueryDto, String, Number]),
    __metadata("design:returntype", Promise)
], EngagementAnalyticsController.prototype, "getTopViews", null);
__decorate([
    (0, common_1.Get)('views/by-user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, analytics_query_dto_1.AnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], EngagementAnalyticsController.prototype, "getViewsByUser", null);
__decorate([
    (0, common_1.Get)('views/by-component/:type/:id'),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EngagementAnalyticsController.prototype, "getViewsByComponent", null);
exports.EngagementAnalyticsController = EngagementAnalyticsController = __decorate([
    (0, common_1.Controller)('api/analytics/engagement'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [engagement_analytics_service_1.EngagementAnalyticsService])
], EngagementAnalyticsController);
//# sourceMappingURL=engagement-analytics.controller.js.map