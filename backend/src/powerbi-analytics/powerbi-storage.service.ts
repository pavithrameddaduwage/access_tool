// src/powerbi-analytics/powerbi-storage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PowerbiUsage } from './entities/powerbi-usage.entity';

@Injectable()
export class PowerbiStorageService {
  private readonly logger = new Logger(PowerbiStorageService.name);
  
  constructor(
    @InjectRepository(PowerbiUsage)
    private readonly usageRepo: Repository<PowerbiUsage>,
  ) {}

  async storeUsageData(workspaceId: string, datasetId: string, rows: any[]) {
    const uniqueRows = new Map<string, any>();
  
    rows.forEach(apiRow => {
      // Transform Power BI API response format to database schema
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
        })(),        distributionMethod: apiRow['Report views[DistributionMethod]'],
        consumptionMethod: apiRow['Report views[ConsumptionMethod]'],
        views: Number(apiRow['[Views]']) || 0
      };
  
      // Validate required fields
      const requiredFields = [
        'workspaceId', 'datasetId', 'reportId', 
        'userId', 'date', 'distributionMethod', 'consumptionMethod'
      ];
  
      if (requiredFields.some(field => !transformedRow[field])) {
        this.logger.warn(`Missing required fields in row: ${JSON.stringify(apiRow)}`);
        return;
      }
  
      const key = `${transformedRow.workspaceId}|${transformedRow.datasetId}|${
        transformedRow.reportId}|${transformedRow.userId}|${transformedRow.date}`;
  
      if (uniqueRows.has(key)) {
        uniqueRows.get(key).views += transformedRow.views;
      } else {
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
        .into(PowerbiUsage)
        .values(records)
        .orUpdate(
          ['views', 'distributionMethod', 'consumptionMethod', 'reportName'],
          ['workspaceId', 'datasetId', 'reportId', 'userId', 'date']
        )
        .execute();
    } catch (error) {
      this.logger.error(`Database insertion failed: ${error.message}`);
      throw error;
    }
  }

//   async getHistoricalData(params: {
//     workspaces?: string[];
//     startDate: Date;
//     endDate: Date;
//   }) {
//     const query = this.usageRepo.createQueryBuilder('usage')
//       .where('usage.date BETWEEN :start AND :end', {
//         start: params.startDate,
//         end: params.endDate
//       });

//     if (params.workspaces?.length) {
//       query.andWhere('usage.workspaceId IN (:...workspaces)', {
//         workspaces: params.workspaces
//       });
//     }

//     return query.getMany();
//   }
async getHistoricalData(params: {
  workspaces?: string[];
  startDate: Date;
  endDate: Date;
}) {
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
}