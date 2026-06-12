import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { StartSessionDto } from './dto/start-session.dto';
import { FlushSessionDto } from './dto/flush-session.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { LogViewDto } from './dto/log-view.dto';
import { TrackerSession } from './entities/tracker-session.entity';
import { ComponentViewCount } from './entities/component-view-count.entity';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Ingest endpoints for the Angular engagement tracker.
 *
 * Marked `@Public()` because the browser tracker posts from inside an embedded
 * dashboard context and identifies the user via the payload `userId`. Tighten
 * to `AuthGuard` if/when the tracker carries a JWT.
 */
@Controller('api/tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /** Create the session row when `startTracking()` runs. */
  @Public()
  @Post('session/start')
  @HttpCode(HttpStatus.CREATED)
  async startSession(@Body() dto: StartSessionDto): Promise<TrackerSession> {
    return this.trackingService.startSession(dto);
  }

  /** Upsert session counters + batch-insert raw events (every 30s / on unload). */
  @Public()
  @Post('session/flush')
  @HttpCode(HttpStatus.OK)
  async flushSession(@Body() dto: FlushSessionDto): Promise<TrackerSession> {
    return this.trackingService.flushSession(dto);
  }

  /** Explicitly mark a session ended. */
  @Public()
  @Post('session/end')
  @HttpCode(HttpStatus.OK)
  async endSession(@Body() dto: EndSessionDto): Promise<TrackerSession> {
    return this.trackingService.endSession(dto);
  }

  /** Log a component view (upsert into component_view_counts). */
  @Public()
  @Post('view')
  @HttpCode(HttpStatus.OK)
  async logView(@Body() dto: LogViewDto): Promise<ComponentViewCount> {
    return this.trackingService.logView(dto);
  }
}
