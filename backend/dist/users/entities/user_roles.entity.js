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
exports.UserRoles = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const role_master_entity_1 = require("./role_master.entity");
let UserRoles = class UserRoles {
};
exports.UserRoles = UserRoles;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserRoles.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.user_roles),
    __metadata("design:type", user_entity_1.User)
], UserRoles.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_master_entity_1.RoleMaster, rolemaster => rolemaster.user_roles),
    __metadata("design:type", role_master_entity_1.RoleMaster)
], UserRoles.prototype, "role", void 0);
exports.UserRoles = UserRoles = __decorate([
    (0, typeorm_1.Entity)()
], UserRoles);
//# sourceMappingURL=user_roles.entity.js.map