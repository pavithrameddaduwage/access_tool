import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginEvent } from './entities/login-event.entity';
import { LoginTrackingService } from './login-tracking.service';

// Power BI Tracker Imports
import { PbiSession } from './entities/pbi-session.entity';
import { PbiUsageSummary } from './entities/pbi-usage-summary.entity';
import { PbiActivityEvent } from '../activity/entities/pbi-activity-event.entity';
import { PbiWorkspace } from '../workspaces/entities/pbi-workspace.entity';
import { PbiReport } from '../workspaces/entities/pbi-report.entity';
import { PbiUser } from '../users/entities/pbi-user.entity';
import { PbiAnalyticsService } from './pbi-analytics.service';
import { PbiAnalyticsController } from './pbi-analytics.controller';

@Module({
  controllers: [AnalyticsController, PbiAnalyticsController],
  providers: [AnalyticsService, LoginTrackingService, PbiAnalyticsService],
  imports: [
    TypeOrmModule.forFeature([
      LoginEvent,
      PbiSession,
      PbiUsageSummary,
      PbiActivityEvent,
      PbiWorkspace,
      PbiReport,
      PbiUser,
    ]),
  ], 
  exports: [LoginTrackingService, PbiAnalyticsService] 
})

export class AnalyticsModule {}
