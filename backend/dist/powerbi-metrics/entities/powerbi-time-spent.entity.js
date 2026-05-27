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
exports.PowerBITimeSpent = void 0;
const typeorm_1 = require("typeorm");
let PowerBITimeSpent = class PowerBITimeSpent {
};
exports.PowerBITimeSpent = PowerBITimeSpent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PowerBITimeSpent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PowerBITimeSpent.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PowerBITimeSpent.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PowerBITimeSpent.prototype, "reportName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PowerBITimeSpent.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PowerBITimeSpent.prototype, "workspaceName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PowerBITimeSpent.prototype, "tabName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], PowerBITimeSpent.prototype, "durationSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], PowerBITimeSpent.prototype, "timestamp", void 0);
exports.PowerBITimeSpent = PowerBITimeSpent = __decorate([
    (0, typeorm_1.Entity)()
], PowerBITimeSpent);
//# sourceMappingURL=powerbi-time-spent.entity.js.map