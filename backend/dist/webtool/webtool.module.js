"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebtoolModule = void 0;
const common_1 = require("@nestjs/common");
const webtool_service_1 = require("./webtool.service");
const webtool_controller_1 = require("./webtool.controller");
const typeorm_1 = require("@nestjs/typeorm");
const webtool_entity_1 = require("./entities/webtool.entity");
let WebtoolModule = class WebtoolModule {
};
exports.WebtoolModule = WebtoolModule;
exports.WebtoolModule = WebtoolModule = __decorate([
    (0, common_1.Module)({
        controllers: [webtool_controller_1.WebtoolController],
        imports: [typeorm_1.TypeOrmModule.forFeature([webtool_entity_1.Webtool])],
        providers: [webtool_service_1.WebtoolService],
        exports: [typeorm_1.TypeOrmModule]
    })
], WebtoolModule);
//# sourceMappingURL=webtool.module.js.map