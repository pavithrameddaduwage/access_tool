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
var SyncDepartmentsTask_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncDepartmentsTask = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const sync_user_departments_service_1 = require("../sync-user-departments.service");
let SyncDepartmentsTask = SyncDepartmentsTask_1 = class SyncDepartmentsTask {
    constructor(syncService) {
        this.syncService = syncService;
        this.logger = new common_1.Logger(SyncDepartmentsTask_1.name);
    }
    async handleCron() {
        this.logger.log('Starting department synchronization from AD...');
        try {
            const result = await this.syncService.syncDepartments();
            this.logger.log(`Department sync completed. Checked: ${result.totalUsersChecked}, Updated: ${result.usersUpdated}`);
        }
        catch (error) {
            this.logger.error('Department synchronization failed:', error.message);
        }
    }
};
exports.SyncDepartmentsTask = SyncDepartmentsTask;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncDepartmentsTask.prototype, "handleCron", null);
exports.SyncDepartmentsTask = SyncDepartmentsTask = SyncDepartmentsTask_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sync_user_departments_service_1.SyncUserDepartmentsService])
], SyncDepartmentsTask);
//# sourceMappingURL=sync-departments.task.js.map