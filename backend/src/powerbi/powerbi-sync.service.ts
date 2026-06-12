import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { format, subDays } from 'date-fns';
import { PowerBIService } from './powerbi.service';
import { SyncLogService } from '../sync-log/sync-log.service';
import { PbiAnalyticsService } from '../analytics/pbi-analytics.service';
import { PbiActivityEvent } from '../activity/entities/pbi-activity-event.entity';
import { ComponentViewCount } from '../tracking/entities/component-view-count.entity';

/** Hours in a day — the admin/activityevents endpoint caps each call to 1 hour. */
const HOURS_PER_DAY = 24;
/** Max retry attempts for transient 5xx responses. */
const MAX_5XX_RETRIES = 3;
/** Sync-log discriminator used for these daily activity pulls. */
const SYNC_TYPE = 'activity';

/**
 * Activity types we translate into component view counts.
 * @see Part 4 of the spec (Source B mapping).
 */
const ACTIVITY_TO_COMPONENT_TYPE: Readonly<Record<string, string>> = {
  ViewReport: 'report',
  ViewDashboard: 'dashboard',
  ViewDataset: 'dataset',
  ExportReport: 'report',
  FilterReport: 'report',
};

/** A single entity from the admin/activityevents response (PascalCase per Microsoft). */
interface PbiAdminActivityEvent {
  Id: string;
  CreationTime: string;
  Operation?: string;
  Activity?: string;
  UserId?: string;
  UserKey?: string;
  ClientIP?: string;
  UserAgent?: string;
  WorkspaceId?: string;
  WorkSpaceName?: string;
  WorkspaceName?: string;
  ReportId?: string;
  ReportName?: string;
  ReportType?: string;
  DashboardId?: string;
  DashboardName?: string;
  DatasetId?: string;
  DatasetName?: string;
  IsSuccess?: boolean;
  DistributionMethod?: string;
  ConsumptionMethod?: string;
  RequestId?: string;
  [key: string]: unknown;
}

/** Shape of a single admin/activityevents page. */
interface PbiActivityEventsResponse {
  activityEventEntities: PbiAdminActivityEvent[];
  continuationUri?: string | null;
  continuationToken?: string | null;
}

/** Aggregated view-count delta for one (user, type, component) within a batch. */
interface ViewCountDelta {
  userId: string;
  componentType: string;
  componentId: string;
  componentName: string | null;
  workspaceId: string | null;
  count: number;
  lastViewedAt: Date;
}

/**
 * Spec-compliant Power BI audit sync (Rule 9: `admin/activityevents` ONLY).
 *
 * Pulls the previous day's audit events in 24 hourly windows, follows
 * `continuationUri` pagination, upserts into the existing `activity_events`
 * table (dedup on `event_id`), and feeds `component_view_counts`.
 *
 * Reuses {@link PowerBIService} for auth (Azure AD client-credentials, correct
 * `powerbi/api/.default` scope) and 429/`Retry-After` handling; this service
 * adds exponential backoff for transient 5xx and the per-day orchestration.
 */
@Injectable()
export class PowerBiSyncService {
  private readonly logger = new Logger(PowerBiSyncService.name);

  constructor(
    private readonly powerBiService: PowerBIService,
    private readonly syncLogService: SyncLogService,
    private readonly analyticsService: PbiAnalyticsService,
    @InjectRepository(PbiActivityEvent)
    private readonly activityRepo: Repository<PbiActivityEvent>,
    @InjectRepository(ComponentViewCount)
    private readonly viewCountRepo: Repository<ComponentViewCount>,
  ) {}

  // ─── Cron entry points ──────────────────────────────────────────────────────

  /** 2:00 AM daily — sync yesterday's audit events. */
  @Cron('0 0 2 * * *')
  async handleDailySync(): Promise<void> {
    const dateStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    this.logger.log(`[2AM] Daily Power BI activity sync for ${dateStr}`);
    try {
      await this.syncDay(dateStr);
      // Recalculate sessions AFTER the fetch so they reflect the freshly-pulled
      // activity (fixes the prior 1 AM-before-fetch ordering).
      await this.recalculateSessions(dateStr);
    } catch (err) {
      this.logger.error(`[2AM] Daily sync failed for ${dateStr}`, this.errMsg(err));
    }
  }

  /** 3:00 AM daily — re-attempt any days marked `failed` in the sync log. */
  @Cron('0 0 3 * * *')
  async handleRetryFailedDays(): Promise<void> {
    const failedDates = await this.getFailedDates();
    if (failedDates.length === 0) {
      this.logger.log('[3AM] No failed activity days to retry.');
      return;
    }
    this.logger.log(`[3AM] Retrying ${failedDates.length} failed day(s): ${failedDates.join(', ')}`);
    for (const dateStr of failedDates) {
      try {
        await this.syncDay(dateStr);
        await this.recalculateSessions(dateStr);
      } catch (err) {
        this.logger.error(`[3AM] Retry failed for ${dateStr}`, this.errMsg(err));
      }
    }
  }

  /**
   * Recompute session/usage summaries for a day after its activity is fetched.
   * Isolated so a calc failure does not fail the (already-successful) sync.
   */
  private async recalculateSessions(dateStr: string): Promise<void> {
    try {
      await this.analyticsService.calculateSessionsForDate(dateStr);
      this.logger.log(`Session calculation complete for ${dateStr}.`);
    } catch (err) {
      this.logger.error(`Session calculation failed for ${dateStr}`, this.errMsg(err));
    }
  }

  // ─── Core sync ────────────────────────────────────────────────────────────────

  /**
   * Sync a single UTC day (`yyyy-MM-dd`) across 24 hourly windows.
   * Records a `sync_log` row (events_fetched / events_inserted / pages_fetched
   * are tracked in memory; the existing log stores the fetched total).
   * @param dateStr Target UTC date, `yyyy-MM-dd`.
   * @returns Number of events fetched.
   */
  async syncDay(dateStr: string): Promise<number> {
    const syncLog = await this.syncLogService.createLog(SYNC_TYPE, dateStr);
    let eventsFetched = 0;
    let pagesFetched = 0;

    try {
      for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
        let url: string | null = this.buildHourUrl(dateStr, hour);

        while (url) {
          const page = await this.callWithRetry(url);
          const entities = page.activityEventEntities ?? [];
          pagesFetched++;
          eventsFetched += entities.length;

          if (entities.length > 0) {
            await this.batchUpsert(entities);
            await this.updateViewCountsFromAudit(entities);
          }

          url = page.continuationUri ?? null;
        }
      }

      await this.syncLogService.updateLog(syncLog.id, 'success', eventsFetched);
      this.logger.log(
        `Sync ${dateStr} complete — ${eventsFetched} events across ${pagesFetched} page(s).`,
      );
      return eventsFetched;
    } catch (err) {
      await this.syncLogService.updateLog(syncLog.id, 'failed', eventsFetched, this.errMsg(err));
      throw err;
    }
  }

  /** Build the admin/activityevents URL for a single hour window. */
  private buildHourUrl(dateStr: string, hour: number): string {
    const start = new Date(`${dateStr}T00:00:00.000Z`);
    start.setUTCHours(hour, 0, 0, 0);
    const end = new Date(`${dateStr}T00:00:00.000Z`);
    end.setUTCHours(hour, 59, 59, 999);
    // Microsoft requires the datetimes wrapped in single quotes.
    return (
      `/admin/activityevents?startDateTime='${start.toISOString()}'` +
      `&endDateTime='${end.toISOString()}'`
    );
  }

  /**
   * GET a page with retry. {@link PowerBIService} already retries 429 using the
   * `Retry-After` header; here we add exponential backoff (2^n s) for 5xx.
   */
  private async callWithRetry(url: string): Promise<PbiActivityEventsResponse> {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    for (;;) {
      try {
        return await this.powerBiService.get<PbiActivityEventsResponse>(url);
      } catch (err) {
        const status = this.statusOf(err);
        const isTransient = status !== undefined && status >= 500 && status < 600;
        if (isTransient && attempt < MAX_5XX_RETRIES) {
          const delayMs = 2 ** attempt * 1000;
          attempt++;
          this.logger.warn(
            `5xx (${status}) on activityevents. Backing off ${delayMs}ms (attempt ${attempt}/${MAX_5XX_RETRIES}).`,
          );
          await this.sleep(delayMs);
          continue;
        }
        throw err;
      }
    }
  }

  /**
   * Upsert a page of audit events into `activity_events`, deduped on `event_id`.
   * Duplicate ids within the same batch are collapsed to avoid the Postgres
   * "ON CONFLICT cannot affect row a second time" error.
   */
  private async batchUpsert(entities: PbiAdminActivityEvent[]): Promise<void> {
    const byId = new Map<string, PbiAdminActivityEvent>();
    for (const e of entities) {
      if (e.Id && (e.UserId || e.UserKey)) byId.set(e.Id, e);
    }
    if (byId.size === 0) return;

    const values = Array.from(byId.values()).map((e) => {
      const userId = (e.UserId || e.UserKey) as string;
      return {
        eventId: e.Id,
        userId,
        userEmail: (e.UserId || '').toLowerCase() || null,
        operation: e.Operation || e.Activity || 'View',
        activity: e.Activity || e.Operation || null,
        workspaceId: e.WorkspaceId || null,
        workspaceName: e.WorkSpaceName || e.WorkspaceName || null,
        reportId: e.ReportId || null,
        reportName: e.ReportName || null,
        reportType: e.ReportType || null,
        dashboardId: e.DashboardId || null,
        dashboardName: e.DashboardName || null,
        datasetId: e.DatasetId || null,
        datasetName: e.DatasetName || null,
        clientIp: e.ClientIP || null,
        userAgent: e.UserAgent || null,
        isSuccess: e.IsSuccess !== undefined ? e.IsSuccess : true,
        distributionMethod: e.DistributionMethod || null,
        consumptionMethod: e.ConsumptionMethod || null,
        creationTime: e.CreationTime ? new Date(e.CreationTime) : new Date(),
        requestId: e.RequestId || null,
        rawJson: e,
      };
    });

    await this.activityRepo
      .createQueryBuilder()
      .insert()
      // Cast required: TypeORM's deep-partial typing misreads the `raw_json`
      // jsonb column as a nested entity. Values are structurally correct.
      .values(values as unknown as QueryDeepPartialEntity<PbiActivityEvent>[])
      .onConflict(
        `("event_id") DO UPDATE SET
          "operation" = EXCLUDED.operation,
          "activity" = EXCLUDED.activity,
          "workspace_name" = EXCLUDED.workspace_name,
          "report_name" = EXCLUDED.report_name,
          "user_email" = EXCLUDED.user_email,
          "is_success" = EXCLUDED.is_success,
          "pulled_at" = NOW()`,
      )
      .execute();
  }

  /**
   * Translate audit events into `component_view_counts` upserts.
   * Aggregates a batch per (user, type, component) so each key is written once
   * (incrementing by the batch count), avoiding repeated conflict writes.
   */
  private async updateViewCountsFromAudit(entities: PbiAdminActivityEvent[]): Promise<void> {
    const deltas = new Map<string, ViewCountDelta>();

    for (const e of entities) {
      const activity = (e.Activity || e.Operation || '') as string;
      const componentType = ACTIVITY_TO_COMPONENT_TYPE[activity];
      if (!componentType) continue;

      const userId = (e.UserId || e.UserKey) as string | undefined;
      const componentId = this.pickComponentId(componentType, e);
      if (!userId || !componentId) continue;

      const key = `${userId}|${componentType}|${componentId}`;
      const lastViewedAt = e.CreationTime ? new Date(e.CreationTime) : new Date();
      const existing = deltas.get(key);
      if (existing) {
        existing.count++;
        if (lastViewedAt > existing.lastViewedAt) existing.lastViewedAt = lastViewedAt;
      } else {
        deltas.set(key, {
          userId,
          componentType,
          componentId,
          componentName: this.pickComponentName(componentType, e),
          workspaceId: e.WorkspaceId || null,
          count: 1,
          lastViewedAt,
        });
      }
    }

    for (const d of deltas.values()) {
      await this.upsertViewCount(d);
    }
  }

  /** Atomic increment-by-N upsert into `component_view_counts`. */
  private async upsertViewCount(d: ViewCountDelta): Promise<void> {
    await this.viewCountRepo.query(
      `INSERT INTO component_view_counts
         (user_id, component_type, component_id, component_name, workspace_id,
          view_count, last_viewed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (user_id, component_type, component_id)
       DO UPDATE SET
         view_count     = component_view_counts.view_count + EXCLUDED.view_count,
         component_name = COALESCE(EXCLUDED.component_name, component_view_counts.component_name),
         workspace_id   = COALESCE(EXCLUDED.workspace_id, component_view_counts.workspace_id),
         last_viewed_at = GREATEST(component_view_counts.last_viewed_at, EXCLUDED.last_viewed_at),
         updated_at     = NOW()`,
      [d.userId, d.componentType, d.componentId, d.componentName, d.workspaceId, d.count, d.lastViewedAt],
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  /** Choose the component id matching the resolved component type. */
  private pickComponentId(componentType: string, e: PbiAdminActivityEvent): string | null {
    switch (componentType) {
      case 'report':
        return e.ReportId || null;
      case 'dashboard':
        return e.DashboardId || null;
      case 'dataset':
        return e.DatasetId || null;
      default:
        return e.ReportId || e.DashboardId || e.DatasetId || null;
    }
  }

  /** Choose the component name matching the resolved component type. */
  private pickComponentName(componentType: string, e: PbiAdminActivityEvent): string | null {
    switch (componentType) {
      case 'report':
        return e.ReportName || null;
      case 'dashboard':
        return e.DashboardName || null;
      case 'dataset':
        return e.DatasetName || null;
      default:
        return e.ReportName || e.DashboardName || e.DatasetName || null;
    }
  }

  /**
   * Distinct dates currently marked `failed` for activity sync that have no
   * later successful sync. Derived from recent sync-log rows.
   */
  private async getFailedDates(): Promise<string[]> {
    const logs = await this.syncLogService.getStatus();
    const succeeded = new Set<string>();
    const failed = new Set<string>();
    for (const log of logs) {
      if (log.syncType !== SYNC_TYPE || !log.syncDate) continue;
      if (log.status === 'success') succeeded.add(log.syncDate);
      else if (log.status === 'failed') failed.add(log.syncDate);
    }
    return Array.from(failed).filter((d) => !succeeded.has(d)).sort();
  }

  private statusOf(err: unknown): number | undefined {
    const resp = (err as { response?: { status?: number } })?.response;
    return resp?.status;
  }

  private errMsg(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
