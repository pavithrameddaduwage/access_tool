import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PbiSession } from './entities/pbi-session.entity';
import { PbiUsageSummary } from './entities/pbi-usage-summary.entity';
import { PbiActivityEvent } from '../activity/entities/pbi-activity-event.entity';
import { PbiWorkspace } from '../workspaces/entities/pbi-workspace.entity';
import { PbiReport } from '../workspaces/entities/pbi-report.entity';
import { PbiUser } from '../users/entities/pbi-user.entity';
import { ConfigService } from '@nestjs/config';
import { format, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';

@Injectable()
export class PbiAnalyticsService {
  private readonly logger = new Logger(PbiAnalyticsService.name);

  constructor(
    @InjectRepository(PbiSession)
    private sessionRepository: Repository<PbiSession>,
    @InjectRepository(PbiUsageSummary)
    private usageSummaryRepository: Repository<PbiUsageSummary>,
    @InjectRepository(PbiActivityEvent)
    private activityEventRepository: Repository<PbiActivityEvent>,
    @InjectRepository(PbiWorkspace)
    private workspaceRepository: Repository<PbiWorkspace>,
    @InjectRepository(PbiReport)
    private reportRepository: Repository<PbiReport>,
    @InjectRepository(PbiUser)
    private userRepository: Repository<PbiUser>,
    private configService: ConfigService,
  ) {}

  // Run session calculation for a specific date (YYYY-MM-DD)
  async calculateSessionsForDate(dateStr: string): Promise<void> {
    this.logger.log(`Running session calculation for date: ${dateStr}`);
    const idleTimeoutMin = parseInt(this.configService.get<string>('IDLE_TIMEOUT_MINUTES', '30'), 10);
    const idleTimeoutSec = idleTimeoutMin * 60;

    const start = startOfDay(parseISO(dateStr));
    const end = endOfDay(parseISO(dateStr));

    // 1. Fetch events for the day sorted by user_id and creation_time
    const events = await this.activityEventRepository.find({
      where: {
        creationTime: Between(start, end),
      },
      order: {
        userId: 'ASC',
        creationTime: 'ASC',
      },
    });

    if (events.length === 0) {
      this.logger.log(`No events found to calculate sessions for date ${dateStr}`);
      return;
    }

    // Group events by user
    const eventsByUser: { [userId: string]: PbiActivityEvent[] } = {};
    for (const ev of events) {
      if (!eventsByUser[ev.userId]) {
        eventsByUser[ev.userId] = [];
      }
      eventsByUser[ev.userId].push(ev);
    }

    // Delete existing sessions for this date to avoid duplication
    await this.sessionRepository.delete({ date: dateStr });

    const computedSessions: PbiSession[] = [];

    // Calculate sessions for each user
    for (const [userId, userEvents] of Object.entries(eventsByUser)) {
      let currentSessionEvents: PbiActivityEvent[] = [userEvents[0]];

      for (let i = 1; i < userEvents.length; i++) {
        const prevEvent = userEvents[i - 1];
        const currEvent = userEvents[i];

        const prevTime = new Date(prevEvent.creationTime).getTime();
        const currTime = new Date(currEvent.creationTime).getTime();
        const gapSeconds = (currTime - prevTime) / 1000;

        if (gapSeconds > idleTimeoutSec) {
          // Finalize current session
          const session = this.createSessionFromEvents(currentSessionEvents, dateStr, idleTimeoutSec);
          computedSessions.push(session);

          // Start new session
          currentSessionEvents = [currEvent];
        } else {
          currentSessionEvents.push(currEvent);
        }
      }

      // Save last session
      if (currentSessionEvents.length > 0) {
        const session = this.createSessionFromEvents(currentSessionEvents, dateStr, idleTimeoutSec);
        computedSessions.push(session);
      }
    }

    // Save all calculated sessions
    await this.sessionRepository.save(computedSessions);
    this.logger.log(`Saved ${computedSessions.length} computed sessions for date ${dateStr}`);

    // 2. Aggregate sessions into usage_summary table
    await this.aggregateSummaryForDate(dateStr, computedSessions, events);
  }

  private createSessionFromEvents(events: PbiActivityEvent[], dateStr: string, idleTimeoutSec: number): PbiSession {
    const session = new PbiSession();
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    session.userId = firstEvent.userId;
    session.userEmail = firstEvent.userEmail;
    session.reportId = firstEvent.reportId || null;
    session.reportName = firstEvent.reportName || null;
    session.workspaceId = firstEvent.workspaceId || null;
    session.sessionStart = firstEvent.creationTime;
    session.sessionEnd = lastEvent.creationTime;
    session.date = dateStr;
    session.eventCount = events.length;

    let totalDuration = 0;
    let idleCapped = false;

    for (let i = 1; i < events.length; i++) {
      const prevTime = new Date(events[i - 1].creationTime).getTime();
      const currTime = new Date(events[i].creationTime).getTime();
      const gap = (currTime - prevTime) / 1000;

      if (gap >= idleTimeoutSec) {
        idleCapped = true;
      }
      totalDuration += Math.min(gap, idleTimeoutSec);
    }

    session.durationSeconds = Math.round(totalDuration);
    session.idleCapped = idleCapped;

    return session;
  }

  private async aggregateSummaryForDate(dateStr: string, sessions: PbiSession[], events: PbiActivityEvent[]): Promise<void> {
    // Delete existing summaries for this date to avoid duplication
    await this.usageSummaryRepository.delete({ date: dateStr });

    const summaryMap: { [key: string]: PbiUsageSummary } = {};

    // 1. Map events to calculate action counts (View, Filter, Export)
    for (const ev of events) {
      if (!ev.reportId) continue;
      const key = `${dateStr}_${ev.userId}_${ev.reportId}`;

      if (!summaryMap[key]) {
        summaryMap[key] = new PbiUsageSummary();
        summaryMap[key].date = dateStr;
        summaryMap[key].userId = ev.userId;
        summaryMap[key].userEmail = ev.userEmail;
        summaryMap[key].workspaceId = ev.workspaceId;
        summaryMap[key].workspaceName = ev.workspaceName;
        summaryMap[key].reportId = ev.reportId;
        summaryMap[key].reportName = ev.reportName;
        summaryMap[key].viewCount = 0;
        summaryMap[key].filterCount = 0;
        summaryMap[key].exportCount = 0;
        summaryMap[key].estimatedDurationSec = 0;
        summaryMap[key].uniqueDaysActive = 1;
      }

      const op = ev.operation?.toLowerCase();
      const act = ev.activity?.toLowerCase();

      if (op === 'viewreport' || op === 'viewdashboard' || act === 'viewreport' || act === 'viewdashboard') {
        summaryMap[key].viewCount++;
      } else if (op === 'filterreport' || act === 'filterreport') {
        summaryMap[key].filterCount++;
      } else if (op === 'exportreport' || act === 'exportreport') {
        summaryMap[key].exportCount++;
      } else {
        summaryMap[key].viewCount++; // Default fallback
      }
    }

    // 2. Map sessions to accumulate estimated duration
    for (const sess of sessions) {
      if (!sess.reportId) continue;
      const key = `${dateStr}_${sess.userId}_${sess.reportId}`;
      if (summaryMap[key]) {
        summaryMap[key].estimatedDurationSec += sess.durationSeconds;
      }
    }

    const summaries = Object.values(summaryMap);
    if (summaries.length > 0) {
      await this.usageSummaryRepository.save(summaries);
      this.logger.log(`Aggregated and saved ${summaries.length} usage summary records for date ${dateStr}`);
    }
  }

  // REST API Endpoints
  async getOverview(from?: string, to?: string): Promise<any> {
    const fromDate = from || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const toDate = to || format(new Date(), 'yyyy-MM-dd');

    const totalWorkspaces = await this.workspaceRepository.count();
    const totalReports = await this.reportRepository.count();
    const totalUsers = await this.userRepository.count();

    // Sum view count this month / today
    const monthStats = await this.usageSummaryRepository
      .createQueryBuilder('sum')
      .select('SUM(sum.view_count)', 'totalViews')
      .where('sum.date BETWEEN :from AND :to', { from: fromDate, to: toDate })
      .getRawOne();

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayStats = await this.usageSummaryRepository
      .createQueryBuilder('sum')
      .select('SUM(sum.view_count)', 'todayViews')
      .where('sum.date = :today', { today: todayStr })
      .getRawOne();

    return {
      totalWorkspaces,
      totalReports,
      totalUsers,
      totalViewsMonth: parseInt(monthStats?.totalViews || '0', 10),
      totalViewsToday: parseInt(todayStats?.todayViews || '0', 10),
    };
  }

  async getViews(workspaceId?: string, from?: string, to?: string): Promise<any[]> {
    const fromDate = from || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const toDate = to || format(new Date(), 'yyyy-MM-dd');

    const query = this.usageSummaryRepository
      .createQueryBuilder('sum')
      .select('sum.date', 'date')
      .addSelect('SUM(sum.view_count)', 'views')
      .where('sum.date BETWEEN :from AND :to', { from: fromDate, to: toDate });

    if (workspaceId) {
      query.andWhere('sum.workspaceId = :workspaceId', { workspaceId });
    }

    query.groupBy('sum.date').orderBy('sum.date', 'ASC');
    const raw = await query.getRawMany();

    return raw.map(r => ({
      date: r.date,
      views: parseInt(r.views || '0', 10),
    }));
  }

  async getTopReports(workspaceId?: string, from?: string, to?: string, limit = 10): Promise<any[]> {
    const fromDate = from || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const toDate = to || format(new Date(), 'yyyy-MM-dd');

    const query = this.usageSummaryRepository
      .createQueryBuilder('sum')
      .select('sum.reportId', 'reportId')
      .addSelect('sum.reportName', 'name')
      .addSelect('SUM(sum.view_count)', 'views')
      .where('sum.date BETWEEN :from AND :to', { from: fromDate, to: toDate });

    if (workspaceId) {
      query.andWhere('sum.workspaceId = :workspaceId', { workspaceId });
    }

    query.groupBy('sum.reportId').addGroupBy('sum.reportName').orderBy('views', 'DESC').limit(limit);
    const raw = await query.getRawMany();

    return raw.map(r => ({
      reportId: r.reportId,
      name: r.name || 'Unknown Report',
      views: parseInt(r.views || '0', 10),
    }));
  }

  async getTopUsers(workspaceId?: string, from?: string, to?: string, limit = 10): Promise<any[]> {
    const fromDate = from || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const toDate = to || format(new Date(), 'yyyy-MM-dd');

    const query = this.usageSummaryRepository
      .createQueryBuilder('sum')
      .select('sum.userId', 'userId')
      .addSelect('sum.userEmail', 'email')
      .addSelect('SUM(sum.view_count)', 'views')
      .where('sum.date BETWEEN :from AND :to', { from: fromDate, to: toDate });

    if (workspaceId) {
      query.andWhere('sum.workspaceId = :workspaceId', { workspaceId });
    }

    query.groupBy('sum.userId').addGroupBy('sum.userEmail').orderBy('views', 'DESC').limit(limit);
    const raw = await query.getRawMany();

    return raw.map(r => ({
      userId: r.userId,
      email: r.email || r.userId,
      views: parseInt(r.views || '0', 10),
    }));
  }

  async getDuration(userId?: string, reportId?: string, from?: string, to?: string): Promise<any[]> {
    const fromDate = from || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const toDate = to || format(new Date(), 'yyyy-MM-dd');

    const query = this.usageSummaryRepository
      .createQueryBuilder('sum')
      .select('sum.date', 'date')
      .addSelect('SUM(sum.estimated_duration_sec)', 'durationSeconds')
      .where('sum.date BETWEEN :from AND :to', { from: fromDate, to: toDate });

    if (userId) {
      query.andWhere('sum.userId = :userId', { userId });
    }

    if (reportId) {
      query.andWhere('sum.reportId = :reportId', { reportId });
    }

    query.groupBy('sum.date').orderBy('sum.date', 'ASC');
    const raw = await query.getRawMany();

    return raw.map(r => ({
      date: r.date,
      durationSeconds: parseInt(r.durationSeconds || '0', 10),
    }));
  }

  async getUserTimeline(userId: string, from?: string, to?: string): Promise<PbiActivityEvent[]> {
    const fromDate = from || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const toDate = to || format(new Date(), 'yyyy-MM-dd');

    return this.activityEventRepository.find({
      where: {
        userId,
        creationTime: Between(startOfDay(parseISO(fromDate)), endOfDay(parseISO(toDate))),
      },
      order: { creationTime: 'DESC' },
    });
  }

  async getReportDetail(reportId: string, from?: string, to?: string): Promise<any[]> {
    const fromDate = from || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const toDate = to || format(new Date(), 'yyyy-MM-dd');

    const query = this.usageSummaryRepository
      .createQueryBuilder('sum')
      .select('sum.userEmail', 'email')
      .addSelect('sum.userId', 'userId')
      .addSelect('SUM(sum.view_count)', 'views')
      .addSelect('SUM(sum.estimated_duration_sec)', 'durationSeconds')
      .where('sum.reportId = :reportId', { reportId })
      .andWhere('sum.date BETWEEN :from AND :to', { from: fromDate, to: toDate })
      .groupBy('sum.userEmail')
      .addGroupBy('sum.userId');

    const raw = await query.getRawMany();
    return raw.map(r => ({
      userId: r.userId,
      email: r.email || r.userId,
      views: parseInt(r.views || '0', 10),
      durationSeconds: parseInt(r.durationSeconds || '0', 10),
    }));
  }

  async getWorkspaceSummary(from?: string, to?: string): Promise<any[]> {
    const fromDate = from || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const toDate = to || format(new Date(), 'yyyy-MM-dd');

    const query = this.usageSummaryRepository
      .createQueryBuilder('sum')
      .select('sum.workspaceId', 'workspaceId')
      .addSelect('sum.workspaceName', 'name')
      .addSelect('SUM(sum.view_count)', 'views')
      .addSelect('COUNT(DISTINCT sum.userId)', 'uniqueUsers')
      .addSelect('SUM(sum.estimated_duration_sec)', 'durationSeconds')
      .where('sum.date BETWEEN :from AND :to', { from: fromDate, to: toDate })
      .groupBy('sum.workspaceId')
      .addGroupBy('sum.workspaceName');

    const raw = await query.getRawMany();
    return raw.map(r => ({
      workspaceId: r.workspaceId,
      name: r.name || 'Unknown Workspace',
      views: parseInt(r.views || '0', 10),
      uniqueUsers: parseInt(r.uniqueUsers || '0', 10),
      durationSeconds: parseInt(r.durationSeconds || '0', 10),
    }));
  }
}
