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
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getSummary(days = 30, webtool) {
        return this.analyticsService.getSummary(days, webtool);
    }
    async getDailyLoginStats(days = 30, webtool) {
        return this.analyticsService.getDailyLogins(days, webtool);
    }
    async getUserStats(email) {
        return this.analyticsService.getUserLoginStats(email);
    }
    async getLoginsByHour(webtool) {
        return this.analyticsService.getLoginsByHour('America/New_York', webtool);
    }
    async getLoginsByDayOfWeek(webtool) {
        return this.analyticsService.getLoginsByDayOfWeek('America/New_York', webtool);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('webtool')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('daily-logins'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('webtool')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDailyLoginStats", null);
__decorate([
    (0, common_1.Get)('user-stats'),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('logins-by-hour'),
    __param(0, (0, common_1.Query)('webtool')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getLoginsByHour", null);
__decorate([
    (0, common_1.Get)('logins-by-day'),
    __param(0, (0, common_1.Query)('webtool')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getLoginsByDayOfWeek", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map