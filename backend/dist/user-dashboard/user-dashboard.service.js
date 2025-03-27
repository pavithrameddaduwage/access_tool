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
exports.UserDashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_dashboard_entity_1 = require("./entities/user-dashboard.entity");
const dashboard_entity_1 = require("../dashboard/entities/dashboard.entity");
let UserDashboardService = class UserDashboardService {
    constructor(userDashboardRepository, dashboardRepository) {
        this.userDashboardRepository = userDashboardRepository;
        this.dashboardRepository = dashboardRepository;
    }
    async findAll() {
        const results = await this.userDashboardRepository.find({
            relations: ['dashboard']
        });
        const groupedResults = results.reduce((acc, curr) => {
            const { email } = curr;
            if (!acc[email]) {
                acc[email] = {
                    userName: curr.userName,
                    email: curr.email,
                    department: curr.department,
                    isActive: curr.isActive,
                    lastActiveAt: curr.lastActiveAt,
                    dashboards: []
                };
            }
            acc[email].dashboards.push(curr.dashboard.dashboard);
            return acc;
        }, {});
        return Object.values(groupedResults);
    }
    async findOne(email) {
        const assignments = await this.userDashboardRepository.find({
            where: { email },
            relations: ['dashboard']
        });
        if (!assignments.length) {
            throw new common_1.NotFoundException(`No dashboard assignments found for user ${email}`);
        }
        return {
            email: assignments[0].email,
            userName: assignments[0].userName,
            department: assignments[0].department,
            isActive: assignments[0].isActive,
            lastActiveAt: assignments[0].lastActiveAt,
            dashboards: assignments.map(a => a.dashboard.dashboard)
        };
    }
    async create(createUserDashboardDto) {
        const { email } = createUserDashboardDto;
        const existingUser = await this.userDashboardRepository.findOne({
            where: { email }
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const { userName, department, dashboardIds } = createUserDashboardDto;
        const userDashboards = await Promise.all(dashboardIds.map(async (dashboardId) => {
            return this.userDashboardRepository.create({
                email,
                userName,
                department,
                dashboardId
            });
        }));
        await this.userDashboardRepository.save(userDashboards);
        return this.findOne(email);
    }
    async update(email, updateUserDashboardDto) {
        const { dashboardIds, userName, department, isActive } = updateUserDashboardDto;
        await this.userDashboardRepository.delete({ email });
        if (dashboardIds && dashboardIds.length > 0) {
            const userDashboards = dashboardIds.map(dashboardId => {
                return this.userDashboardRepository.create({
                    email,
                    userName,
                    department,
                    dashboardId,
                    isActive: isActive ?? true,
                    ...(isActive === false && { lastActiveAt: new Date() })
                });
            });
            await this.userDashboardRepository.save(userDashboards);
        }
        return this.findOne(email);
    }
    async remove(email) {
        await this.userDashboardRepository.delete({ email });
    }
};
exports.UserDashboardService = UserDashboardService;
exports.UserDashboardService = UserDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_dashboard_entity_1.UserDashboard)),
    __param(1, (0, typeorm_1.InjectRepository)(dashboard_entity_1.Dashboard)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UserDashboardService);
//# sourceMappingURL=user-dashboard.service.js.map