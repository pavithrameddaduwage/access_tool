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
exports.TrackerSession = void 0;
const typeorm_1 = require("typeorm");
let TrackerSession = class TrackerSession {
};
exports.TrackerSession = TrackerSession;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], TrackerSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TrackerSession.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dashboard_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TrackerSession.prototype, "dashboardId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tab_name', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TrackerSession.prototype, "tabName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TrackerSession.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engaged_seconds', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TrackerSession.prototype, "engagedSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'click_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TrackerSession.prototype, "clickCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scroll_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TrackerSession.prototype, "scrollCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'copy_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TrackerSession.prototype, "copyCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'keydown_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TrackerSession.prototype, "keydownCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'select_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TrackerSession.prototype, "selectCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], TrackerSession.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'idle_expired', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TrackerSession.prototype, "idleExpired", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], TrackerSession.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_flush_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], TrackerSession.prototype, "lastFlushAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ended_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], TrackerSession.prototype, "endedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], TrackerSession.prototype, "createdAt", void 0);
exports.TrackerSession = TrackerSession = __decorate([
    (0, typeorm_1.Entity)({ name: 'tracker_sessions' }),
    (0, typeorm_1.Index)(['userId', 'startedAt']),
    (0, typeorm_1.Index)(['dashboardId', 'startedAt'])
], TrackerSession);
//# sourceMappingURL=tracker-session.entity.js.map