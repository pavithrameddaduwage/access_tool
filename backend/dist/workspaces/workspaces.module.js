"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const pbi_workspace_entity_1 = require("./entities/pbi-workspace.entity");
const pbi_report_entity_1 = require("./entities/pbi-report.entity");
const pbi_dashboard_entity_1 = require("./entities/pbi-dashboard.entity");
const pbi_activity_event_entity_1 = require("../activity/entities/pbi-activity-event.entity");
const workspaces_service_1 = require("./workspaces.service");
const workspaces_controller_1 = require("./workspaces.controller");
const powerbi_module_1 = require("../powerbi/powerbi.module");
const sync_log_module_1 = require("../sync-log/sync-log.module");
let WorkspacesModule = class WorkspacesModule {
};
exports.WorkspacesModule = WorkspacesModule;
exports.WorkspacesModule = WorkspacesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([pbi_workspace_entity_1.PbiWorkspace, pbi_report_entity_1.PbiReport, pbi_dashboard_entity_1.PbiDashboard, pbi_activity_event_entity_1.PbiActivityEvent]),
            powerbi_module_1.PowerBIModule,
            sync_log_module_1.SyncLogModule,
        ],
        controllers: [workspaces_controller_1.WorkspacesController],
        providers: [workspaces_service_1.WorkspacesService],
        exports: [workspaces_service_1.WorkspacesService],
    })
], WorkspacesModule);
//# sourceMappingURL=workspaces.module.js.map