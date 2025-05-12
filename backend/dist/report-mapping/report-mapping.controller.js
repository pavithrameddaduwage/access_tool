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
exports.ReportMappingController = void 0;
const common_1 = require("@nestjs/common");
const report_mapping_service_1 = require("./report-mapping.service");
let ReportMappingController = class ReportMappingController {
    constructor(reportMappingService) {
        this.reportMappingService = reportMappingService;
    }
    async findAll(workspaceId) {
        return this.reportMappingService.findAll(workspaceId);
    }
    async findOne(id) {
        return this.reportMappingService.findOne(id);
    }
    async update(id, displayName) {
        return this.reportMappingService.updateDisplayName(id, displayName);
    }
};
exports.ReportMappingController = ReportMappingController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportMappingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportMappingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('displayName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportMappingController.prototype, "update", null);
exports.ReportMappingController = ReportMappingController = __decorate([
    (0, common_1.Controller)('report-mappings'),
    __metadata("design:paramtypes", [report_mapping_service_1.ReportMappingService])
], ReportMappingController);
//# sourceMappingURL=report-mapping.controller.js.map