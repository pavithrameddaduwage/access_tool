"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const tracker_session_entity_1 = require("./entities/tracker-session.entity");
const tracker_usage_event_entity_1 = require("./entities/tracker-usage-event.entity");
const component_view_count_entity_1 = require("./entities/component-view-count.entity");
const tracking_service_1 = require("./tracking.service");
const tracking_controller_1 = require("./tracking.controller");
let TrackingModule = class TrackingModule {
};
exports.TrackingModule = TrackingModule;
exports.TrackingModule = TrackingModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([tracker_session_entity_1.TrackerSession, tracker_usage_event_entity_1.TrackerUsageEvent, component_view_count_entity_1.ComponentViewCount])],
        controllers: [tracking_controller_1.TrackingController],
        providers: [tracking_service_1.TrackingService],
        exports: [tracking_service_1.TrackingService, typeorm_1.TypeOrmModule],
    })
], TrackingModule);
//# sourceMappingURL=tracking.module.js.map