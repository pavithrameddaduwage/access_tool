// src/report-mapping/report-mapping.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportMapping } from './entities/report-mapping.entity';
import { PowerBILog } from 'src/powerbi-metrics/entities/powerbi-log.entity';

@Injectable()
export class ReportMappingService {
  constructor(
    @InjectRepository(ReportMapping)
    private readonly reportMappingRepository: Repository<ReportMapping>,
    @InjectRepository(PowerBILog)
    private readonly powerbiLogRepo: Repository<PowerBILog>,
  ) {}

  private cleanReportName(name: string): string {
    if (!name) return 'Unknown Report';
    
    // Remove "HGU" prefix (case insensitive)
    let cleaned = name.replace(/^HGU\s*-\s*/i, '')
                     .replace(/^HGU/i, '');
    
    // Remove "Report" and "Dashboard" suffixes (case insensitive)
    cleaned = cleaned.replace(/\s*-\s*Report$/i, '')
                    .replace(/Report$/i, '')
                    .replace(/\s*-\s*Dashboard$/i, '')
                    .replace(/Dashboard$/i, '');
    
    // Trim whitespace
    cleaned = cleaned.trim();
    
    return cleaned || name; // Return original if empty after cleaning
  }

  async findOrCreate(reportId: string, originalName: string, workspaceId?: string): Promise<ReportMapping> {
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
    } else if (mapping.workspaceId === null && workspaceId) {
        mapping.workspaceId = workspaceId;
        await this.reportMappingRepository.save(mapping);
    }
    
    return mapping;
}

  async getDisplayName(reportId: string, originalName?: string): Promise<string> {
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

  async updateDisplayName(reportId: string, displayName: string): Promise<ReportMapping> {
    let mapping = await this.reportMappingRepository.findOne({ 
      where: { reportId } 
    });

    if (!mapping) {
      throw new Error('Report mapping not found');
    }

    mapping.displayName = displayName;
    return this.reportMappingRepository.save(mapping);
  }

  async findAll(workspaceId?: string): Promise<ReportMapping[]> {
    const where = workspaceId ? { workspaceId } : {};
    return this.reportMappingRepository.find({ where });
  }
  
  async findOne(reportId: string): Promise<ReportMapping> {
    return this.reportMappingRepository.findOne({ 
      where: { reportId },
      relations: ['workspace'] 
    });
  }
}