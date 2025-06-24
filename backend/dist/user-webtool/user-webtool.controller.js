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
exports.UserWebtoolController = void 0;
const common_1 = require("@nestjs/common");
const user_webtool_service_1 = require("./user-webtool.service");
const create_user_webtool_dto_1 = require("./dto/create-user-webtool.dto");
const external_webtool_assignment_dto_1 = require("./dto/external-webtool-assignment.dto");
const external_delete_assignment_dto_1 = require("./dto/external-delete-assignment.dto");
const external_update_assignment_dto_1 = require("./dto/external-update-assignment.dto");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let UserWebtoolController = class UserWebtoolController {
    constructor(userWebtoolService) {
        this.userWebtoolService = userWebtoolService;
    }
    create(createUserWebtoolDto) {
        return this.userWebtoolService.create(createUserWebtoolDto);
    }
    findAll() {
        return this.userWebtoolService.findAll();
    }
    findOne(id) {
        return this.userWebtoolService.findOne(+id);
    }
    remove(email, webtoolId) {
        return this.userWebtoolService.remove(email, +webtoolId);
    }
    getUserWebtoolsByUser(email) {
        return this.userWebtoolService.getUserWebtoolsByUser(email);
    }
    async removeRole(email, webtoolId, roleId) {
        return this.userWebtoolService.removeRole(email, +webtoolId, +roleId);
    }
    async createExternalAssignment(dto, req) {
        return this.userWebtoolService.createExternalAssignment(dto);
    }
    async deleteExternalAssignment(dto) {
        return this.userWebtoolService.deleteExternalAssignment(dto);
    }
    async updateStatus(email, webtoolId, dto) {
        return this.userWebtoolService.updateActiveStatus(email, webtoolId, dto.isActive);
    }
    async getAllRawUserWebtools() {
        return this.userWebtoolService.findAllRaw();
    }
    async updateExternalAssignment(dto) {
        return this.userWebtoolService.updateExternalAssignment(dto);
    }
};
exports.UserWebtoolController = UserWebtoolController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_webtool_dto_1.CreateUserWebtoolDto]),
    __metadata("design:returntype", void 0)
], UserWebtoolController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UserWebtoolController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserWebtoolController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':email/:webtoolId'),
    __param(0, (0, common_1.Param)('email')),
    __param(1, (0, common_1.Param)('webtoolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UserWebtoolController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('user/:email'),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserWebtoolController.prototype, "getUserWebtoolsByUser", null);
__decorate([
    (0, common_1.Delete)(':email/:webtoolId/role/:roleId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('email')),
    __param(1, (0, common_1.Param)('webtoolId')),
    __param(2, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UserWebtoolController.prototype, "removeRole", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('external-assignment'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [external_webtool_assignment_dto_1.ExternalWebtoolAssignmentDto,
        Request]),
    __metadata("design:returntype", Promise)
], UserWebtoolController.prototype, "createExternalAssignment", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Delete)('external-assignment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [external_delete_assignment_dto_1.ExternalDeleteAssignmentDto]),
    __metadata("design:returntype", Promise)
], UserWebtoolController.prototype, "deleteExternalAssignment", null);
__decorate([
    (0, common_1.Patch)(':email/:webtoolId/status'),
    __param(0, (0, common_1.Param)('email')),
    __param(1, (0, common_1.Param)('webtoolId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], UserWebtoolController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)('raw/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserWebtoolController.prototype, "getAllRawUserWebtools", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Patch)('external-assignment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [external_update_assignment_dto_1.ExternalWebtoolUpdateDto]),
    __metadata("design:returntype", Promise)
], UserWebtoolController.prototype, "updateExternalAssignment", null);
exports.UserWebtoolController = UserWebtoolController = __decorate([
    (0, common_1.Controller)('user-webtools'),
    __metadata("design:paramtypes", [user_webtool_service_1.UserWebtoolService])
], UserWebtoolController);
//# sourceMappingURL=user-webtool.controller.js.map