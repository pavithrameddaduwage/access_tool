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
exports.UserMappingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_mapping_entity_1 = require("./entities/user-mapping.entity");
let UserMappingsService = class UserMappingsService {
    constructor(userMappingRepo) {
        this.userMappingRepo = userMappingRepo;
    }
    async findByEmail(email) {
        console.log(`Fetching mapping for email: ${email}`);
        const result = await this.userMappingRepo.findOne({ where: { email } });
        console.log('Query result:', result);
        return result;
    }
    async upsert(email, realName) {
        console.log(`Upserting mapping for email: ${email}, realName: ${realName}`);
        let mapping = await this.findByEmail(email);
        if (mapping) {
            console.log('Updating existing mapping:', mapping);
            mapping.real_name = realName;
        }
        else {
            console.log('Creating new mapping for email:', email);
            mapping = this.userMappingRepo.create({ email, real_name: realName });
        }
        const savedMapping = await this.userMappingRepo.save(mapping);
        console.log('Saved mapping:', savedMapping);
        return savedMapping;
    }
    async findAll() {
        return this.userMappingRepo.find();
    }
};
exports.UserMappingsService = UserMappingsService;
exports.UserMappingsService = UserMappingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_mapping_entity_1.UserMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UserMappingsService);
//# sourceMappingURL=user-mappings.service.js.map