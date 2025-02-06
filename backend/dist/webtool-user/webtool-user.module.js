"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebtoolUserModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const webtool_user_service_1 = require("./webtool-user.service");
const webtool_user_controller_1 = require("./webtool-user.controller");
const user_webtool_entity_1 = require("../user-webtool/entities/user-webtool.entity");
let WebtoolUserModule = class WebtoolUserModule {
};
exports.WebtoolUserModule = WebtoolUserModule;
exports.WebtoolUserModule = WebtoolUserModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_webtool_entity_1.UserWebtool])],
        controllers: [webtool_user_controller_1.WebtoolUserController],
        providers: [webtool_user_service_1.WebtoolUserService],
        exports: [webtool_user_service_1.WebtoolUserService]
    })
], WebtoolUserModule);
//# sourceMappingURL=webtool-user.module.js.map