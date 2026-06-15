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
exports.PbiActivityEvent = void 0;
const typeorm_1 = require("typeorm");
let PbiActivityEvent = class PbiActivityEvent {
};
exports.PbiActivityEvent = PbiActivityEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_id', unique: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "eventId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_email', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "userEmail", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "operation", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "activity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_name', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "workspaceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_name', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "reportName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_type', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "reportType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dashboard_id', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "dashboardId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dashboard_name', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "dashboardName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dataset_id', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "datasetId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dataset_name', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "datasetName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_ip', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "clientIp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_success', default: true }),
    __metadata("design:type", Boolean)
], PbiActivityEvent.prototype, "isSuccess", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'distribution_method', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "distributionMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'consumption_method', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "consumptionMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'creation_time', type: 'timestamp' }),
    __metadata("design:type", Date)
], PbiActivityEvent.prototype, "creationTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'request_id', nullable: true }),
    __metadata("design:type", String)
], PbiActivityEvent.prototype, "requestId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'raw_json', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PbiActivityEvent.prototype, "rawJson", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'pulled_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PbiActivityEvent.prototype, "pulledAt", void 0);
exports.PbiActivityEvent = PbiActivityEvent = __decorate([
    (0, typeorm_1.Entity)({ name: 'activity_events' }),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['operation']),
    (0, typeorm_1.Index)(['reportId']),
    (0, typeorm_1.Index)(['workspaceId']),
    (0, typeorm_1.Index)(['creationTime']),
    (0, typeorm_1.Index)(['userId', 'creationTime'])
], PbiActivityEvent);
//# sourceMappingURL=pbi-activity-event.entity.js.map