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
var PowerBIMetricsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerBIMetricsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const powerbi_log_entity_1 = require("./entities/powerbi-log.entity");
const user_dashboard_entity_1 = require("../user-dashboard/entities/user-dashboard.entity");
let PowerBIMetricsService = PowerBIMetricsService_1 = class PowerBIMetricsService {
    constructor(httpService, configService, userDashboardRepository, powerbiLogRepository) {
        this.httpService = httpService;
        this.configService = configService;
        this.userDashboardRepository = userDashboardRepository;
        this.powerbiLogRepository = powerbiLogRepository;
        this.logger = new common_1.Logger(PowerBIMetricsService_1.name);
    }
    async getAccessToken() {
        const tenantId = this.configService.get('TENANT_ID');
        const clientId = this.configService.get('CLIENT_ID');
        const clientSecret = this.configService.get('CLIENT_SECRET');
        const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('scope', 'https://manage.office.com/.default');
        params.append('client_secret', clientSecret);
        params.append('grant_type', 'client_credentials');
        const response = await this.httpService.post(tokenEndpoint, params).toPromise();
        return response.data.access_token;
    }
    async ensureSubscription(accessToken) {
        const tenantId = this.configService.get('TENANT_ID');
        const baseUrl = `https://manage.office.com/api/v1.0/${tenantId}/activity/feed/subscriptions`;
        try {
            const { data: subscriptions } = await this.httpService.get(`${baseUrl}/list`, { headers: { Authorization: `Bearer ${accessToken}` } }).toPromise();
            if (subscriptions.includes('Audit.General'))
                return;
            await this.httpService.post(`${baseUrl}/start`, null, {
                params: { contentType: 'Audit.General' },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }).toPromise();
        }
        catch (error) {
            if (error.response?.data?.error?.code === 'AF20024')
                return;
            console.warn('Subscription check completed with warnings:', {
                status: error.response?.status,
                code: error.response?.data?.error?.code,
                message: error.response?.data?.error?.message || error.message
            });
        }
    }
    async getLogEntries(contentUri, accessToken) {
        const response = await this.httpService.get(contentUri, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }).toPromise();
        return response.data.filter(entry => entry.Workload === 'PowerBI');
    }
    async getWorkspaceMetrics(workspaceId, startDate, endDate) {
        const metrics = await this.getPowerBIMetrics(startDate, endDate);
        const allLogEntries = await this.getAllLogEntries(startDate, endDate);
        const workspace = metrics.workspaces.workspaces.find(w => w.id === workspaceId);
        const workspaceReports = metrics.reports.reports.filter(r => r.workspaceId === workspaceId);
        return {
            workspace: workspace || { id: workspaceId, name: 'Unknown', views: 0, uniqueViewers: 0 },
            reports: workspaceReports,
            totalReports: workspaceReports.length,
            totalViews: workspaceReports.reduce((total, report) => total + report.views, 0),
            uniqueViewers: [...new Set(allLogEntries
                    .filter(entry => entry.WorkspaceId === workspaceId && entry.Operation === 'ViewReport')
                    .map(entry => entry.UserId))].length
        };
    }
    async getReportMetrics(reportId, startDate, endDate) {
        const metrics = await this.getPowerBIMetrics(startDate, endDate);
        const allLogEntries = await this.getAllLogEntries(startDate, endDate);
        const report = metrics.reports.reports.find(r => r.id === reportId);
        if (!report) {
            return {
                report: { id: reportId, name: 'Unknown', views: 0, uniqueViewers: 0 },
                viewers: []
            };
        }
        const reportViewers = [...new Set(allLogEntries
                .filter(entry => entry.ReportId === reportId && entry.Operation === 'ViewReport')
                .map(entry => entry.UserId))];
        return {
            report,
            viewers: reportViewers,
            viewsByDay: this.getViewsByDay(reportId, startDate, endDate, allLogEntries)
        };
    }
    getViewsByDay(reportId, startDate, endDate, logEntries) {
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const result = [];
        for (let i = 0; i < days; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);
            const dateString = currentDate.toISOString().split('T')[0];
            const dailyViews = logEntries.filter(entry => entry.ReportId === reportId &&
                entry.Operation === 'ViewReport' &&
                entry.CreationTime.startsWith(dateString)).length;
            result.push({
                date: dateString,
                views: dailyViews
            });
        }
        return result;
    }
    processLogEntries(entries) {
        const users = [...new Set(entries.map(entry => entry.UserId))];
        const workspacesMap = new Map();
        const reportsMap = new Map();
        entries.forEach(entry => {
            if (entry.Operation === 'ViewReport' || entry.Operation === 'ViewDashboard') {
                if (entry.WorkspaceId) {
                    if (!workspacesMap.has(entry.WorkspaceId)) {
                        workspacesMap.set(entry.WorkspaceId, {
                            id: entry.WorkspaceId,
                            name: entry.WorkSpaceName || 'Unknown',
                            views: 0,
                            viewerSet: new Set()
                        });
                    }
                    const workspace = workspacesMap.get(entry.WorkspaceId);
                    workspace.views += 1;
                    workspace.viewerSet.add(entry.UserId);
                }
                if (entry.Operation === 'ViewReport' && entry.ReportId) {
                    if (!reportsMap.has(entry.ReportId)) {
                        reportsMap.set(entry.ReportId, {
                            id: entry.ReportId,
                            name: entry.ReportName || entry.ArtifactName || 'Unknown',
                            workspaceId: entry.WorkspaceId || 'Unknown',
                            workspaceName: entry.WorkSpaceName || 'Unknown',
                            views: 0,
                            viewerSet: new Set()
                        });
                    }
                    const report = reportsMap.get(entry.ReportId);
                    report.views += 1;
                    report.viewerSet.add(entry.UserId);
                }
            }
        });
        const workspaces = Array.from(workspacesMap.values()).map(workspace => ({
            id: workspace.id,
            name: workspace.name,
            views: workspace.views,
            uniqueViewers: workspace.viewerSet.size
        }));
        const reports = Array.from(reportsMap.values()).map(report => ({
            id: report.id,
            name: report.name,
            workspaceId: report.workspaceId,
            workspaceName: report.workspaceName,
            views: report.views,
            uniqueViewers: report.viewerSet.size
        }));
        return {
            uniqueUsers: {
                count: users.length,
                users
            },
            workspaces: {
                count: workspaces.length,
                workspaces
            },
            reports: {
                count: reports.length,
                reports
            }
        };
    }
    async getPowerBIMetrics(startDate, endDate) {
        const logs = await this.getLogsFromDatabase(startDate, endDate);
        const allUserIds = [...new Set(logs.map(log => log.UserId))];
        const allReportIds = [...new Set(logs
                .filter(log => log.ReportId)
                .map(log => log.ReportId))];
        const workspacesMap = new Map();
        const reportsMap = new Map();
        logs.forEach(entry => {
            if (entry.Operation === 'ViewReport' || entry.Operation === 'ViewDashboard') {
                if (entry.WorkspaceId) {
                    if (!workspacesMap.has(entry.WorkspaceId)) {
                        workspacesMap.set(entry.WorkspaceId, {
                            id: entry.WorkspaceId,
                            name: entry.WorkSpaceName || 'Unknown',
                            views: 0,
                            viewerSet: new Set()
                        });
                    }
                    const workspace = workspacesMap.get(entry.WorkspaceId);
                    workspace.views += 1;
                    workspace.viewerSet.add(entry.UserId);
                }
                if (entry.Operation === 'ViewReport' && entry.ReportId) {
                    if (!reportsMap.has(entry.ReportId)) {
                        reportsMap.set(entry.ReportId, {
                            id: entry.ReportId,
                            name: entry.ReportName || entry.ArtifactName || 'Unknown',
                            workspaceId: entry.WorkspaceId || 'Unknown',
                            workspaceName: entry.WorkSpaceName || 'Unknown',
                            views: 0,
                            viewerSet: new Set()
                        });
                    }
                    const report = reportsMap.get(entry.ReportId);
                    report.views += 1;
                    report.viewerSet.add(entry.UserId);
                }
            }
        });
        const workspaces = Array.from(workspacesMap.values()).map(workspace => ({
            id: workspace.id,
            name: workspace.name,
            views: workspace.views,
            uniqueViewers: workspace.viewerSet.size
        }));
        const reports = Array.from(reportsMap.values()).map(report => ({
            id: report.id,
            name: report.name,
            workspaceId: report.workspaceId,
            workspaceName: report.workspaceName,
            views: report.views,
            uniqueViewers: report.viewerSet.size
        }));
        return {
            uniqueUsers: {
                count: allUserIds.length,
                users: allUserIds
            },
            workspaces: {
                count: workspaces.length,
                workspaces
            },
            reports: {
                count: allReportIds.length,
                reports
            }
        };
    }
    async saveRawLogs(logs) {
        const entities = logs.map(log => this.powerbiLogRepository.create({
            id: log.Id,
            recordType: log.RecordType,
            creationTime: new Date(log.CreationTime),
            operation: log.Operation,
            organizationId: log.OrganizationId,
            userType: log.UserType,
            userKey: log.UserKey,
            workload: log.Workload,
            userId: log.UserId,
            clientIP: log.ClientIP,
            userAgent: log.UserAgent,
            activity: log.Activity,
            itemName: log.ItemName,
            workSpaceName: log.WorkSpaceName,
            datasetName: log.DatasetName,
            reportName: log.ReportName,
            capacityId: log.CapacityId,
            capacityName: log.CapacityName,
            workspaceId: log.WorkspaceId,
            objectId: log.ObjectId,
            datasetId: log.DatasetId,
            reportId: log.ReportId,
            artifactId: log.ArtifactId,
            artifactName: log.ArtifactName,
            isSuccess: log.IsSuccess,
            reportType: log.ReportType,
            requestId: log.RequestId,
            activityId: log.ActivityId,
            distributionMethod: log.DistributionMethod,
            consumptionMethod: log.ConsumptionMethod,
            artifactKind: log.ArtifactKind,
            refreshEnforcementPolicy: log.RefreshEnforcementPolicy,
            billingType: log.BillingType,
        }));
        await this.powerbiLogRepository.save(entities);
    }
    async getLogsFromDatabase(startDate, endDate) {
        const logs = await this.powerbiLogRepository.find({
            where: {
                creationTime: (0, typeorm_2.Between)(startDate, endDate),
                workload: 'PowerBI',
                operation: 'ViewReport',
            },
            order: {
                creationTime: 'ASC',
            },
        });
        return logs.map(log => ({
            Id: log.id,
            RecordType: log.recordType,
            CreationTime: log.creationTime.toISOString(),
            Operation: log.operation,
            OrganizationId: log.organizationId,
            UserType: log.userType,
            UserKey: log.userKey,
            Workload: log.workload,
            UserId: log.userId,
            ClientIP: log.clientIP,
            UserAgent: log.userAgent,
            Activity: log.activity,
            ItemName: log.itemName,
            WorkSpaceName: log.workSpaceName,
            DatasetName: log.datasetName,
            ReportName: log.reportName,
            CapacityId: log.capacityId,
            CapacityName: log.capacityName,
            WorkspaceId: log.workspaceId,
            ObjectId: log.objectId,
            DatasetId: log.datasetId,
            ReportId: log.reportId,
            ArtifactId: log.artifactId,
            ArtifactName: log.artifactName,
            IsSuccess: log.isSuccess,
            ReportType: log.reportType,
            RequestId: log.requestId,
            ActivityId: log.activityId,
            DistributionMethod: log.distributionMethod,
            ConsumptionMethod: log.consumptionMethod,
            ArtifactKind: log.artifactKind,
            RefreshEnforcementPolicy: log.refreshEnforcementPolicy,
            BillingType: log.billingType,
        }));
    }
    async fetchAndProcessLogs(contentUri, accessToken) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(contentUri, {
                headers: { Authorization: `Bearer ${accessToken}` }
            }));
            return response.data
                .filter(entry => entry.Workload === 'PowerBI' &&
                entry.Operation === 'ViewReport')
                .map(entry => ({
                Id: entry.Id,
                UserId: entry.UserId,
                CreationTime: entry.CreationTime,
                Operation: entry.Operation,
                WorkSpaceName: entry.WorkSpaceName,
                WorkspaceId: entry.WorkspaceId,
                ReportId: entry.ReportId,
                ReportName: entry.ReportName,
            }));
        }
        catch (error) {
            console.error(`Failed to process ${contentUri}:`, error.message);
            return [];
        }
    }
    emptyMetricsResponse() {
        return {
            uniqueUsers: { count: 0, users: [] },
            workspaces: { count: 0, workspaces: [] },
            reports: { count: 0, reports: [] }
        };
    }
    async getAllLogEntries(startDate, endDate) {
        const accessToken = await this.getAccessToken();
        await this.ensureSubscription(accessToken);
        const contentUris = await this.getContentUris(accessToken, startDate, endDate);
        const logPromises = contentUris.map(uri => this.getLogEntries(uri, accessToken));
        const logEntriesArrays = await Promise.all(logPromises);
        return logEntriesArrays.flat();
    }
    async getContentUris(accessToken, startDate, endDate) {
        const tenantId = this.configService.get('TENANT_ID');
        const formatDate = (date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');
        const endpoint = `https://manage.office.com/api/v1.0/${tenantId}/activity/feed/subscriptions/content` +
            `?contentType=Audit.General` +
            `&startTime=${formatDate(startDate)}` +
            `&endTime=${formatDate(endDate)}`;
        const response = await this.httpService.get(endpoint, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }).toPromise();
        return response.data.map(item => item.contentUri);
    }
    async collectDailyLogs() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const startDate = new Date(yesterday);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(yesterday);
        endDate.setHours(23, 59, 59, 999);
        this.logger.log(`Starting daily log collection for ${startDate.toISOString()} to ${endDate.toISOString()}`);
        try {
            const existingCount = await this.powerbiLogRepository.count({
                where: {
                    creationTime: (0, typeorm_2.Between)(startDate, endDate),
                    workload: 'PowerBI',
                    operation: 'ViewReport',
                },
            });
            if (existingCount > 0) {
                this.logger.warn(`Already have ${existingCount} logs for this date range, skipping collection`);
                return;
            }
            const accessToken = await this.getAccessToken();
            await this.ensureSubscription(accessToken);
            const contentUris = await this.getContentUris(accessToken, startDate, endDate);
            const allLogs = await Promise.all(contentUris.map(uri => this.getLogEntries(uri, accessToken)
                .catch(e => {
                this.logger.error(`Failed to process URI ${uri}: ${e.message}`);
                return [];
            })));
            const powerBILogs = allLogs.flat().filter(entry => entry.Workload === 'PowerBI' && entry.Operation === 'ViewReport');
            const newLogs = await this.filterExistingLogs(powerBILogs);
            if (newLogs.length > 0) {
                await this.saveRawLogs(newLogs);
                this.logger.log(`Successfully saved ${newLogs.length} new logs`);
            }
            else {
                this.logger.log('No new logs to save');
            }
        }
        catch (error) {
            this.logger.error('Failed to collect daily logs', error.stack);
        }
    }
    async filterExistingLogs(logs) {
        const existingIds = await this.powerbiLogRepository.find({
            where: {
                id: (0, typeorm_2.In)(logs.map(l => l.Id)),
            },
            select: ['id'],
        });
        const existingIdSet = new Set(existingIds.map(l => l.id));
        return logs.filter(log => !existingIdSet.has(log.Id));
    }
    async getDistinctWorkspaces(startDate, endDate, reportId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select('log.workspaceId', 'id')
            .addSelect('log.workSpaceName', 'name')
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere('log.workspaceId IS NOT NULL')
            .distinct(true);
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        const results = await query.getRawMany();
        return results.map(r => ({
            id: r.id,
            name: r.name || 'Unknown Workspace'
        }));
    }
    async getViewCountsByDate(startDate, endDate, workspaceId, reportId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .select(['log.creationTime']);
        if (workspaceId && workspaceId !== 'all') {
            query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
        }
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        const logs = await query.getMany();
        const counts = new Map();
        logs.forEach(log => {
            const colomboTime = new Date(log.creationTime.getTime() + (5 * 60 * 60 * 1000) + (30 * 60 * 1000));
            const dateKey = colomboTime.toISOString().split('T')[0];
            counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
        });
        return Array.from(counts.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    async getUserActivityTrend(startDate, endDate, workspaceId, reportId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .select(['log.creationTime', 'log.userId']);
        if (workspaceId && workspaceId !== 'all') {
            query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
        }
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        const logs = await query.getMany();
        const dailyActiveUsers = new Map();
        logs.forEach(log => {
            const colomboTime = new Date(log.creationTime.getTime() + (5 * 60 * 60 * 1000) + (30 * 60 * 1000));
            const dateKey = colomboTime.toISOString().split('T')[0];
            if (!dailyActiveUsers.has(dateKey)) {
                dailyActiveUsers.set(dateKey, new Set());
            }
            dailyActiveUsers.get(dateKey)?.add(log.userId);
        });
        return Array.from(dailyActiveUsers.entries())
            .map(([date, users]) => ({
            date,
            count: users.size
        }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    async getDistinctReports(startDate, endDate, workspaceId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select('log.reportId', 'id')
            .addSelect('log.reportName', 'name')
            .addSelect('log.workspaceId', 'workspaceId')
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere('log.reportId IS NOT NULL')
            .distinct(true);
        if (workspaceId && workspaceId !== 'all') {
            query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
        }
        const results = await query.getRawMany();
        return results.map(r => ({
            id: r.id,
            name: r.name || 'Unknown Report',
            workspaceId: r.workspaceId
        }));
    }
    async getTopReports(startDate, endDate, limit = 10, workspaceId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select("log.reportId", "reportId")
            .addSelect("log.reportName", "reportName")
            .addSelect("COUNT(*)", "count")
            .where("log.creationTime BETWEEN :startDate AND :endDate", { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere("log.reportId IS NOT NULL");
        if (workspaceId && workspaceId !== 'all') {
            query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
        }
        const results = await query
            .groupBy("log.reportId, log.reportName")
            .orderBy("COUNT(*)", "DESC")
            .limit(limit)
            .getRawMany();
        return results.map(r => ({
            reportId: r.reportId,
            reportName: r.reportName || 'Unknown Report',
            count: parseInt(r.count)
        }));
    }
    async getTopUsers(startDate, endDate, limit = 10, workspaceId, reportId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select("log.userId", "userId")
            .addSelect("COUNT(*)", "count")
            .where("log.creationTime BETWEEN :startDate AND :endDate", { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'");
        if (workspaceId && workspaceId !== 'all') {
            query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
        }
        if (reportId) {
            query.andWhere("log.reportId = :reportId", { reportId });
        }
        const results = await query
            .groupBy("log.userId")
            .orderBy("COUNT(*)", "DESC")
            .limit(limit)
            .getRawMany();
        return results.map(r => ({
            userId: r.userId,
            count: parseInt(r.count)
        }));
    }
    async getUserConsumptionMethods(userId, startDate, endDate) {
        const allLogs = await this.powerbiLogRepository.find({
            where: {
                userId,
                creationTime: (0, typeorm_2.Between)(startDate, endDate),
            },
            select: ['consumptionMethod', 'operation'],
        });
        console.log('All logs count:', allLogs.length);
        console.log('All operations:', [...new Set(allLogs.map(l => l.operation))]);
        const logs = allLogs.filter(log => log.operation === 'ViewReport');
        console.log('ViewReport logs count:', logs.length);
        console.log('Raw consumption methods from DB:', logs.map(l => ({
            value: l.consumptionMethod,
            type: typeof l.consumptionMethod,
            isNull: l.consumptionMethod === null,
            isUndefined: l.consumptionMethod === undefined,
            isEmptyString: l.consumptionMethod === '',
            isNullString: l.consumptionMethod === 'NULL',
        })));
        const strictNulls = logs.filter(log => log.consumptionMethod === null);
        const undefinedValues = logs.filter(log => log.consumptionMethod === undefined);
        const emptyStrings = logs.filter(log => typeof log.consumptionMethod === 'string' && log.consumptionMethod === '');
        const blankStrings = logs.filter(log => typeof log.consumptionMethod === 'string' && log.consumptionMethod.trim() === '' && log.consumptionMethod !== '');
        const nullStrings = logs.filter(log => typeof log.consumptionMethod === 'string' && log.consumptionMethod === 'NULL');
        console.log('Strict null values:', strictNulls.length);
        console.log('Undefined values:', undefinedValues.length);
        console.log('Empty strings:', emptyStrings.length);
        console.log('Blank strings (whitespace):', blankStrings.length);
        console.log('NULL string values:', nullStrings.length);
        const unusualValues = logs.filter(log => {
            const cm = log.consumptionMethod;
            return cm !== null &&
                typeof cm === 'string' &&
                cm !== '' &&
                cm !== 'NULL' &&
                !['Microsoft Teams', 'Power BI Web', 'Power BI Mobile', 'Export Report', 'PowerPoint add-in', 'Embedding for your organization'].includes(cm);
        });
        console.log('Unusual values:', unusualValues.map(l => l.consumptionMethod));
        const methodCounts = new Map();
        logs.forEach(log => {
            if (log.consumptionMethod === null ||
                log.consumptionMethod === undefined ||
                log.consumptionMethod === 'NULL' ||
                log.consumptionMethod === 'null' ||
                (typeof log.consumptionMethod === 'string' && log.consumptionMethod.trim() === '') ||
                (typeof log.consumptionMethod === 'object')) {
                console.log('Found null-like value:', log.consumptionMethod);
                methodCounts.set('Microsoft Teams', (methodCounts.get('Microsoft Teams') || 0) + 1);
            }
            else {
                methodCounts.set(log.consumptionMethod.trim(), (methodCounts.get(log.consumptionMethod.trim()) || 0) + 1);
            }
        });
        console.log('Method counts after processing:', Array.from(methodCounts.entries()));
        console.log('Microsoft Teams count:', methodCounts.get('Microsoft Teams') || 0);
        if ((strictNulls.length > 0 || undefinedValues.length > 0 || emptyStrings.length > 0 ||
            blankStrings.length > 0 || nullStrings.length > 0) && !methodCounts.has('Microsoft Teams')) {
            const nullLikeCount = strictNulls.length + undefinedValues.length + emptyStrings.length +
                blankStrings.length + nullStrings.length;
            console.log(`Forcing Microsoft Teams with ${nullLikeCount} nulls`);
            methodCounts.set('Microsoft Teams', nullLikeCount);
        }
        return Array.from(methodCounts.entries()).map(([method, count]) => ({
            method,
            count,
        }));
    }
    async getUniqueUserCount(startDate, endDate, workspaceId, reportId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select('COUNT(DISTINCT log.userId)', 'count')
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'");
        if (workspaceId && workspaceId !== 'all') {
            query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
        }
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        const result = await query.getRawOne();
        return parseInt(result?.count || 0);
    }
    async getUniqueReportCount(startDate, endDate, workspaceId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select('COUNT(DISTINCT log.reportId)', 'count')
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere('log.reportId IS NOT NULL');
        if (workspaceId && workspaceId !== 'all') {
            query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
        }
        const result = await query.getRawOne();
        return parseInt(result?.count || 0);
    }
    async getUserMetrics(userId, startDate, endDate, workspaceId, reportId) {
        try {
            const [totalViews, reports, workspaces, activityByDate] = await Promise.all([
                this.getUserTotalViews(userId, startDate, endDate, workspaceId, reportId),
                this.getUserReports(userId, startDate, endDate, workspaceId, reportId),
                this.getUserWorkspaces(userId, startDate, endDate, reportId),
                this.getUserActivityByDate(userId, startDate, endDate, workspaceId, reportId)
            ]);
            return {
                totalViews: totalViews || 0,
                reports: reports || [],
                workspaces: workspaces || [],
                activityByDate: activityByDate || []
            };
        }
        catch (error) {
            console.error('Error getting user metrics:', error);
            return {
                totalViews: 0,
                reports: [],
                workspaces: [],
                activityByDate: []
            };
        }
    }
    async getUserTotalViews(userId, startDate, endDate, workspaceId, reportId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .where('log.userId = :userId', { userId })
            .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'");
        if (workspaceId && workspaceId !== 'all') {
            query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
        }
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        return query.getCount();
    }
    async getUserReports(userId, startDate, endDate, workspaceId, reportId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select('log.reportId', 'reportId')
            .addSelect('log.reportName', 'reportName')
            .distinct(true)
            .where('log.userId = :userId', { userId })
            .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere('log.reportId IS NOT NULL');
        if (workspaceId && workspaceId !== 'all') {
            query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
        }
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        return query.getRawMany().catch(() => []);
    }
    async getUserWorkspaces(userId, startDate, endDate, reportId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select('log.workspaceId', 'workspaceId')
            .addSelect('log.workSpaceName', 'workspaceName')
            .distinct(true)
            .where('log.userId = :userId', { userId })
            .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere('log.workspaceId IS NOT NULL');
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        return query.getRawMany().catch(() => []);
    }
    async getUserActivityByDate(userId, startDate, endDate, workspaceId, reportId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .where('log.userId = :userId', { userId })
            .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .select(['log.creationTime']);
        if (workspaceId && workspaceId !== 'all') {
            query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
        }
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        const logs = await query.getMany();
        const dailyViews = new Map();
        logs.forEach(log => {
            const colomboTime = new Date(log.creationTime.getTime() + (5 * 60 * 60 * 1000) + (30 * 60 * 1000));
            const dateKey = colomboTime.toISOString().split('T')[0];
            dailyViews.set(dateKey, (dailyViews.get(dateKey) || 0) + 1);
        });
        return Array.from(dailyViews.entries())
            .map(([date, count]) => ({
            date,
            count
        }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    async getWorkspaceViewsDistribution(userId, startDate, endDate, reportId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select('log.workspaceId', 'workspaceId')
            .addSelect('log.workSpaceName', 'workspaceName')
            .addSelect('COUNT(*)', 'count')
            .where('log.userId = :userId', { userId })
            .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere('log.workspaceId IS NOT NULL');
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        const results = await query
            .groupBy('log.workspaceId, log.workSpaceName')
            .orderBy('COUNT(*)', 'DESC')
            .getRawMany();
        return results.map(r => ({
            workspaceId: r.workspaceId,
            workspaceName: r.workspaceName || 'Unknown Workspace',
            count: parseInt(r.count)
        }));
    }
};
exports.PowerBIMetricsService = PowerBIMetricsService;
exports.PowerBIMetricsService = PowerBIMetricsService = PowerBIMetricsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(user_dashboard_entity_1.UserDashboard)),
    __param(3, (0, typeorm_1.InjectRepository)(powerbi_log_entity_1.PowerBILog)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PowerBIMetricsService);
//# sourceMappingURL=powerbi-metrics.service.js.map