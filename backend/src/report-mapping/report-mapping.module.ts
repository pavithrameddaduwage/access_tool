// src/report-mapping/report-mapping.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportMapping } from './entities/report-mapping.entity';
import { ReportMappingService } from './report-mapping.service';
import { PowerBILog } from 'src/powerbi-metrics/entities/powerbi-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReportMapping, PowerBILog])],
  providers: [ReportMappingService],
  exports: [ReportMappingService],
})
export class ReportMappingModule {}