import { Repository } from 'typeorm';
import { PbiSyncLog } from './entities/pbi-sync-log.entity';
export declare class SyncLogService {
    private syncLogRepository;
    constructor(syncLogRepository: Repository<PbiSyncLog>);
    createLog(syncType: string, syncDate?: string): Promise<PbiSyncLog>;
    updateLog(id: string, status: 'success' | 'failed' | 'partial', eventsPulled?: number, errorMessage?: string): Promise<PbiSyncLog>;
    getStatus(): Promise<PbiSyncLog[]>;
    findSuccessLog(syncType: string, syncDate: string): Promise<PbiSyncLog | null>;
}
