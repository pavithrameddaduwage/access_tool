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
exports.WorkspacesController = void 0;
const common_1 = require("@nestjs/common");
const workspaces_service_1 = require("./workspaces.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pbi_activity_event_entity_1 = require("../activity/entities/pbi-activity-event.entity");
let WorkspacesController = class WorkspacesController {
    constructor(workspacesService, activityEventRepository) {
        this.workspacesService = workspacesService;
        this.activityEventRepository = activityEventRepository;
    }
    async getAllWorkspaces() {
        return this.workspacesService.findAllWorkspaces();
    }
    async triggerSync() {
        this.workspacesService.syncAll().catch(err => { });
        return { message: 'Sync triggered successfully' };
    }
    async getWorkspaceById(id) {
        return this.workspacesService.findWorkspaceById(id);
    }
    async getReports(id) {
        return this.workspacesService.findReportsByWorkspace(id);
    }
    async getDashboards(id) {
        return this.workspacesService.findDashboardsByWorkspace(id);
    }
    async getWorkspaceUsers(id) {
        const query = await this.activityEventRepository
            .createQueryBuilder('event')
            .select('DISTINCT event.user_id', 'userId')
            .addSelect('event.user_email', 'email')
            .where('event.workspace_id = :workspaceId', { workspaceId: id })
            .andWhere('event.user_id IS NOT NULL')
            .getRawMany();
        return query.map(q => ({
            userId: q.userId,
            email: q.email || q.userId,
        }));
    }
};
exports.WorkspacesController = WorkspacesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getAllWorkspaces", null);
__decorate([
    (0, common_1.Post)('sync'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "triggerSync", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getWorkspaceById", null);
__decorate([
    (0, common_1.Get)(':id/reports'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)(':id/dashboards'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getDashboards", null);
__decorate([
    (0, common_1.Get)(':id/users'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getWorkspaceUsers", null);
exports.WorkspacesController = WorkspacesController = __decorate([
    (0, common_1.Controller)('api/workspaces'),
    __param(1, (0, typeorm_1.InjectRepository)(pbi_activity_event_entity_1.PbiActivityEvent)),
    __metadata("design:paramtypes", [workspaces_service_1.WorkspacesService,
        typeorm_2.Repository])
], WorkspacesController);
//# sourceMappingURL=workspaces.controller.js.map