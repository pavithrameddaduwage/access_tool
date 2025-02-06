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
exports.DepartmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const department_entity_1 = require("./entities/department.entity");
const typeorm_2 = require("typeorm");
let DepartmentService = class DepartmentService {
    constructor(departmentRepository) {
        this.departmentRepository = departmentRepository;
    }
    async getAllDepartments() {
        return this.departmentRepository.find({ order: { 'department': 'ASC' } });
    }
    async getDepartmentById(id) {
        return this.departmentRepository.findOne({
            where: { id },
        });
    }
    async createDepartment(createDepartmentDto) {
        return this.departmentRepository.save(createDepartmentDto);
    }
    async updateDepartment(id, updateDepartmentDto) {
        const department = await this.departmentRepository.findOne({
            where: { id },
        });
        if (!department) {
            throw new Error(`Department with ID ${id} not found.`);
        }
        return this.departmentRepository.save(Object.assign(department, updateDepartmentDto));
    }
    async deleteDepartment(id) {
        const department = await this.departmentRepository.findOne({
            where: { id },
        });
        if (!department) {
            throw new Error(`Department with ID ${id} not found.`);
        }
        await this.departmentRepository.remove(department);
    }
};
exports.DepartmentService = DepartmentService;
exports.DepartmentService = DepartmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DepartmentService);
//# sourceMappingURL=department.service.js.map