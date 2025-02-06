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
exports.ValuetypeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const valuetype_entity_1 = require("./entities/valuetype.entity");
const typeorm_2 = require("typeorm");
let ValuetypeService = class ValuetypeService {
    constructor(valueTypeRepository) {
        this.valueTypeRepository = valueTypeRepository;
    }
    async createValueType(createValuetypeDto) {
        const existingValueType = await this.valueTypeRepository.findOne({
            where: { valuetype: createValuetypeDto.valuetype }
        });
        if (existingValueType) {
            throw new common_1.ConflictException(`Value Type "${createValuetypeDto.valuetype}" already exists`);
        }
        return this.valueTypeRepository.save(createValuetypeDto);
    }
    async getAllValueTypes() {
        return this.valueTypeRepository.find({ order: { 'valuetype': 'ASC' } });
    }
    async getValueTypeById(id) {
        const valueType = await this.valueTypeRepository.findOne({
            where: { id },
        });
        if (!valueType) {
            throw new common_1.NotFoundException(`Value Type with ID ${id} not found`);
        }
        return valueType;
    }
    async updateValueType(id, updateValuetypeDto) {
        const valueType = await this.valueTypeRepository.findOne({
            where: { id },
        });
        if (!valueType) {
            throw new common_1.NotFoundException(`Value Type with ID ${id} not found`);
        }
        if (updateValuetypeDto.valuetype) {
            const existingValueType = await this.valueTypeRepository.findOne({
                where: { valuetype: updateValuetypeDto.valuetype }
            });
            if (existingValueType && existingValueType.id !== id) {
                throw new common_1.ConflictException(`Value Type "${updateValuetypeDto.valuetype}" already exists`);
            }
        }
        return this.valueTypeRepository.save(Object.assign(valueType, updateValuetypeDto));
    }
    async deleteValueType(id) {
        const valuetype = await this.valueTypeRepository.findOne({
            where: { id },
        });
        if (!valuetype) {
            throw new Error(`Value Type with ID ${id} not found.`);
        }
        await this.valueTypeRepository.remove(valuetype);
    }
};
exports.ValuetypeService = ValuetypeService;
exports.ValuetypeService = ValuetypeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(valuetype_entity_1.Valuetype)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ValuetypeService);
//# sourceMappingURL=valuetype.service.js.map