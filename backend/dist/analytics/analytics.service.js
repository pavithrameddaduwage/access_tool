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
    async getLoginEvents() {
        return this.loginEventRepository.find({
            order: {
                loginTime: 'DESC'
            }
        });
    }
    async getUserStats(email, webtool, days = 30) {
        const normalizedEmail = email.toLowerCase().trim();
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const baseQuery = this.loginEventRepository
            .createQueryBuilder('login')
            .where('LOWER(login.email) = LOWER(:email)', { email: normalizedEmail })
            .andWhere('login.loginTime >= :startDate', { startDate });
        if (webtool) {
            baseQuery.andWhere('login.webtool = :webtool', { webtool });
        }
        const [totalLogins, dailyLogins, loginsByHour, loginsByDay, webtoolUsage, lastLogin, peakHourData] = await Promise.all([
            baseQuery.getCount(),
            this.getDailyLogins(days, webtool, normalizedEmail),
            this.getLoginsByHour(days, webtool, normalizedEmail),
            this.getLoginsByDayOfWeek(days, webtool, normalizedEmail),
            this.loginEventRepository
                .createQueryBuilder('login')
                .select('login.webtool', 'webtool')
                .addSelect('COUNT(*)', 'count')
                .where('LOWER(login.email) = LOWER(:email)', { email: normalizedEmail })
                .andWhere('login.loginTime >= :startDate', { startDate })
                .groupBy('login.webtool')
                .orderBy('count', 'DESC')
                .getRawMany(),
            baseQuery
                .orderBy('login.loginTime', 'DESC')
                .getOne(),
            baseQuery
                .select('EXTRACT(HOUR FROM login.loginTime)', 'hour')
                .addSelect('COUNT(*)', 'count')
                .groupBy('EXTRACT(HOUR FROM login.loginTime)')
                .orderBy('count', 'DESC')
                .limit(1)
                .getRawOne()
        ]);
        return {
            username: normalizedEmail.split('@')[0],
            email: normalizedEmail,
            department: lastLogin?.department || 'Unknown',
            totalLogins,
            mostUsedWebtool: webtoolUsage[0]?.webtool || 'N/A',
            lastLogin: lastLogin?.loginTime || null,
            peakHour: peakHourData ? `${peakHourData.hour}:00` : 'N/A',
            dailyLogins,
            loginsByHour,
            loginsByDay,
            webtoolUsage
        };
    }
    async getSummary(days = 30, webtool, email) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const whereClause = {
            loginTime: (0, typeorm_2.MoreThanOrEqual)(startDate),
            ...(webtool && { webtool }),
            ...(email && { email })
        };
        const [totalLogins, activeUsers] = await Promise.all([
            this.loginEventRepository.count({ where: whereClause }),
            email ? 1 : this.loginEventRepository.createQueryBuilder('login')
                .select('COUNT(DISTINCT login.email)', 'count')
                .where('login.loginTime >= :startDate', { startDate })
                .andWhere(webtool ? 'login.webtool = :webtool' : '1=1', { webtool })
                .getRawOne()
                .then(res => parseInt(res.count, 10))
        ]);
        return {
            totalLogins,
            activeUsers: email ? 1 : activeUsers
        };
    }
    async getDailyLogins(days = 30, webtool, email) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository.createQueryBuilder('login')
            .select("DATE(login.loginTime)", "date")
            .addSelect('COUNT(*)', 'count')
            .where('login.loginTime >= :startDate', { startDate });
        if (webtool) {
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        if (email) {
            query.andWhere('LOWER(login.email) = LOWER(:email)', { email });
        }
        return query
            .groupBy("DATE(login.loginTime)")
            .orderBy("DATE(login.loginTime)", "ASC")
            .getRawMany();
    }
    async getLoginsByHour(days = 30, webtool, email) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository.createQueryBuilder('login')
            .select('EXTRACT(HOUR FROM login.loginTime)', 'hour')
            .addSelect('COUNT(*)', 'count')
            .where('login.loginTime >= :startDate', { startDate });
        if (webtool) {
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        if (email) {
            query.andWhere('LOWER(login.email) = LOWER(:email)', { email });
        }
        return query
            .groupBy('EXTRACT(HOUR FROM login.loginTime)')
            .orderBy('EXTRACT(HOUR FROM login.loginTime)', 'ASC')
            .getRawMany();
    }
    async getLoginsByDayOfWeek(days = 30, webtool, email) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository.createQueryBuilder('login')
            .select('EXTRACT(DOW FROM login.loginTime)', 'day')
            .addSelect('COUNT(*)', 'count')
            .where('login.loginTime >= :startDate', { startDate });
        if (webtool) {
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        if (email) {
            query.andWhere('LOWER(login.email) = LOWER(:email)', { email });
        }
        return query
            .groupBy('EXTRACT(DOW FROM login.loginTime)')
            .orderBy('EXTRACT(DOW FROM login.loginTime)', 'ASC')
            .getRawMany();
    }
    async getDepartmentLoginStats(days = 30, webtool, email) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository.createQueryBuilder('login')
            .select('login.department', 'department')
            .addSelect('COUNT(*)', 'logins')
            .where('login.loginTime >= :startDate', { startDate });
        if (webtool) {
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        if (email) {
            query.andWhere('login.email ILIKE :email', { email: email.toLowerCase() });
        }
        return query
            .groupBy('login.department')
            .orderBy('logins', 'DESC')
            .getRawMany();
    }
    async getDepartmentHourlyLogins(days = 30, webtool, email) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository.createQueryBuilder('login')
            .select('login.department', 'department')
            .addSelect('EXTRACT(HOUR FROM login.loginTime)', 'hour')
            .addSelect('COUNT(*)', 'count')
            .where('login.loginTime >= :startDate', { startDate });
        if (webtool) {
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        if (email) {
            query.andWhere('login.email ILIKE :email', { email: email.toLowerCase() });
        }
        return query
            .groupBy('login.department, EXTRACT(HOUR FROM login.loginTime)')
            .orderBy('department, hour')
            .getRawMany();
    }
    async getDepartmentDailyLogins(days = 30, webtool, email) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository.createQueryBuilder('login')
            .select('login.department', 'department')
            .addSelect('DATE(login.loginTime)', 'date')
            .addSelect('COUNT(*)', 'count')
            .where('login.loginTime >= :startDate', { startDate });
        if (webtool) {
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        if (email) {
            query.andWhere('login.email ILIKE :email', { email: email.toLowerCase() });
        }
        return query
            .groupBy('login.department, DATE(login.loginTime)')
            .orderBy('department, date')
            .getRawMany();
    }
    async getUserWebtoolStats(email, days = 30) {
        const normalizedEmail = email.toLowerCase().trim();
        const results = await this.loginEventRepository
            .createQueryBuilder('login')
            .select('login.webtool', 'webtool')
            .addSelect('COUNT(*)', 'count')
            .addSelect('MAX(login.loginTime)', 'lastLogin')
            .where('LOWER(login.email) = LOWER(:email)', { email: normalizedEmail })
            .andWhere('login.loginTime >= :startDate', {
            startDate: (0, date_fns_1.subDays)(new Date(), days)
        })
            .groupBy('login.webtool')
            .orderBy('count', 'DESC')
            .getRawMany();
        return results.map(r => ({
            webtool: r.webtool,
            count: parseInt(r.count),
            lastLogin: r.lastLogin ? new Date(r.lastLogin) : null
        }));
    }
    async getTopActiveUsers(days = 30, webtool) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository.createQueryBuilder('login')
            .select('LOWER(login.email)', 'email')
            .addSelect('COUNT(*)', 'count')
            .where('login.loginTime >= :startDate', { startDate });
        if (webtool && webtool !== 'all') {
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        return query
            .groupBy('LOWER(login.email)')
            .orderBy('count', 'DESC')
            .limit(5)
            .getRawMany();
    }
    async getTopUsedWebtools(days = 30, email) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository.createQueryBuilder('login')
            .select('login.webtool', 'webtool')
            .addSelect('COUNT(*)', 'count')
            .where('login.loginTime >= :startDate', { startDate });
        if (email && email !== 'All') {
            query.andWhere('LOWER(login.email) = LOWER(:email)', { email });
        }
        return query
            .groupBy('login.webtool')
            .orderBy('count', 'DESC')
            .limit(5)
            .getRawMany();
    }
    async getPeakHourUsers(hour, days = 30, webtool) {
        const startDate = (0, date_fns_1.subDays)(new Date(), days);
        const query = this.loginEventRepository
            .createQueryBuilder('login')
            .select('login.email', 'email')
            .addSelect('COUNT(*)', 'count')
            .addSelect('MAX(login.loginTime)', 'lastLogin')
            .where('EXTRACT(HOUR FROM login.loginTime) = :hour', { hour })
            .andWhere('login.loginTime >= :startDate', { startDate });
        if (webtool) {
            query.andWhere('login.webtool = :webtool', { webtool });
        }
        const results = await query
            .groupBy('login.email')
            .orderBy('count', 'DESC')
            .getRawMany();
        return results.map(r => ({
            email: r.email,
            count: parseInt(r.count),
            lastLogin: r.lastLogin ? new Date(r.lastLogin) : null
        }));
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(login_event_entity_1.LoginEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map