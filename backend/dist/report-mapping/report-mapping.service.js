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
exports.ReportMappingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const report_mapping_entity_1 = require("./entities/report-mapping.entity");
const powerbi_log_entity_1 = require("../powerbi-metrics/entities/powerbi-log.entity");
let ReportMappingService = class ReportMappingService {
    constructor(reportMappingRepository, powerbiLogRepo) {
        this.reportMappingRepository = reportMappingRepository;
        this.powerbiLogRepo = powerbiLogRepo;
    }
    cleanReportName(name) {
        if (!name)
            return 'Unknown Report';
        let cleaned = name
            .replace(/^(HGU\s*-\s*|HGU\s*|Dashboard\s*-\s*|Dashboard\s*|\bDash\s*-\s*|\bDash\s*)/i, '')
            .replace(/(-?\s*Report\s*$|-?\s*Dashboard\s*$|-?\s*HGU\s*$|\s*-\s*Report\s*$|\s*-\s*Dashboard\s*$|\s*-\s*HGU\s*$)/i, '')
            .trim();
        return cleaned || name;
    }
    async findOrCreate(reportId, originalName, workspaceId) {
        let mapping = await this.reportMappingRepository.findOne({
            where: { reportId }
        });
        if (!mapping) {
            if (!workspaceId) {
                const logEntry = await this.powerbiLogRepo.findOne({
                    where: { reportId },
                    order: { creationTime: 'DESC' },
                    select: ['workspaceId']
                });
                workspaceId = logEntry?.workspaceId;
            }
            mapping = this.reportMappingRepository.create({
                reportId,
                originalName,
                displayName: this.cleanReportName(originalName),
                workspaceId: workspaceId || null
            });
            await this.reportMappingRepository.save(mapping);
        }
        else if (mapping.workspaceId === null && workspaceId) {
            mapping.workspaceId = workspaceId;
            await this.reportMappingRepository.save(mapping);
        }
        return mapping;
    }
    async getDisplayName(reportId, originalName) {
        const mapping = await this.reportMappingRepository.findOne({
            where: { reportId }
        });
        if (mapping) {
            return mapping.displayName;
        }
        if (originalName) {
            const newMapping = await this.findOrCreate(reportId, originalName);
            return newMapping.displayName;
        }
        return 'Unknown Report';
    }
    async updateDisplayName(reportId, displayName) {
        let mapping = await this.reportMappingRepository.findOne({
            where: { reportId }
        });
        if (!mapping) {
            throw new Error('Report mapping not found');
        }
        mapping.displayName = displayName;
        return this.reportMappingRepository.save(mapping);
    }
    async findAll(workspaceId) {
        const where = workspaceId ? { workspaceId } : {};
        return this.reportMappingRepository.find({ where });
    }
    async findOne(reportId) {
        return this.reportMappingRepository.findOne({
            where: { reportId },
            relations: ['workspace']
        });
    }
};
exports.ReportMappingService = ReportMappingService;
exports.ReportMappingService = ReportMappingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(report_mapping_entity_1.ReportMapping)),
    __param(1, (0, typeorm_1.InjectRepository)(powerbi_log_entity_1.PowerBILog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ReportMappingService);
//# sourceMappingURL=report-mapping.service.js.map