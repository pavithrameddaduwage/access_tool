// usage-metrics.model.ts
export interface UsageMetrics {
    // Required from backend
    viewsByDate: { [date: string]: number };
    viewsByReport: { [reportId: string]: number };
    totalViews: number;
    uniqueUsersCount: number;
    uniqueReportsCount: number;
    topReports: Array<{ id: string; count: number }>;
    topUsers: Array<{ id: string; count: number }>;
    
    // Optional fields from calculations
    userEngagement?: { [userId: string]: number };
    userReportInteractions?: { [userId: string]: { [reportId: string]: number } };
    engagementRate?: number;
  }