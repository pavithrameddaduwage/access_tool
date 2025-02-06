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
exports.DashboardType = void 0;
const typeorm_1 = require("typeorm");
const dashboard_entity_1 = require("./dashboard.entity");
const type_entity_1 = require("../../type/entities/type.entity");
let DashboardType = class DashboardType {
};
exports.DashboardType = DashboardType;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DashboardType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DashboardType.prototype, "typeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dashboard_entity_1.Dashboard, dashboard => dashboard.dashboardTypes, {
        onDelete: 'CASCADE'
    }),
    (0, typeorm_1.JoinColumn)({ name: 'dashboardId' }),
    __metadata("design:type", dashboard_entity_1.Dashboard)
], DashboardType.prototype, "dashboard", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => type_entity_1.Type, type => type.dashboardTypes),
    (0, typeorm_1.JoinColumn)({ name: 'typeId' }),
    __metadata("design:type", type_entity_1.Type)
], DashboardType.prototype, "type", void 0);
exports.DashboardType = DashboardType = __decorate([
    (0, typeorm_1.Entity)()
], DashboardType);
//# sourceMappingURL=dashboard-type.entity.js.map