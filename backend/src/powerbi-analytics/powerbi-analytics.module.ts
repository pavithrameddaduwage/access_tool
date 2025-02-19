import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PowerBIService } from './powerbi-analytics.service';
import { PowerBIAnalyticsController } from './powerbi-analytics.controller';

@Module({
  imports: [
    HttpModule,
    ConfigModule
  ],
  controllers: [PowerBIAnalyticsController],
  providers: [PowerBIService],
  exports: [PowerBIService]
})
export class PowerBIAnalyticsModule {}