import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngagementAnalyticsService } from './engagement-analytics.service';
import { EngagementAnalyticsController } from './engagement-analytics.controller';
import { TrackerSession } from '../tracking/entities/tracker-session.entity';
import { ComponentViewCount } from '../tracking/entities/component-view-count.entity';
import { PbiActivityEvent } from '../activity/entities/pbi-activity-event.entity';
import { PbiUser } from '../users/entities/pbi-user.entity';

/**
 * v2 engagement analytics (tracker sessions + component view counts + audit).
 * Kept separate from the legacy AnalyticsModule to avoid touching existing code.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([TrackerSession, ComponentViewCount, PbiActivityEvent, PbiUser]),
  ],
  controllers: [EngagementAnalyticsController],
  providers: [EngagementAnalyticsService],
  exports: [EngagementAnalyticsService],
})
export class EngagementAnalyticsModule {}
