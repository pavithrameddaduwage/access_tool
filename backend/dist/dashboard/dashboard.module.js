"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("./dashboard.service");
const dashboard_controller_1 = require("./dashboard.controller");
const typeorm_1 = require("@nestjs/typeorm");
const dashboard_entity_1 = require("./entities/dashboard.entity");
const dashboard_type_entity_1 = require("./entities/dashboard-type.entity");
const dashboard_valuetype_entity_1 = require("./entities/dashboard-valuetype.entity");
const type_entity_1 = require("../type/entities/type.entity");
const valuetype_entity_1 = require("../valuetype/entities/valuetype.entity");
const workspace_entity_1 = require("../workspace/entities/workspace.entity");
const dashboard_workspace_entity_1 = require("./entities/dashboard-workspace.entity");
const user_dashboard_entity_1 = require("../user-dashboard/entities/user-dashboard.entity");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        controllers: [dashboard_controller_1.DashboardController],
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                dashboard_entity_1.Dashboard,
                dashboard_type_entity_1.DashboardType,
                dashboard_valuetype_entity_1.DashboardValuetype,
                type_entity_1.Type,
                valuetype_entity_1.Valuetype,
                workspace_entity_1.Workspace,
                dashboard_workspace_entity_1.DashboardWorkspace,
                user_dashboard_entity_1.UserDashboard
            ]),
        ],
        providers: [dashboard_service_1.DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map