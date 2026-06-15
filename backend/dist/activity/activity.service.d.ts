import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PbiActivityEvent } from './entities/pbi-activity-event.entity';
import { PbiUser } from '../users/entities/pbi-user.entity';
import { SyncLogService } from '../sync-log/sync-log.service';
export declare class ActivityService {
    private activityEventRepository;
    private userRepository;
    private syncLogService;
    private configService;
    private readonly logger;
    private isBackfilling;
    private o365Token;
    private o365TokenExpiry;
    constructor(activityEventRepository: Repository<PbiActivityEvent>, userRepository: Repository<PbiUser>, syncLogService: SyncLogService, configService: ConfigService);
    private getO365Token;
    private ensureSubscription;
    private getContentUrisForDay;
    private fetchContentBlob;
    fetchActivityForDate(dateStr: string): Promise<number>;
    triggerBackfill(days?: number): Promise<void>;
    private runBackfillAsync;
    findFiltered(filters: {
        from?: string;
        to?: string;
        userId?: string;
        workspaceId?: string;
        reportId?: string;
    }): Promise<PbiActivityEvent[]>;
    getSyncStatus(): Promise<any[]>;
    getIsBackfilling(): Promise<boolean>;
}
