export declare class PbiActivityEvent {
    id: string;
    eventId: string;
    userId: string;
    userEmail: string;
    operation: string;
    activity: string;
    workspaceId: string;
    workspaceName: string;
    reportId: string;
    reportName: string;
    reportType: string;
    dashboardId: string;
    dashboardName: string;
    datasetId: string;
    datasetName: string;
    clientIp: string;
    userAgent: string;
    isSuccess: boolean;
    distributionMethod: string;
    consumptionMethod: string;
    creationTime: Date;
    requestId: string;
    rawJson: any;
    pulledAt: Date;
}
