"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const department_module_1 = require("./department/department.module");
const roles_module_1 = require("./roles/roles.module");
const type_module_1 = require("./type/type.module");
const valuetype_module_1 = require("./valuetype/valuetype.module");
const webtool_module_1 = require("./webtool/webtool.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const workspace_module_1 = require("./workspace/workspace.module");
const typeorm_1 = require("@nestjs/typeorm");
const type_entity_1 = require("./type/entities/type.entity");
const dashboard_entity_1 = require("./dashboard/entities/dashboard.entity");
const dashboard_type_entity_1 = require("./dashboard/entities/dashboard-type.entity");
const dashboard_valuetype_entity_1 = require("./dashboard/entities/dashboard-valuetype.entity");
const valuetype_entity_1 = require("./valuetype/entities/valuetype.entity");
const user_dashboard_module_1 = require("./user-dashboard/user-dashboard.module");
const user_webtool_module_1 = require("./user-webtool/user-webtool.module");
const group_module_1 = require("./group/group.module");
const webtool_user_module_1 = require("./webtool-user/webtool-user.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const auth_guard_1 = require("./auth/guards/auth.guard");
const core_1 = require("@nestjs/core");
const http_exception_filter_1 = require("./http-exception.filter");
const config_1 = require("@nestjs/config");
const user_mappings_module_1 = require("./user-mappings/user-mappings.module");
const powerbi_metrics_module_1 = require("./powerbi-metrics/powerbi-metrics.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: 'localhost',
                port: 5432,
                username: 'postgres',
                password: '12345',
                database: 'user-access',
                entities: [type_entity_1.Type, dashboard_entity_1.Dashboard,
                    dashboard_type_entity_1.DashboardType,
                    dashboard_valuetype_entity_1.DashboardValuetype,
                    valuetype_entity_1.Valuetype],
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
                extra: {
                    timezone: 'America/New_York'
                }
            }),
            department_module_1.DepartmentModule,
            roles_module_1.RolesModule,
            type_module_1.TypeModule,
            valuetype_module_1.ValuetypeModule,
            webtool_module_1.WebtoolModule,
            dashboard_module_1.DashboardModule,
            workspace_module_1.WorkspaceModule,
            user_dashboard_module_1.UserDashboardModule,
            user_webtool_module_1.UserWebtoolModule,
            group_module_1.GroupsModule,
            webtool_user_module_1.WebtoolUserModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            user_mappings_module_1.UserMappingsModule,
            powerbi_metrics_module_1.PowerBIMetricsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_FILTER,
                useClass: http_exception_filter_1.HttpExceptionFilter,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: auth_guard_1.AuthGuard,
            }
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map