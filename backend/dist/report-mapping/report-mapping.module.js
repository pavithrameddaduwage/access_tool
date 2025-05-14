"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportMappingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const report_mapping_entity_1 = require("./entities/report-mapping.entity");
const report_mapping_service_1 = require("./report-mapping.service");
const powerbi_log_entity_1 = require("../powerbi-metrics/entities/powerbi-log.entity");
let ReportMappingModule = class ReportMappingModule {
};
exports.ReportMappingModule = ReportMappingModule;
exports.ReportMappingModule = ReportMappingModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([report_mapping_entity_1.ReportMapping, powerbi_log_entity_1.PowerBILog])],
        providers: [report_mapping_service_1.ReportMappingService],
        exports: [report_mapping_service_1.ReportMappingService],
    })
], ReportMappingModule);
//# sourceMappingURL=report-mapping.module.js.map