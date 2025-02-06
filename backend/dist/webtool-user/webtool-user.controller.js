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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebtoolUserController = void 0;
const common_1 = require("@nestjs/common");
const webtool_user_service_1 = require("./webtool-user.service");
const create_webtool_user_dto_1 = require("./dto/create-webtool-user.dto");
let WebtoolUserController = class WebtoolUserController {
    constructor(webtoolUserService) {
        this.webtoolUserService = webtoolUserService;
    }
    findAll() {
        return this.webtoolUserService.findAll();
    }
    create(createDto) {
        return this.webtoolUserService.create(createDto);
    }
    async remove(email, webtoolId) {
        return this.webtoolUserService.remove(email, +webtoolId);
    }
};
exports.WebtoolUserController = WebtoolUserController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WebtoolUserController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_webtool_user_dto_1.CreateWebtoolUserDto]),
    __metadata("design:returntype", void 0)
], WebtoolUserController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':email/:webtoolId'),
    __param(0, (0, common_1.Param)('email')),
    __param(1, (0, common_1.Param)('webtoolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WebtoolUserController.prototype, "remove", null);
exports.WebtoolUserController = WebtoolUserController = __decorate([
    (0, common_1.Controller)('webtool-user'),
    __metadata("design:paramtypes", [webtool_user_service_1.WebtoolUserService])
], WebtoolUserController);
//# sourceMappingURL=webtool-user.controller.js.map