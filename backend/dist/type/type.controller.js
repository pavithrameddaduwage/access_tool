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
exports.TypeController = void 0;
const common_1 = require("@nestjs/common");
const type_service_1 = require("./type.service");
const create_type_dto_1 = require("./dto/create-type.dto");
const update_type_dto_1 = require("./dto/update-type.dto");
let TypeController = class TypeController {
    constructor(typeService) {
        this.typeService = typeService;
    }
    async getAllTypes() {
        return this.typeService.getAllTypes();
    }
    async getTypeById(id) {
        const type = await this.typeService.getTypeById(id);
        if (!type) {
            throw new common_1.NotFoundException(`Type with ID ${id} not found.`);
        }
        return type;
    }
    async createType(CreateTypeDto) {
        return this.typeService.createType(CreateTypeDto);
    }
    async updateType(id, UpdateTypeDto) {
        const type = await this.typeService.getTypeById(id);
        if (!type) {
            throw new common_1.NotFoundException(`Type with ID ${id} not found.`);
        }
        return this.typeService.updateType(id, UpdateTypeDto);
    }
    async deleteType(id) {
        const type = await this.typeService.getTypeById(id);
        if (!type) {
            throw new common_1.NotFoundException(`Type with ID ${id} not found.`);
        }
        return this.typeService.deleteType(id);
    }
};
exports.TypeController = TypeController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TypeController.prototype, "getAllTypes", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TypeController.prototype, "getTypeById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_type_dto_1.CreateTypeDto]),
    __metadata("design:returntype", Promise)
], TypeController.prototype, "createType", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_type_dto_1.UpdateTypeDto]),
    __metadata("design:returntype", Promise)
], TypeController.prototype, "updateType", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TypeController.prototype, "deleteType", null);
exports.TypeController = TypeController = __decorate([
    (0, common_1.Controller)('type'),
    __metadata("design:paramtypes", [type_service_1.TypeService])
], TypeController);
//# sourceMappingURL=type.controller.js.map