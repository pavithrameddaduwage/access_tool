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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PbiSyncLog = void 0;
const typeorm_1 = require("typeorm");
let PbiSyncLog = class PbiSyncLog {
};
exports.PbiSyncLog = PbiSyncLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PbiSyncLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sync_type' }),
    __metadata("design:type", String)
], PbiSyncLog.prototype, "syncType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sync_date', type: 'date', nullable: true }),
    __metadata("design:type", String)
], PbiSyncLog.prototype, "syncDate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PbiSyncLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'events_pulled', default: 0 }),
    __metadata("design:type", Number)
], PbiSyncLog.prototype, "eventsPulled", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PbiSyncLog.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'started_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PbiSyncLog.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], PbiSyncLog.prototype, "completedAt", void 0);
exports.PbiSyncLog = PbiSyncLog = __decorate([
    (0, typeorm_1.Entity)({ name: 'sync_log' })
], PbiSyncLog);
//# sourceMappingURL=pbi-sync-log.entity.js.map