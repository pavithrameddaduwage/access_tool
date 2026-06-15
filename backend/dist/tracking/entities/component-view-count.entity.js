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
exports.ComponentViewCount = void 0;
const typeorm_1 = require("typeorm");
let ComponentViewCount = class ComponentViewCount {
};
exports.ComponentViewCount = ComponentViewCount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ComponentViewCount.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ComponentViewCount.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'component_type', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], ComponentViewCount.prototype, "componentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'component_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ComponentViewCount.prototype, "componentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'component_name', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], ComponentViewCount.prototype, "componentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ComponentViewCount.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'view_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ComponentViewCount.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_viewed_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], ComponentViewCount.prototype, "lastViewedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], ComponentViewCount.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], ComponentViewCount.prototype, "updatedAt", void 0);
exports.ComponentViewCount = ComponentViewCount = __decorate([
    (0, typeorm_1.Entity)({ name: 'component_view_counts' }),
    (0, typeorm_1.Unique)('uq_cvc_user_type_component', ['userId', 'componentType', 'componentId']),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['componentType', 'componentId']),
    (0, typeorm_1.Index)(['lastViewedAt'])
], ComponentViewCount);
//# sourceMappingURL=component-view-count.entity.js.map