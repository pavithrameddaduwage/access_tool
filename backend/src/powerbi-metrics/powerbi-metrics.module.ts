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

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([PowerBILog]),
    HttpModule,
    ConfigModule.forRoot(),
  ],
  controllers: [PowerBIMetricsController],
  providers: [PowerBIMetricsService, PowerBILogsCollectorTask],
})
export class PowerBIMetricsModule {}