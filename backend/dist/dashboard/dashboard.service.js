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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dashboard_entity_1 = require("./entities/dashboard.entity");
const typeorm_2 = require("typeorm");
const dashboard_type_entity_1 = require("./entities/dashboard-type.entity");
const dashboard_valuetype_entity_1 = require("./entities/dashboard-valuetype.entity");
const dashboard_workspace_entity_1 = require("./entities/dashboard-workspace.entity");
const user_dashboard_entity_1 = require("../user-dashboard/entities/user-dashboard.entity");
let DashboardService = class DashboardService {
    constructor(dashboardRepository, dashboardTypeRepository, dashboardValuetypeRepository, dashboardWorkspaceRepository, userDashboardRepository) {
        this.dashboardRepository = dashboardRepository;
        this.dashboardTypeRepository = dashboardTypeRepository;
        this.dashboardValuetypeRepository = dashboardValuetypeRepository;
        this.dashboardWorkspaceRepository = dashboardWorkspaceRepository;
        this.userDashboardRepository = userDashboardRepository;
    }
    async create(createDashboardDto) {
        const { typeIds, valueTypeIds, workspaceIds, groupId, ...dashboardData } = createDashboardDto;
        const existingDashboard = await this.dashboardRepository.findOne({
            where: { dashboard: dashboardData.dashboard }
        });
        if (existingDashboard) {
            throw new common_1.ConflictException(`Dashboard "${dashboardData.dashboard}" already exists`);
        }
        try {
            const dashboard = this.dashboardRepository.create({
                ...dashboardData,
                groupId: groupId || null
            });
            await this.dashboardRepository.save(dashboard);
            await Promise.all([
                ...(typeIds?.map(typeId => this.dashboardTypeRepository.save({
                    dashboard: dashboard,
                    typeId: typeId
                })) || []),
                ...(valueTypeIds?.map(valueTypeId => this.dashboardValuetypeRepository.save({
                    dashboard: dashboard,
                    valueTypeId: valueTypeId
                })) || []),
                ...(workspaceIds?.map(workspaceId => this.dashboardWorkspaceRepository.save({
                    dashboard: dashboard,
                    workspaceId: workspaceId
                })) || [])
            ]);
            return this.findOne(dashboard.id);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Failed to create dashboard');
        }
    }
    async findAll() {
        const dashboards = await this.dashboardRepository.find({
            relations: [
                'dashboardTypes.type',
                'dashboardValuetypes.valuetype',
                'dashboardWorkspaces.workspace',
                'group',
                'userDashboards'
            ]
        });
        const dashboardsWithUsers = await Promise.all(dashboards.map(async (dashboard) => ({
            ...dashboard,
            users: await this.getUsersForDashboard(dashboard.id)
        })));
        return dashboardsWithUsers;
    }
    async getUsersForDashboard(dashboardId) {
        const userDashboards = await this.userDashboardRepository.find({
            where: { dashboardId }
        });
        return userDashboards.map(ud => ({
            email: ud.email,
            userName: ud.userName,
            department: ud.department
        }));
    }
    findOne(id) {
        return this.dashboardRepository.findOne({
            where: { id },
            relations: [
                'dashboardTypes.type',
                'dashboardValuetypes.valuetype',
                'dashboardWorkspaces.workspace',
                'group'
            ]
        });
    }
    async update(id, updateDashboardDto) {
        const dashboard = await this.dashboardRepository.findOne({
            where: { id },
            relations: ['dashboardTypes', 'dashboardValuetypes', 'dashboardWorkspaces']
        });
        if (!dashboard) {
            throw new common_1.NotFoundException(`Dashboard with ID ${id} not found`);
        }
        if (updateDashboardDto.dashboard && updateDashboardDto.dashboard !== dashboard.dashboard) {
            const existingDashboard = await this.dashboardRepository.findOne({
                where: { dashboard: updateDashboardDto.dashboard }
            });
            if (existingDashboard && existingDashboard.id !== id) {
                throw new common_1.ConflictException(`Dashboard "${updateDashboardDto.dashboard}" already exists`);
            }
        }
        try {
            if (updateDashboardDto.dashboard || updateDashboardDto.groupId !== undefined) {
                Object.assign(dashboard, {
                    dashboard: updateDashboardDto.dashboard || dashboard.dashboard,
                    groupId: updateDashboardDto.groupId !== undefined ? updateDashboardDto.groupId : dashboard.groupId
                });
                await this.dashboardRepository.save(dashboard);
            }
            await this.updateRelationships(id, updateDashboardDto);
            return this.findOne(id);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Failed to update dashboard');
        }
    }
    async updateRelationships(id, updateDashboardDto) {
        const { typeIds, valueTypeIds, workspaceIds } = updateDashboardDto;
        if (typeIds?.length > 0) {
            await this.dashboardTypeRepository.delete({ dashboard: { id } });
            await Promise.all(typeIds.map(typeId => this.dashboardTypeRepository.save({
                dashboard: { id },
                typeId
            })));
        }
        if (valueTypeIds?.length > 0) {
            await this.dashboardValuetypeRepository.delete({ dashboard: { id } });
            await Promise.all(valueTypeIds.map(valueTypeId => this.dashboardValuetypeRepository.save({
                dashboard: { id },
                valueTypeId
            })));
        }
        if (workspaceIds?.length > 0) {
            await this.dashboardWorkspaceRepository.delete({ dashboard: { id } });
            await Promise.all(workspaceIds.map(workspaceId => this.dashboardWorkspaceRepository.save({
                dashboard: { id },
                workspaceId
            })));
        }
    }
    async remove(id) {
        try {
            await this.userDashboardRepository.delete({ dashboardId: id });
            const result = await this.dashboardRepository.delete(id);
            if (result.affected === 0) {
                throw new common_1.NotFoundException(`Dashboard with ID ${id} not found`);
            }
            return { message: 'Dashboard deleted successfully' };
        }
        catch (error) {
            console.error('Error deleting dashboard:', error);
            throw new common_1.InternalServerErrorException('Failed to delete dashboard');
        }
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(dashboard_entity_1.Dashboard)),
    __param(1, (0, typeorm_1.InjectRepository)(dashboard_type_entity_1.DashboardType)),
    __param(2, (0, typeorm_1.InjectRepository)(dashboard_valuetype_entity_1.DashboardValuetype)),
    __param(3, (0, typeorm_1.InjectRepository)(dashboard_workspace_entity_1.DashboardWorkspace)),
    __param(4, (0, typeorm_1.InjectRepository)(user_dashboard_entity_1.UserDashboard)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map