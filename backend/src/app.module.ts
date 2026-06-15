import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DepartmentModule } from './department/department.module';
import { RolesModule } from './roles/roles.module';
import { TypeModule } from './type/type.module';
import { ValuetypeModule } from './valuetype/valuetype.module';
import { WebtoolModule } from './webtool/webtool.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Type } from './type/entities/type.entity';
import { Dashboard } from './dashboard/entities/dashboard.entity';
import { DashboardType } from './dashboard/entities/dashboard-type.entity';
import { DashboardValuetype } from './dashboard/entities/dashboard-valuetype.entity';
import { Valuetype } from './valuetype/entities/valuetype.entity';
import { UserDashboardModule } from './user-dashboard/user-dashboard.module';
import { UserWebtoolModule } from './user-webtool/user-webtool.module';
import { GroupsModule } from './group/group.module';
import { WebtoolUserModule } from './webtool-user/webtool-user.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './http-exception.filter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserMappingsModule } from './user-mappings/user-mappings.module';
import { PowerBIMetricsModule } from './powerbi-metrics/powerbi-metrics.module';
import { WorkspaceMappingModule } from './workspace-mapping/workspace-mapping.module';
import { ReportMappingModule } from './report-mapping/report-mapping.module';
import { AnalyticsModule } from './analytics/analytics.module';

// Power BI Tracker Module Imports
import { ScheduleModule } from '@nestjs/schedule';
import { PowerBIModule } from './powerbi/powerbi.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ActivityModule } from './activity/activity.module';
import { SyncLogModule } from './sync-log/sync-log.module';
import { PbiSchedulerModule } from './scheduler/pbi-scheduler.module';
import { TrackingModule } from './tracking/tracking.module';
import { PowerBiSyncModule } from './powerbi/powerbi-sync.module';
import { EngagementAnalyticsModule } from './analytics/engagement-analytics.module';
import { QaAgentModule } from './modules/qa-agent/qa-agent.module';

@Module({
  imports: [ ConfigModule.forRoot({
    isGlobal: true,
  }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('PG_DB_HOST', 'localhost'),
        port: parseInt(configService.get<string>('PG_DB_PORT', '5432'), 10),
        username: configService.get<string>('PG_DB_USER', 'postgres'),
        password: configService.get<string>('PG_DB_PASSWORD', 'M!SAppsTest'),
        database: configService.get<string>('PG_DB_NAME', 'user-access'),
        entities: [Type,  Dashboard,
          DashboardType,
          DashboardValuetype,
          Valuetype],
        autoLoadEntities: true,
        synchronize: true,
        logging: false,
        extra: {
          timezone: 'America/New_York'
        }
      }),
    }),
    DepartmentModule,
    RolesModule,
    TypeModule,
    ValuetypeModule,
    WebtoolModule,
    DashboardModule,
    WorkspaceModule,
    UserDashboardModule,
    UserWebtoolModule,
    GroupsModule,
    WebtoolUserModule,
    AuthModule,
    UsersModule,
    UserMappingsModule,
    PowerBIMetricsModule,
    WorkspaceMappingModule,
    ReportMappingModule,
    AnalyticsModule,
    PowerBIModule,
    WorkspacesModule,
    ActivityModule,
    SyncLogModule,
    PbiSchedulerModule,
    TrackingModule,
    PowerBiSyncModule,
    EngagementAnalyticsModule,
    QaAgentModule,
    ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
