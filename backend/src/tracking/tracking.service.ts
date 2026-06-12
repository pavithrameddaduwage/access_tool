import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TrackerSession } from './entities/tracker-session.entity';
import { TrackerUsageEvent } from './entities/tracker-usage-event.entity';
import { ComponentViewCount } from './entities/component-view-count.entity';
import { StartSessionDto } from './dto/start-session.dto';
import { FlushSessionDto } from './dto/flush-session.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { LogViewDto } from './dto/log-view.dto';

/**
 * Persistence logic for Angular tracker sessions and raw events.
 *
 * Full method bodies (upsert + batch insert) are implemented in Step 5. This
 * file provides the wired-up structure so the module compiles and routes resolve.
 */
@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectRepository(TrackerSession)
    private readonly sessionRepo: Repository<TrackerSession>,
    @InjectRepository(TrackerUsageEvent)
    private readonly eventRepo: Repository<TrackerUsageEvent>,
    @InjectRepository(ComponentViewCount)
    private readonly viewCountRepo: Repository<ComponentViewCount>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create the initial session row when tracking starts.
   * @param dto Session identity + start timestamp (UUID generated client-side).
   * @returns The persisted {@link TrackerSession}.
   */
  async startSession(dto: StartSessionDto): Promise<TrackerSession> {
    const session = this.sessionRepo.create({
      id: dto.sessionId,
      userId: dto.userId,
      dashboardId: dto.dashboardId,
      tabName: dto.tabName ?? null,
      department: dto.department ?? null,
      startedAt: new Date(dto.startedAt),
      isActive: true,
    });
    // Idempotent: if the client retries start, keep the existing row.
    await this.sessionRepo
      .createQueryBuilder()
      .insert()
      .into(TrackerSession)
      .values(session)
      .orIgnore()
      .execute();
    return this.sessionRepo.findOneByOrFail({ id: dto.sessionId });
  }

  /**
   * Upsert a session summary and batch-insert any buffered raw events.
   * Called every 30s and on `beforeunload` (with `isEnding=true`).
   * @param dto Cumulative counters + optional raw event batch.
   */
  async flushSession(dto: FlushSessionDto): Promise<TrackerSession> {
    return this.dataSource.transaction(async (manager) => {
      const flushAt = new Date(dto.timestamp);

      await manager
        .createQueryBuilder()
        .insert()
        .into(TrackerSession)
        .values({
          id: dto.sessionId,
          userId: dto.userId,
          dashboardId: dto.dashboardId,
          tabName: dto.tabName ?? null,
          department: dto.department ?? null,
          engagedSeconds: dto.engagedSeconds,
          clickCount: dto.clickCount,
          scrollCount: dto.scrollCount,
          copyCount: dto.copyCount,
          keydownCount: dto.keydownCount,
          selectCount: dto.selectCount,
          isActive: !dto.isEnding,
          idleExpired: dto.idleExpired ?? false,
          startedAt: flushAt,
          lastFlushAt: flushAt,
          endedAt: dto.isEnding ? flushAt : null,
        })
        .orUpdate(
          [
            'tab_name',
            'department',
            'engaged_seconds',
            'click_count',
            'scroll_count',
            'copy_count',
            'keydown_count',
            'select_count',
            'is_active',
            'idle_expired',
            'last_flush_at',
            'ended_at',
          ],
          ['id'],
        )
        .execute();

      if (dto.events?.length) {
        const rows = dto.events.map((e) =>
          manager.create(TrackerUsageEvent, {
            sessionId: dto.sessionId,
            userId: dto.userId,
            dashboardId: dto.dashboardId,
            tabName: dto.tabName ?? null,
            eventType: e.eventType,
            eventData: e.eventData ?? null,
            createdAt: e.timestamp ? new Date(e.timestamp) : undefined,
          }),
        );
        await manager.insert(TrackerUsageEvent, rows);
      }

      return manager.findOneByOrFail(TrackerSession, { id: dto.sessionId });
    });
  }

  /**
   * Explicitly mark a session ended.
   * @param dto Session id + optional end timestamp.
   */
  async endSession(dto: EndSessionDto): Promise<TrackerSession> {
    const endedAt = dto.endedAt ? new Date(dto.endedAt) : new Date();
    await this.sessionRepo.update(
      { id: dto.sessionId },
      { isActive: false, endedAt, lastFlushAt: endedAt },
    );
    return this.sessionRepo.findOneByOrFail({ id: dto.sessionId });
  }

  /**
   * Record a component view (route change / iframe navigation).
   *
   * Single atomic UPSERT on `(user_id, component_type, component_id)`:
   * inserts with `view_count = 1`, or on conflict increments
   * `view_count = view_count + 1` and refreshes name/workspace/timestamps.
   * Race-safe under concurrent flushes from the same user.
   *
   * @param dto The viewed component identity.
   * @returns The current {@link ComponentViewCount} row after upsert.
   */
  async logView(dto: LogViewDto): Promise<ComponentViewCount> {
    const viewedAt = new Date(dto.timestamp);

    await this.viewCountRepo.query(
      `INSERT INTO component_view_counts
         (user_id, component_type, component_id, component_name, workspace_id,
          view_count, last_viewed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 1, $6, NOW(), NOW())
       ON CONFLICT (user_id, component_type, component_id)
       DO UPDATE SET
         view_count     = component_view_counts.view_count + 1,
         component_name = COALESCE(EXCLUDED.component_name, component_view_counts.component_name),
         workspace_id   = COALESCE(EXCLUDED.workspace_id, component_view_counts.workspace_id),
         last_viewed_at = EXCLUDED.last_viewed_at,
         updated_at     = NOW()`,
      [
        dto.userId,
        dto.componentType,
        dto.componentId,
        dto.componentName ?? null,
        dto.workspaceId ?? null,
        viewedAt,
      ],
    );

    return this.viewCountRepo.findOneByOrFail({
      userId: dto.userId,
      componentType: dto.componentType,
      componentId: dto.componentId,
    });
  }
}
