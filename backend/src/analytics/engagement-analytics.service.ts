import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { subDays } from 'date-fns';
import { TrackerSession } from '../tracking/entities/tracker-session.entity';
import { ComponentViewCount } from '../tracking/entities/component-view-count.entity';
import { PbiActivityEvent } from '../activity/entities/pbi-activity-event.entity';
import { PbiUser } from '../users/entities/pbi-user.entity';
import { AnalyticsQueryDto, periodToDays } from './dto/analytics-query.dto';

/** Power BI audit operations counted in the report summary. */
const REPORT_OPS = {
  view: 'ViewReport',
  export: 'ExportReport',
  filter: 'FilterReport',
  share: 'ShareReport',
  print: 'PrintReport',
} as const;

// ─── Return shapes ──────────────────────────────────────────────────────────────

export interface OverviewResult {
  activeUsers: number;
  totalEngagedHours: number;
  avgEngagedMinPerUser: number;
  topDashboard: { id: string; name: string; engagedSeconds: number } | null;
  mostViewedReport: { id: string; name: string | null; viewCount: number } | null;
}

export interface TopViewRow {
  componentId: string;
  componentName: string | null;
  componentType: string;
  totalViews: number;
  uniqueViewers: number;
  lastViewedAt: Date | null;
}

export interface UserViewRow {
  componentId: string;
  componentName: string | null;
  componentType: string;
  viewCount: number;
  lastViewedAt: Date | null;
}

export interface ComponentViewerRow {
  userId: string;
  userEmail: string | null;
  viewCount: number;
  lastViewedAt: Date | null;
  totalEngagedSeconds: number;
}

export interface UserRow {
  userId: string;
  userEmail: string | null;
  department: string | null;
  totalEngagedSeconds: number;
  lastSeen: Date | null;
  sessionCount: number;
  totalViews: number;
}

export interface DashboardRow {
  dashboardId: string;
  engagedSeconds: number;
  uniqueUsers: number;
  visitCount: number;
  copyCount: number;
  scrollCount: number;
}

export interface ReportRow {
  reportId: string;
  reportName: string | null;
  viewCount: number;
  exportCount: number;
  filterCount: number;
  shareCount: number;
  printCount: number;
  uniqueUsers: number;
}

export interface UserDetailResult {
  user: {
    userId: string;
    userEmail: string | null;
    department: string | null;
    totalEngagedSeconds: number;
    totalViews: number;
  };
  sessions: Array<{
    id: string;
    dashboardId: string;
    tabName: string | null;
    startedAt: Date;
    engagedSeconds: number;
    clickCount: number;
    scrollCount: number;
    copyCount: number;
  }>;
  views: UserViewRow[];
  audit: Array<{ activityType: string; reportName: string | null; activityAt: Date }>;
}

/**
 * Engagement analytics over the new tracker tables (`tracker_sessions`,
 * `component_view_counts`) joined with the reused `activity_events` audit data.
 *
 * All list/overview queries honor `?period` (relative day window) and, where the
 * underlying table carries it, `?department` (sourced from `tracker_sessions`).
 */
@Injectable()
export class EngagementAnalyticsService {
  constructor(
    @InjectRepository(TrackerSession)
    private readonly sessionRepo: Repository<TrackerSession>,
    @InjectRepository(ComponentViewCount)
    private readonly viewRepo: Repository<ComponentViewCount>,
    @InjectRepository(PbiActivityEvent)
    private readonly activityRepo: Repository<PbiActivityEvent>,
    @InjectRepository(PbiUser)
    private readonly userRepo: Repository<PbiUser>,
  ) {}

  // ─── Overview ─────────────────────────────────────────────────────────────────

  /**
   * KPI summary for the period: active users, engaged hours, averages, plus the
   * top dashboard (by engaged time) and most-viewed report.
   */
  async getOverview(query: AnalyticsQueryDto): Promise<OverviewResult> {
    const since = this.since(query);

    const agg = await this.sessionScope(query, since)
      .select('COUNT(DISTINCT s.user_id)', 'activeUsers')
      .addSelect('COALESCE(SUM(s.engaged_seconds), 0)', 'engagedSeconds')
      .getRawOne<{ activeUsers: string; engagedSeconds: string }>();

    const activeUsers = Number(agg?.activeUsers ?? 0);
    const engagedSeconds = Number(agg?.engagedSeconds ?? 0);
    const totalEngagedHours = +(engagedSeconds / 3600).toFixed(2);
    const avgEngagedMinPerUser =
      activeUsers > 0 ? +(engagedSeconds / 60 / activeUsers).toFixed(2) : 0;

    const topDash = await this.sessionScope(query, since)
      .select('s.dashboard_id', 'dashboardId')
      .addSelect('SUM(s.engaged_seconds)', 'engagedSeconds')
      .groupBy('s.dashboard_id')
      .orderBy('"engagedSeconds"', 'DESC')
      .limit(1)
      .getRawOne<{ dashboardId: string; engagedSeconds: string }>();

    const topReport = await this.viewScope(query, since)
      .select('v.component_id', 'componentId')
      .addSelect('MAX(v.component_name)', 'componentName')
      .addSelect('SUM(v.view_count)', 'views')
      .where('v.component_type = :t', { t: 'report' })
      .groupBy('v.component_id')
      .orderBy('"views"', 'DESC')
      .limit(1)
      .getRawOne<{ componentId: string; componentName: string | null; views: string }>();

    return {
      activeUsers,
      totalEngagedHours,
      avgEngagedMinPerUser,
      topDashboard: topDash
        ? { id: topDash.dashboardId, name: topDash.dashboardId, engagedSeconds: Number(topDash.engagedSeconds) }
        : null,
      mostViewedReport: topReport
        ? { id: topReport.componentId, name: topReport.componentName, viewCount: Number(topReport.views) }
        : null,
    };
  }

  // ─── Views ────────────────────────────────────────────────────────────────────

  /** Top components by total views, optionally filtered to a single type. */
  async getTopViews(query: AnalyticsQueryDto, type?: string, limit = 20): Promise<TopViewRow[]> {
    const since = this.since(query);
    const qb = this.viewScope(query, since)
      .select('v.component_id', 'componentId')
      .addSelect('MAX(v.component_name)', 'componentName')
      .addSelect('v.component_type', 'componentType')
      .addSelect('SUM(v.view_count)', 'totalViews')
      .addSelect('COUNT(DISTINCT v.user_id)', 'uniqueViewers')
      .addSelect('MAX(v.last_viewed_at)', 'lastViewedAt')
      .groupBy('v.component_id')
      .addGroupBy('v.component_type')
      .orderBy('"totalViews"', 'DESC')
      .limit(limit);

    if (type) qb.andWhere('v.component_type = :type', { type });

    const rows = await qb.getRawMany<{
      componentId: string;
      componentName: string | null;
      componentType: string;
      totalViews: string;
      uniqueViewers: string;
      lastViewedAt: Date | null;
    }>();

    return rows.map((r) => ({
      componentId: r.componentId,
      componentName: r.componentName,
      componentType: r.componentType,
      totalViews: Number(r.totalViews),
      uniqueViewers: Number(r.uniqueViewers),
      lastViewedAt: r.lastViewedAt,
    }));
  }

  /** All components a single user has viewed. */
  async getViewsByUser(userId: string, query: AnalyticsQueryDto): Promise<UserViewRow[]> {
    const since = this.since(query);
    const rows = await this.viewRepo
      .createQueryBuilder('v')
      .select('v.component_id', 'componentId')
      .addSelect('v.component_name', 'componentName')
      .addSelect('v.component_type', 'componentType')
      .addSelect('v.view_count', 'viewCount')
      .addSelect('v.last_viewed_at', 'lastViewedAt')
      .where('v.user_id = :userId', { userId })
      .andWhere('v.last_viewed_at >= :since', { since })
      .orderBy('v.view_count', 'DESC')
      .getRawMany<{
        componentId: string;
        componentName: string | null;
        componentType: string;
        viewCount: string;
        lastViewedAt: Date | null;
      }>();

    return rows.map((r) => ({
      componentId: r.componentId,
      componentName: r.componentName,
      componentType: r.componentType,
      viewCount: Number(r.viewCount),
      lastViewedAt: r.lastViewedAt,
    }));
  }

  /** All users who viewed a given component, with their engaged time. */
  async getViewsByComponent(type: string, id: string): Promise<ComponentViewerRow[]> {
    const rows = await this.viewRepo
      .createQueryBuilder('v')
      .select('v.user_id', 'userId')
      .addSelect('u.email', 'userEmail')
      .addSelect('v.view_count', 'viewCount')
      .addSelect('v.last_viewed_at', 'lastViewedAt')
      .addSelect(
        `COALESCE((
          SELECT SUM(s.engaged_seconds) FROM tracker_sessions s
          WHERE s.user_id = v.user_id AND s.dashboard_id = v.component_id
        ), 0)`,
        'totalEngagedSeconds',
      )
      .leftJoin(PbiUser, 'u', 'u.user_id = v.user_id')
      .where('v.component_type = :type', { type })
      .andWhere('v.component_id = :id', { id })
      .orderBy('v.view_count', 'DESC')
      .getRawMany<{
        userId: string;
        userEmail: string | null;
        viewCount: string;
        lastViewedAt: Date | null;
        totalEngagedSeconds: string;
      }>();

    return rows.map((r) => ({
      userId: r.userId,
      userEmail: r.userEmail,
      viewCount: Number(r.viewCount),
      lastViewedAt: r.lastViewedAt,
      totalEngagedSeconds: Number(r.totalEngagedSeconds),
    }));
  }

  // ─── Users ────────────────────────────────────────────────────────────────────

  /** All users with engaged time, last seen, session + view totals. */
  async getUsers(query: AnalyticsQueryDto): Promise<UserRow[]> {
    const since = this.since(query);
    const rows = await this.sessionScope(query, since)
      .select('s.user_id', 'userId')
      .addSelect('u.email', 'userEmail')
      .addSelect('MAX(s.department)', 'department')
      .addSelect('SUM(s.engaged_seconds)', 'totalEngagedSeconds')
      .addSelect('MAX(s.last_flush_at)', 'lastSeen')
      .addSelect('COUNT(s.id)', 'sessionCount')
      .addSelect(
        `COALESCE((
          SELECT SUM(v.view_count) FROM component_view_counts v WHERE v.user_id = s.user_id
        ), 0)`,
        'totalViews',
      )
      .leftJoin(PbiUser, 'u', 'u.user_id = s.user_id')
      .groupBy('s.user_id')
      .addGroupBy('u.email')
      .orderBy('"totalEngagedSeconds"', 'DESC')
      .getRawMany<{
        userId: string;
        userEmail: string | null;
        department: string | null;
        totalEngagedSeconds: string;
        lastSeen: Date | null;
        sessionCount: string;
        totalViews: string;
      }>();

    return rows.map((r) => ({
      userId: r.userId,
      userEmail: r.userEmail,
      department: r.department,
      totalEngagedSeconds: Number(r.totalEngagedSeconds),
      lastSeen: r.lastSeen,
      sessionCount: Number(r.sessionCount),
      totalViews: Number(r.totalViews),
    }));
  }

  /** Single-user detail: summary + sessions + views + audit events. */
  async getUserDetail(userId: string, query: AnalyticsQueryDto): Promise<UserDetailResult> {
    const since = this.since(query);

    const sessions = await this.sessionRepo
      .createQueryBuilder('s')
      .where('s.user_id = :userId', { userId })
      .andWhere('s.started_at >= :since', { since })
      .orderBy('s.started_at', 'DESC')
      .getMany();

    const views = await this.getViewsByUser(userId, query);

    const auditRows = await this.activityRepo
      .createQueryBuilder('a')
      .select('a.activity', 'activityType')
      .addSelect('a.report_name', 'reportName')
      .addSelect('a.creation_time', 'activityAt')
      .where('a.user_id = :userId', { userId })
      .andWhere('a.creation_time >= :since', { since })
      .orderBy('a.creation_time', 'DESC')
      .limit(200)
      .getRawMany<{ activityType: string; reportName: string | null; activityAt: Date }>();

    const totalEngagedSeconds = sessions.reduce((sum, s) => sum + (s.engagedSeconds ?? 0), 0);
    const totalViews = views.reduce((sum, v) => sum + v.viewCount, 0);
    const user = await this.userRepo.findOne({ where: { userId } });

    return {
      user: {
        userId,
        userEmail: user?.email ?? null,
        department: sessions[0]?.department ?? null,
        totalEngagedSeconds,
        totalViews,
      },
      sessions: sessions.map((s) => ({
        id: s.id,
        dashboardId: s.dashboardId,
        tabName: s.tabName,
        startedAt: s.startedAt,
        engagedSeconds: s.engagedSeconds,
        clickCount: s.clickCount,
        scrollCount: s.scrollCount,
        copyCount: s.copyCount,
      })),
      views,
      audit: auditRows,
    };
  }

  // ─── Dashboards & reports ───────────────────────────────────────────────────────

  /** Per-dashboard engagement rollup from `tracker_sessions`. */
  async getDashboards(query: AnalyticsQueryDto): Promise<DashboardRow[]> {
    const since = this.since(query);
    const rows = await this.sessionScope(query, since)
      .select('s.dashboard_id', 'dashboardId')
      .addSelect('SUM(s.engaged_seconds)', 'engagedSeconds')
      .addSelect('COUNT(DISTINCT s.user_id)', 'uniqueUsers')
      .addSelect('COUNT(s.id)', 'visitCount')
      .addSelect('SUM(s.copy_count)', 'copyCount')
      .addSelect('SUM(s.scroll_count)', 'scrollCount')
      .groupBy('s.dashboard_id')
      .orderBy('"engagedSeconds"', 'DESC')
      .getRawMany<{
        dashboardId: string;
        engagedSeconds: string;
        uniqueUsers: string;
        visitCount: string;
        copyCount: string;
        scrollCount: string;
      }>();

    return rows.map((r) => ({
      dashboardId: r.dashboardId,
      engagedSeconds: Number(r.engagedSeconds),
      uniqueUsers: Number(r.uniqueUsers),
      visitCount: Number(r.visitCount),
      copyCount: Number(r.copyCount),
      scrollCount: Number(r.scrollCount),
    }));
  }

  /** Per-report audit rollup from `activity_events` (view/export/filter/share/print). */
  async getReports(query: AnalyticsQueryDto): Promise<ReportRow[]> {
    const since = this.since(query);
    const count = (op: string) => `COUNT(*) FILTER (WHERE a.operation = '${op}')`;

    const qb = this.activityRepo
      .createQueryBuilder('a')
      .select('a.report_id', 'reportId')
      .addSelect('MAX(a.report_name)', 'reportName')
      .addSelect(count(REPORT_OPS.view), 'viewCount')
      .addSelect(count(REPORT_OPS.export), 'exportCount')
      .addSelect(count(REPORT_OPS.filter), 'filterCount')
      .addSelect(count(REPORT_OPS.share), 'shareCount')
      .addSelect(count(REPORT_OPS.print), 'printCount')
      .addSelect('COUNT(DISTINCT a.user_id)', 'uniqueUsers')
      .where('a.report_id IS NOT NULL')
      .andWhere('a.creation_time >= :since', { since })
      .groupBy('a.report_id')
      .orderBy('"viewCount"', 'DESC');

    this.applyDepartmentUserFilter(qb, 'a', query.department);

    const rows = await qb.getRawMany<{
      reportId: string;
      reportName: string | null;
      viewCount: string;
      exportCount: string;
      filterCount: string;
      shareCount: string;
      printCount: string;
      uniqueUsers: string;
    }>();

    return rows.map((r) => ({
      reportId: r.reportId,
      reportName: r.reportName,
      viewCount: Number(r.viewCount),
      exportCount: Number(r.exportCount),
      filterCount: Number(r.filterCount),
      shareCount: Number(r.shareCount),
      printCount: Number(r.printCount),
      uniqueUsers: Number(r.uniqueUsers),
    }));
  }

  // ─── Scope helpers ──────────────────────────────────────────────────────────────

  private since(query: AnalyticsQueryDto): Date {
    return subDays(new Date(), periodToDays(query.period));
  }

  /** Sessions filtered by period (+ department directly on the table). */
  private sessionScope(query: AnalyticsQueryDto, since: Date): SelectQueryBuilder<TrackerSession> {
    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .where('s.started_at >= :since', { since });
    if (query.department) qb.andWhere('s.department = :dept', { dept: query.department });
    return qb;
  }

  /** Views filtered by period (+ department via tracker_sessions membership). */
  private viewScope(query: AnalyticsQueryDto, since: Date): SelectQueryBuilder<ComponentViewCount> {
    const qb = this.viewRepo
      .createQueryBuilder('v')
      .where('v.last_viewed_at >= :since', { since });
    this.applyDepartmentUserFilter(qb, 'v', query.department);
    return qb;
  }

  /**
   * Restrict to users belonging to a department. Since only `tracker_sessions`
   * carries department, this filters `<alias>.user_id` to that department's users.
   */
  private applyDepartmentUserFilter(
    qb: SelectQueryBuilder<unknown>,
    alias: string,
    department?: string,
  ): void {
    if (!department) return;
    qb.andWhere(
      `${alias}.user_id IN (
        SELECT DISTINCT s2.user_id FROM tracker_sessions s2 WHERE s2.department = :dept
      )`,
      { dept: department },
    );
  }
}
