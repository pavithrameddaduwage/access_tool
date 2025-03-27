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
var PowerbiStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerbiStorageService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const powerbi_usage_entity_1 = require("./entities/powerbi-usage.entity");
let PowerbiStorageService = PowerbiStorageService_1 = class PowerbiStorageService {
    constructor(usageRepo) {
        this.usageRepo = usageRepo;
        this.logger = new common_1.Logger(PowerbiStorageService_1.name);
    }
    async storeUsageData(workspaceId, datasetId, rows) {
        const uniqueRows = new Map();
        rows.forEach(apiRow => {
            const transformedRow = {
                workspaceId: workspaceId,
                datasetId: datasetId,
                reportId: apiRow['Report views[ReportId]'],
                reportName: apiRow['Report views[ReportName]'] || 'Unknown Report',
                userId: apiRow['Report views[UserId]'],
                userKey: apiRow['Report views[UserKey]'],
                date: (() => {
                    const rawDate = apiRow['Report views[Date]'];
                    const date = new Date(rawDate);
                    return isNaN(date.getTime()) ? new Date() : date;
                })(), distributionMethod: apiRow['Report views[DistributionMethod]'],
                consumptionMethod: apiRow['Report views[ConsumptionMethod]'],
                views: Number(apiRow['[Views]']) || 0
            };
            const requiredFields = [
                'workspaceId', 'datasetId', 'reportId',
                'userId', 'date', 'distributionMethod', 'consumptionMethod'
            ];
            if (requiredFields.some(field => !transformedRow[field])) {
                this.logger.warn(`Missing required fields in row: ${JSON.stringify(apiRow)}`);
                return;
            }
            const key = `${transformedRow.workspaceId}|${transformedRow.datasetId}|${transformedRow.reportId}|${transformedRow.userId}|${transformedRow.date}`;
            if (uniqueRows.has(key)) {
                uniqueRows.get(key).views += transformedRow.views;
            }
            else {
                uniqueRows.set(key, transformedRow);
            }
        });
        const records = Array.from(uniqueRows.values());
        if (records.length === 0) {
            this.logger.log('No valid records to store');
            return;
        }
        try {
            await this.usageRepo.createQueryBuilder()
                .insert()
                .into(powerbi_usage_entity_1.PowerbiUsage)
                .values(records)
                .orUpdate(['views', 'distributionMethod', 'consumptionMethod', 'reportName'], ['workspaceId', 'datasetId', 'reportId', 'userId', 'date'])
                .execute();
        }
        catch (error) {
            this.logger.error(`Database insertion failed: ${error.message}`);
            throw error;
        }
    }
    async getHistoricalData(params) {
        const query = this.usageRepo.createQueryBuilder('usage')
            .where('usage.date BETWEEN :start AND :end', {
            start: params.startDate.toISOString(),
            end: params.endDate.toISOString()
        });
        if (params.workspaces?.length) {
            query.andWhere('usage.workspaceId IN (:...workspaces)', {
                workspaces: params.workspaces
            });
        }
        return query.getMany();
    }
};
exports.PowerbiStorageService = PowerbiStorageService;
exports.PowerbiStorageService = PowerbiStorageService = PowerbiStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(powerbi_usage_entity_1.PowerbiUsage)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PowerbiStorageService);
//# sourceMappingURL=powerbi-storage.service.js.map