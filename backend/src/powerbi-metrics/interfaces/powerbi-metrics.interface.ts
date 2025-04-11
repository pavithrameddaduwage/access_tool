export interface PowerBIWorkspace {
    id: string;
    name: string;
  }
  
  export interface PowerBIReport {
    id: string;
    name: string;
  }
  
  export interface PowerBIMetrics {
    uniqueUsers: {
      count: number;
      users: string[];
    };
    workspaces: {
      count: number;
      workspaces: Array<{
        id: string;
        name: string;
        views: number;
        uniqueViewers: number;
      }>;
    };
    reports: {
      count: number;
      reports: Array<{
        id: string;
        name: string;
        workspaceId: string;
        workspaceName: string;
        views: number;
        uniqueViewers: number;
      }>;
    };
  }