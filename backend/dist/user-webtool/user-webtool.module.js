"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserWebtoolModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_webtool_service_1 = require("./user-webtool.service");
const user_webtool_controller_1 = require("./user-webtool.controller");
const user_webtool_entity_1 = require("./entities/user-webtool.entity");
const webtool_entity_1 = require("../webtool/entities/webtool.entity");
const role_entity_1 = require("../roles/entities/role.entity");
let UserWebtoolModule = class UserWebtoolModule {
};
exports.UserWebtoolModule = UserWebtoolModule;
exports.UserWebtoolModule = UserWebtoolModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_webtool_entity_1.UserWebtool, webtool_entity_1.Webtool, role_entity_1.Role])],
        controllers: [user_webtool_controller_1.UserWebtoolController],
        providers: [user_webtool_service_1.UserWebtoolService],
        exports: [user_webtool_service_1.UserWebtoolService]
    })
], UserWebtoolModule);
//# sourceMappingURL=user-webtool.module.js.map