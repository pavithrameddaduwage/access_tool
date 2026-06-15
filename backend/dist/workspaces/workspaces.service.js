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
var WorkspacesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pbi_workspace_entity_1 = require("./entities/pbi-workspace.entity");
const pbi_report_entity_1 = require("./entities/pbi-report.entity");
const pbi_dashboard_entity_1 = require("./entities/pbi-dashboard.entity");
const powerbi_service_1 = require("../powerbi/powerbi.service");
const sync_log_service_1 = require("../sync-log/sync-log.service");
let WorkspacesService = WorkspacesService_1 = class WorkspacesService {
    constructor(workspaceRepository, reportRepository, dashboardRepository, powerBiService, syncLogService) {
        this.workspaceRepository = workspaceRepository;
        this.reportRepository = reportRepository;
        this.dashboardRepository = dashboardRepository;
        this.powerBiService = powerBiService;
        this.syncLogService = syncLogService;
        this.logger = new common_1.Logger(WorkspacesService_1.name);
    }
    async syncAll() {
        const syncLog = await this.syncLogService.createLog('workspaces');
        try {
            this.logger.log('Starting Power BI workspace, report, and dashboard synchronization...');
            const workspacesData = await this.powerBiService.getPaginated('/admin/groups');
            this.logger.log(`Fetched ${workspacesData.length} workspaces from Power BI API.`);
            for (const ws of workspacesData) {
                await this.workspaceRepository.save({
                    workspaceId: ws.id,
                    name: ws.name,
                    type: ws.type || 'Workspace',
                    state: ws.state || 'Active',
                    isOnDedicatedCapacity: ws.isOnDedicatedCapacity || false,
                    capacityId: ws.capacityId || null,
                    description: ws.description || null,
                    syncedAt: new Date(),
                });
                try {
                    const reportsData = await this.powerBiService.get(`/admin/groups/${ws.id}/reports`);
                    const reportsList = reportsData?.value || [];
                    for (const rep of reportsList) {
                        await this.reportRepository.save({
                            reportId: rep.id,
                            workspaceId: ws.id,
                            name: rep.name,
                            reportType: rep.reportType || 'PowerBIReport',
                            webUrl: rep.webUrl || null,
                            embedUrl: rep.embedUrl || null,
                            datasetId: rep.datasetId || null,
                            syncedAt: new Date(),
                        });
                    }
                }
                catch (repError) {
                    this.logger.error(`Failed to fetch reports for workspace ${ws.id}`, repError.message);
                }
                try {
                    const dashboardsData = await this.powerBiService.get(`/admin/groups/${ws.id}/dashboards`);
                    const dashboardsList = dashboardsData?.value || [];
                    for (const db of dashboardsList) {
                        await this.dashboardRepository.save({
                            dashboardId: db.id,
                            workspaceId: ws.id,
                            name: db.displayName || db.name,
                            isReadOnly: db.isReadOnly || false,
                            webUrl: db.webUrl || null,
                            embedUrl: db.embedUrl || null,
                            syncedAt: new Date(),
                        });
                    }
                }
                catch (dbError) {
                    this.logger.error(`Failed to fetch dashboards for workspace ${ws.id}`, dbError.message);
                }
            }
            await this.syncLogService.updateLog(syncLog.id, 'success', workspacesData.length);
            this.logger.log('Power BI workspaces, reports, and dashboards sync completed successfully.');
        }
        catch (error) {
            this.logger.error('Failed to sync Power BI workspaces', error.stack);
            await this.syncLogService.updateLog(syncLog.id, 'failed', 0, error.message);
            throw error;
        }
    }
    async findAllWorkspaces() {
        return this.workspaceRepository.find({ order: { name: 'ASC' } });
    }
    async findWorkspaceById(workspaceId) {
        const ws = await this.workspaceRepository.findOne({ where: { workspaceId } });
        if (!ws) {
            return this.workspaceRepository.findOne({ where: { id: workspaceId } });
        }
        return ws;
    }
    async findReportsByWorkspace(workspaceId) {
        return this.reportRepository.find({ where: { workspaceId } });
    }
    async findDashboardsByWorkspace(workspaceId) {
        return this.dashboardRepository.find({ where: { workspaceId } });
    }
    async isWorkspacesEmpty() {
        const count = await this.workspaceRepository.count();
        return count === 0;
    }
};
exports.WorkspacesService = WorkspacesService;
exports.WorkspacesService = WorkspacesService = WorkspacesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pbi_workspace_entity_1.PbiWorkspace)),
    __param(1, (0, typeorm_1.InjectRepository)(pbi_report_entity_1.PbiReport)),
    __param(2, (0, typeorm_1.InjectRepository)(pbi_dashboard_entity_1.PbiDashboard)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        powerbi_service_1.PowerBIService,
        sync_log_service_1.SyncLogService])
], WorkspacesService);
//# sourceMappingURL=workspaces.service.js.map