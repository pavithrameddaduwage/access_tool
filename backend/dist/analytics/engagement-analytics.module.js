"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngagementAnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const engagement_analytics_service_1 = require("./engagement-analytics.service");
const engagement_analytics_controller_1 = require("./engagement-analytics.controller");
const tracker_session_entity_1 = require("../tracking/entities/tracker-session.entity");
const component_view_count_entity_1 = require("../tracking/entities/component-view-count.entity");
const pbi_activity_event_entity_1 = require("../activity/entities/pbi-activity-event.entity");
const pbi_user_entity_1 = require("../users/entities/pbi-user.entity");
let EngagementAnalyticsModule = class EngagementAnalyticsModule {
};
exports.EngagementAnalyticsModule = EngagementAnalyticsModule;
exports.EngagementAnalyticsModule = EngagementAnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([tracker_session_entity_1.TrackerSession, component_view_count_entity_1.ComponentViewCount, pbi_activity_event_entity_1.PbiActivityEvent, pbi_user_entity_1.PbiUser]),
        ],
        controllers: [engagement_analytics_controller_1.EngagementAnalyticsController],
        providers: [engagement_analytics_service_1.EngagementAnalyticsService],
        exports: [engagement_analytics_service_1.EngagementAnalyticsService],
    })
], EngagementAnalyticsModule);
//# sourceMappingURL=engagement-analytics.module.js.map