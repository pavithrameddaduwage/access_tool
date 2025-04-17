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
exports.WebtoolUserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_webtool_entity_1 = require("../user-webtool/entities/user-webtool.entity");
let WebtoolUserService = class WebtoolUserService {
    constructor(webtoolUserRepository) {
        this.webtoolUserRepository = webtoolUserRepository;
    }
    async findAll() {
        const userWebtools = await this.webtoolUserRepository.find({
            relations: ['webtool', 'role']
        });
        const userMap = new Map();
        userWebtools.forEach(uw => {
            if (!userMap.has(uw.email)) {
                userMap.set(uw.email, {
                    userId: uw.id,
                    userName: uw.userName,
                    email: uw.email,
                    department: uw.department,
                    roles: [],
                    webtools: [],
                    isActive: uw.isActive,
                    lastActiveAt: uw.lastActiveAt
                });
            }
            const userData = userMap.get(uw.email);
            if (uw.webtool && !userData.webtools.includes(uw.webtool.webtool)) {
                userData.webtools.push(uw.webtool.webtool);
            }
            if (uw.role && !userData.roles.some(r => r.id === uw.role.id)) {
                userData.roles.push({
                    id: uw.role.id,
                    name: uw.role.roles,
                    privileges: uw.role.privileges
                });
            }
        });
        return Array.from(userMap.values());
    }
    async create(createWebtoolUserDto) {
        const webtoolUser = this.webtoolUserRepository.create({
            email: createWebtoolUserDto.email,
            userName: createWebtoolUserDto.userName,
            department: createWebtoolUserDto.department,
            webtoolId: createWebtoolUserDto.webtoolId,
            roleId: createWebtoolUserDto.roleIds[0]
        });
        const saved = await this.webtoolUserRepository.save(webtoolUser);
        return this.findOne(saved.id);
    }
    async findOne(id) {
        return this.webtoolUserRepository.findOne({
            where: { id },
            relations: ['webtool', 'role']
        });
    }
    async remove(email, webtoolId) {
        const result = await this.webtoolUserRepository.delete({
            email,
            webtoolId,
        });
        if (result.affected === 0) {
            throw new Error(`No user-webtool record found for email: ${email} and webtoolId: ${webtoolId}`);
        }
        return `User-webtool relationship for email: ${email} and webtoolId: ${webtoolId} has been removed.`;
    }
};
exports.WebtoolUserService = WebtoolUserService;
exports.WebtoolUserService = WebtoolUserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_webtool_entity_1.UserWebtool)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WebtoolUserService);
//# sourceMappingURL=webtool-user.service.js.map