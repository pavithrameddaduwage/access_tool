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
exports.WorkspaceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const workspace_entity_1 = require("./entities/workspace.entity");
const typeorm_2 = require("typeorm");
let WorkspaceService = class WorkspaceService {
    constructor(workspaceRepository) {
        this.workspaceRepository = workspaceRepository;
    }
    async createWorkspace(createWorkspaceDto) {
        const existingWorkspace = await this.workspaceRepository.findOne({
            where: { workspace: createWorkspaceDto.workspace }
        });
        if (existingWorkspace) {
            throw new common_1.ConflictException(`Workspace "${createWorkspaceDto.workspace}" already exists`);
        }
        return this.workspaceRepository.save(createWorkspaceDto);
    }
    async getAllWorkspaces() {
        return this.workspaceRepository.find({ order: { 'workspace': 'ASC' } });
    }
    async getWorkspaceById(id) {
        const workspace = await this.workspaceRepository.findOne({
            where: { id },
        });
        if (!workspace) {
            throw new common_1.NotFoundException(`Workspace with ID ${id} not found`);
        }
        return workspace;
    }
    async updateWorkspace(id, updateWorkspaceDto) {
        const workspace = await this.workspaceRepository.findOne({
            where: { id },
        });
        if (!workspace) {
            throw new common_1.NotFoundException(`Workspace with ID ${id} not found`);
        }
        if (updateWorkspaceDto.workspace && updateWorkspaceDto.workspace !== workspace.workspace) {
            const existingWorkspace = await this.workspaceRepository.findOne({
                where: { workspace: updateWorkspaceDto.workspace }
            });
            if (existingWorkspace && existingWorkspace.id !== id) {
                throw new common_1.ConflictException(`Workspace "${updateWorkspaceDto.workspace}" already exists`);
            }
        }
        return this.workspaceRepository.save(Object.assign(workspace, updateWorkspaceDto));
    }
    async deleteWorkspace(id) {
        const workspace = await this.workspaceRepository.findOne({
            where: { id },
        });
        if (!workspace) {
            throw new common_1.NotFoundException(`Workspace with ID ${id} not found`);
        }
        try {
            await this.workspaceRepository.remove(workspace);
        }
        catch (error) {
            if (error.code === '23503') {
                throw new common_1.ConflictException('Cannot delete Workspace as it is being used by dashboards');
            }
            throw error;
        }
    }
};
exports.WorkspaceService = WorkspaceService;
exports.WorkspaceService = WorkspaceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WorkspaceService);
//# sourceMappingURL=workspace.service.js.map