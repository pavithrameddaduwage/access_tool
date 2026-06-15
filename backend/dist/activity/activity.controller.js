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
exports.ActivityController = void 0;
const common_1 = require("@nestjs/common");
const activity_service_1 = require("./activity.service");
let ActivityController = class ActivityController {
    constructor(activityService) {
        this.activityService = activityService;
    }
    async getFilteredActivities(from, to, userId, workspaceId, reportId) {
        return this.activityService.findFiltered({ from, to, userId, workspaceId, reportId });
    }
    async getSyncStatus() {
        const isBackfilling = await this.activityService.getIsBackfilling();
        const logs = await this.activityService.getSyncStatus();
        return {
            isBackfilling,
            logs,
        };
    }
    async triggerBackfill(days) {
        const daysCount = days ? parseInt(days, 10) : 90;
        this.activityService.triggerBackfill(daysCount).catch(() => { });
        return { message: `Historical backfill for the last ${daysCount} days triggered successfully.` };
    }
};
exports.ActivityController = ActivityController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('workspaceId')),
    __param(4, (0, common_1.Query)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "getFilteredActivities", null);
__decorate([
    (0, common_1.Get)('sync-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "getSyncStatus", null);
__decorate([
    (0, common_1.Post)('backfill'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "triggerBackfill", null);
exports.ActivityController = ActivityController = __decorate([
    (0, common_1.Controller)('api/activity'),
    __metadata("design:paramtypes", [activity_service_1.ActivityService])
], ActivityController);
//# sourceMappingURL=activity.controller.js.map