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
exports.ValuetypeController = void 0;
const common_1 = require("@nestjs/common");
const valuetype_service_1 = require("./valuetype.service");
const create_valuetype_dto_1 = require("./dto/create-valuetype.dto");
const update_valuetype_dto_1 = require("./dto/update-valuetype.dto");
let ValuetypeController = class ValuetypeController {
    constructor(valuetypeService) {
        this.valuetypeService = valuetypeService;
    }
    async getAllValueTypes() {
        return this.valuetypeService.getAllValueTypes();
    }
    async getValueTypeById(id) {
        const valuetype = await this.valuetypeService.getValueTypeById(id);
        if (!valuetype) {
            throw new common_1.NotFoundException(`Value Type with ID ${id} not found.`);
        }
        return valuetype;
    }
    async createValueType(CreateValuetypeDto) {
        return this.valuetypeService.createValueType(CreateValuetypeDto);
    }
    async updateType(id, UpdateValuetypeDto) {
        const valuetype = await this.valuetypeService.getValueTypeById(id);
        if (!valuetype) {
            throw new common_1.NotFoundException(`Value Type with ID ${id} not found.`);
        }
        return this.valuetypeService.updateValueType(id, UpdateValuetypeDto);
    }
    async deleteType(id) {
        const valuetype = await this.valuetypeService.getValueTypeById(id);
        if (!valuetype) {
            throw new common_1.NotFoundException(`Value Type with ID ${id} not found.`);
        }
        return this.valuetypeService.deleteValueType(id);
    }
};
exports.ValuetypeController = ValuetypeController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ValuetypeController.prototype, "getAllValueTypes", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ValuetypeController.prototype, "getValueTypeById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_valuetype_dto_1.CreateValuetypeDto]),
    __metadata("design:returntype", Promise)
], ValuetypeController.prototype, "createValueType", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_valuetype_dto_1.UpdateValuetypeDto]),
    __metadata("design:returntype", Promise)
], ValuetypeController.prototype, "updateType", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ValuetypeController.prototype, "deleteType", null);
exports.ValuetypeController = ValuetypeController = __decorate([
    (0, common_1.Controller)('valuetype'),
    __metadata("design:paramtypes", [valuetype_service_1.ValuetypeService])
], ValuetypeController);
//# sourceMappingURL=valuetype.controller.js.map