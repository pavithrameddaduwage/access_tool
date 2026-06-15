import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PbiActivityEvent } from './entities/pbi-activity-event.entity';
import { PbiUser } from '../users/entities/pbi-user.entity';
import { SyncLogService } from '../sync-log/sync-log.service';
import { format, subDays, parseISO, startOfDay, endOfDay } from 'date-fns';

const ACTIVITIES_TO_TRACK = new Set([
  'ViewReport',
  'ViewDashboard',
  'FilterReport',
  'ExportReport',
  'PrintReport',
]);

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);
  private isBackfilling = false;

  // Per-instance token cache (scope: manage.office.com)
  private o365Token: string | null = null;
  private o365TokenExpiry: number | null = null;

  constructor(
    @InjectRepository(PbiActivityEvent)
    private activityEventRepository: Repository<PbiActivityEvent>,
    @InjectRepository(PbiUser)
    private userRepository: Repository<PbiUser>,
    private syncLogService: SyncLogService,
    private configService: ConfigService,
  ) {}

  // ─── O365 Management API helpers ────────────────────────────────────────────

  /** Fetch / return cached OAuth2 token for Office 365 Management API. */
  private async getO365Token(): Promise<string> {
    const now = Date.now();
    if (this.o365Token && this.o365TokenExpiry && this.o365TokenExpiry - now > 300_000) {
      return this.o365Token;
    }

    const tenantId = this.configService.get<string>('TENANT_ID');
    const clientId = this.configService.get<string>('CLIENT_ID');
    const clientSecret = this.configService.get<string>('CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Azure AD credentials (TENANT_ID, CLIENT_ID, CLIENT_SECRET) are missing.');
    }

    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'https://manage.office.com/.default');

    const response = await axios.post(url, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    this.o365Token = response.data.access_token;
    this.o365TokenExpiry = now + response.data.expires_in * 1000;
    this.logger.log('Office 365 Management API token refreshed.');
    return this.o365Token;
  }

  /** Ensure the Audit.General subscription exists (idempotent). */
  private async ensureSubscription(token: string): Promise<void> {
    const tenantId = this.configService.get<string>('TENANT_ID');
    const baseUrl = `https://manage.office.com/api/v1.0/${tenantId}/activity/feed/subscriptions`;

    try {
      const listRes = await axios.get<any[]>(`${baseUrl}/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const existing = (listRes.data || []).map((s: any) => s.contentType as string);
      if (existing.includes('Audit.General')) return;

      await axios.post(`${baseUrl}/start`, null, {
        params: { contentType: 'Audit.General' },
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      this.logger.log('Audit.General subscription created.');
    } catch (err) {
      // Code AF20024 = subscription already exists → safe to ignore
      if (err?.response?.data?.error?.code === 'AF20024') return;
      this.logger.warn(`Subscription check warning: ${err.message}`);
    }
  }

  /**
   * Pull all content URIs available for a given UTC day window.
   * O365 Management API caps windows to 24 hours.
   */
  private async getContentUrisForDay(
    token: string,
    startDate: Date,
    endDate: Date,
  ): Promise<string[]> {
    const tenantId = this.configService.get<string>('TENANT_ID');
    const fmt = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');

    const url =
      `https://manage.office.com/api/v1.0/${tenantId}/activity/feed/subscriptions/content` +
      `?contentType=Audit.General&startTime=${fmt(startDate)}&endTime=${fmt(endDate)}`;

    const res = await axios.get<any[]>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return (res.data || []).map((item: any) => item.contentUri as string);
  }

  /** Fetch a content blob URI and return Power BI entries only. */
  private async fetchContentBlob(token: string, contentUri: string): Promise<any[]> {
    const res = await axios.get<any[]>(contentUri, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return (res.data || []).filter(
      (e: any) => e.Workload === 'PowerBI' && ACTIVITIES_TO_TRACK.has(e.Activity || e.Operation),
    );
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** Fetch and persist all Power BI activity logs for a single UTC date string (yyyy-MM-dd). */
  async fetchActivityForDate(dateStr: string): Promise<number> {
    const syncLog = await this.syncLogService.createLog('activity', dateStr);
    try {
      this.logger.log(`Fetching Power BI activity logs for date: ${dateStr}`);

      const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
      const dayEnd = new Date(`${dateStr}T23:59:59.000Z`);

      const token = await this.getO365Token();
      await this.ensureSubscription(token);

      const contentUris = await this.getContentUrisForDay(token, dayStart, dayEnd);
      this.logger.log(`Found ${contentUris.length} content blobs for ${dateStr}.`);

      let totalEventsPulled = 0;

      for (const uri of contentUris) {
        let entries: any[] = [];
        try {
          entries = await this.fetchContentBlob(token, uri);
        } catch (blobErr) {
          this.logger.warn(`Failed to fetch blob ${uri}: ${blobErr.message}`);
          continue;
        }

        for (const ev of entries) {
          const eventId = ev.Id;
          const userId = ev.UserId || ev.UserKey;
          if (!eventId || !userId) continue;

          // Upsert the activity event
          await this.activityEventRepository
            .createQueryBuilder()
            .insert()
            .values({
              eventId,
              userId,
              userEmail: (ev.UserId || '').toLowerCase() || null,
              operation: ev.Operation || 'View',
              activity: ev.Activity || ev.Operation || null,
              workspaceId: ev.WorkspaceId || null,
              workspaceName: ev.WorkSpaceName || ev.WorkspaceName || null,
              reportId: ev.ReportId || null,
              reportName: ev.ReportName || ev.ArtifactName || null,
              reportType: ev.ReportType || null,
              dashboardId: ev.DashboardId || null,
              dashboardName: ev.DashboardName || null,
              datasetId: ev.DatasetId || null,
              datasetName: ev.DatasetName || null,
              clientIp: ev.ClientIP || null,
              userAgent: ev.UserAgent || null,
              isSuccess: ev.IsSuccess !== undefined ? ev.IsSuccess : true,
              distributionMethod: ev.DistributionMethod || null,
              consumptionMethod: ev.ConsumptionMethod || null,
              creationTime: ev.CreationTime ? new Date(ev.CreationTime) : new Date(),
              requestId: ev.RequestId || null,
              rawJson: ev,
            })
            .onConflict(`("event_id") DO UPDATE SET 
              "operation" = EXCLUDED.operation,
              "activity" = EXCLUDED.activity,
              "workspace_name" = EXCLUDED.workspace_name,
              "report_name" = EXCLUDED.report_name,
              "user_email" = EXCLUDED.user_email,
              "client_ip" = EXCLUDED.client_ip,
              "user_agent" = EXCLUDED.user_agent,
              "is_success" = EXCLUDED.is_success,
              "pulled_at" = NOW()`)
            .execute();

          // Upsert user record
          const email = (ev.UserId || '').toLowerCase();
          if (email && email.includes('@')) {
            await this.userRepository
              .createQueryBuilder()
              .insert()
              .values({
                userId,
                email,
                displayName: email.split('@')[0],
                lastSeenAt: ev.CreationTime ? new Date(ev.CreationTime) : new Date(),
              })
              .onConflict(`("user_id") DO UPDATE SET 
                "last_seen_at" = EXCLUDED.last_seen_at,
                "email" = EXCLUDED.email`)
              .execute();
          }

          totalEventsPulled++;
        }
      }

      await this.syncLogService.updateLog(syncLog.id, 'success', totalEventsPulled);
      this.logger.log(`Completed activity fetch for ${dateStr}. Pulled ${totalEventsPulled} events.`);
      return totalEventsPulled;
    } catch (error) {
      this.logger.error(`Error fetching activity for date ${dateStr}`, error?.response?.data || error.message);
      await this.syncLogService.updateLog(syncLog.id, 'failed', 0, error.message);
      throw error;
    }
  }

  /** Trigger a non-blocking historical backfill for the past N days. */
  async triggerBackfill(days = 90): Promise<void> {
    if (this.isBackfilling) {
      this.logger.warn('Backfill task is already running.');
      return;
    }
    this.isBackfilling = true;
    this.runBackfillAsync(days).finally(() => {
      this.isBackfilling = false;
    });
  }

  private async runBackfillAsync(days: number): Promise<void> {
    this.logger.log(`Starting historical backfill going back ${days} days...`);
    const today = new Date();

    for (let i = days; i >= 1; i--) {
      const targetDate = subDays(today, i);
      const dateStr = format(targetDate, 'yyyy-MM-dd');

      try {
        const alreadySynced = await this.syncLogService.findSuccessLog('activity', dateStr);
        if (alreadySynced) {
          this.logger.log(`Date ${dateStr} already synced. Skipping.`);
          continue;
        }

        await this.fetchActivityForDate(dateStr);

        // Brief pause between days to avoid hammering the API
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      } catch (err) {
        this.logger.error(
          `Backfill failed for date ${dateStr}. Continuing with next days.`,
          err.message,
        );
      }
    }
    this.logger.log('Historical backfill completed.');
  }

  // ─── Query helpers ───────────────────────────────────────────────────────────

  async findFiltered(filters: {
    from?: string;
    to?: string;
    userId?: string;
    workspaceId?: string;
    reportId?: string;
  }): Promise<PbiActivityEvent[]> {
    const query = this.activityEventRepository.createQueryBuilder('event');

    if (filters.from && filters.to) {
      query.andWhere('event.creationTime BETWEEN :from AND :to', {
        from: startOfDay(parseISO(filters.from)),
        to: endOfDay(parseISO(filters.to)),
      });
    }

    if (filters.userId) {
      query.andWhere('event.userId = :userId', { userId: filters.userId });
    }

    if (filters.workspaceId) {
      query.andWhere('event.workspaceId = :workspaceId', { workspaceId: filters.workspaceId });
    }

    if (filters.reportId) {
      query.andWhere('event.reportId = :reportId', { reportId: filters.reportId });
    }

    query.orderBy('event.creationTime', 'DESC');
    return query.getMany();
  }

  async getSyncStatus(): Promise<any[]> {
    return this.syncLogService.getStatus();
  }

  async getIsBackfilling(): Promise<boolean> {
    return this.isBackfilling;
  }
}
