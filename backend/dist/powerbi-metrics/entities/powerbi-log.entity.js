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
exports.PowerBILog = void 0;
const typeorm_1 = require("typeorm");
let PowerBILog = class PowerBILog {
};
exports.PowerBILog = PowerBILog;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], PowerBILog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PowerBILog.prototype, "recordType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], PowerBILog.prototype, "creationTime", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PowerBILog.prototype, "operation", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PowerBILog.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PowerBILog.prototype, "userType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PowerBILog.prototype, "userKey", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PowerBILog.prototype, "workload", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PowerBILog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "clientIP", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "activity", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "itemName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "workSpaceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "datasetName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "reportName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "capacityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "capacityName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PowerBILog.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "objectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "datasetId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PowerBILog.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "artifactId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "artifactName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], PowerBILog.prototype, "isSuccess", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "reportType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "requestId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "activityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "distributionMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "consumptionMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBILog.prototype, "artifactKind", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], PowerBILog.prototype, "refreshEnforcementPolicy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], PowerBILog.prototype, "billingType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PowerBILog.prototype, "storedAt", void 0);
exports.PowerBILog = PowerBILog = __decorate([
    (0, typeorm_1.Entity)()
], PowerBILog);
//# sourceMappingURL=powerbi-log.entity.js.map