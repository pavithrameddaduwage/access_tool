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
    async getUserLoginStats(email) {
        const [totalLogins, lastLogin, loginsLast30Days] = await Promise.all([
            this.loginEventRepository.count({ where: { email } }),
            this.loginEventRepository.findOne({
                where: { email },
                order: { loginTime: 'DESC' },
            }),
            this.loginEventRepository.count({
                where: {
                    email,
                    loginTime: (0, typeorm_2.MoreThanOrEqual)((0, date_fns_1.subDays)(new Date(), 30)),
                },
            }),
        ]);
        return {
            totalLogins,
            lastLogin: lastLogin?.loginTime || null,
            loginsLast30Days,
        };
    }
    async getDepartmentUsage(days = 30, webtool) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository
            .createQueryBuilder('login')
            .select('login.department', 'department')
            .addSelect('COUNT(*)', 'count')
            .where('login.loginTime >= :startDate', { startDate });
        if (webtool) {
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        return query
            .groupBy('login.department')
            .getRawMany();
    }
    async getActiveUsers(days = 30, webtool) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository
            .createQueryBuilder('login')
            .select('COUNT(DISTINCT login.email)', 'count')
            .where('login.loginTime >= :date', { date: startDate });
        if (webtool) {
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        const result = await query.getRawOne();
        return parseInt(result.count, 10);
    }
    async getTotalLogins(days = 30, webtool) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const where = {
            loginTime: (0, typeorm_2.MoreThanOrEqual)(startDate)
        };
        if (webtool) {
            where.webtool = webtool;
        }
        return this.loginEventRepository.count({ where });
    }
    async getLoginsByWebtool(days = 30, webtool) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository
            .createQueryBuilder('login')
            .select('login.webtool', 'webtool')
            .addSelect('COUNT(*)', 'count')
            .where('login.loginTime >= :startDate', { startDate });
        if (webtool) {
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        return query
            .groupBy('login.webtool')
            .getRawMany();
    }
    async getLoginsByDayOfWeek(targetTimezone = 'America/New_York', webtool, days) {
        const query = this.loginEventRepository
            .createQueryBuilder('login')
            .select(`EXTRACT(DOW FROM timezone(:tz, login.loginTime))`, "day")
            .addSelect('COUNT(*)', 'count')
            .setParameter('tz', targetTimezone);
        if (webtool) {
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        if (days) {
            const startDate = (0, date_fns_1.subDays)(new Date(), days);
            query.andWhere('login.loginTime >= :startDate', { startDate });
        }
        return query
            .groupBy(`EXTRACT(DOW FROM timezone(:tz, login.loginTime))`)
            .orderBy(`EXTRACT(DOW FROM timezone(:tz, login.loginTime))`, "ASC")
            .getRawMany();
    }
    async getDailyLogins(days = 30, webtool) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository
            .createQueryBuilder('login')
            .select("DATE(timezone('UTC', login.loginTime))", "date")
            .addSelect('COUNT(*)', 'count')
            .where('login.loginTime >= :startDate', { startDate });
        if (webtool) {
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        return query
            .groupBy("DATE(timezone('UTC', login.loginTime))")
            .orderBy("DATE(timezone('UTC', login.loginTime))", "ASC")
            .getRawMany();
    }
    async getSummary(days = 30, webtool) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const queryConditions = {
            loginTime: (0, typeorm_2.MoreThanOrEqual)(startDate)
        };
        if (webtool) {
            queryConditions.webtool = webtool;
        }
        const [totalLogins, activeUsers] = await Promise.all([
            this.loginEventRepository.count({ where: queryConditions }),
            this.loginEventRepository.createQueryBuilder('login')
                .select('COUNT(DISTINCT login.email)', 'count')
                .where(queryConditions)
                .getRawOne()
                .then(result => parseInt(result.count, 10))
        ]);
        return {
            totalLogins,
            activeUsers
        };
    }
    async getLoginsByHour(targetTimezone = 'America/New_York', webtool, days) {
        const query = this.loginEventRepository
            .createQueryBuilder('login')
            .select(`EXTRACT(HOUR FROM timezone(:tz, login.loginTime))`, "hour")
            .addSelect('COUNT(*)', 'count')
            .setParameter('tz', targetTimezone);
        if (webtool) {
            query.andWhere('login.webtool = :webtool', { webtool });
            const exists = await this.loginEventRepository.exist({
                where: { webtool }
            });
            if (!exists) {
                return [];
            }
        }
        if (days) {
            const startDate = (0, date_fns_1.subDays)(new Date(), days);
            query.andWhere('login.loginTime >= :startDate', { startDate });
        }
        return query
            .groupBy(`EXTRACT(HOUR FROM timezone(:tz, login.loginTime))`)
            .orderBy(`EXTRACT(HOUR FROM timezone(:tz, login.loginTime))`, "ASC")
            .getRawMany();
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(login_event_entity_1.LoginEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map