import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginEvent } from './entities/login-event.entity';
import { LoginTrackingService } from './login-tracking.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, LoginTrackingService],
  imports: [TypeOrmModule.forFeature([LoginEvent])], 
  exports: [LoginTrackingService] 
})

export class AnalyticsModule {}
