import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackerSession } from './entities/tracker-session.entity';
import { TrackerUsageEvent } from './entities/tracker-usage-event.entity';
import { ComponentViewCount } from './entities/component-view-count.entity';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';

/**
 * Ingest pipeline for the Angular engagement tracker
 * (sessions + raw interaction events).
 */
@Module({
  imports: [TypeOrmModule.forFeature([TrackerSession, TrackerUsageEvent, ComponentViewCount])],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService, TypeOrmModule],
})
export class TrackingModule {}
