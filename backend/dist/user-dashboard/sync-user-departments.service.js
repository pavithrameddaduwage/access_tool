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
exports.SyncUserDepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_dashboard_entity_1 = require("./entities/user-dashboard.entity");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let SyncUserDepartmentsService = class SyncUserDepartmentsService {
    constructor(userDashboardRepository, httpService) {
        this.userDashboardRepository = userDashboardRepository;
        this.httpService = httpService;
        this.url = `http://localhost:${process.env.PORT || 4006}/auth`;
    }
    async syncDepartments() {
        const uniqueEmails = await this.userDashboardRepository
            .createQueryBuilder('user')
            .select('DISTINCT user.email', 'email')
            .where('user.email IS NOT NULL')
            .getRawMany();
        let updatedCount = 0;
        for (const { email } of uniqueEmails) {
            try {
                const adUserResponse = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.url}/searchUsers`, {
                    searchkey: email
                }));
                const adUsers = Array.isArray(adUserResponse.data) ? adUserResponse.data : [];
                const adUser = adUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
                if (adUser && adUser.department) {
                    const result = await this.userDashboardRepository
                        .createQueryBuilder()
                        .update(user_dashboard_entity_1.UserDashboard)
                        .set({ department: adUser.department })
                        .where('email = :email', { email })
                        .andWhere('department != :newDepartment', {
                        newDepartment: adUser.department
                    })
                        .execute();
                    if (result.affected && result.affected > 0) {
                        updatedCount += result.affected;
                        console.log(`Updated department for ${email} to ${adUser.department}`);
                    }
                }
            }
            catch (error) {
                console.error(`Error syncing department for ${email}:`, error.message);
            }
        }
        return {
            totalUsersChecked: uniqueEmails.length,
            usersUpdated: updatedCount,
        };
    }
};
exports.SyncUserDepartmentsService = SyncUserDepartmentsService;
exports.SyncUserDepartmentsService = SyncUserDepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_dashboard_entity_1.UserDashboard)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        axios_1.HttpService])
], SyncUserDepartmentsService);
//# sourceMappingURL=sync-user-departments.service.js.map