import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PbiSyncLog } from './entities/pbi-sync-log.entity';

@Injectable()
export class SyncLogService {
  constructor(
    @InjectRepository(PbiSyncLog)
    private syncLogRepository: Repository<PbiSyncLog>,
  ) {}

  async createLog(syncType: string, syncDate?: string): Promise<PbiSyncLog> {
    const log = new PbiSyncLog();
    log.syncType = syncType;
    log.syncDate = syncDate || null;
    log.status = 'pending';
    log.eventsPulled = 0;
    return this.syncLogRepository.save(log);
  }

  async updateLog(
    id: string,
    status: 'success' | 'failed' | 'partial',
    eventsPulled = 0,
    errorMessage?: string,
  ): Promise<PbiSyncLog> {
    const log = await this.syncLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new Error(`Sync log with ID ${id} not found`);
    }
    log.status = status;
    log.eventsPulled = eventsPulled;
    log.errorMessage = errorMessage || null;
    log.completedAt = new Date();
    return this.syncLogRepository.save(log);
  }

  async getStatus(): Promise<PbiSyncLog[]> {
    return this.syncLogRepository.find({
      order: { startedAt: 'DESC' },
      take: 90, // Limit to last 90 logs
    });
  }

  async findSuccessLog(syncType: string, syncDate: string): Promise<PbiSyncLog | null> {
    return this.syncLogRepository.findOne({
      where: {
        syncType,
        syncDate,
        status: 'success',
      },
    });
  }
}
