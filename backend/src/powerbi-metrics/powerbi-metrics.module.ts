// src/powerbi-metrics/powerbi-metrics.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PowerBILog } from './entities/powerbi-log.entity';
import { PowerBIMetricsController } from './powerbi-metrics.controller';
import { PowerBIMetricsService } from './powerbi-metrics.service';
import { PowerBILogsCollectorTask } from './tasks/powerbi-logs-collector.task';
import { UserDashboard } from 'src/user-dashboard/entities/user-dashboard.entity';
import { Dashboard } from 'src/dashboard/entities/dashboard.entity';
import { WorkspaceMappingModule } from 'src/workspace-mapping/workspace-mapping.module';
import { ReportMappingModule } from 'src/report-mapping/report-mapping.module';
import { UserDashboardModule } from 'src/user-dashboard/user-dashboard.module';


@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([PowerBILog, UserDashboard, Dashboard]),
    HttpModule,
    ConfigModule.forRoot(),
    WorkspaceMappingModule,  
    ReportMappingModule,    
    UserDashboardModule,
  ],
  controllers: [PowerBIMetricsController],
  providers: [PowerBIMetricsService, PowerBILogsCollectorTask],
})
export class PowerBIMetricsModule {}