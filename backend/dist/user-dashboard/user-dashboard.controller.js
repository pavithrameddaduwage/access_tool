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
exports.UserDashboardController = void 0;
const common_1 = require("@nestjs/common");
const user_dashboard_service_1 = require("./user-dashboard.service");
const create_user_dashboard_dto_1 = require("./dto/create-user-dashboard.dto");
const update_user_dashboard_dto_1 = require("./dto/update-user-dashboard.dto");
let UserDashboardController = class UserDashboardController {
    constructor(userDashboardService) {
        this.userDashboardService = userDashboardService;
    }
    create(createUserDashboardDto) {
        return this.userDashboardService.create(createUserDashboardDto);
    }
    findAll() {
        return this.userDashboardService.findAll();
    }
    findOne(email) {
        return this.userDashboardService.findOne(email);
    }
    update(email, updateUserDashboardDto) {
        return this.userDashboardService.update(email, updateUserDashboardDto);
    }
    remove(email) {
        return this.userDashboardService.remove(email);
    }
    async getDatabaseUsers() {
        return this.userDashboardService.getDatabaseUsers();
    }
    async permittedUsers(workspaceId, reportId) {
        return this.userDashboardService.getPermittedUsers(workspaceId, reportId);
    }
    async getDatabaseUsersByWorkspaceAndReportID(data) {
        return this.userDashboardService.getDatabaseUsersByWorkspaceAndReportID(data.workspaceName, data.reportName);
    }
    async getLastDeactivatedUsers(limit = 5) {
        return this.userDashboardService.getLastDeactivatedUsers(limit);
    }
    async syncDepartments() {
        return await this.userDashboardService.syncDepartmentsManually();
    }
};
exports.UserDashboardController = UserDashboardController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dashboard_dto_1.CreateUserDashboardDto]),
    __metadata("design:returntype", void 0)
], UserDashboardController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UserDashboardController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':email'),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserDashboardController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':email'),
    __param(0, (0, common_1.Param)('email')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dashboard_dto_1.UpdateUserDashboardDto]),
    __metadata("design:returntype", void 0)
], UserDashboardController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':email'),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserDashboardController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('database/database-users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserDashboardController.prototype, "getDatabaseUsers", null);
__decorate([
    (0, common_1.Get)('permitted'),
    __param(0, (0, common_1.Query)('workspaceId')),
    __param(1, (0, common_1.Query)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserDashboardController.prototype, "permittedUsers", null);
__decorate([
    (0, common_1.Post)('activeUsers/getDatabaseUsersByWorkspaceAndReportID'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserDashboardController.prototype, "getDatabaseUsersByWorkspaceAndReportID", null);
__decorate([
    (0, common_1.Get)('last-deactivated'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UserDashboardController.prototype, "getLastDeactivatedUsers", null);
__decorate([
    (0, common_1.Post)('sync-departments'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserDashboardController.prototype, "syncDepartments", null);
exports.UserDashboardController = UserDashboardController = __decorate([
    (0, common_1.Controller)('user-dashboards'),
    __metadata("design:paramtypes", [user_dashboard_service_1.UserDashboardService])
], UserDashboardController);
//# sourceMappingURL=user-dashboard.controller.js.map