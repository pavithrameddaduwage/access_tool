/**
 * View models for the engagement analytics dashboard.
 * Mirror the NestJS EngagementAnalyticsService return shapes.
 */

export type Period = '7d' | '30d' | '90d';
export type ComponentType = 'report' | 'dashboard' | 'dashboard_page' | 'dataset' | 'visual';

export interface AnalyticsQuery {
  period?: Period;
  department?: string;
}

export interface Overview {
  activeUsers: number;
  totalEngagedHours: number;
  avgEngagedMinPerUser: number;
  topDashboard: { id: string; name: string; engagedSeconds: number } | null;
  mostViewedReport: { id: string; name: string | null; viewCount: number } | null;
}

export interface TopViewRow {
  componentId: string;
  componentName: string | null;
  componentType: string;
  totalViews: number;
  uniqueViewers: number;
  lastViewedAt: string | null;
}

export interface UserViewRow {
  componentId: string;
  componentName: string | null;
  componentType: string;
  viewCount: number;
  lastViewedAt: string | null;
}

export interface ComponentViewerRow {
  userId: string;
  userEmail: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  totalEngagedSeconds: number;
}

export interface UserRow {
  userId: string;
  userEmail: string | null;
  department: string | null;
  totalEngagedSeconds: number;
  lastSeen: string | null;
  sessionCount: number;
  totalViews: number;
}

export interface DashboardRow {
  dashboardId: string;
  engagedSeconds: number;
  uniqueUsers: number;
  visitCount: number;
  copyCount: number;
  scrollCount: number;
}

export interface ReportRow {
  reportId: string;
  reportName: string | null;
  viewCount: number;
  exportCount: number;
  filterCount: number;
  shareCount: number;
  printCount: number;
  uniqueUsers: number;
}

export interface UserDetail {
  user: {
    userId: string;
    userEmail: string | null;
    department: string | null;
    totalEngagedSeconds: number;
    totalViews: number;
  };
  sessions: Array<{
    id: string;
    dashboardId: string;
    tabName: string | null;
    startedAt: string;
    engagedSeconds: number;
    clickCount: number;
    scrollCount: number;
    copyCount: number;
  }>;
  views: UserViewRow[];
  audit: Array<{ activityType: string; reportName: string | null; activityAt: string }>;
}
