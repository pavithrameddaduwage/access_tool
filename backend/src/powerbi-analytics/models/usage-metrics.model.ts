export interface UsageMetrics {
  viewsByDate: Record<string, number>;
  viewsByReport: Record<string, number>;
  viewsByUser: Record<string, number>;
  totalViews: number;
  uniqueUsersCount: number;
  uniqueReportsCount: number;
  topReports: Array<{ id: string; count: number }>;
  topUsers: Array<{ id: string; count: number }>;
}