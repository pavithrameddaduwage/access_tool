"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
const analytics_controller_1 = require("./analytics.controller");
const typeorm_1 = require("@nestjs/typeorm");
const login_event_entity_1 = require("./entities/login-event.entity");
const login_tracking_service_1 = require("./login-tracking.service");
const pbi_session_entity_1 = require("./entities/pbi-session.entity");
const pbi_usage_summary_entity_1 = require("./entities/pbi-usage-summary.entity");
const pbi_activity_event_entity_1 = require("../activity/entities/pbi-activity-event.entity");
const pbi_workspace_entity_1 = require("../workspaces/entities/pbi-workspace.entity");
const pbi_report_entity_1 = require("../workspaces/entities/pbi-report.entity");
const pbi_user_entity_1 = require("../users/entities/pbi-user.entity");
const pbi_analytics_service_1 = require("./pbi-analytics.service");
const pbi_analytics_controller_1 = require("./pbi-analytics.controller");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        controllers: [analytics_controller_1.AnalyticsController, pbi_analytics_controller_1.PbiAnalyticsController],
        providers: [analytics_service_1.AnalyticsService, login_tracking_service_1.LoginTrackingService, pbi_analytics_service_1.PbiAnalyticsService],
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                login_event_entity_1.LoginEvent,
                pbi_session_entity_1.PbiSession,
                pbi_usage_summary_entity_1.PbiUsageSummary,
                pbi_activity_event_entity_1.PbiActivityEvent,
                pbi_workspace_entity_1.PbiWorkspace,
                pbi_report_entity_1.PbiReport,
                pbi_user_entity_1.PbiUser,
            ]),
        ],
        exports: [login_tracking_service_1.LoginTrackingService, pbi_analytics_service_1.PbiAnalyticsService]
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map