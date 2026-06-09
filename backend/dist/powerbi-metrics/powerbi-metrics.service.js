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
const powerbi_time_spent_entity_1 = require("./entities/powerbi-time-spent.entity");
const user_dashboard_entity_1 = require("../user-dashboard/entities/user-dashboard.entity");
const dashboard_entity_1 = require("../dashboard/entities/dashboard.entity");
const report_mapping_service_1 = require("../report-mapping/report-mapping.service");
const workspace_mapping_service_1 = require("../workspace-mapping/workspace-mapping.service");
const user_dashboard_service_1 = require("../user-dashboard/user-dashboard.service");
let PowerBIMetricsService = PowerBIMetricsService_1 = class PowerBIMetricsService {
    constructor(httpService, configService, userDashboardRepository, powerbiLogRepository, dashboardRepository, powerbiTimeSpentRepository, reportMappingService, workspaceMappingService, userDashboardService) {
        this.httpService = httpService;
        this.configService = configService;
        this.userDashboardRepository = userDashboardRepository;
        this.powerbiLogRepository = powerbiLogRepository;
        this.dashboardRepository = dashboardRepository;
        this.powerbiTimeSpentRepository = powerbiTimeSpentRepository;
        this.reportMappingService = reportMappingService;
        this.workspaceMappingService = workspaceMappingService;
        this.userDashboardService = userDashboardService;
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
        const allLogEntries = await this.getLogsFromDatabase(startDate, endDate);
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
        const allLogEntries = await this.getLogsFromDatabase(startDate, endDate);
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
    async processLogEntries(entries) {
        const users = [...new Set(entries.map(entry => entry.UserId))];
        const workspacesMap = new Map();
        const reportsMap = new Map();
        for (const entry of entries) {
            if (entry.Operation === 'ViewReport' || entry.Operation === 'ViewDashboard') {
                if (entry.WorkspaceId) {
                    await this.workspaceMappingService.findOrCreate(entry.WorkspaceId, entry.WorkSpaceName || 'Unknown');
                }
                if (entry.Operation === 'ViewReport' && entry.ReportId) {
                    await this.reportMappingService.findOrCreate(entry.ReportId, entry.ReportName || entry.ArtifactName || 'Unknown', entry.WorkspaceId);
                }
            }
        }
        for (const entry of entries) {
            if (entry.Operation === 'ViewReport' || entry.Operation === 'ViewDashboard') {
                if (entry.WorkspaceId) {
                    const workspaceDisplayName = await this.workspaceMappingService.getDisplayName(entry.WorkspaceId, entry.WorkSpaceName);
                    if (!workspacesMap.has(entry.WorkspaceId)) {
                        workspacesMap.set(entry.WorkspaceId, {
                            id: entry.WorkspaceId,
                            name: workspaceDisplayName,
                            views: 0,
                            viewerSet: new Set()
                        });
                    }
                    const workspace = workspacesMap.get(entry.WorkspaceId);
                    workspace.views += 1;
                    workspace.viewerSet.add(entry.UserId);
                }
                if (entry.Operation === 'ViewReport' && entry.ReportId) {
                    const reportDisplayName = await this.reportMappingService.getDisplayName(entry.ReportId, entry.ReportName || entry.ArtifactName);
                    const workspaceDisplayName = entry.WorkspaceId
                        ? await this.workspaceMappingService.getDisplayName(entry.WorkspaceId, entry.WorkSpaceName)
                        : 'Unknown';
                    if (!reportsMap.has(entry.ReportId)) {
                        reportsMap.set(entry.ReportId, {
                            id: entry.ReportId,
                            name: reportDisplayName,
                            workspaceId: entry.WorkspaceId || 'Unknown',
                            workspaceName: workspaceDisplayName,
                            views: 0,
                            viewerSet: new Set()
                        });
                    }
                    const report = reportsMap.get(entry.ReportId);
                    report.views += 1;
                    report.viewerSet.add(entry.UserId);
                }
            }
        }
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
        if (!logs || logs.length === 0) {
            return;
        }
        const uniqueIncomingMap = new Map();
        for (const log of logs) {
            if (log && log.Id) {
                uniqueIncomingMap.set(log.Id, log);
            }
        }
        const uniqueIncomingLogs = Array.from(uniqueIncomingMap.values());
        const filteredLogs = await this.filterExistingLogs(uniqueIncomingLogs);
        if (filteredLogs.length === 0) {
            this.logger.log('All logs are duplicates, skipping database insertion.');
            return;
        }
        const entities = filteredLogs.map(log => {
            const cleanedWorkspaceName = log.WorkSpaceName?.startsWith('PersonalWorkspace')
                ? 'PersonalWorkspace'
                : log.WorkSpaceName;
            return this.powerbiLogRepository.create({
                id: log.Id,
                recordType: log.RecordType,
                creationTime: new Date(log.CreationTime + 'Z'),
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
                workSpaceName: cleanedWorkspaceName,
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
            });
        });
        await this.powerbiLogRepository.save(entities);
        try {
            const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
            const DEFAULT_PAGE_VIEW_MS = 2 * 60 * 1000;
            const grouped = {};
            for (const l of filteredLogs) {
                const userId = (l.UserId || '').toLowerCase();
                const reportId = l.ReportId || '';
                if (!userId || !reportId)
                    continue;
                const key = `${userId}::${reportId}`;
                if (!grouped[key])
                    grouped[key] = [];
                grouped[key].push(l);
            }
            const aggregated = {};
            for (const key of Object.keys(grouped)) {
                const logsForKey = grouped[key].sort((a, b) => new Date(a.CreationTime).getTime() - new Date(b.CreationTime).getTime());
                for (let i = 0; i < logsForKey.length; i++) {
                    const cur = logsForKey[i];
                    const next = logsForKey[i + 1];
                    let durationMs = DEFAULT_PAGE_VIEW_MS;
                    if (next) {
                        const diff = new Date(next.CreationTime).getTime() - new Date(cur.CreationTime).getTime();
                        if (diff > 0 && diff <= SESSION_TIMEOUT_MS) {
                            durationMs = diff;
                        }
                    }
                    const tabName = cur.ArtifactName || cur.ItemName || cur.ReportName || 'Main Page';
                    const aggKey = `${(cur.UserId || '').toLowerCase()}::${cur.ReportId || ''}::${tabName}`;
                    if (!aggregated[aggKey]) {
                        aggregated[aggKey] = {
                            userId: (cur.UserId || '').toLowerCase(),
                            reportId: cur.ReportId || '',
                            reportName: cur.ReportName,
                            workspaceId: cur.WorkspaceId,
                            workspaceName: cur.WorkSpaceName,
                            tabName,
                            seconds: 0
                        };
                    }
                    aggregated[aggKey].seconds += Math.round(durationMs / 1000);
                }
            }
            const timeSpentEntries = Object.values(aggregated).filter(a => a.reportId && a.userId && a.seconds > 0);
            for (const entry of timeSpentEntries) {
                try {
                    await this.saveTimeSpent({
                        userId: entry.userId,
                        reportId: entry.reportId,
                        reportName: entry.reportName || 'Unknown Report',
                        workspaceId: entry.workspaceId,
                        workspaceName: entry.workspaceName,
                        tabName: entry.tabName,
                        durationSeconds: entry.seconds,
                    });
                }
                catch (err) {
                    this.logger.error('Failed to save inferred time-spent entry', err.stack);
                }
            }
            this.logger.log(`Persisted ${timeSpentEntries.length} inferred time-spent entries from logs.`);
        }
        catch (err) {
            this.logger.error('Failed to process raw logs into time-spent entries', err.stack);
        }
    }
    async getUserReportViewsDistribution(userId, startDate, endDate, workspaceId) {
        const edtStart = this.convertToEdtStartOfDay(startDate);
        const edtEnd = this.convertToEdtEndOfDay(endDate);
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select('log.reportId', 'reportId')
            .addSelect('log.reportName', 'originalReportName')
            .addSelect('log.workspaceId', 'workspaceId')
            .addSelect('log.workSpaceName', 'originalWorkspaceName')
            .addSelect('log.creationTime', 'creationTime')
            .where('log.userId = :userId', { userId })
            .andWhere('log.creationTime BETWEEN :startDate AND :endDate', {
            startDate: edtStart,
            endDate: edtEnd
        })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere('log.reportId IS NOT NULL');
        if (workspaceId) {
            if (workspaceId === '000000') {
                query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
            }
            else {
                query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
            }
        }
        const rawLogs = await query.getRawMany();
        const reportViews = new Map();
        for (const log of rawLogs) {
            const [reportName, workspaceName] = await Promise.all([
                this.reportMappingService.getDisplayName(log.reportId, log.originalReportName),
                this.workspaceMappingService.getDisplayName(log.workspaceId, log.originalWorkspaceName)
            ]);
            const key = log.reportId;
            if (!reportViews.has(key)) {
                reportViews.set(key, {
                    reportId: key,
                    reportName: reportName,
                    workspaceName: workspaceName,
                    count: 0
                });
            }
            reportViews.get(key).count += 1;
        }
        return Array.from(reportViews.values())
            .sort((a, b) => b.count - a.count);
    }
    convertToEdtStartOfDay(date) {
        const edtDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        edtDate.setHours(0, 0, 0, 0);
        return edtDate;
    }
    convertToEdtEndOfDay(date) {
        const edtDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        edtDate.setHours(23, 59, 59, 999);
        return edtDate;
    }
    getAllLogs() {
        return this.powerbiLogRepository.find();
    }
    async getLogsFromDatabase(startDate, endDate, workspaceId, reportId) {
        const query = this.powerbiLogRepository.createQueryBuilder('log')
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('log.workload = :workload', { workload: 'PowerBI' })
            .andWhere('log.operation = :operation', { operation: 'ViewReport' })
            .orderBy('log.creationTime', 'ASC');
        if (workspaceId) {
            query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
        }
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        const logs = await query.getMany();
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
    async getDatabaseLogEntries(startDate, endDate, workspaceId, reportId) {
        return this.getLogsFromDatabase(startDate, endDate, workspaceId, reportId);
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
    async getViewCountsByDate(startDate, endDate, workspaceId, reportId) {
        console.log("date time", startDate, endDate);
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .select(['log.creationTime']);
        if (workspaceId && workspaceId !== 'all') {
            if (workspaceId === '000000') {
                query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
            }
            else {
                query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
            }
        }
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        const logs = await query.getMany();
        const counts = new Map();
        logs.forEach(log => {
            const utcDate = new Date(log.creationTime);
            const options = { timeZone: 'America/New_York' };
            const edtDateString = utcDate.toLocaleDateString('en-US', options);
            const edtDateParts = edtDateString.split('/');
            const dateKey = `${edtDateParts[2]}-${edtDateParts[0].padStart(2, '0')}-${edtDateParts[1].padStart(2, '0')}`;
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
        if (workspaceId) {
            if (workspaceId === '000000') {
                query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
            }
            else {
                query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
            }
        }
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        const logs = await query.getMany();
        const dailyActiveUsers = new Map();
        logs.forEach(log => {
            const utcDate = new Date(log.creationTime);
            const options = { timeZone: 'America/New_York' };
            const edtDateString = utcDate.toLocaleDateString('en-US', options);
            const edtDateParts = edtDateString.split('/');
            const dateKey = `${edtDateParts[2]}-${edtDateParts[0].padStart(2, '0')}-${edtDateParts[1].padStart(2, '0')}`;
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
    async getTopUsers(startDate, endDate, limit = 10, workspaceId, reportId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select("log.userId", "userId")
            .addSelect("COUNT(*)", "count")
            .where("log.creationTime BETWEEN :startDate AND :endDate", { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'");
        if (workspaceId && workspaceId !== 'all') {
            if (workspaceId === '000000') {
                query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
            }
            else {
                query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
            }
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
        const logs = allLogs.filter(log => log.operation === 'ViewReport');
        const strictNulls = logs.filter(log => log.consumptionMethod === null);
        const undefinedValues = logs.filter(log => log.consumptionMethod === undefined);
        const emptyStrings = logs.filter(log => typeof log.consumptionMethod === 'string' && log.consumptionMethod === '');
        const blankStrings = logs.filter(log => typeof log.consumptionMethod === 'string' && log.consumptionMethod.trim() === '' && log.consumptionMethod !== '');
        const nullStrings = logs.filter(log => typeof log.consumptionMethod === 'string' && log.consumptionMethod === 'NULL');
        const unusualValues = logs.filter(log => {
            const cm = log.consumptionMethod;
            return cm !== null &&
                typeof cm === 'string' &&
                cm !== '' &&
                cm !== 'NULL' &&
                !['Microsoft Teams', 'Power BI Web', 'Power BI Mobile', 'Export Report', 'PowerPoint add-in', 'Embedding for your organization'].includes(cm);
        });
        const methodCounts = new Map();
        logs.forEach(log => {
            if (log.consumptionMethod === null ||
                log.consumptionMethod === undefined ||
                log.consumptionMethod === 'NULL' ||
                log.consumptionMethod === 'null' ||
                (typeof log.consumptionMethod === 'string' && log.consumptionMethod.trim() === '') ||
                (typeof log.consumptionMethod === 'object')) {
                methodCounts.set('Microsoft Teams', (methodCounts.get('Microsoft Teams') || 0) + 1);
            }
            else {
                methodCounts.set(log.consumptionMethod.trim(), (methodCounts.get(log.consumptionMethod.trim()) || 0) + 1);
            }
        });
        if ((strictNulls.length > 0 || undefinedValues.length > 0 || emptyStrings.length > 0 ||
            blankStrings.length > 0 || nullStrings.length > 0) && !methodCounts.has('Microsoft Teams')) {
            const nullLikeCount = strictNulls.length + undefinedValues.length + emptyStrings.length +
                blankStrings.length + nullStrings.length;
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
        if (workspaceId) {
            if (workspaceId === '000000') {
                query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
            }
            else {
                query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
            }
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
        if (workspaceId) {
            if (workspaceId === '000000') {
                query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
            }
            else {
                query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
            }
        }
        const result = await query.getRawOne();
        return parseInt(result?.count || 0);
    }
    async getUserMetrics(userId, startDate, endDate, workspaceId, reportId) {
        try {
            const [totalViews, rawReports, rawWorkspaces, activityByDate, estimatedTimeSpent, userAssignments] = await Promise.all([
                this.getUserTotalViews(userId, startDate, endDate, workspaceId, reportId),
                this.getUserReports(userId, startDate, endDate, workspaceId, reportId),
                this.getUserWorkspaces(userId, startDate, endDate, reportId),
                this.getUserActivityByDate(userId, startDate, endDate, workspaceId, reportId),
                this.getUserEstimatedTimeSpent(userId, startDate, endDate, workspaceId, reportId),
                this.userDashboardRepository.find({
                    where: { email: userId, isActive: true },
                    relations: ['dashboard']
                })
            ]);
            const [reports, workspaces] = await Promise.all([
                Promise.all(rawReports.map(async (r) => ({
                    reportId: r.reportId,
                    reportName: await this.reportMappingService.getDisplayName(r.reportId, r.reportName)
                }))),
                Promise.all(rawWorkspaces.map(async (w) => ({
                    workspaceId: w.workspaceId,
                    workspaceName: await this.workspaceMappingService.getDisplayName(w.workspaceId, w.workspaceName)
                })))
            ]);
            return {
                totalViews: totalViews || 0,
                reports: reports || [],
                workspaces: workspaces || [],
                activityByDate: activityByDate || [],
                assignedDashboards: userAssignments.map(ua => ua.dashboard?.dashboard).filter(Boolean) || [],
                estimatedTimeSpent: estimatedTimeSpent || 0
            };
        }
        catch (error) {
            return {
                totalViews: 0,
                reports: [],
                workspaces: [],
                activityByDate: [],
                assignedDashboards: [],
                estimatedTimeSpent: 0
            };
        }
    }
    async getUserEstimatedTimeSpent(userId, startDate, endDate, workspaceId, reportId) {
        try {
            const preciseQuery = this.powerbiTimeSpentRepository
                .createQueryBuilder('spent')
                .select('SUM(spent.durationSeconds)', 'totalSeconds')
                .where('LOWER(spent.userId) = LOWER(:userId)', { userId })
                .andWhere('spent.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });
            if (workspaceId) {
                preciseQuery.andWhere('spent.workspaceId = :workspaceId', { workspaceId });
            }
            if (reportId) {
                preciseQuery.andWhere('spent.reportId = :reportId', { reportId });
            }
            const preciseResult = await preciseQuery.getRawOne();
            const preciseSeconds = parseInt(preciseResult?.totalSeconds || '0', 10);
            if (preciseSeconds > 0) {
                return preciseSeconds;
            }
            const query = this.powerbiLogRepository
                .createQueryBuilder('log')
                .where('log.userId = :userId', { userId })
                .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
                .andWhere("log.operation = 'ViewReport'")
                .orderBy('log.creationTime', 'ASC');
            if (workspaceId) {
                if (workspaceId === '000000') {
                    query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
                }
                else {
                    query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
                }
            }
            if (reportId) {
                query.andWhere('log.reportId = :reportId', { reportId });
            }
            const logs = await query.getMany();
            if (logs.length === 0) {
                return 0;
            }
            if (logs.length === 1) {
                return 120;
            }
            let totalDurationSeconds = 0;
            const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
            const DEFAULT_PAGE_VIEW_MS = 2 * 60 * 1000;
            for (let i = 0; i < logs.length - 1; i++) {
                const currentLogTime = new Date(logs[i].creationTime).getTime();
                const nextLogTime = new Date(logs[i + 1].creationTime).getTime();
                const diff = nextLogTime - currentLogTime;
                if (diff > 0 && diff <= SESSION_TIMEOUT_MS) {
                    totalDurationSeconds += diff / 1000;
                }
                else {
                    totalDurationSeconds += DEFAULT_PAGE_VIEW_MS / 1000;
                }
            }
            totalDurationSeconds += DEFAULT_PAGE_VIEW_MS / 1000;
            return Math.round(totalDurationSeconds);
        }
        catch (error) {
            return 0;
        }
    }
    async getUserTotalViews(userId, startDate, endDate, workspaceId, reportId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .where('log.userId = :userId', { userId })
            .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'");
        if (workspaceId) {
            if (workspaceId === '000000') {
                query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
            }
            else {
                query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
            }
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
        if (workspaceId) {
            if (workspaceId === '000000') {
                query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
            }
            else {
                query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
            }
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
        if (workspaceId) {
            if (workspaceId === '000000') {
                query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
            }
            else {
                query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
            }
        }
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        const logs = await query.getMany();
        const dailyViews = new Map();
        logs.forEach(log => {
            const utcDate = new Date(log.creationTime);
            const options = { timeZone: 'America/New_York' };
            const edtDateString = utcDate.toLocaleDateString('en-US', options);
            const edtDateParts = edtDateString.split('/');
            const dateKey = `${edtDateParts[2]}-${edtDateParts[0].padStart(2, '0')}-${edtDateParts[1].padStart(2, '0')}`;
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
            .addSelect('log.workSpaceName', 'originalName')
            .addSelect('log.creationTime', 'creationTime')
            .where('log.userId = :userId', { userId })
            .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere('log.workspaceId IS NOT NULL');
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        const rawLogs = await query.getRawMany();
        const workspaceCounts = new Map();
        for (const log of rawLogs) {
            const utcDate = new Date(log.creationTime);
            const options = { timeZone: 'America/New_York' };
            const edtDateString = utcDate.toLocaleDateString('en-US', options);
            const edtDateParts = edtDateString.split('/');
            const displayName = await this.workspaceMappingService.getDisplayName(log.workspaceId, log.originalName);
            if (!workspaceCounts.has(log.workspaceId)) {
                workspaceCounts.set(log.workspaceId, {
                    workspaceId: log.workspaceId,
                    workspaceName: displayName,
                    count: 0
                });
            }
            workspaceCounts.get(log.workspaceId).count += 1;
        }
        return Array.from(workspaceCounts.values())
            .sort((a, b) => b.count - a.count);
    }
    normalizeWorkspaceName(name) {
        if (name.startsWith('PersonalWorkspace')) {
            return 'PersonalWorkspace';
        }
        return name;
    }
    async getUnusedReports(startDate, endDate, workspaceId) {
        const viewedReports = await this.powerbiLogRepository
            .createQueryBuilder('log')
            .select('log.reportName', 'reportName')
            .addSelect('log.creationTime', 'creationTime')
            .distinct(true)
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere('log.reportName IS NOT NULL');
        if (workspaceId && workspaceId !== 'all') {
            viewedReports.andWhere('log.workspaceId = :workspaceId', { workspaceId });
        }
        const rawLogs = await viewedReports.getRawMany();
        const viewedReportNames = new Set();
        rawLogs.forEach(log => {
            const utcDate = new Date(log.creationTime);
            const options = { timeZone: 'America/New_York' };
            const edtDate = new Date(utcDate.toLocaleString('en-US', options));
            if (log.reportName && log.reportName.trim() !== '') {
                viewedReportNames.add(log.reportName.toLowerCase().trim());
            }
        });
        const viewedReportNamesArray = Array.from(viewedReportNames);
        const query = this.dashboardRepository
            .createQueryBuilder('dashboard')
            .select(['dashboard.id', 'dashboard.dashboard', 'dashboard.groupId'])
            .where('dashboard.dashboard IS NOT NULL');
        if (viewedReportNamesArray.length > 0) {
            query.andWhere('LOWER(TRIM(dashboard.dashboard)) NOT IN (:...viewedReportNames)', {
                viewedReportNames: viewedReportNamesArray
            });
        }
        return query.getMany();
    }
    async getDistinctWorkspaces(startDate, endDate, reportId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select('log.workspaceId', 'id')
            .addSelect('log.workSpaceName', 'originalName')
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere('log.workspaceId IS NOT NULL')
            .distinct(true);
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        const results = await query.getRawMany();
        const workspaceMap = new Map();
        for (const result of results) {
            const workspaceId = result.id;
            const originalName = result.originalName;
            if (originalName === 'PersonalWorkspace') {
                workspaceMap.set('PersonalWorkspace', {
                    id: '000000',
                    name: 'Personal Workspace'
                });
                continue;
            }
            const displayName = await this.workspaceMappingService.getDisplayName(workspaceId, originalName);
            workspaceMap.set(workspaceId, {
                id: workspaceId,
                name: displayName
            });
        }
        return Array.from(workspaceMap.values());
    }
    async getDistinctReports(startDate, endDate, workspaceId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select('log.reportId', 'id')
            .addSelect('log.reportName', 'originalName')
            .addSelect('log.workspaceId', 'workspaceId')
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere('log.reportId IS NOT NULL')
            .distinct(true);
        if (workspaceId) {
            if (workspaceId === '000000') {
                query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
            }
            else {
                query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
            }
        }
        const results = await query.getRawMany();
        const reports = [];
        for (const result of results) {
            const displayName = await this.reportMappingService.getDisplayName(result.id, result.originalName);
            reports.push({
                id: result.id,
                name: displayName,
                workspaceId: result.workspaceId
            });
        }
        return reports;
    }
    async getTopReports(startDate, endDate, limit = 10, workspaceId) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select("log.reportId", "reportId")
            .addSelect("log.reportName", "originalName")
            .addSelect("COUNT(*)", "count")
            .where("log.creationTime BETWEEN :startDate AND :endDate", { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere("log.reportId IS NOT NULL");
        if (workspaceId && workspaceId !== 'all') {
            if (workspaceId === '000000') {
                query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
            }
            else {
                query.andWhere("log.workspaceId = :workspaceId", { workspaceId });
            }
        }
        const results = await query
            .groupBy("log.reportId, log.reportName")
            .orderBy("COUNT(*)", "DESC")
            .limit(limit)
            .getRawMany();
        const mappedResults = [];
        for (const result of results) {
            const displayName = await this.reportMappingService.getDisplayName(result.reportId, result.originalName);
            mappedResults.push({
                reportId: result.reportId,
                reportName: displayName,
                count: parseInt(result.count)
            });
        }
        return mappedResults;
    }
    async getUserCounts(startDate, endDate, workspaceId, reportId) {
        let workspaceName;
        let reportName;
        if (workspaceId && workspaceId !== 'all') {
            workspaceName = await this.workspaceMappingService.getDisplayName(workspaceId);
        }
        if (reportId) {
            reportName = await this.reportMappingService.getDisplayName(reportId);
        }
        const permittedUsers = await this.userDashboardService.getPermittedUsers(workspaceName, reportName);
        const totalUsers = permittedUsers.length;
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .select('log.userId', 'userId')
            .addSelect('COUNT(*)', 'count')
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .groupBy('log.userId');
        if (workspaceId && workspaceId !== 'all') {
            if (workspaceId === '000000') {
                query.andWhere("log.workSpaceName = 'PersonalWorkspace'");
            }
            else {
                query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
            }
        }
        if (reportId) {
            query.andWhere('log.reportId = :reportId', { reportId });
        }
        const activeUsers = await query.getRawMany();
        const totalViews = activeUsers.reduce((sum, user) => sum + parseInt(user.count), 0);
        const activeUserIds = activeUsers.map(u => u.userId);
        const zeroViewUsers = permittedUsers.filter(email => !activeUserIds.includes(email)).length;
        const lowActivityUsers = activeUsers.filter(u => parseInt(u.count) < 5).length;
        const deactivatedUsers = await this.userDashboardService.getLastDeactivatedUsers(5);
        const userEmails = deactivatedUsers.map(u => u.email);
        let nameMappings = {};
        if (userEmails.length > 0) {
            try {
                const nameResponse = await this.getUserNameMappings(userEmails);
                nameMappings = nameResponse?.names || {};
            }
            catch (error) {
                console.warn('Failed to get name mappings:', error);
            }
        }
        return {
            totalUsers,
            totalViews,
            zeroViewUsers,
            lowActivityUsers,
            deactivatedUsers: deactivatedUsers.length,
            lastDeactivatedUsers: deactivatedUsers.map(u => ({
                email: u.email,
                name: nameMappings[u.email] || u.email.split('@')[0],
                department: u.department || 'Unknown',
                deactivatedAt: u.lastActiveAt
            }))
        };
    }
    async getUserNameMappings(emails) {
        if (!emails || emails.length === 0) {
            return {
                names: {},
                departments: {}
            };
        }
        const users = await this.userDashboardRepository
            .createQueryBuilder('user')
            .where('user.email IN (:...emails)', { emails })
            .select(['user.email', 'user.userName', 'user.department'])
            .getRawMany();
        const nameMap = {};
        const departmentMap = {};
        users.forEach(user => {
            if (user.user_email) {
                nameMap[user.user_email] = user.user_userName || user.user_email.split('@')[0];
                departmentMap[user.user_email] = user.user_department || 'Unknown';
            }
        });
        return {
            names: nameMap,
            departments: departmentMap,
        };
    }
    async syncMappingsToMasterData() {
        try {
            this.logger.log('Starting Workspace/Dashboard mappings to Master Data sync...');
            const manager = this.dashboardRepository.manager;
            const workspaceMappings = await manager.query('SELECT * FROM workspace_mapping');
            const reportMappings = await manager.query('SELECT * FROM report_mapping');
            const workspaceNameToId = {};
            for (const wm of workspaceMappings) {
                const name = (wm.displayName || wm.originalName || '').trim();
                if (!name)
                    continue;
                const existing = await manager.query('SELECT id FROM workspace WHERE LOWER(workspace) = LOWER($1)', [name]);
                let workspaceId;
                if (existing && existing.length > 0) {
                    workspaceId = existing[0].id;
                }
                else {
                    try {
                        const insertRes = await manager.query('INSERT INTO workspace (workspace) VALUES ($1) ON CONFLICT (workspace) DO UPDATE SET workspace = EXCLUDED.workspace RETURNING id', [name]);
                        workspaceId = insertRes[0].id;
                    }
                    catch (insertErr) {
                        const fallback = await manager.query('SELECT id FROM workspace WHERE LOWER(workspace) = LOWER($1)', [name]);
                        workspaceId = fallback[0]?.id;
                    }
                }
                workspaceNameToId[wm.workspaceId] = workspaceId;
            }
            for (const rm of reportMappings) {
                const name = (rm.displayName || rm.originalName || '').trim();
                if (!name)
                    continue;
                const existingDashboard = await manager.query('SELECT id FROM dashboard WHERE LOWER(dashboard) = LOWER($1)', [name]);
                let dashboardId;
                if (existingDashboard && existingDashboard.length > 0) {
                    dashboardId = existingDashboard[0].id;
                }
                else {
                    try {
                        const insertRes = await manager.query('INSERT INTO dashboard (dashboard, "groupId") VALUES ($1, NULL) ON CONFLICT (dashboard) DO UPDATE SET dashboard = EXCLUDED.dashboard RETURNING id', [name]);
                        dashboardId = insertRes[0].id;
                    }
                    catch (insertErr) {
                        const fallback = await manager.query('SELECT id FROM dashboard WHERE LOWER(dashboard) = LOWER($1)', [name]);
                        dashboardId = fallback[0]?.id;
                    }
                }
                const dbWorkspaceId = workspaceNameToId[rm.workspaceId];
                if (dbWorkspaceId && dashboardId) {
                    const existingLink = await manager.query('SELECT id FROM dashboard_workspace WHERE "workspaceId" = $1 AND "dashboardId" = $2', [dbWorkspaceId, dashboardId]);
                    if (!existingLink || existingLink.length === 0) {
                        await manager.query('INSERT INTO dashboard_workspace ("workspaceId", "dashboardId") VALUES ($1, $2) ON CONFLICT DO NOTHING', [dbWorkspaceId, dashboardId]);
                    }
                }
            }
            this.logger.log('Workspace/Dashboard mappings successfully synced to Master Data.');
        }
        catch (err) {
            this.logger.error('Failed to sync mappings to Master Data', err.stack);
        }
    }
    async syncUsersFromLogs() {
        try {
            this.logger.log('Starting User roster sync from Power BI logs...');
            const manager = this.dashboardRepository.manager;
            const res = await manager.query('SELECT DISTINCT "userId" FROM power_bi_log WHERE "userId" IS NOT NULL');
            const emails = res.map(r => r.userId.toLowerCase());
            if (emails.length === 0)
                return;
            let roleRes = await manager.query("SELECT id FROM role_master WHERE role = 'Viewer'");
            let viewerRoleId;
            if (roleRes.length > 0) {
                viewerRoleId = roleRes[0].id;
            }
            else {
                const insertRole = await manager.query("INSERT INTO role_master (role) VALUES ('Viewer') RETURNING id");
                viewerRoleId = insertRole[0].id;
            }
            let newUsersCount = 0;
            for (const email of emails) {
                const userRes = await manager.query('SELECT id FROM "user" WHERE email = $1', [email]);
                if (userRes.length === 0) {
                    const name = email.split('@')[0];
                    const insertUser = await manager.query('INSERT INTO "user" (email, name, is_active) VALUES ($1, $2, true) RETURNING id', [email, name]);
                    const userId = insertUser[0].id;
                    await manager.query('INSERT INTO user_roles ("userId", "roleId") VALUES ($1, $2)', [userId, viewerRoleId]);
                    newUsersCount++;
                }
            }
            this.logger.log(`User roster sync complete. Added ${newUsersCount} new users from logs.`);
        }
        catch (err) {
            this.logger.error('Failed to sync users from logs', err.stack);
        }
    }
    async saveTimeSpent(data) {
        const entity = this.powerbiTimeSpentRepository.create({
            userId: data.userId.toLowerCase(),
            reportId: data.reportId,
            reportName: data.reportName,
            workspaceId: data.workspaceId,
            workspaceName: data.workspaceName,
            tabName: data.tabName,
            durationSeconds: data.durationSeconds,
            timestamp: new Date()
        });
        return this.powerbiTimeSpentRepository.save(entity);
    }
    async getUserTimeSpentDistribution(userId, startDate, endDate) {
        const query = this.powerbiTimeSpentRepository
            .createQueryBuilder('spent')
            .select('spent.reportId', 'reportId')
            .addSelect('spent.reportName', 'reportName')
            .addSelect('spent.workspaceId', 'workspaceId')
            .addSelect('spent.workspaceName', 'workspaceName')
            .addSelect('spent.tabName', 'tabName')
            .addSelect('SUM(spent.durationSeconds)', 'totalSeconds')
            .where('LOWER(spent.userId) = LOWER(:userId)', { userId })
            .andWhere('spent.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
            .groupBy('spent.reportId, spent.reportName, spent.workspaceId, spent.workspaceName, spent.tabName')
            .orderBy('SUM(spent.durationSeconds)', 'DESC');
        const results = await query.getRawMany();
        if (results.length === 0) {
            const logQuery = this.powerbiLogRepository
                .createQueryBuilder('log')
                .select('log.reportId', 'reportId')
                .addSelect('log.reportName', 'reportName')
                .addSelect('log.workspaceId', 'workspaceId')
                .addSelect('log.workSpaceName', 'workspaceName')
                .addSelect('COUNT(log.id) * 120', 'totalSeconds')
                .where('LOWER(log.userId) = LOWER(:userId)', { userId })
                .andWhere('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
                .andWhere("log.operation = 'ViewReport'")
                .groupBy('log.reportId, log.reportName, log.workspaceId, log.workSpaceName')
                .orderBy('COUNT(log.id)', 'DESC');
            const fallbackLogs = await logQuery.getRawMany();
            return fallbackLogs.map(r => ({
                reportId: r.reportId,
                reportName: r.reportName || 'Unknown Report',
                workspaceId: r.workspaceId || 'Unknown',
                workspaceName: r.workspaceName === 'PersonalWorkspace' ? 'Personal Workspace' : (r.workspaceName || 'Personal Workspace'),
                tabName: 'Overview',
                totalSeconds: parseInt(r.totalSeconds || '0', 10)
            }));
        }
        return results.map(r => ({
            reportId: r.reportId,
            reportName: r.reportName || 'Unknown Report',
            workspaceId: r.workspaceId || 'Unknown',
            workspaceName: r.workspaceName || 'Personal Workspace',
            tabName: r.tabName || 'Overview',
            totalSeconds: parseInt(r.totalSeconds || '0', 10)
        }));
    }
    async getTotalTimeSpentForUser(userId, startDate, endDate) {
        const query = this.powerbiTimeSpentRepository
            .createQueryBuilder('spent')
            .select('SUM(spent.durationSeconds)', 'totalSeconds')
            .where('LOWER(spent.userId) = LOWER(:userId)', { userId })
            .andWhere('spent.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });
        const result = await query.getRawOne();
        return parseInt(result?.totalSeconds || '0', 10);
    }
    async getLastRefreshTime() {
        try {
            const latestLog = await this.powerbiLogRepository.findOne({
                where: {},
                order: { storedAt: 'DESC' }
            });
            return { lastRefreshedAt: latestLog ? latestLog.storedAt : new Date() };
        }
        catch (e) {
            return { lastRefreshedAt: new Date() };
        }
    }
    async getDashboardUsage(dashboardName, workspaceId, startDate, endDate) {
        const query = this.powerbiLogRepository
            .createQueryBuilder('log')
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'")
            .andWhere("(LOWER(log.reportName) LIKE LOWER(:name) OR LOWER(log.artifactName) LIKE LOWER(:name) OR LOWER(log.itemName) LIKE LOWER(:name))", { name: `%${dashboardName.trim()}%` });
        if (workspaceId && workspaceId !== 'all') {
            query.andWhere('log.workspaceId = :workspaceId', { workspaceId });
        }
        const logs = await query.getMany();
        const userMap = new Map();
        const reportMap = new Map();
        logs.forEach(log => {
            if (!userMap.has(log.userId)) {
                userMap.set(log.userId, { userId: log.userId, views: 0, lastSeen: log.creationTime.toISOString(), reports: new Set() });
            }
            const user = userMap.get(log.userId);
            user.views++;
            if (log.reportName)
                user.reports.add(log.reportName);
            if (log.creationTime.toISOString() > user.lastSeen)
                user.lastSeen = log.creationTime.toISOString();
            if (log.reportId) {
                if (!reportMap.has(log.reportId)) {
                    reportMap.set(log.reportId, { reportId: log.reportId, reportName: log.reportName || 'Unknown', views: 0, viewerSet: new Set() });
                }
                const report = reportMap.get(log.reportId);
                report.views++;
                report.viewerSet.add(log.userId);
            }
        });
        const pageQuery = this.powerbiTimeSpentRepository
            .createQueryBuilder('spent')
            .select('spent.tabName', 'tabName')
            .addSelect('SUM(spent.durationSeconds)', 'totalSeconds')
            .addSelect('COUNT(DISTINCT spent.userId)', 'uniqueUsers')
            .where('spent.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('LOWER(spent.reportName) LIKE LOWER(:name)', { name: `%${dashboardName.trim()}%` })
            .groupBy('spent.tabName')
            .orderBy('SUM(spent.durationSeconds)', 'DESC');
        if (workspaceId && workspaceId !== 'all') {
            pageQuery.andWhere('spent.workspaceId = :workspaceId', { workspaceId });
        }
        const pageRows = await pageQuery.getRawMany();
        const viewers = Array.from(userMap.values())
            .map(u => ({ userId: u.userId, views: u.views, lastSeen: u.lastSeen, reports: Array.from(u.reports) }))
            .sort((a, b) => b.views - a.views);
        const topReports = Array.from(reportMap.values())
            .map(r => ({ reportId: r.reportId, reportName: r.reportName, views: r.views, uniqueViewers: r.viewerSet.size }))
            .sort((a, b) => b.views - a.views);
        const pageTimeBreakdown = pageRows.map(r => ({
            tabName: r.tabName || 'Main Page',
            totalSeconds: parseInt(r.totalSeconds || '0'),
            uniqueUsers: parseInt(r.uniqueUsers || '0')
        }));
        return { totalViews: logs.length, uniqueViewers: userMap.size, viewers, topReports, pageTimeBreakdown };
    }
    async getTimeSpentOverview(startDate, endDate, workspaceId) {
        const userTimeQuery = this.powerbiTimeSpentRepository
            .createQueryBuilder('spent')
            .select('spent.userId', 'userId')
            .addSelect('SUM(spent.durationSeconds)', 'totalSeconds')
            .where('spent.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
            .groupBy('spent.userId')
            .orderBy('SUM(spent.durationSeconds)', 'DESC')
            .limit(10);
        const reportTimeQuery = this.powerbiTimeSpentRepository
            .createQueryBuilder('spent')
            .select('spent.reportId', 'reportId')
            .addSelect('spent.reportName', 'reportName')
            .addSelect('SUM(spent.durationSeconds)', 'totalSeconds')
            .where('spent.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
            .groupBy('spent.reportId, spent.reportName')
            .orderBy('SUM(spent.durationSeconds)', 'DESC')
            .limit(10);
        if (workspaceId && workspaceId !== 'all') {
            userTimeQuery.andWhere('spent.workspaceId = :workspaceId', { workspaceId });
            reportTimeQuery.andWhere('spent.workspaceId = :workspaceId', { workspaceId });
        }
        const [userResults, reportResults] = await Promise.all([
            userTimeQuery.getRawMany(),
            reportTimeQuery.getRawMany()
        ]);
        if (userResults.length > 0 || reportResults.length > 0) {
            return {
                topUsersByTime: userResults.map(r => ({ userId: r.userId, totalSeconds: parseInt(r.totalSeconds || '0') })),
                topReportsByTime: reportResults.map(r => ({ reportId: r.reportId, reportName: r.reportName || 'Unknown', totalSeconds: parseInt(r.totalSeconds || '0') }))
            };
        }
        const logQuery = this.powerbiLogRepository
            .createQueryBuilder('log')
            .where('log.creationTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere("log.operation = 'ViewReport'");
        if (workspaceId && workspaceId !== 'all') {
            if (workspaceId === '000000') {
                logQuery.andWhere("log.workSpaceName = 'PersonalWorkspace'");
            }
            else {
                logQuery.andWhere("log.workspaceId = :workspaceId", { workspaceId });
            }
        }
        const logs = await logQuery.getMany();
        const userTimeMap = new Map();
        const reportTimeMap = new Map();
        logs.forEach(log => {
            userTimeMap.set(log.userId, (userTimeMap.get(log.userId) || 0) + 120);
            if (log.reportId) {
                if (!reportTimeMap.has(log.reportId)) {
                    reportTimeMap.set(log.reportId, { reportId: log.reportId, reportName: log.reportName || 'Unknown', totalSeconds: 0 });
                }
                reportTimeMap.get(log.reportId).totalSeconds += 120;
            }
        });
        return {
            topUsersByTime: Array.from(userTimeMap.entries())
                .map(([userId, totalSeconds]) => ({ userId, totalSeconds }))
                .sort((a, b) => b.totalSeconds - a.totalSeconds)
                .slice(0, 10),
            topReportsByTime: Array.from(reportTimeMap.values())
                .sort((a, b) => b.totalSeconds - a.totalSeconds)
                .slice(0, 10)
        };
    }
};
exports.PowerBIMetricsService = PowerBIMetricsService;
exports.PowerBIMetricsService = PowerBIMetricsService = PowerBIMetricsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(user_dashboard_entity_1.UserDashboard)),
    __param(3, (0, typeorm_1.InjectRepository)(powerbi_log_entity_1.PowerBILog)),
    __param(4, (0, typeorm_1.InjectRepository)(dashboard_entity_1.Dashboard)),
    __param(5, (0, typeorm_1.InjectRepository)(powerbi_time_spent_entity_1.PowerBITimeSpent)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        report_mapping_service_1.ReportMappingService,
        workspace_mapping_service_1.WorkspaceMappingService,
        user_dashboard_service_1.UserDashboardService])
], PowerBIMetricsService);
//# sourceMappingURL=powerbi-metrics.service.js.map