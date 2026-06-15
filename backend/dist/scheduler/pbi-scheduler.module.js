"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PbiSchedulerModule = void 0;
const common_1 = require("@nestjs/common");
const pbi_scheduler_service_1 = require("./pbi-scheduler.service");
const activity_module_1 = require("../activity/activity.module");
const analytics_module_1 = require("../analytics/analytics.module");
const workspaces_module_1 = require("../workspaces/workspaces.module");
const sync_log_module_1 = require("../sync-log/sync-log.module");
let PbiSchedulerModule = class PbiSchedulerModule {
};
exports.PbiSchedulerModule = PbiSchedulerModule;
exports.PbiSchedulerModule = PbiSchedulerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            activity_module_1.ActivityModule,
            analytics_module_1.AnalyticsModule,
            workspaces_module_1.WorkspacesModule,
            sync_log_module_1.SyncLogModule,
        ],
        providers: [pbi_scheduler_service_1.PbiSchedulerService],
    })
], PbiSchedulerModule);
//# sourceMappingURL=pbi-scheduler.module.js.map