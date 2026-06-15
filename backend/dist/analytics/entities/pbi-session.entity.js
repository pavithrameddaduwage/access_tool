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
exports.PbiSession = void 0;
const typeorm_1 = require("typeorm");
let PbiSession = class PbiSession {
};
exports.PbiSession = PbiSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PbiSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], PbiSession.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_email', nullable: true }),
    __metadata("design:type", String)
], PbiSession.prototype, "userEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', nullable: true }),
    __metadata("design:type", String)
], PbiSession.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_name', nullable: true }),
    __metadata("design:type", String)
], PbiSession.prototype, "reportName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', nullable: true }),
    __metadata("design:type", String)
], PbiSession.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_start', type: 'timestamp' }),
    __metadata("design:type", Date)
], PbiSession.prototype, "sessionStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_end', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], PbiSession.prototype, "sessionEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_seconds', nullable: true }),
    __metadata("design:type", Number)
], PbiSession.prototype, "durationSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'idle_capped', default: false }),
    __metadata("design:type", Boolean)
], PbiSession.prototype, "idleCapped", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_count', default: 1 }),
    __metadata("design:type", Number)
], PbiSession.prototype, "eventCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], PbiSession.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PbiSession.prototype, "createdAt", void 0);
exports.PbiSession = PbiSession = __decorate([
    (0, typeorm_1.Entity)({ name: 'sessions' }),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['reportId']),
    (0, typeorm_1.Index)(['workspaceId']),
    (0, typeorm_1.Index)(['date'])
], PbiSession);
//# sourceMappingURL=pbi-session.entity.js.map