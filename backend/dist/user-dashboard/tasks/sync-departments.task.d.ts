import { SyncUserDepartmentsService } from '../sync-user-departments.service';
export declare class SyncDepartmentsTask {
    private syncService;
    private readonly logger;
    constructor(syncService: SyncUserDepartmentsService);
    handleCron(): Promise<void>;
}
