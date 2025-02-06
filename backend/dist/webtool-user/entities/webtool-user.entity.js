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
exports.UserWebtool = void 0;
const role_entity_1 = require("../../roles/entities/role.entity");
const webtool_entity_1 = require("../../webtool/entities/webtool.entity");
const typeorm_1 = require("typeorm");
let UserWebtool = class UserWebtool {
};
exports.UserWebtool = UserWebtool;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserWebtool.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserWebtool.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserWebtool.prototype, "userName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserWebtool.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => webtool_entity_1.Webtool),
    (0, typeorm_1.JoinColumn)({ name: 'webtoolId' }),
    __metadata("design:type", webtool_entity_1.Webtool)
], UserWebtool.prototype, "webtool", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UserWebtool.prototype, "webtoolId", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => role_entity_1.Role),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], UserWebtool.prototype, "roles", void 0);
exports.UserWebtool = UserWebtool = __decorate([
    (0, typeorm_1.Entity)()
], UserWebtool);
//# sourceMappingURL=webtool-user.entity.js.map