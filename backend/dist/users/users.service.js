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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const role_master_entity_1 = require("./entities/role_master.entity");
const user_roles_entity_1 = require("./entities/user_roles.entity");
let UsersService = class UsersService {
    constructor(userRepository, roleRepository, userrolesRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userrolesRepository = userrolesRepository;
    }
    async create(createUserDto) {
        createUserDto.email = createUserDto.email.toLowerCase();
        const existingUser = await this.userRepository.findOne({
            where: { email: createUserDto.email }
        });
        if (existingUser) {
            throw new common_1.ConflictException(`User with email "${createUserDto.email}" already exists`);
        }
        try {
            const newuser = new user_entity_1.User();
            newuser.email = createUserDto.email;
            newuser.name = createUserDto.name;
            newuser.is_active = createUserDto.is_active;
            const savedUser = await this.userRepository.save(newuser);
            if (createUserDto.user_roles?.length > 0) {
                await this.validateRoles(createUserDto.user_roles.map(ur => ur.roleId));
                const userRoles = createUserDto.user_roles.map(ur => {
                    const userRole = new user_roles_entity_1.UserRoles();
                    userRole.user = savedUser;
                    userRole.role = { id: ur.roleId };
                    return userRole;
                });
                await this.userrolesRepository.save(userRoles);
            }
            return this.findUserById(savedUser.id);
        }
        catch (error) {
            if (error.code === '23505') {
                throw new common_1.ConflictException(`User with email "${createUserDto.email}" already exists`);
            }
            throw error;
        }
    }
    async validateRoles(roleIds) {
        const roles = await this.roleRepository.findByIds(roleIds);
        const missingRoles = roleIds.filter(id => !roles.find(r => r.id === id));
        if (missingRoles.length > 0) {
            throw new common_1.NotFoundException(`Roles with IDs ${missingRoles.join(', ')} not found`);
        }
    }
    async update(id, updateUserDto) {
        if (updateUserDto.email) {
            updateUserDto.email = updateUserDto.email.toLowerCase();
        }
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['user_roles']
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.userRepository.findOne({
                where: { email: updateUserDto.email }
            });
            if (existingUser) {
                throw new common_1.ConflictException(`User with email "${updateUserDto.email}" already exists`);
            }
        }
        try {
            if (updateUserDto.email)
                user.email = updateUserDto.email;
            if (updateUserDto.name)
                user.name = updateUserDto.name;
            if (typeof updateUserDto.is_active === 'boolean')
                user.is_active = updateUserDto.is_active;
            await this.userRepository.save(user);
            if (updateUserDto.user_roles) {
                await this.validateRoles(updateUserDto.user_roles.map(ur => ur.roleId));
                await this.userrolesRepository.delete({ user: { id } });
                const newUserRoles = updateUserDto.user_roles.map(ur => {
                    const userRole = new user_roles_entity_1.UserRoles();
                    userRole.user = user;
                    userRole.role = { id: ur.roleId };
                    return userRole;
                });
                await this.userrolesRepository.save(newUserRoles);
            }
            return this.findUserById(id);
        }
        catch (error) {
            if (error.code === '23505') {
                throw new common_1.ConflictException(`User with email "${updateUserDto.email}" already exists`);
            }
            throw error;
        }
    }
    findAll() {
        return this.userRepository.find({
            relations: {
                user_roles: {
                    role: true
                }
            },
            order: {
                id: 'ASC',
                user_roles: {
                    role: {
                        id: 'ASC'
                    }
                }
            }
        });
    }
    findAllRoles() {
        return this.roleRepository.find();
    }
    async findUserById(id) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['user_roles', 'user_roles.role']
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    findUserByEmail(email) {
        return this.userRepository.findOne({
            where: {
                email: email.toLowerCase(),
                is_active: true
            },
            relations: ['user_roles.role'],
            order: {
                user_roles: {
                    role: {
                        id: 'ASC'
                    }
                }
            }
        });
    }
    async searchLocalUsers(query) {
        const users = await this.userRepository
            .createQueryBuilder('user')
            .where('user.name ILIKE :query OR user.email ILIKE :query', { query: `%${query}%` })
            .getMany();
        const formatted = [];
        for (const u of users) {
            const userDash = await this.userRepository.manager.getRepository('UserDashboard').findOne({
                where: { email: u.email }
            });
            formatted.push({
                name: u.name || u.email.split('@')[0],
                email: u.email,
                department: userDash?.department || null
            });
        }
        return formatted;
    }
    async remove(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        await this.userrolesRepository.delete({ user: { id } });
        await this.userRepository.remove(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_master_entity_1.RoleMaster)),
    __param(2, (0, typeorm_1.InjectRepository)(user_roles_entity_1.UserRoles)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map