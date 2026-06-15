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
exports.SyncLogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pbi_sync_log_entity_1 = require("./entities/pbi-sync-log.entity");
let SyncLogService = class SyncLogService {
    constructor(syncLogRepository) {
        this.syncLogRepository = syncLogRepository;
    }
    async createLog(syncType, syncDate) {
        const log = new pbi_sync_log_entity_1.PbiSyncLog();
        log.syncType = syncType;
        log.syncDate = syncDate || null;
        log.status = 'pending';
        log.eventsPulled = 0;
        return this.syncLogRepository.save(log);
    }
    async updateLog(id, status, eventsPulled = 0, errorMessage) {
        const log = await this.syncLogRepository.findOne({ where: { id } });
        if (!log) {
            throw new Error(`Sync log with ID ${id} not found`);
        }
        log.status = status;
        log.eventsPulled = eventsPulled;
        log.errorMessage = errorMessage || null;
        log.completedAt = new Date();
        return this.syncLogRepository.save(log);
    }
    async getStatus() {
        return this.syncLogRepository.find({
            order: { startedAt: 'DESC' },
            take: 90,
        });
    }
    async findSuccessLog(syncType, syncDate) {
        return this.syncLogRepository.findOne({
            where: {
                syncType,
                syncDate,
                status: 'success',
            },
        });
    }
};
exports.SyncLogService = SyncLogService;
exports.SyncLogService = SyncLogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pbi_sync_log_entity_1.PbiSyncLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SyncLogService);
//# sourceMappingURL=sync-log.service.js.map