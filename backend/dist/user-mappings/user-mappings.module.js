"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMappingsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_mappings_service_1 = require("./user-mappings.service");
const user_mappings_controller_1 = require("./user-mappings.controller");
const user_mapping_entity_1 = require("./entities/user-mapping.entity");
let UserMappingsModule = class UserMappingsModule {
};
exports.UserMappingsModule = UserMappingsModule;
exports.UserMappingsModule = UserMappingsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_mapping_entity_1.UserMapping])],
        controllers: [user_mappings_controller_1.UserMappingsController],
        providers: [user_mappings_service_1.UserMappingsService],
    })
], UserMappingsModule);
//# sourceMappingURL=user-mappings.module.js.map