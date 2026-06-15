"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerBiSyncModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const powerbi_module_1 = require("./powerbi.module");
const powerbi_sync_service_1 = require("./powerbi-sync.service");
const sync_log_module_1 = require("../sync-log/sync-log.module");
const analytics_module_1 = require("../analytics/analytics.module");
const pbi_activity_event_entity_1 = require("../activity/entities/pbi-activity-event.entity");
const component_view_count_entity_1 = require("../tracking/entities/component-view-count.entity");
let PowerBiSyncModule = class PowerBiSyncModule {
};
exports.PowerBiSyncModule = PowerBiSyncModule;
exports.PowerBiSyncModule = PowerBiSyncModule = __decorate([
    (0, common_1.Module)({
        imports: [
            powerbi_module_1.PowerBIModule,
            sync_log_module_1.SyncLogModule,
            analytics_module_1.AnalyticsModule,
            typeorm_1.TypeOrmModule.forFeature([pbi_activity_event_entity_1.PbiActivityEvent, component_view_count_entity_1.ComponentViewCount]),
        ],
        providers: [powerbi_sync_service_1.PowerBiSyncService],
        exports: [powerbi_sync_service_1.PowerBiSyncService],
    })
], PowerBiSyncModule);
//# sourceMappingURL=powerbi-sync.module.js.map