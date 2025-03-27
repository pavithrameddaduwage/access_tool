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
var PowerBIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerBIService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const identity_1 = require("@azure/identity");
const rxjs_1 = require("rxjs");
const powerbi_storage_service_1 = require("./powerbi-storage.service");
let PowerBIService = PowerBIService_1 = class PowerBIService {
    constructor(httpService, configService, storageService) {
        this.httpService = httpService;
        this.configService = configService;
        this.storageService = storageService;
        this.apiUrl = 'https://api.powerbi.com/v1.0/myorg';
        this.logger = new common_1.Logger(PowerBIService_1.name);
        const tenantId = this.configService.get('TENANT_ID');
        const clientId = this.configService.get('CLIENT_ID');
        const clientSecret = this.configService.get('CLIENT_SECRET');
        this.logger.debug(`TenantID length: ${tenantId?.length}`);
        this.logger.debug(`ClientID length: ${clientId?.length}`);
        this.logger.debug(`ClientSecret length: ${clientSecret?.length}`);
        try {
            this.credential = new identity_1.ClientSecretCredential(tenantId, clientId, clientSecret);
            this.logger.debug('Credential object created successfully');
        }
        catch (error) {
            this.logger.error('Failed to create credential object:', error.message);
            throw error;
        }
    }
    async getMyWorkspaceAccess() {
        try {
            const token = await this.getAccessToken();
            const url = `${this.apiUrl}/groups?$filter=delegated eq true`;
            this.logger.debug(`Checking workspace access: ${url}`);
            const response = await this.httpService.axiosRef.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            this.logger.debug(`Found ${response.data.value.length} accessible workspaces`);
            return response.data.value;
        }
        catch (error) {
            this.logger.error('Failed to check workspace access:', error.message);
            throw new Error(`Failed to check workspace access: ${error.message}`);
        }
    }
    async getAccessToken() {
        try {
            this.logger.debug('Attempting to get access token...');
            const token = await this.credential.getToken('https://analysis.windows.net/powerbi/api/.default');
            this.logger.debug(`Token starts with: ${token.token.substring(0, 10)}...`);
            this.logger.debug(`Token expires in: ${token.expiresOnTimestamp}`);
            return token.token;
        }
        catch (error) {
            this.logger.error('Failed to get access token:', error.message);
            throw error;
        }
    }
    async getWorkspaces() {
        try {
            this.logger.debug('Getting access token for workspaces request...');
            const token = await this.getAccessToken();
            this.logger.debug('Making request to Power BI API...');
            const url = `${this.apiUrl}/groups`;
            this.logger.debug(`Request URL: ${url}`);
            this.logger.debug('Request Headers:', {
                Authorization: `Bearer ${token.substring(0, 10)}...`,
                'Content-Type': 'application/json'
            });
            const response = await this.httpService.axiosRef.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            this.logger.debug('Successfully retrieved workspaces');
            return response.data.value;
        }
        catch (error) {
            if (error.response) {
                this.logger.error(`API Error Status: ${error.response.status}`);
                this.logger.error('API Error Data:', error.response.data);
                this.logger.error('API Response Headers:', JSON.stringify(error.response.headers, null, 2));
            }
            else if (error.request) {
                this.logger.error('No response received from API');
                this.logger.error(error.request);
            }
            else {
                this.logger.error('Error setting up request:', error.message);
            }
            throw new Error(`Failed to get workspaces: ${error.message}`);
        }
    }
    async getSpecificWorkspace(workspaceId) {
        try {
            const token = await this.getAccessToken();
            const url = `${this.apiUrl}/groups/${workspaceId}`;
            this.logger.debug(`Getting specific workspace: ${url}`);
            const response = await this.httpService.axiosRef.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to get workspace ${workspaceId}:`, error.message);
            throw new Error(`Failed to get workspace: ${error.message}`);
        }
    }
    async getData() {
        try {
            const token = await this.getAccessToken();
            const url = `${this.apiUrl}/admin/activityevents?startDateTime=2024-02-01T00:00:00Z&endDateTime=2024-02-21T00:00:00Z`;
            this.logger.debug(`Getting data for my workspaces`);
            const response = await this.httpService.axiosRef.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to get data for my workspaces:`, error.message);
            throw new Error(`Failed to get data: ${error.message}`);
        }
    }
    async getReports(workspaceId) {
        try {
            const token = await this.getAccessToken();
            const url = `${this.apiUrl}/groups/${workspaceId}/reports`;
            this.logger.debug(`Getting reports for workspace ${workspaceId}`);
            const response = await this.httpService.axiosRef.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.value;
        }
        catch (error) {
            this.logger.error(`Failed to get reports for workspace ${workspaceId}:`, error.message);
            throw new Error(`Failed to get reports: ${error.message}`);
        }
    }
    async getAllWorkspaces() {
        try {
            const token = await this.getAccessToken();
            const url = `${this.apiUrl}/groups`;
            this.logger.debug(`Getting all accessible workspaces`);
            const response = await this.httpService.axiosRef.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            this.logger.debug(`Found ${response.data.value.length} workspaces`);
            return response.data.value;
        }
        catch (error) {
            this.logger.error('Failed to get workspaces:', error.message);
            throw new Error(`Failed to get workspaces: ${error.message}`);
        }
    }
    async getReportUsageMetrics(workspaceId, reportId) {
        try {
            const token = await this.getAccessToken();
            const url = `${this.apiUrl}/groups/${workspaceId}/reports/${reportId}/usage`;
            this.logger.debug(`Getting usage metrics for report ${reportId}`);
            const response = await this.httpService.axiosRef.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to get usage metrics for report ${reportId}:`, error.message);
            throw new Error(`Failed to get report metrics: ${error.message}`);
        }
    }
    async getWorkspaceUsageMetrics(workspaceId) {
        try {
            const token = await this.getAccessToken();
            const reportsUrl = `${this.apiUrl}/groups/${workspaceId}/reports`;
            const reportsResponse = await this.httpService.axiosRef.get(reportsUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const reports = reportsResponse.data.value;
            this.logger.debug(`Found ${reports.length} reports in workspace ${workspaceId}`);
            const metricsPromises = reports.map(report => this.getReportUsageMetrics(workspaceId, report.id)
                .then(metrics => ({
                reportId: report.id,
                reportName: report.name,
                metrics
            }))
                .catch(error => ({
                reportId: report.id,
                reportName: report.name,
                metrics: { error: error.message }
            })));
            const reportMetrics = await Promise.all(metricsPromises);
            return {
                workspaceId,
                workspaceName: reports[0]?.datasetWorkspace?.name || 'Unknown',
                reports: reportMetrics,
                aggregateMetrics: this.calculateAggregateMetrics(reportMetrics.map(r => r.metrics))
            };
        }
        catch (error) {
            this.logger.error(`Failed to get workspace metrics for ${workspaceId}:`, error.message);
            throw new Error(`Failed to get workspace metrics: ${error.message}`);
        }
    }
    async getAggregateMetrics() {
        try {
            const workspaces = await this.getWorkspaces();
            if (workspaces.length === 0) {
                return {
                    totalViews: 0,
                    totalUsers: 0,
                    reportCount: 0,
                    workspaceCount: 0
                };
            }
            const metricsPromises = workspaces.map(workspace => this.getWorkspaceUsageMetrics(workspace.id)
                .catch(error => ({
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                reports: [],
                aggregateMetrics: {
                    totalViews: 0,
                    totalUsers: 0,
                    reportCount: 0
                }
            })));
            const workspaceMetrics = await Promise.all(metricsPromises);
            return {
                totalViews: workspaceMetrics.reduce((sum, ws) => sum + (ws.aggregateMetrics.totalViews || 0), 0),
                totalUsers: new Set(workspaceMetrics.flatMap(ws => ws.aggregateMetrics.userIds || [])).size,
                reportCount: workspaceMetrics.reduce((sum, ws) => sum + ws.reports.length, 0),
                workspaceCount: workspaces.length,
                topReports: this.getTopReports(workspaceMetrics),
                topWorkspaces: this.getTopWorkspaces(workspaceMetrics)
            };
        }
        catch (error) {
            this.logger.error('Failed to get aggregate metrics:', error.message);
            throw new Error(`Failed to get aggregate metrics: ${error.message}`);
        }
    }
    calculateAggregateMetrics(metrics) {
        const userIds = metrics.flatMap(m => m.users || [])
            .filter(id => id);
        return {
            totalViews: metrics.reduce((sum, m) => sum + (m.viewCount || 0), 0),
            totalUsers: new Set(userIds).size,
            userIds: [...new Set(userIds)],
            avgViewsPerDay: this.calculateAverageViewsPerDay(metrics)
        };
    }
    calculateAverageViewsPerDay(metrics) {
        const viewsByDay = {};
        let dayCount = 0;
        metrics.forEach((m) => {
            if (m.timeline && Array.isArray(m.timeline)) {
                m.timeline.forEach((day) => {
                    const date = day.date.split('T')[0];
                    viewsByDay[date] = (viewsByDay[date] || 0) + day.count;
                });
            }
        });
        dayCount = Object.keys(viewsByDay).length;
        const totalViews = Object.values(viewsByDay).reduce((sum, count) => sum + count, 0);
        return dayCount > 0 ? Math.round(totalViews / dayCount) : 0;
    }
    getTopReports(workspaceMetrics) {
        const allReports = workspaceMetrics.flatMap(ws => ws.reports.map(report => ({
            id: report.reportId,
            name: report.reportName,
            workspaceId: ws.workspaceId,
            workspaceName: ws.workspaceName,
            views: report.metrics.viewCount || 0,
            users: (report.metrics.users || []).length
        })));
        return allReports
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);
    }
    getTopWorkspaces(workspaceMetrics) {
        return workspaceMetrics
            .map(ws => ({
            id: ws.workspaceId,
            name: ws.workspaceName,
            reports: ws.reports.length,
            views: ws.aggregateMetrics.totalViews || 0,
            users: (ws.aggregateMetrics.userIds || []).length
        }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);
    }
    async getReportData(workspaceId, datasetId) {
        try {
            const token = await this.getAccessToken();
            const url = `${this.apiUrl}/groups/${workspaceId}/datasets/${datasetId}/execute-queries`;
            const body = {
                "queries": [
                    {
                        "query": "EVALUATE VALUES(TableName)"
                    }
                ],
                "serializerSettings": {
                    "includeNulls": true
                }
            };
            const response = await this.httpService.axiosRef.post(url, body, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Error fetching report data:', error.response?.data || error.message);
            throw error;
        }
    }
    async getDatasetTables(workspaceId, datasetId) {
        try {
            const token = await this.getAccessToken();
            const url = `${this.apiUrl}/groups/${workspaceId}/datasets/${datasetId}/tables`;
            const response = await this.httpService.axiosRef.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.value;
        }
        catch (error) {
            this.logger.error('Error fetching dataset tables:', error.response?.data || error.message);
            throw error;
        }
    }
    async exportReport(workspaceId, reportId, accessToken) {
        try {
            const url = `${this.apiUrl}/groups/${workspaceId}/reports/${reportId}/export`;
            this.logger.debug(`Exporting report ${reportId} from workspace ${workspaceId}`);
            const response = await this.httpService.axiosRef.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                responseType: 'stream',
            });
            return response;
        }
        catch (error) {
            this.logger.error(`Failed to export report ${reportId}:`, error.message);
            throw new Error(`Failed to export report: ${error.message}`);
        }
    }
    async executeQueries(workspaceId, datasetId, requestBody) {
        const token = await this.getAccessToken();
        const url = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/executeQueries`;
        try {
            const reportMap = await this.getReportNameMap(workspaceId);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, requestBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }));
            if (response.data?.results?.[0]?.tables?.[0]?.rows) {
                response.data.results[0].tables[0].rows = response.data.results[0].tables[0].rows.map((row) => {
                    const reportId = row['Report views[ReportId]'];
                    return {
                        ...row,
                        'WorkspaceId': workspaceId,
                        'Report views[ReportName]': reportMap.get(reportId) || reportId,
                    };
                });
            }
            return response.data;
        }
        catch (error) {
            console.error('Power BI API Error Details:');
            throw new Error(`Power BI API Error: ${error.response?.data?.error?.message || error.message}`);
        }
    }
    async getReportNameMap(workspaceId) {
        try {
            const reports = await this.getReports(workspaceId);
            const reportMap = new Map();
            reports.forEach((report) => {
                reportMap.set(report.id, report.name);
            });
            return reportMap;
        }
        catch (error) {
            this.logger.error(`Failed to fetch report names for workspace ${workspaceId}:`, error.message);
            throw new Error(`Failed to fetch report names: ${error.message}`);
        }
    }
    async getAccessibleWorkspaces() {
        return this.getWorkspaces();
    }
    async getDatasetData(workspaceId, datasetId, query) {
        const requestBody = {
            queries: [{ query }],
            serializerSettings: { includeNulls: true }
        };
        try {
            const response = await this.executeQueries(workspaceId, datasetId, requestBody);
            return response;
        }
        catch (error) {
            this.logger.error('Error fetching dataset data:', error);
            throw error;
        }
    }
    async getDatasets(workspaceId) {
        try {
            const token = await this.getAccessToken();
            const url = `${this.apiUrl}/groups/${workspaceId}/datasets`;
            const response = await this.httpService.axiosRef.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.value;
        }
        catch (error) {
            this.logger.error(`Failed to get datasets for workspace ${workspaceId}:`, error.message);
            return [];
        }
    }
    async getWorkspacesWithDatasets() {
        try {
            const workspaces = await this.getWorkspaces();
            const workspacesWithDatasets = await Promise.all(workspaces.map(async (workspace) => {
                try {
                    const datasets = await this.getDatasets(workspace.id);
                    return {
                        workspaceId: workspace.id,
                        workspaceName: workspace.name,
                        datasets: datasets.map(d => ({
                            id: d.id,
                            name: d.name,
                            configuredBy: d.configuredBy,
                            createdDate: d.createdDate
                        }))
                    };
                }
                catch (error) {
                    this.logger.error(`Failed to get datasets for workspace ${workspace.id}: ${error.message}`);
                    return {
                        workspaceId: workspace.id,
                        workspaceName: workspace.name,
                        datasets: [],
                        error: error.message
                    };
                }
            }));
            return workspacesWithDatasets;
        }
        catch (error) {
            this.logger.error(`Failed to get workspaces: ${error.message}`);
            throw new Error(`Failed to fetch workspaces and datasets: ${error.message}`);
        }
    }
    processActivityEvents(activityData, startDate, endDate, workspaceIds, allWorkspaces = []) {
        const metrics = {
            viewsByDate: {},
            viewsByReport: {},
            viewsByUser: {},
            totalViews: 0,
            uniqueUsersCount: 0,
            uniqueReportsCount: 0,
            topReports: [],
            topUsers: []
        };
        if (!activityData?.activityEventEntities)
            return metrics;
        const workspaceMap = new Map(allWorkspaces.map(ws => [ws.id, ws.name]));
        activityData.activityEventEntities.forEach(event => {
            if (event.Activity === 'ViewReport') {
                if (workspaceIds && workspaceIds.length > 0 &&
                    !workspaceIds.includes(event.WorkspaceId)) {
                    return;
                }
                const date = event.CreationTime.split('T')[0];
                const reportId = event.ReportId;
                const userId = event.UserId;
                const workspaceName = workspaceMap.get(event.WorkspaceId) || 'Unknown';
                metrics.totalViews++;
                metrics.viewsByDate[date] = (metrics.viewsByDate[date] || 0) + 1;
                const reportKey = `${workspaceName} - ${reportId}`;
                metrics.viewsByReport[reportKey] = (metrics.viewsByReport[reportKey] || 0) + 1;
                metrics.viewsByUser[userId] = (metrics.viewsByUser[userId] || 0) + 1;
            }
        });
        metrics.uniqueUsersCount = new Set(Object.keys(metrics.viewsByUser)).size;
        metrics.uniqueReportsCount = new Set(Object.keys(metrics.viewsByReport)).size;
        metrics.topReports = Object.entries(metrics.viewsByReport)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id, count]) => ({ id, count }));
        metrics.topUsers = Object.entries(metrics.viewsByUser)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id, count]) => ({ id, count }));
        return metrics;
    }
    async getFilteredMetrics(workspaceIds, days = 30) {
        try {
            const targetWorkspaceId = '19c566e0-081f-4821-a0d0-6c78984d113c';
            const targetDatasetId = '000894d3-b693-4008-b092-95a03c5064d7';
            const query = `
      EVALUATE 
      SUMMARIZECOLUMNS(
        'Report views'[Date],
        'Report views'[ReportId],
        'Report views'[UserId],
        "Views", COUNTROWS('Report views')
      )
      ${workspaceIds?.length ?
                `WHERE 'Report views'[WorkspaceId] IN ${this.formatWorkspaceFilter(workspaceIds)}`
                : ''}
    `;
            const response = await this.getDatasetData(targetWorkspaceId, targetDatasetId, query);
            return this.processDatasetResponse(response);
        }
        catch (error) {
            this.logger.error('Failed to get filtered metrics:', error.message);
            throw new Error('Failed to load metrics data');
        }
    }
    formatWorkspaceFilter(workspaceIds) {
        return `{ "${workspaceIds.join('", "')}" }`;
    }
    processDatasetResponse(response) {
        const metrics = {
            viewsByDate: {},
            viewsByReport: {},
            viewsByUser: {},
            totalViews: 0,
            uniqueUsersCount: 0,
            uniqueReportsCount: 0,
            topReports: [],
            topUsers: []
        };
        const uniqueUsers = new Set();
        const uniqueReports = new Set();
        response.results[0].tables[0].rows.forEach(row => {
            const date = row['Report views[Date]'];
            const reportId = row['Report views[ReportId]'];
            const userId = row['Report views[UserId]'];
            const views = row['Views'];
            metrics.totalViews += views;
            metrics.viewsByDate[date] = (metrics.viewsByDate[date] || 0) + views;
            metrics.viewsByReport[reportId] = (metrics.viewsByReport[reportId] || 0) + views;
            metrics.viewsByUser[userId] = (metrics.viewsByUser[userId] || 0) + views;
            uniqueUsers.add(userId);
            uniqueReports.add(reportId);
        });
        metrics.uniqueUsersCount = uniqueUsers.size;
        metrics.uniqueReportsCount = uniqueReports.size;
        metrics.topReports = Object.entries(metrics.viewsByReport)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id, count]) => ({ id, count }));
        metrics.topUsers = Object.entries(metrics.viewsByUser)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id, count]) => ({ id, count }));
        return metrics;
    }
    async getCombinedMetrics(workspaceIds) {
        try {
            const workspacesWithDatasets = await this.getWorkspacesWithDatasets();
            const filteredWorkspaces = workspacesWithDatasets
                .map(ws => ({
                workspaceId: ws.workspaceId,
                datasetId: ws.datasets.find(d => d.name === 'Usage Metrics Report')?.id
            }))
                .filter(ws => ws.datasetId)
                .filter(ws => !workspaceIds ||
                workspaceIds.length === 0 ||
                workspaceIds.includes(ws.workspaceId));
            this.logger.debug('Filtered workspaces:', filteredWorkspaces);
            const allData = await Promise.all(filteredWorkspaces.map(async ({ workspaceId, datasetId }) => {
                try {
                    const query = `
            EVALUATE 
            SUMMARIZECOLUMNS(
              'Report views'[Date],
              'Report views'[ReportId],
              'Report views'[UserId],
              "Views", COUNTROWS('Report views')
            )
          `;
                    this.logger.debug(`Executing query for workspace ${workspaceId}`);
                    const response = await this.executeQueries(workspaceId, datasetId, {
                        queries: [{ query }],
                        serializerSettings: { includeNulls: true }
                    });
                    this.logger.debug(`Query response for workspace ${workspaceId}:`);
                    return response.results[0].tables[0].rows;
                }
                catch (error) {
                    this.logger.error(`Failed to query workspace ${workspaceId}:`, error);
                    return [];
                }
            }));
            console.log(allData);
            const combinedRows = allData.flat();
            return combinedRows;
        }
        catch (error) {
            this.logger.error('Failed to get combined metrics:', error);
            throw error;
        }
    }
    aggregateAcrossWorkspaces(workspaceMetrics) {
        const metrics = {
            viewsByDate: {},
            viewsByReport: {},
            viewsByUser: {},
            totalViews: 0,
            uniqueUsersCount: 0,
            uniqueReportsCount: 0,
            topReports: [],
            topUsers: []
        };
        workspaceMetrics.forEach(ws => {
            const aggMetrics = ws.aggregateMetrics;
            metrics.totalViews += aggMetrics.totalViews;
            Object.entries(aggMetrics.viewsByDate || {}).forEach(([date, count]) => {
                metrics.viewsByDate[date] = (metrics.viewsByDate[date] || 0) + count;
            });
            ws.reports.forEach(report => {
                const key = `${report.reportId}|${report.reportName}`;
                metrics.viewsByReport[key] = (metrics.viewsByReport[key] || 0) + report.metrics.viewCount;
            });
        });
        metrics.topReports = Object.entries(metrics.viewsByReport)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id, count]) => ({ id, count: count }));
        return metrics;
    }
};
exports.PowerBIService = PowerBIService;
exports.PowerBIService = PowerBIService = PowerBIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        powerbi_storage_service_1.PowerbiStorageService])
], PowerBIService);
//# sourceMappingURL=powerbi-analytics.service.js.map