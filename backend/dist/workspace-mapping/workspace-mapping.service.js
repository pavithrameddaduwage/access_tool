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
exports.WorkspaceMappingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workspace_mapping_entity_1 = require("./entities/workspace-mapping.entity");
let WorkspaceMappingService = class WorkspaceMappingService {
    constructor(workspaceMappingRepository) {
        this.workspaceMappingRepository = workspaceMappingRepository;
    }
    cleanWorkspaceName(name) {
        if (!name)
            return 'Unknown Workspace';
        let cleaned = name.replace(/^HGU\s*-\s*/i, '')
            .replace(/^HGU/i, '');
        cleaned = cleaned.replace(/\s*-\s*Dashboard$/i, '')
            .replace(/Dashboard$/i, '');
        cleaned = cleaned.trim();
        return cleaned || name;
    }
    async findOrCreate(workspaceId, originalName) {
        let mapping = await this.workspaceMappingRepository.findOne({
            where: { workspaceId }
        });
        if (!mapping) {
            mapping = this.workspaceMappingRepository.create({
                workspaceId,
                originalName,
                displayName: this.cleanWorkspaceName(originalName)
            });
            await this.workspaceMappingRepository.save(mapping);
        }
        return mapping;
    }
    async getDisplayName(workspaceId, originalName) {
        const mapping = await this.workspaceMappingRepository.findOne({
            where: { workspaceId }
        });
        if (mapping) {
            return mapping.displayName;
        }
        if (originalName) {
            const newMapping = await this.findOrCreate(workspaceId, originalName);
            return newMapping.displayName;
        }
        return 'Unknown Workspace';
    }
    async updateDisplayName(workspaceId, displayName) {
        let mapping = await this.workspaceMappingRepository.findOne({
            where: { workspaceId }
        });
        if (!mapping) {
            throw new Error('Workspace mapping not found');
        }
        mapping.displayName = displayName;
        return this.workspaceMappingRepository.save(mapping);
    }
    async findAll() {
        return this.workspaceMappingRepository.find();
    }
    async findOne(workspaceId) {
        return this.workspaceMappingRepository.findOne({
            where: { workspaceId }
        });
    }
};
exports.WorkspaceMappingService = WorkspaceMappingService;
exports.WorkspaceMappingService = WorkspaceMappingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workspace_mapping_entity_1.WorkspaceMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WorkspaceMappingService);
//# sourceMappingURL=workspace-mapping.service.js.map