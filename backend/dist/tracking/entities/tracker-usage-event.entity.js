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
exports.TrackerUsageEvent = void 0;
const typeorm_1 = require("typeorm");
let TrackerUsageEvent = class TrackerUsageEvent {
};
exports.TrackerUsageEvent = TrackerUsageEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TrackerUsageEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_id', type: 'uuid' }),
    __metadata("design:type", String)
], TrackerUsageEvent.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TrackerUsageEvent.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dashboard_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TrackerUsageEvent.prototype, "dashboardId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tab_name', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TrackerUsageEvent.prototype, "tabName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_type', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], TrackerUsageEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TrackerUsageEvent.prototype, "eventData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], TrackerUsageEvent.prototype, "createdAt", void 0);
exports.TrackerUsageEvent = TrackerUsageEvent = __decorate([
    (0, typeorm_1.Entity)({ name: 'tracker_usage_events' }),
    (0, typeorm_1.Index)(['sessionId']),
    (0, typeorm_1.Index)(['userId', 'createdAt'])
], TrackerUsageEvent);
//# sourceMappingURL=tracker-usage-event.entity.js.map