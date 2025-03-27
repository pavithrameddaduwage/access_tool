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
var PowerBIAnalyticsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerBIAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const powerbi_analytics_service_1 = require("./powerbi-analytics.service");
const common_2 = require("@nestjs/common");
let PowerBIAnalyticsController = PowerBIAnalyticsController_1 = class PowerBIAnalyticsController {
    constructor(powerBIService) {
        this.powerBIService = powerBIService;
        this.logger = new common_2.Logger(PowerBIAnalyticsController_1.name);
    }
    getWorkspaces() {
        return this.powerBIService.getWorkspaces();
    }
    async testConnection() {
        try {
            const workspaces = await this.powerBIService.getWorkspaces();
            return {
                status: 'success',
                message: 'PowerBI connection successful',
                workspaceCount: workspaces.length,
                workspaces: workspaces.map(ws => ({
                    id: ws.id,
                    name: ws.name
                }))
            };
        }
        catch (error) {
            return {
                status: 'error',
                message: error.message
            };
        }
    }
    async getMyWorkspaceAccess() {
        return this.powerBIService.getMyWorkspaceAccess();
    }
    async getSpecificWorkspace(workspaceId) {
        return this.powerBIService.getSpecificWorkspace(workspaceId);
    }
    async getReports(workspaceId) {
        return this.powerBIService.getReports(workspaceId);
    }
    async getAllWorkspaces() {
        return this.powerBIService.getAllWorkspaces();
    }
    async getReportUsageMetrics(workspaceId, reportId) {
        return this.powerBIService.getReportUsageMetrics(workspaceId, reportId);
    }
    async getWorkspaceUsageMetrics(workspaceId) {
        return this.powerBIService.getWorkspaceUsageMetrics(workspaceId);
    }
    async getAggregateMetrics() {
        return this.powerBIService.getAggregateMetrics();
    }
    async getData() {
        return this.powerBIService.getData();
    }
    async getToken() {
        return this.powerBIService.getAccessToken();
    }
    async getDatasetTables(workspaceId, datasetId) {
        return this.powerBIService.getDatasetTables(workspaceId, datasetId);
    }
    async getReportData(workspaceId, datasetId) {
        return this.powerBIService.getReportData(workspaceId, datasetId);
    }
    async exportReport(workspaceId, reportId, res) {
        try {
            const token = await this.powerBIService.getAccessToken();
            const response = await this.powerBIService.exportReport(workspaceId, reportId, token);
            this.logger.debug('Response Headers:', response.headers);
            const filename = response.headers['x-powerbi-filename'] || `report-${reportId}.pbix`;
            res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            response.data.pipe(res);
        }
        catch (error) {
            this.logger.error('Failed to export report:', error.message);
            res.status(500).send(`Failed to export report: ${error.message}`);
        }
    }
    async executeQueries(workspaceId, datasetId, fullRequestBody) {
        return this.powerBIService.executeQueries(workspaceId, datasetId, fullRequestBody);
    }
    async getWorkspacesWithDatasets() {
        return this.powerBIService.getWorkspacesWithDatasets();
    }
    async getFilterableMetrics(workspaceIds, days = '30') {
        return this.powerBIService.getFilteredMetrics(workspaceIds?.split(','), parseInt(days, 10));
    }
    async getCombinedMetrics(workspaceIds) {
        try {
            return await this.powerBIService.getCombinedMetrics(workspaceIds);
        }
        catch (error) {
            throw new common_1.HttpException('Failed to get combined metrics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getWorkspaceReports(workspaceId) {
        return this.powerBIService.getReports(workspaceId);
    }
};
exports.PowerBIAnalyticsController = PowerBIAnalyticsController;
__decorate([
    (0, common_1.Get)('workspaces'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PowerBIAnalyticsController.prototype, "getWorkspaces", null);
__decorate([
    (0, common_1.Get)('test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Get)('workspaces/access'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getMyWorkspaceAccess", null);
__decorate([
    (0, common_1.Get)('workspace/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getSpecificWorkspace", null);
__decorate([
    (0, common_1.Get)('workspace/:id/reports'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('workspaces'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getAllWorkspaces", null);
__decorate([
    (0, common_1.Get)('metrics/report/:workspaceId/:reportId'),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Param)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getReportUsageMetrics", null);
__decorate([
    (0, common_1.Get)('metrics/workspace/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getWorkspaceUsageMetrics", null);
__decorate([
    (0, common_1.Get)('metrics/aggregate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getAggregateMetrics", null);
__decorate([
    (0, common_1.Get)('just'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getData", null);
__decorate([
    (0, common_1.Get)('token'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getToken", null);
__decorate([
    (0, common_1.Get)('workspace/:workspaceId/dataset/:datasetId/tables'),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Param)('datasetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getDatasetTables", null);
__decorate([
    (0, common_1.Post)('workspace/:workspaceId/dataset/:datasetId/data'),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Param)('datasetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getReportData", null);
__decorate([
    (0, common_1.Get)('workspace/:workspaceId/report/:reportId/export'),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Param)('reportId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "exportReport", null);
__decorate([
    (0, common_1.Post)('groups/:workspaceId/datasets/:datasetId/executeQueries'),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Param)('datasetId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "executeQueries", null);
__decorate([
    (0, common_1.Get)('workspaces-with-datasets'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getWorkspacesWithDatasets", null);
__decorate([
    (0, common_1.Get)('filterable-metrics'),
    __param(0, (0, common_1.Query)('workspaceIds')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getFilterableMetrics", null);
__decorate([
    (0, common_1.Get)('combined-metrics'),
    __param(0, (0, common_1.Body)('workspaceIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getCombinedMetrics", null);
__decorate([
    (0, common_1.Get)('groups/:workspaceId/reports'),
    __param(0, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PowerBIAnalyticsController.prototype, "getWorkspaceReports", null);
exports.PowerBIAnalyticsController = PowerBIAnalyticsController = PowerBIAnalyticsController_1 = __decorate([
    (0, common_1.Controller)('powerbi-analytics'),
    __metadata("design:paramtypes", [powerbi_analytics_service_1.PowerBIService])
], PowerBIAnalyticsController);
//# sourceMappingURL=powerbi-analytics.controller.js.map