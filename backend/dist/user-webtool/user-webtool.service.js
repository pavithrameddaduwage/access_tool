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
exports.UserWebtoolService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_webtool_entity_1 = require("./entities/user-webtool.entity");
const webtool_entity_1 = require("../webtool/entities/webtool.entity");
const role_entity_1 = require("../roles/entities/role.entity");
let UserWebtoolService = class UserWebtoolService {
    constructor(userWebtoolRepository, webtoolRepository, roleRepository) {
        this.userWebtoolRepository = userWebtoolRepository;
        this.webtoolRepository = webtoolRepository;
        this.roleRepository = roleRepository;
    }
    async create(createUserWebtoolDto) {
        const webtool = await this.webtoolRepository.findOne({
            where: { id: createUserWebtoolDto.webtoolId }
        });
        if (!webtool) {
            throw new common_1.NotFoundException(`Webtool with ID ${createUserWebtoolDto.webtoolId} not found`);
        }
        const role = await this.roleRepository.findOne({
            where: { id: createUserWebtoolDto.roleId }
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${createUserWebtoolDto.roleId} not found`);
        }
        const userWebtool = this.userWebtoolRepository.create({
            email: createUserWebtoolDto.email,
            userName: createUserWebtoolDto.userName,
            department: createUserWebtoolDto.department,
            webtoolId: createUserWebtoolDto.webtoolId,
            roleId: createUserWebtoolDto.roleId,
            isActive: createUserWebtoolDto.isActive,
            lastActiveAt: createUserWebtoolDto.isActive === false ? new Date() : null
        });
        const saved = await this.userWebtoolRepository.save(userWebtool);
        const result = await this.userWebtoolRepository.findOne({
            where: { id: saved.id },
            relations: ['webtool', 'role']
        });
        return result;
    }
    async removeRole(email, webtoolId, roleId) {
        const result = await this.userWebtoolRepository.delete({
            email,
            webtoolId,
            roleId
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`User-Webtool-Role relationship not found for email=${email}, webtoolId=${webtoolId}, roleId=${roleId}`);
        }
    }
    async getUserWebtoolsByUser(email) {
        return this.userWebtoolRepository.find({
            where: { email },
            relations: ['webtool', 'role']
        });
    }
    async findAll() {
        const userWebtools = await this.userWebtoolRepository.find({
            relations: ['webtool', 'role']
        });
        const userMap = new Map();
        for (const uw of userWebtools) {
            if (!userMap.has(uw.email)) {
                userMap.set(uw.email, {
                    userId: uw.id,
                    userName: uw.userName,
                    email: uw.email,
                    department: uw.department,
                    roles: {},
                    webtools: [],
                    isActive: uw.isActive,
                    lastActiveAt: uw.lastActiveAt
                });
            }
            const userData = userMap.get(uw.email);
            if (uw.webtool?.webtool && !userData.webtools.includes(uw.webtool.webtool)) {
                userData.webtools.push(uw.webtool.webtool);
            }
            if (uw.webtool?.id && uw.role) {
                if (!userData.roles[uw.webtool.id]) {
                    userData.roles[uw.webtool.id] = [];
                }
                const roleExists = userData.roles[uw.webtool.id].some(r => r.id === uw.role.id);
                if (!roleExists) {
                    userData.roles[uw.webtool.id].push({
                        id: uw.role.id,
                        name: uw.role.roles,
                        privileges: uw.role.privileges
                    });
                }
            }
        }
        return Array.from(userMap.values());
    }
    findOne(id) {
        return this.userWebtoolRepository.findOne({
            where: { id },
            relations: ['webtool', 'role']
        });
    }
    async remove(email, webtoolId) {
        await this.userWebtoolRepository.delete({ email, webtoolId });
    }
    async createExternalAssignment(dto) {
        const webtool = await this.webtoolRepository.findOne({
            where: { id: dto.webtoolId }
        });
        if (!webtool) {
            throw new common_1.NotFoundException(`Webtool with ID ${dto.webtoolId} not found`);
        }
        const roles = await this.roleRepository.find({
            where: {
                id: (0, typeorm_2.In)(dto.roleIds),
                webtool: { id: dto.webtoolId }
            },
            relations: ['webtool']
        });
        if (roles.length !== dto.roleIds.length) {
            throw new common_1.NotFoundException('Some roles were not found or do not belong to this webtool');
        }
        await this.userWebtoolRepository.delete({
            email: dto.email,
            webtoolId: dto.webtoolId
        });
        const userWebtools = dto.roleIds.map(roleId => this.userWebtoolRepository.create({
            email: dto.email,
            userName: dto.userName,
            department: dto.department,
            webtoolId: dto.webtoolId,
            roleId: roleId,
            isActive: true,
            lastActiveAt: new Date()
        }));
        const saved = await this.userWebtoolRepository.save(userWebtools);
        return {
            success: true,
            message: 'User assignments created successfully',
            data: {
                email: dto.email,
                userName: dto.userName,
                webtool: webtool.webtool,
                roles: roles.map(role => ({
                    id: role.id,
                    name: role.roles
                })),
                isActive: true
            }
        };
    }
    async deleteExternalAssignment(dto) {
        await this.userWebtoolRepository.delete({
            email: dto.email,
            webtoolId: dto.webtoolId
        });
        return {
            success: true,
            message: 'User assignments deleted successfully',
            data: {
                email: dto.email,
                webtoolId: dto.webtoolId
            }
        };
    }
    async updateActiveStatus(email, webtoolId, isActive) {
        await this.userWebtoolRepository.update({ email, webtoolId }, {
            isActive,
            lastActiveAt: isActive ? null : new Date()
        });
    }
    async update(id, updateDto) {
        const updateData = { ...updateDto };
        if (updateDto.isActive !== undefined) {
            updateData.lastActiveAt = updateDto.isActive ?
                null : new Date().toISOString();
        }
        await this.userWebtoolRepository.update(id, updateData);
        return this.userWebtoolRepository.findOne({
            where: { id },
            relations: ['webtool', 'role']
        });
    }
    async findAllRaw() {
        return this.userWebtoolRepository.find({
            where: { isActive: true },
            relations: ['webtool', 'role']
        });
    }
};
exports.UserWebtoolService = UserWebtoolService;
exports.UserWebtoolService = UserWebtoolService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_webtool_entity_1.UserWebtool)),
    __param(1, (0, typeorm_1.InjectRepository)(webtool_entity_1.Webtool)),
    __param(2, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UserWebtoolService);
//# sourceMappingURL=user-webtool.service.js.map