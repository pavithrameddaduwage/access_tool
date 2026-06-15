export declare class FlushEventDto {
    eventType: string;
    eventData?: Record<string, unknown>;
    timestamp?: string;
}
export declare class FlushSessionDto {
    sessionId: string;
    userId: string;
    dashboardId: string;
    tabName?: string;
    department?: string;
    engagedSeconds: number;
    clickCount: number;
    scrollCount: number;
    copyCount: number;
    keydownCount: number;
    selectCount: number;
    isEnding: boolean;
    idleExpired?: boolean;
    timestamp: string;
    events?: FlushEventDto[];
}
