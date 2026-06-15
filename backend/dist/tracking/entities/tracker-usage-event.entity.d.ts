export declare class TrackerUsageEvent {
    id: string;
    sessionId: string;
    userId: string;
    dashboardId: string;
    tabName: string | null;
    eventType: string;
    eventData: Record<string, unknown> | null;
    createdAt: Date;
}
