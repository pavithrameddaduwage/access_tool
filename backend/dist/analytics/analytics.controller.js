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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
const auth_guard_1 = require("../auth/guards/auth.guard");
const login_tracking_service_1 = require("./login-tracking.service");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService, loginTrackingService) {
        this.analyticsService = analyticsService;
        this.loginTrackingService = loginTrackingService;
    }
    async getLoginEvents() {
        return this.analyticsService.getLoginEvents();
    }
    async getDailyLoginStats(days = 30, webtool, email) {
        return this.analyticsService.getDailyLogins(days, webtool, email);
    }
    async getLoginsByHour(days = 30, webtool, email) {
        return this.analyticsService.getLoginsByHour(days, webtool, email);
    }
    async getLoginsByDayOfWeek(days = 30, webtool, email) {
        return this.analyticsService.getLoginsByDayOfWeek(days, webtool, email);
    }
    async getSummary(days = 30, webtool, email) {
        return this.analyticsService.getSummary(days, webtool, email);
    }
    async getDepartmentLoginStats(days = 30, webtool, email) {
        return this.analyticsService.getDepartmentLoginStats(days, webtool, email);
    }
    async getDepartmentHourlyLogins(days = 30, webtool, email) {
        return this.analyticsService.getDepartmentHourlyLogins(days, webtool, email);
    }
    async getDepartmentDailyLogins(days = 30, webtool, email) {
        return this.analyticsService.getDepartmentDailyLogins(days, webtool, email);
    }
    async recordLogin(data, req) {
        return this.loginTrackingService.recordLogin(data.email, data.webtool, req, data.department, data.location);
    }
    async getUserStats(email, webtool, days = 30) {
        return this.analyticsService.getUserStats(email, webtool, days);
    }
    async getUserWebtoolStats(email, days = 30) {
        return this.analyticsService.getUserWebtoolStats(email, days);
    }
    async getTopActiveUsers(days = 30, webtool) {
        return this.analyticsService.getTopActiveUsers(days, webtool);
    }
    async getTopUsedWebtools(days = 30, email) {
        return this.analyticsService.getTopUsedWebtools(days, email);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('login-events'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getLoginEvents", null);
__decorate([
    (0, common_1.Get)('daily-logins'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('webtool')),
    __param(2, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDailyLoginStats", null);
__decorate([
    (0, common_1.Get)('logins-by-hour'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('webtool')),
    __param(2, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getLoginsByHour", null);
__decorate([
    (0, common_1.Get)('logins-by-day'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('webtool')),
    __param(2, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getLoginsByDayOfWeek", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('webtool')),
    __param(2, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('department-logins'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('webtool')),
    __param(2, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDepartmentLoginStats", null);
__decorate([
    (0, common_1.Get)('department-hourly-logins'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('webtool')),
    __param(2, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDepartmentHourlyLogins", null);
__decorate([
    (0, common_1.Get)('department-daily-logins'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('webtool')),
    __param(2, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDepartmentDailyLogins", null);
__decorate([
    (0, common_1.Post)('record-login'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "recordLogin", null);
__decorate([
    (0, common_1.Get)('user-stats/:email'),
    __param(0, (0, common_1.Param)('email')),
    __param(1, (0, common_1.Query)('webtool')),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('user-webtool-stats/:email'),
    __param(0, (0, common_1.Param)('email')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUserWebtoolStats", null);
__decorate([
    (0, common_1.Get)('top-active-users'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('webtool')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTopActiveUsers", null);
__decorate([
    (0, common_1.Get)('top-used-webtools'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTopUsedWebtools", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService, login_tracking_service_1.LoginTrackingService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map