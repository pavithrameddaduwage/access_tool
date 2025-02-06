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
exports.WebtoolController = void 0;
const common_1 = require("@nestjs/common");
const webtool_service_1 = require("./webtool.service");
const create_webtool_dto_1 = require("./dto/create-webtool.dto");
const update_webtool_dto_1 = require("./dto/update-webtool.dto");
let WebtoolController = class WebtoolController {
    constructor(webtoolService) {
        this.webtoolService = webtoolService;
    }
    async getAllWebtools() {
        return this.webtoolService.getAllWebtool();
    }
    async getWebtoolById(id) {
        const webtool = await this.webtoolService.getWebtoolById(id);
        if (!webtool) {
            throw new common_1.NotFoundException(`Webtool with ID ${id} not found.`);
        }
        return webtool;
    }
    async createWebtool(createWebtoolDto) {
        return this.webtoolService.createWebtool(createWebtoolDto);
    }
    async updateWebtool(id, updateWebtoolDto) {
        const webtool = await this.webtoolService.getWebtoolById(id);
        if (!webtool) {
            throw new common_1.NotFoundException(`Web tool with ID ${id} not found.`);
        }
        return this.webtoolService.updateWebtool(id, updateWebtoolDto);
    }
    async deleteWebtool(id) {
        const webtool = await this.webtoolService.getWebtoolById(id);
        if (!webtool) {
            throw new common_1.NotFoundException(`Webtool with ID ${id} not found.`);
        }
        return this.webtoolService.deleteWebtool(id);
    }
};
exports.WebtoolController = WebtoolController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebtoolController.prototype, "getAllWebtools", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WebtoolController.prototype, "getWebtoolById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_webtool_dto_1.CreateWebtoolDto]),
    __metadata("design:returntype", Promise)
], WebtoolController.prototype, "createWebtool", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_webtool_dto_1.UpdateWebtoolDto]),
    __metadata("design:returntype", Promise)
], WebtoolController.prototype, "updateWebtool", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WebtoolController.prototype, "deleteWebtool", null);
exports.WebtoolController = WebtoolController = __decorate([
    (0, common_1.Controller)('webtool'),
    __metadata("design:paramtypes", [webtool_service_1.WebtoolService])
], WebtoolController);
//# sourceMappingURL=webtool.controller.js.map