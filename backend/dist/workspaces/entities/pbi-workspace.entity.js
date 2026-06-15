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
exports.PbiWorkspace = void 0;
const typeorm_1 = require("typeorm");
let PbiWorkspace = class PbiWorkspace {
};
exports.PbiWorkspace = PbiWorkspace;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PbiWorkspace.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', unique: true }),
    __metadata("design:type", String)
], PbiWorkspace.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PbiWorkspace.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PbiWorkspace.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PbiWorkspace.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_on_dedicated_capacity', default: false }),
    __metadata("design:type", Boolean)
], PbiWorkspace.prototype, "isOnDedicatedCapacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'capacity_id', nullable: true }),
    __metadata("design:type", String)
], PbiWorkspace.prototype, "capacityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], PbiWorkspace.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PbiWorkspace.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'synced_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PbiWorkspace.prototype, "syncedAt", void 0);
exports.PbiWorkspace = PbiWorkspace = __decorate([
    (0, typeorm_1.Entity)({ name: 'workspaces' })
], PbiWorkspace);
//# sourceMappingURL=pbi-workspace.entity.js.map