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
exports.PbiReport = void 0;
const typeorm_1 = require("typeorm");
let PbiReport = class PbiReport {
};
exports.PbiReport = PbiReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PbiReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_id', unique: true }),
    __metadata("design:type", String)
], PbiReport.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id' }),
    __metadata("design:type", String)
], PbiReport.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PbiReport.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_type', nullable: true }),
    __metadata("design:type", String)
], PbiReport.prototype, "reportType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'web_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PbiReport.prototype, "webUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'embed_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PbiReport.prototype, "embedUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dataset_id', nullable: true }),
    __metadata("design:type", String)
], PbiReport.prototype, "datasetId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PbiReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'synced_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PbiReport.prototype, "syncedAt", void 0);
exports.PbiReport = PbiReport = __decorate([
    (0, typeorm_1.Entity)({ name: 'reports' })
], PbiReport);
//# sourceMappingURL=pbi-report.entity.js.map