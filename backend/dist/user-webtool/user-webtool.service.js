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
const auth_service_1 = require("../auth/auth.service");
let UserWebtoolService = class UserWebtoolService {
    constructor(userWebtoolRepository, webtoolRepository, roleRepository, authService) {
        this.userWebtoolRepository = userWebtoolRepository;
        this.webtoolRepository = webtoolRepository;
        this.roleRepository = roleRepository;
        this.authService = authService;
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
    async findExistingEmail(email, webtoolId) {
        const queryBuilder = this.userWebtoolRepository.createQueryBuilder('uw')
            .select('uw.email')
            .where('LOWER(uw.email) = LOWER(:email)', { email });
        if (webtoolId) {
            queryBuilder.andWhere('uw.webtoolId = :webtoolId', { webtoolId });
        }
        const result = await queryBuilder.getOne();
        return result?.email || null;
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
        const existingEmail = await this.findExistingEmail(dto.email);
        const emailToUse = existingEmail || dto.email;
        let departmentToUse = dto.department;
        if (!departmentToUse || departmentToUse.trim() === '') {
            const existingAssignment = await this.userWebtoolRepository.findOne({
                where: { email: dto.email },
                select: ['department']
            });
            if (existingAssignment?.department) {
                departmentToUse = existingAssignment.department;
            }
            else {
                try {
                    const users = await this.authService.searchUsers(dto.email);
                    const userFromAD = users.find(u => u.email.toLowerCase() === dto.email.toLowerCase());
                    if (userFromAD?.department) {
                        departmentToUse = userFromAD.department;
                    }
                    else {
                        departmentToUse = 'Unknown';
                    }
                }
                catch (error) {
                    console.error('Failed to fetch department from AD:', error);
                    departmentToUse = 'Unknown';
                }
            }
        }
        await this.userWebtoolRepository
            .createQueryBuilder()
            .delete()
            .where('LOWER(email) = LOWER(:email)', { email: dto.email })
            .andWhere('webtoolId = :webtoolId', { webtoolId: dto.webtoolId })
            .execute();
        const isActive = dto.isActive !== undefined ? dto.isActive : true;
        const lastActiveAt = isActive ? null : new Date();
        const userWebtools = dto.roleIds.map(roleId => this.userWebtoolRepository.create({
            email: emailToUse,
            userName: dto.userName,
            department: departmentToUse,
            webtoolId: dto.webtoolId,
            roleId: roleId,
            isActive: isActive,
            lastActiveAt: lastActiveAt
        }));
        const saved = await this.userWebtoolRepository.save(userWebtools);
        const updatedAssignments = await this.userWebtoolRepository.find({
            where: { email: emailToUse, webtoolId: dto.webtoolId },
            relations: ['webtool', 'role']
        });
        return {
            success: true,
            message: 'User assignments created successfully',
            data: {
                email: emailToUse,
                userName: dto.userName,
                department: departmentToUse,
                webtool: webtool.webtool,
                roles: updatedAssignments.map(uw => ({
                    id: uw.role.id,
                    name: uw.role.roles
                })),
                isActive: isActive,
                lastActiveAt: lastActiveAt
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
    async updateExternalAssignment(dto) {
        const webtool = await this.webtoolRepository.findOne({
            where: { id: dto.webtoolId }
        });
        if (!webtool) {
            throw new common_1.NotFoundException(`Webtool with ID ${dto.webtoolId} not found`);
        }
        let existingUserDetails = null;
        if (dto.roleIdsToAdd?.length) {
            const existingAssignment = await this.userWebtoolRepository.findOne({
                where: { email: dto.email, webtoolId: dto.webtoolId },
                select: ['userName', 'department']
            });
            if (existingAssignment) {
                existingUserDetails = {
                    userName: existingAssignment.userName,
                    department: existingAssignment.department
                };
            }
            else if (!dto.userName || !dto.department) {
                throw new common_1.BadRequestException('userName and department are required when adding roles to a new user-webtool assignment');
            }
        }
        if (dto.roleIdsToAdd && dto.roleIdsToAdd.length > 0) {
            const rolesToAdd = await this.roleRepository.find({
                where: {
                    id: (0, typeorm_2.In)(dto.roleIdsToAdd),
                    webtool: { id: dto.webtoolId }
                },
                relations: ['webtool']
            });
            if (rolesToAdd.length !== dto.roleIdsToAdd.length) {
                throw new common_1.NotFoundException('Some roles to add were not found or do not belong to this webtool');
            }
            const userName = dto.userName || existingUserDetails?.userName;
            const department = dto.department || existingUserDetails?.department;
            const userWebtoolsToAdd = dto.roleIdsToAdd.map(roleId => this.userWebtoolRepository.create({
                email: dto.email,
                userName: userName,
                department: department,
                webtoolId: dto.webtoolId,
                roleId: roleId,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
                lastActiveAt: dto.isActive === false ? new Date() : null
            }));
            await this.userWebtoolRepository.save(userWebtoolsToAdd);
        }
        if (dto.roleIdsToRemove && dto.roleIdsToRemove.length > 0) {
            await this.userWebtoolRepository.delete({
                email: dto.email,
                webtoolId: dto.webtoolId,
                roleId: (0, typeorm_2.In)(dto.roleIdsToRemove)
            });
        }
        if (dto.isActive !== undefined) {
            await this.userWebtoolRepository.update({ email: dto.email, webtoolId: dto.webtoolId }, {
                isActive: dto.isActive,
                lastActiveAt: dto.isActive ? null : new Date()
            });
        }
        const updatedAssignments = await this.userWebtoolRepository.find({
            where: { email: dto.email, webtoolId: dto.webtoolId },
            relations: ['webtool', 'role']
        });
        return {
            success: true,
            message: 'User assignments updated successfully',
            data: {
                email: dto.email,
                webtool: webtool.webtool,
                roles: updatedAssignments.map(uw => ({
                    id: uw.role.id,
                    name: uw.role.roles
                })),
                isActive: dto.isActive !== undefined ? dto.isActive : undefined
            }
        };
    }
};
exports.UserWebtoolService = UserWebtoolService;
exports.UserWebtoolService = UserWebtoolService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_webtool_entity_1.UserWebtool)),
    __param(1, (0, typeorm_1.InjectRepository)(webtool_entity_1.Webtool)),
    __param(2, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => auth_service_1.AuthService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        auth_service_1.AuthService])
], UserWebtoolService);
//# sourceMappingURL=user-webtool.service.js.map