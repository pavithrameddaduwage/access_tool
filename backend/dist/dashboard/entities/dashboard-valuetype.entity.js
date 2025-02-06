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
exports.DashboardValuetype = void 0;
const typeorm_1 = require("typeorm");
const dashboard_entity_1 = require("./dashboard.entity");
const valuetype_entity_1 = require("../../valuetype/entities/valuetype.entity");
let DashboardValuetype = class DashboardValuetype {
};
exports.DashboardValuetype = DashboardValuetype;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DashboardValuetype.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DashboardValuetype.prototype, "valueTypeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dashboard_entity_1.Dashboard, dashboard => dashboard.dashboardValuetypes, {
        onDelete: 'CASCADE'
    }),
    (0, typeorm_1.JoinColumn)({ name: 'dashboardId' }),
    __metadata("design:type", dashboard_entity_1.Dashboard)
], DashboardValuetype.prototype, "dashboard", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => valuetype_entity_1.Valuetype, valuetype => valuetype.dashboardValuetypes),
    (0, typeorm_1.JoinColumn)({ name: 'valueTypeId' }),
    __metadata("design:type", valuetype_entity_1.Valuetype)
], DashboardValuetype.prototype, "valuetype", void 0);
exports.DashboardValuetype = DashboardValuetype = __decorate([
    (0, typeorm_1.Entity)()
], DashboardValuetype);
//# sourceMappingURL=dashboard-valuetype.entity.js.map