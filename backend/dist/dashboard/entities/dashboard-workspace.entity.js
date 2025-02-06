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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardWorkspace = void 0;
const typeorm_1 = require("typeorm");
const dashboard_entity_1 = require("./dashboard.entity");
const workspace_entity_1 = require("../../workspace/entities/workspace.entity");
let DashboardWorkspace = class DashboardWorkspace {
};
exports.DashboardWorkspace = DashboardWorkspace;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DashboardWorkspace.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DashboardWorkspace.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dashboard_entity_1.Dashboard, dashboard => dashboard.dashboardWorkspaces, {
        onDelete: 'CASCADE'
    }),
    (0, typeorm_1.JoinColumn)({ name: 'dashboardId' }),
    __metadata("design:type", dashboard_entity_1.Dashboard)
], DashboardWorkspace.prototype, "dashboard", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, workspace => workspace.dashboardWorkspaces),
    (0, typeorm_1.JoinColumn)({ name: 'workspaceId' }),
    __metadata("design:type", workspace_entity_1.Workspace)
], DashboardWorkspace.prototype, "workspace", void 0);
exports.DashboardWorkspace = DashboardWorkspace = __decorate([
    (0, typeorm_1.Entity)()
], DashboardWorkspace);
//# sourceMappingURL=dashboard-workspace.entity.js.map