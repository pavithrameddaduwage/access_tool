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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngagementAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const date_fns_1 = require("date-fns");
const tracker_session_entity_1 = require("../tracking/entities/tracker-session.entity");
const component_view_count_entity_1 = require("../tracking/entities/component-view-count.entity");
const pbi_activity_event_entity_1 = require("../activity/entities/pbi-activity-event.entity");
const pbi_user_entity_1 = require("../users/entities/pbi-user.entity");
const analytics_query_dto_1 = require("./dto/analytics-query.dto");
const REPORT_OPS = {
    view: 'ViewReport',
    export: 'ExportReport',
    filter: 'FilterReport',
    share: 'ShareReport',
    print: 'PrintReport',
};
let EngagementAnalyticsService = class EngagementAnalyticsService {
    constructor(sessionRepo, viewRepo, activityRepo, userRepo) {
        this.sessionRepo = sessionRepo;
        this.viewRepo = viewRepo;
        this.activityRepo = activityRepo;
        this.userRepo = userRepo;
    }
    async getOverview(query) {
        const since = this.since(query);
        const agg = await this.sessionScope(query, since)
            .select('COUNT(DISTINCT s.user_id)', 'activeUsers')
            .addSelect('COALESCE(SUM(s.engaged_seconds), 0)', 'engagedSeconds')
            .getRawOne();
        const activeUsers = Number(agg?.activeUsers ?? 0);
        const engagedSeconds = Number(agg?.engagedSeconds ?? 0);
        const totalEngagedHours = +(engagedSeconds / 3600).toFixed(2);
        const avgEngagedMinPerUser = activeUsers > 0 ? +(engagedSeconds / 60 / activeUsers).toFixed(2) : 0;
        const topDash = await this.sessionScope(query, since)
            .select('s.dashboard_id', 'dashboardId')
            .addSelect('SUM(s.engaged_seconds)', 'engagedSeconds')
            .groupBy('s.dashboard_id')
            .orderBy('"engagedSeconds"', 'DESC')
            .limit(1)
            .getRawOne();
        const topReport = await this.viewScope(query, since)
            .select('v.component_id', 'componentId')
            .addSelect('MAX(v.component_name)', 'componentName')
            .addSelect('SUM(v.view_count)', 'views')
            .where('v.component_type = :t', { t: 'report' })
            .groupBy('v.component_id')
            .orderBy('"views"', 'DESC')
            .limit(1)
            .getRawOne();
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
    async getTopViews(query, type, limit = 20) {
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
        if (type)
            qb.andWhere('v.component_type = :type', { type });
        const rows = await qb.getRawMany();
        return rows.map((r) => ({
            componentId: r.componentId,
            componentName: r.componentName,
            componentType: r.componentType,
            totalViews: Number(r.totalViews),
            uniqueViewers: Number(r.uniqueViewers),
            lastViewedAt: r.lastViewedAt,
        }));
    }
    async getViewsByUser(userId, query) {
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
            .getRawMany();
        return rows.map((r) => ({
            componentId: r.componentId,
            componentName: r.componentName,
            componentType: r.componentType,
            viewCount: Number(r.viewCount),
            lastViewedAt: r.lastViewedAt,
        }));
    }
    async getViewsByComponent(type, id) {
        const rows = await this.viewRepo
            .createQueryBuilder('v')
            .select('v.user_id', 'userId')
            .addSelect('u.email', 'userEmail')
            .addSelect('v.view_count', 'viewCount')
            .addSelect('v.last_viewed_at', 'lastViewedAt')
            .addSelect(`COALESCE((
          SELECT SUM(s.engaged_seconds) FROM tracker_sessions s
          WHERE s.user_id = v.user_id AND s.dashboard_id = v.component_id
        ), 0)`, 'totalEngagedSeconds')
            .leftJoin(pbi_user_entity_1.PbiUser, 'u', 'u.user_id = v.user_id')
            .where('v.component_type = :type', { type })
            .andWhere('v.component_id = :id', { id })
            .orderBy('v.view_count', 'DESC')
            .getRawMany();
        return rows.map((r) => ({
            userId: r.userId,
            userEmail: r.userEmail,
            viewCount: Number(r.viewCount),
            lastViewedAt: r.lastViewedAt,
            totalEngagedSeconds: Number(r.totalEngagedSeconds),
        }));
    }
    async getUsers(query) {
        const since = this.since(query);
        const rows = await this.sessionScope(query, since)
            .select('s.user_id', 'userId')
            .addSelect('u.email', 'userEmail')
            .addSelect('MAX(s.department)', 'department')
            .addSelect('SUM(s.engaged_seconds)', 'totalEngagedSeconds')
            .addSelect('MAX(s.last_flush_at)', 'lastSeen')
            .addSelect('COUNT(s.id)', 'sessionCount')
            .addSelect(`COALESCE((
          SELECT SUM(v.view_count) FROM component_view_counts v WHERE v.user_id = s.user_id
        ), 0)`, 'totalViews')
            .leftJoin(pbi_user_entity_1.PbiUser, 'u', 'u.user_id = s.user_id')
            .groupBy('s.user_id')
            .addGroupBy('u.email')
            .orderBy('"totalEngagedSeconds"', 'DESC')
            .getRawMany();
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
    async getUserDetail(userId, query) {
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
            .getRawMany();
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
    async getDashboards(query) {
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
            .getRawMany();
        return rows.map((r) => ({
            dashboardId: r.dashboardId,
            engagedSeconds: Number(r.engagedSeconds),
            uniqueUsers: Number(r.uniqueUsers),
            visitCount: Number(r.visitCount),
            copyCount: Number(r.copyCount),
            scrollCount: Number(r.scrollCount),
        }));
    }
    async getReports(query) {
        const since = this.since(query);
        const count = (op) => `COUNT(*) FILTER (WHERE a.operation = '${op}')`;
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
        const rows = await qb.getRawMany();
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
    since(query) {
        return (0, date_fns_1.subDays)(new Date(), (0, analytics_query_dto_1.periodToDays)(query.period));
    }
    sessionScope(query, since) {
        const qb = this.sessionRepo
            .createQueryBuilder('s')
            .where('s.started_at >= :since', { since });
        if (query.department)
            qb.andWhere('s.department = :dept', { dept: query.department });
        return qb;
    }
    viewScope(query, since) {
        const qb = this.viewRepo
            .createQueryBuilder('v')
            .where('v.last_viewed_at >= :since', { since });
        this.applyDepartmentUserFilter(qb, 'v', query.department);
        return qb;
    }
    applyDepartmentUserFilter(qb, alias, department) {
        if (!department)
            return;
        qb.andWhere(`${alias}.user_id IN (
        SELECT DISTINCT s2.user_id FROM tracker_sessions s2 WHERE s2.department = :dept
      )`, { dept: department });
    }
};
exports.EngagementAnalyticsService = EngagementAnalyticsService;
exports.EngagementAnalyticsService = EngagementAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tracker_session_entity_1.TrackerSession)),
    __param(1, (0, typeorm_1.InjectRepository)(component_view_count_entity_1.ComponentViewCount)),
    __param(2, (0, typeorm_1.InjectRepository)(pbi_activity_event_entity_1.PbiActivityEvent)),
    __param(3, (0, typeorm_1.InjectRepository)(pbi_user_entity_1.PbiUser)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EngagementAnalyticsService);
//# sourceMappingURL=engagement-analytics.service.js.map