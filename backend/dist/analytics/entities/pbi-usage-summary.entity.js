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
exports.PbiUsageSummary = void 0;
const typeorm_1 = require("typeorm");
let PbiUsageSummary = class PbiUsageSummary {
};
exports.PbiUsageSummary = PbiUsageSummary;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PbiUsageSummary.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], PbiUsageSummary.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], PbiUsageSummary.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_email', nullable: true }),
    __metadata("design:type", String)
], PbiUsageSummary.prototype, "userEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', nullable: true }),
    __metadata("design:type", String)
], PbiUsageSummary.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_name', nullable: true }),
    __metadata("design:type", String)
], PbiUsageSummary.prototype, "workspaceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', nullable: true }),
    __metadata("design:type", String)
], PbiUsageSummary.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_name', nullable: true }),
    __metadata("design:type", String)
], PbiUsageSummary.prototype, "reportName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'view_count', default: 0 }),
    __metadata("design:type", Number)
], PbiUsageSummary.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'filter_count', default: 0 }),
    __metadata("design:type", Number)
], PbiUsageSummary.prototype, "filterCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'export_count', default: 0 }),
    __metadata("design:type", Number)
], PbiUsageSummary.prototype, "exportCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estimated_duration_sec', default: 0 }),
    __metadata("design:type", Number)
], PbiUsageSummary.prototype, "estimatedDurationSec", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unique_days_active', default: 1 }),
    __metadata("design:type", Number)
], PbiUsageSummary.prototype, "uniqueDaysActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PbiUsageSummary.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PbiUsageSummary.prototype, "updatedAt", void 0);
exports.PbiUsageSummary = PbiUsageSummary = __decorate([
    (0, typeorm_1.Entity)({ name: 'usage_summary' }),
    (0, typeorm_1.Unique)(['date', 'userId', 'reportId']),
    (0, typeorm_1.Index)(['date']),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['reportId']),
    (0, typeorm_1.Index)(['workspaceId'])
], PbiUsageSummary);
//# sourceMappingURL=pbi-usage-summary.entity.js.map