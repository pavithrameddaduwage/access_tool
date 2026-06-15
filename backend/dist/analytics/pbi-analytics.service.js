"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PbiAnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PbiAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pbi_session_entity_1 = require("./entities/pbi-session.entity");
const pbi_usage_summary_entity_1 = require("./entities/pbi-usage-summary.entity");
const pbi_activity_event_entity_1 = require("../activity/entities/pbi-activity-event.entity");
const pbi_workspace_entity_1 = require("../workspaces/entities/pbi-workspace.entity");
const pbi_report_entity_1 = require("../workspaces/entities/pbi-report.entity");
const pbi_user_entity_1 = require("../users/entities/pbi-user.entity");
const config_1 = require("@nestjs/config");
const date_fns_1 = require("date-fns");
let PbiAnalyticsService = PbiAnalyticsService_1 = class PbiAnalyticsService {
    constructor(sessionRepository, usageSummaryRepository, activityEventRepository, workspaceRepository, reportRepository, userRepository, configService) {
        this.sessionRepository = sessionRepository;
        this.usageSummaryRepository = usageSummaryRepository;
        this.activityEventRepository = activityEventRepository;
        this.workspaceRepository = workspaceRepository;
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.configService = configService;
        this.logger = new common_1.Logger(PbiAnalyticsService_1.name);
    }
    async calculateSessionsForDate(dateStr) {
        this.logger.log(`Running session calculation for date: ${dateStr}`);
        const idleTimeoutMin = parseInt(this.configService.get('IDLE_TIMEOUT_MINUTES', '30'), 10);
        const idleTimeoutSec = idleTimeoutMin * 60;
        const start = (0, date_fns_1.startOfDay)((0, date_fns_1.parseISO)(dateStr));
        const end = (0, date_fns_1.endOfDay)((0, date_fns_1.parseISO)(dateStr));
        const events = await this.activityEventRepository.find({
            where: {
                creationTime: (0, typeorm_2.Between)(start, end),
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
        const eventsByUser = {};
        for (const ev of events) {
            if (!eventsByUser[ev.userId]) {
                eventsByUser[ev.userId] = [];
            }
            eventsByUser[ev.userId].push(ev);
        }
        await this.sessionRepository.delete({ date: dateStr });
        const computedSessions = [];
        for (const [userId, userEvents] of Object.entries(eventsByUser)) {
            let currentSessionEvents = [userEvents[0]];
            for (let i = 1; i < userEvents.length; i++) {
                const prevEvent = userEvents[i - 1];
                const currEvent = userEvents[i];
                const prevTime = new Date(prevEvent.creationTime).getTime();
                const currTime = new Date(currEvent.creationTime).getTime();
                const gapSeconds = (currTime - prevTime) / 1000;
                if (gapSeconds > idleTimeoutSec) {
                    const session = this.createSessionFromEvents(currentSessionEvents, dateStr, idleTimeoutSec);
                    computedSessions.push(session);
                    currentSessionEvents = [currEvent];
                }
                else {
                    currentSessionEvents.push(currEvent);
                }
            }
            if (currentSessionEvents.length > 0) {
                const session = this.createSessionFromEvents(currentSessionEvents, dateStr, idleTimeoutSec);
                computedSessions.push(session);
            }
        }
        await this.sessionRepository.save(computedSessions);
        this.logger.log(`Saved ${computedSessions.length} computed sessions for date ${dateStr}`);
        await this.aggregateSummaryForDate(dateStr, computedSessions, events);
    }
    createSessionFromEvents(events, dateStr, idleTimeoutSec) {
        const session = new pbi_session_entity_1.PbiSession();
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
    async aggregateSummaryForDate(dateStr, sessions, events) {
        await this.usageSummaryRepository.delete({ date: dateStr });
        const summaryMap = {};
        for (const ev of events) {
            if (!ev.reportId)
                continue;
            const key = `${dateStr}_${ev.userId}_${ev.reportId}`;
            if (!summaryMap[key]) {
                summaryMap[key] = new pbi_usage_summary_entity_1.PbiUsageSummary();
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
            }
            else if (op === 'filterreport' || act === 'filterreport') {
                summaryMap[key].filterCount++;
            }
            else if (op === 'exportreport' || act === 'exportreport') {
                summaryMap[key].exportCount++;
            }
            else {
                summaryMap[key].viewCount++;
            }
        }
        for (const sess of sessions) {
            if (!sess.reportId)
                continue;
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
    async getOverview(from, to) {
        const fromDate = from || (0, date_fns_1.format)((0, date_fns_1.subDays)(new Date(), 30), 'yyyy-MM-dd');
        const toDate = to || (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
        const totalWorkspaces = await this.workspaceRepository.count();
        const totalReports = await this.reportRepository.count();
        const totalUsers = await this.userRepository.count();
        const monthStats = await this.usageSummaryRepository
            .createQueryBuilder('sum')
            .select('SUM(sum.view_count)', 'totalViews')
            .where('sum.date BETWEEN :from AND :to', { from: fromDate, to: toDate })
            .getRawOne();
        const todayStr = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
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
    async getViews(workspaceId, from, to) {
        const fromDate = from || (0, date_fns_1.format)((0, date_fns_1.subDays)(new Date(), 30), 'yyyy-MM-dd');
        const toDate = to || (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
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
    async getTopReports(workspaceId, from, to, limit = 10) {
        const fromDate = from || (0, date_fns_1.format)((0, date_fns_1.subDays)(new Date(), 30), 'yyyy-MM-dd');
        const toDate = to || (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
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
    async getTopUsers(workspaceId, from, to, limit = 10) {
        const fromDate = from || (0, date_fns_1.format)((0, date_fns_1.subDays)(new Date(), 30), 'yyyy-MM-dd');
        const toDate = to || (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
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
    async getDuration(userId, reportId, from, to) {
        const fromDate = from || (0, date_fns_1.format)((0, date_fns_1.subDays)(new Date(), 30), 'yyyy-MM-dd');
        const toDate = to || (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
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
    async getUserTimeline(userId, from, to) {
        const fromDate = from || (0, date_fns_1.format)((0, date_fns_1.subDays)(new Date(), 30), 'yyyy-MM-dd');
        const toDate = to || (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
        return this.activityEventRepository.find({
            where: {
                userId,
                creationTime: (0, typeorm_2.Between)((0, date_fns_1.startOfDay)((0, date_fns_1.parseISO)(fromDate)), (0, date_fns_1.endOfDay)((0, date_fns_1.parseISO)(toDate))),
            },
            order: { creationTime: 'DESC' },
        });
    }
    async getReportDetail(reportId, from, to) {
        const fromDate = from || (0, date_fns_1.format)((0, date_fns_1.subDays)(new Date(), 30), 'yyyy-MM-dd');
        const toDate = to || (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
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
    async getWorkspaceSummary(from, to) {
        const fromDate = from || (0, date_fns_1.format)((0, date_fns_1.subDays)(new Date(), 30), 'yyyy-MM-dd');
        const toDate = to || (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
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
};
exports.PbiAnalyticsService = PbiAnalyticsService;
exports.PbiAnalyticsService = PbiAnalyticsService = PbiAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pbi_session_entity_1.PbiSession)),
    __param(1, (0, typeorm_1.InjectRepository)(pbi_usage_summary_entity_1.PbiUsageSummary)),
    __param(2, (0, typeorm_1.InjectRepository)(pbi_activity_event_entity_1.PbiActivityEvent)),
    __param(3, (0, typeorm_1.InjectRepository)(pbi_workspace_entity_1.PbiWorkspace)),
    __param(4, (0, typeorm_1.InjectRepository)(pbi_report_entity_1.PbiReport)),
    __param(5, (0, typeorm_1.InjectRepository)(pbi_user_entity_1.PbiUser)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], PbiAnalyticsService);
//# sourceMappingURL=pbi-analytics.service.js.map