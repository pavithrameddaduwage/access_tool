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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const login_event_entity_1 = require("./entities/login-event.entity");
const date_fns_1 = require("date-fns");
let AnalyticsService = class AnalyticsService {
    constructor(loginEventRepository) {
        this.loginEventRepository = loginEventRepository;
    }
    async getDailyLogins(days = 30, webtool) {
        console.log(`Getting daily logins for ${days} days, webtool: ${webtool}`);
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository.createQueryBuilder('login')
            .select("DATE(login.loginTime)", "date")
            .addSelect('COUNT(*)', 'count')
            .where('login.loginTime >= :startDate', { startDate });
        if (webtool) {
            console.log(`Filtering by webtool: ${webtool}`);
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        const result = await query
            .groupBy("DATE(login.loginTime)")
            .orderBy("DATE(login.loginTime)", "ASC")
            .getRawMany();
        console.log(`Daily logins query result:`, result);
        return result;
    }
    async getLoginsByHour(webtool) {
        const query = this.loginEventRepository.createQueryBuilder('login')
            .select('EXTRACT(HOUR FROM login.loginTime)', 'hour')
            .addSelect('COUNT(*)', 'count');
        if (webtool) {
            query.where('login.webtool = :webtool', { webtool });
        }
        return query
            .groupBy('EXTRACT(HOUR FROM login.loginTime)')
            .orderBy('EXTRACT(HOUR FROM login.loginTime)', 'ASC')
            .getRawMany();
    }
    async getLoginsByDayOfWeek(webtool) {
        const query = this.loginEventRepository.createQueryBuilder('login')
            .select('EXTRACT(DOW FROM login.loginTime)', 'day')
            .addSelect('COUNT(*)', 'count');
        if (webtool) {
            query.where('login.webtool = :webtool', { webtool });
        }
        return query
            .groupBy('EXTRACT(DOW FROM login.loginTime)')
            .orderBy('EXTRACT(DOW FROM login.loginTime)', 'ASC')
            .getRawMany();
    }
    async getSummary(days = 30, webtool) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const [totalLogins, activeUsers] = await Promise.all([
            this.loginEventRepository.count({
                where: {
                    loginTime: (0, typeorm_2.MoreThanOrEqual)(startDate),
                    ...(webtool && { webtool })
                }
            }),
            this.loginEventRepository.createQueryBuilder('login')
                .select('COUNT(DISTINCT login.email)', 'count')
                .where('login.loginTime >= :startDate', { startDate })
                .andWhere(webtool ? 'login.webtool = :webtool' : '1=1', { webtool })
                .getRawOne()
                .then(res => parseInt(res.count, 10))
        ]);
        return {
            totalLogins,
            activeUsers
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(login_event_entity_1.LoginEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map