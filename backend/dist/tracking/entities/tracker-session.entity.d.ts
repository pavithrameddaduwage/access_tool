export declare class TrackerSession {
    id: string;
    userId: string;
    dashboardId: string;
    tabName: string | null;
    department: string | null;
    engagedSeconds: number;
    clickCount: number;
    scrollCount: number;
    copyCount: number;
    keydownCount: number;
    selectCount: number;
    isActive: boolean;
    idleExpired: boolean;
    startedAt: Date;
    lastFlushAt: Date | null;
    endedAt: Date | null;
    createdAt: Date;
}
