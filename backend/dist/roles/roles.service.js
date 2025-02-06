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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const role_entity_1 = require("./entities/role.entity");
const typeorm_2 = require("typeorm");
const webtool_entity_1 = require("../webtool/entities/webtool.entity");
let RolesService = class RolesService {
    constructor(roleRepository, webtoolRepository) {
        this.roleRepository = roleRepository;
        this.webtoolRepository = webtoolRepository;
    }
    async getRolesByWebtool(webtoolId) {
        return this.roleRepository.find({
            where: {
                webtool: { id: webtoolId }
            },
            relations: ['webtool'],
            order: { roles: 'ASC' }
        });
    }
    async createRole(createRoleDto) {
        const { roles, privileges, webtoolId } = createRoleDto;
        const webtool = await this.webtoolRepository.findOne({ where: { id: webtoolId } });
        if (!webtool) {
            throw new common_1.NotFoundException(`Webtool with ID ${webtoolId} not found`);
        }
        const existingRole = await this.roleRepository.findOne({
            where: {
                roles: roles,
                webtool: { id: webtoolId }
            },
            relations: ['webtool']
        });
        if (existingRole) {
            throw new common_1.ConflictException(`Role "${roles}" already exists for Web Tool "${webtool.webtool}"`);
        }
        const role = this.roleRepository.create({
            roles,
            privileges,
            webtool,
        });
        return this.roleRepository.save(role);
    }
    async getAllRoles() {
        return this.roleRepository.find({ relations: ['webtool'], order: { 'roles': 'ASC' } });
    }
    async getRoleById(id) {
        const role = await this.roleRepository.findOne({
            where: { id },
            relations: ['webtool']
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }
    async updateRole(id, updateRoleDto) {
        const existingRole = await this.roleRepository.findOne({
            where: { id },
            relations: ['webtool']
        });
        if (!existingRole) {
            throw new common_1.NotFoundException(`Role with ID ${id} not found`);
        }
        if (updateRoleDto.roles && updateRoleDto.roles !== existingRole.roles) {
            const duplicateRole = await this.roleRepository.findOne({
                where: {
                    roles: updateRoleDto.roles,
                    webtool: { id: updateRoleDto.webtoolId || existingRole.webtool.id }
                },
                relations: ['webtool']
            });
            if (duplicateRole && duplicateRole.id !== id) {
                const webtool = duplicateRole.webtool.webtool;
                throw new common_1.ConflictException(`Role "${updateRoleDto.roles}" already exists for Web Tool "${webtool}"`);
            }
        }
        if (updateRoleDto.webtoolId && updateRoleDto.webtoolId !== existingRole.webtool.id) {
            const newWebtool = await this.webtoolRepository.findOne({
                where: { id: updateRoleDto.webtoolId }
            });
            if (!newWebtool) {
                throw new common_1.NotFoundException(`Webtool with ID ${updateRoleDto.webtoolId} not found`);
            }
        }
        Object.assign(existingRole, updateRoleDto);
        if (updateRoleDto.webtoolId) {
            existingRole.webtool = { id: updateRoleDto.webtoolId };
        }
        return this.roleRepository.save(existingRole);
    }
    async deleteRole(id) {
        const role = await this.roleRepository.findOne({
            where: { id },
            relations: ['webtool']
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${id} not found`);
        }
        try {
            await this.roleRepository.remove(role);
        }
        catch (error) {
            if (error.code === '23503') {
                throw new common_1.ConflictException('Cannot delete role as it is being used by users');
            }
            throw error;
        }
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(webtool_entity_1.Webtool)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RolesService);
//# sourceMappingURL=roles.service.js.map