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
exports.UserDashboard = void 0;
const typeorm_1 = require("typeorm");
const dashboard_entity_1 = require("../../dashboard/entities/dashboard.entity");
let UserDashboard = class UserDashboard {
};
exports.UserDashboard = UserDashboard;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserDashboard.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserDashboard.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserDashboard.prototype, "userName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserDashboard.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dashboard_entity_1.Dashboard),
    (0, typeorm_1.JoinColumn)({ name: 'dashboardId' }),
    __metadata("design:type", dashboard_entity_1.Dashboard)
], UserDashboard.prototype, "dashboard", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UserDashboard.prototype, "dashboardId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], UserDashboard.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], UserDashboard.prototype, "lastActiveAt", void 0);
exports.UserDashboard = UserDashboard = __decorate([
    (0, typeorm_1.Entity)()
], UserDashboard);
//# sourceMappingURL=user-dashboard.entity.js.map