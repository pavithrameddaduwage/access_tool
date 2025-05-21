"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerBIMetricsModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const powerbi_log_entity_1 = require("./entities/powerbi-log.entity");
const powerbi_metrics_controller_1 = require("./powerbi-metrics.controller");
const powerbi_metrics_service_1 = require("./powerbi-metrics.service");
const powerbi_logs_collector_task_1 = require("./tasks/powerbi-logs-collector.task");
const user_dashboard_entity_1 = require("../user-dashboard/entities/user-dashboard.entity");
const dashboard_entity_1 = require("../dashboard/entities/dashboard.entity");
const workspace_mapping_module_1 = require("../workspace-mapping/workspace-mapping.module");
const report_mapping_module_1 = require("../report-mapping/report-mapping.module");
const user_dashboard_module_1 = require("../user-dashboard/user-dashboard.module");
let PowerBIMetricsModule = class PowerBIMetricsModule {
};
exports.PowerBIMetricsModule = PowerBIMetricsModule;
exports.PowerBIMetricsModule = PowerBIMetricsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forFeature([powerbi_log_entity_1.PowerBILog, user_dashboard_entity_1.UserDashboard, dashboard_entity_1.Dashboard]),
            axios_1.HttpModule,
            config_1.ConfigModule.forRoot(),
            workspace_mapping_module_1.WorkspaceMappingModule,
            report_mapping_module_1.ReportMappingModule,
            user_dashboard_module_1.UserDashboardModule,
        ],
        controllers: [powerbi_metrics_controller_1.PowerBIMetricsController],
        providers: [powerbi_metrics_service_1.PowerBIMetricsService, powerbi_logs_collector_task_1.PowerBILogsCollectorTask],
    })
], PowerBIMetricsModule);
//# sourceMappingURL=powerbi-metrics.module.js.map