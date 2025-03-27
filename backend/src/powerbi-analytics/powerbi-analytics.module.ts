import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PowerbiUsage } from './entities/powerbi-usage.entity';
import { PowerBIService } from './powerbi-analytics.service';
import { PowerbiStorageService } from './powerbi-storage.service';
import { PowerbiSyncTask } from './tasks/powerbi-sync.task';
import { HttpModule } from '@nestjs/axios';
import { PowerBIAnalyticsController } from './powerbi-analytics.controller';

@Module({
  imports: [HttpModule,
    ScheduleModule.forRoot(), // Add this line
    TypeOrmModule.forFeature([PowerbiUsage]),
  ],
  controllers: [PowerBIAnalyticsController],

  providers: [
    PowerBIService,
    PowerbiStorageService,
    PowerbiSyncTask, // Make sure this is included
  ],
})
export class PowerBIAnalyticsModule {}