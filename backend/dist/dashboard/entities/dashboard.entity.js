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
exports.Dashboard = void 0;
const typeorm_1 = require("typeorm");
const dashboard_type_entity_1 = require("./dashboard-type.entity");
const dashboard_valuetype_entity_1 = require("./dashboard-valuetype.entity");
const dashboard_workspace_entity_1 = require("./dashboard-workspace.entity");
const user_dashboard_entity_1 = require("../../user-dashboard/entities/user-dashboard.entity");
const group_entity_1 = require("../../group/entities/group.entity");
let Dashboard = class Dashboard {
};
exports.Dashboard = Dashboard;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Dashboard.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Dashboard.prototype, "dashboard", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_dashboard_entity_1.UserDashboard, userDashboard => userDashboard.dashboard, {
        cascade: true
    }),
    __metadata("design:type", Array)
], Dashboard.prototype, "userDashboards", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => dashboard_type_entity_1.DashboardType, dashboardType => dashboardType.dashboard, {
        cascade: true
    }),
    __metadata("design:type", Array)
], Dashboard.prototype, "dashboardTypes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => dashboard_valuetype_entity_1.DashboardValuetype, dashboardValuetype => dashboardValuetype.dashboard, {
        cascade: true
    }),
    __metadata("design:type", Array)
], Dashboard.prototype, "dashboardValuetypes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => dashboard_workspace_entity_1.DashboardWorkspace, dashboardWorkspace => dashboardWorkspace.dashboard, {
        cascade: true
    }),
    __metadata("design:type", Array)
], Dashboard.prototype, "dashboardWorkspaces", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => group_entity_1.Group, group => group.dashboards),
    (0, typeorm_1.JoinColumn)({ name: 'groupId' }),
    __metadata("design:type", group_entity_1.Group)
], Dashboard.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Dashboard.prototype, "groupId", void 0);
exports.Dashboard = Dashboard = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Unique)(['dashboard'])
], Dashboard);
//# sourceMappingURL=dashboard.entity.js.map