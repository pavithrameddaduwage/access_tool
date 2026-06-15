export declare const COMPONENT_TYPES: readonly ["report", "dashboard", "dashboard_page", "dataset", "visual"];
export type ComponentType = (typeof COMPONENT_TYPES)[number];
export declare class LogViewDto {
    userId: string;
    componentType: ComponentType;
    componentId: string;
    componentName: string;
    workspaceId?: string;
    sessionId: string;
    timestamp: string;
}
