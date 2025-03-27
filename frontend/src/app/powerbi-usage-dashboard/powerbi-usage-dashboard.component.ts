import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { PowerBIService } from '../Services/powerbi.service';
import { FormsModule } from '@angular/forms';
import { FilterPipe } from './filter.pipe';
import { ChangeDetectorRef } from '@angular/core';
import { HomeService } from '../Services/home.service';
import { Colors } from 'chart.js';


interface ReportMetric {
  id: string;   // Store ReportId
  name: string; // Store ReportName
  count: number;
}
interface UserMetric {
  id: string; // Email address
  count: number; // Number of views
}
interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  avgViewsPerUser: number;
  userEngagementTrend: { date: string; count: number }[];
  topUsers: { userId: string; views: number; lastActive: string }[];
  newUsersOverTime: { date: string; count: number }[];
}

interface ChartDataPoint {
  x: number; // Timestamp
  y: number; // View count
}
@Component({
  selector: 'app-powerbi-usage-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, FormsModule],
  templateUrl: './powerbi-usage-dashboard.component.html',
})
export class PowerBIUsageDashboardComponent implements OnInit {

  // State variables

  loading = false;      
  error = '';
  dataLoaded = false;
  activeView: 'workspace' | 'user' = 'workspace';   
  selectedUserId: string | null = null;        
  selectedUser: string | null = null;
  selectedWorkspace: string = 'all';
  selectedReport: string = 'all';
  selectedPeriod = 30;
  isUserListExpanded: boolean = false;

  
  // Data Variables

  metrics: any = {                            // Stores calculated metrics like total views and unique users
    totalViews: 0,
    uniqueUsers: new Set<string>(),
    uniqueReports: new Set<string>(),
    chartData: [], 
    topReports: [],
    consumptionMethods: {},
    distributionMethods: {},
    topUsers: [],
    userReportInteractions: {},
    engagementRate: 0,
  };

  
  workspaces: any[] = [];
  reports: any[] = [];
  allData: any[] = [];          // Stores the raw data fetched from the backend
  filteredUsers: any[] = [];    // Stores the filtered list of users based on search query
  userMetrics: any = {};        // Stores metrics for the selected user

  activityTrendChartData: any[] = [];         // Stores data for the activity trend chart
  topUsersChartData: any[] = [];              // Stores data for top users chart
  activityTrendCategories: string[] = [];     // Stores categories (dates) for the activity trend chart
  topUsersCategories: string[] = [];          // Stores categories (user names) for the top users chart



  allUsers: any[] = [];             // Stores the list of all users with their metrics

 

  // Chart Options

  userReportInteractionChartOptions: any;
  engagementRateChartOptions: any;
  userWorkspacePieChartOptions: any = null;
  viewsChartOptions: any;            // Configuration for the Views Over Time chart
  topReportsChartOptions: any;
  userReportViewsChartOptions: any;          // User Views for Selected Report

  topUsersChartOptions: any = {
    chart: { type: 'bar', height: 350 },
    series: [{ name: 'Views', data: [] }],
    xaxis: { categories: [] },
    plotOptions: {
      bar: {
        columnWidth: '10%' 
      }
    }
  };

  activityTrendChartOptions: any = {
    chart: { type: 'line', height: 350 },
    series: [{ name: 'Active Users', data: [] }],
    xaxis: { type: 'datetime' },
    stroke: {
      width: 2
    },
    colors: ['#FF5993'] 
  };
  


  // Paginatiuon and Filtering

  currentPage: number = 1;
  usersPerPage: number = 10;
  userSearchQuery: string = '';
  timePeriods = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 },
  ];

  




  // Mapping and Caching 

  userEmailToNameMap: Map<string, string> = new Map();    // Maps emails to their real names
  workspaceNames: Map<string, string> = new Map();     // Maps workspace IDs to their names

  // Colours lol

  private blueGradientColors: string[] = [
    '#03045E',
    '#0077B6', 
    '#00B4D8', 
    '#90E0EF', 
    '#CAF0F8', 
    '#789DBC',
    '#8ACDD7'
  ];



  // The big boy constructor

  constructor(private powerBIService: PowerBIService, private homeService: HomeService,private cdr: ChangeDetectorRef ) {}

  // ngOnInit() {
  //   this.loadWorkspaces();
  //   this.loadData(this.selectedPeriod);
  //   this.fetchWorkspaceNames(); 
  // }
  // async ngOnInit() {
  //   this.loadWorkspaces();
  //   await this.loadData(this.selectedPeriod); // Wait for data to load
  //   await this.prepareTopUsersChart(); // Prepare the top users chart with real names
  //   this.fetchWorkspaceNames();
  // }
  ngOnInit() {
    this.loadCacheFromLocalStorage(); 
    this.loadWorkspaces();
    this.loadData(this.selectedPeriod);
    this.prepareTopUsersChart(); // Prepare the top users chart with real names
    this.fetchWorkspaceNames();
  }

  loadCacheFromLocalStorage() {
    const cache = localStorage.getItem('emailToNameCache');
    if (cache) {
      this.userEmailToNameMap = new Map(JSON.parse(cache));
    }
  }

  async loadWorkspaces() {                                                                     // This is to populate the workspace dropdown
    const response = await this.powerBIService.getWorkspaces().toPromise();
    this.workspaces = [{ id: 'all', name: 'All Workspaces' }, ...(response || [])];
  }

  async loadData(days: number) {                     
    this.loading = true;
    this.error = '';
    this.selectedPeriod = days;
  
    try {
      if (this.allData.length === 0) {
        const response = await this.powerBIService.getCombinedMetrics().toPromise();
        this.allData = response || [];
      }
  
      // Filter by workspace
      let filteredData = this.allData;
      if (this.selectedWorkspace !== 'all') {
        filteredData = this.allData.filter(item => 
          item.WorkspaceId === this.selectedWorkspace
        );
      }
  
      // Filter by report
      if (this.selectedReport !== 'all') {
        filteredData = filteredData.filter(item =>
          item['Report views[ReportId]'] === this.selectedReport
        );
      }
     
    
  
      // Update reports list based on workspace
      this.updateReportsList(filteredData);
  
      // Filter data by time period
      const timeFilteredData = this.filterDataByTimePeriod(filteredData, days);
  
      // Process user metrics
      // this.processUserMetrics();
      // Process user metrics with the filtered data
    this.processUserMetrics(timeFilteredData);  // Pass filtered data here
  
      // Calculate metrics
      this.metrics = this.calculateMetrics(timeFilteredData);
  
      // Prepare chart data
      this.prepareChartData();
      this.prepareActivityTrendChart();
      
         // If a user is selected, update their metrics
         if (this.selectedUserId) {
          this.updateUserMetrics(this.selectedUserId);
        }
  
      this.dataLoaded = true;
    } catch (err) {
      console.error('Error loading data:', err);
      this.error = `Failed to load data: ${err}`;
    }
    this.loading = false;
  }

  async fetchWorkspaceNames() {
    try {
      // Use nullish coalescing operator (??) to provide a fallback empty array
      const workspaces = (await this.powerBIService.getWorkspaces().toPromise()) ?? [];
      
      workspaces.forEach(ws => {
        this.workspaceNames.set(ws.id, ws.name || `Workspace ${ws.id}`);
      });
      
      console.log('Workspace Names:', this.workspaceNames); // Debugging: Log workspace names
    } catch (error) {
      console.error('Failed to fetch workspace names:', error);
    }
  }
  

  calculateMetrics(data: any[]) {
    if (!data || !Array.isArray(data)) {
      console.error('Invalid data format:', data);
      return {
        viewsByDate: {},
        totalViews: 0,
        uniqueUsersCount: 0,
        uniqueReportsCount: 0,
        topReports: [],
        topUsers: []
      };
    }
  
    const metrics = {
      viewsByDate: {} as { [key: string]: number },
      userActivity: {} as { [key: string]: Set<string> }, // Track active users per date
      userViews: {} as { [key: string]: number }, // Track total views per user
      totalViews: 0,
      uniqueUsersCount: 0,
      uniqueReportsCount: 0,
      topReports: [] as ReportMetric[],
      topUsers: [] as { id: string; count: number }[]
    };
  
    const uniqueUsers = new Set<string>();
    const uniqueReports = new Set<string>();
    const reportCounts = new Map<string, number>();
    const userCounts = new Map<string, number>();
    const userReportViews = new Map<string, number>();

  
    data.forEach(row => {
      if (!row || typeof row !== 'object') {
        console.warn('Invalid row:', row);
        return;
      }
  
      const date = row['Report views[Date]'];
      const reportId = row['Report views[ReportId]'];
      const userId = row['Report views[UserId]'];
      const views = row['[Views]'] || 0;
      const reportName = row['Report views[ReportName]'] || reportId;
  
      if (!date || !reportName || !userId) {
        console.warn('Missing required fields in row:', row);
        return;
      }


       // Initialize userActivity for the date if it doesn't exist
  if (!metrics.userActivity[date]) {
    metrics.userActivity[date] = new Set<string>();
  }

       // User activity tracking
    if (!metrics.userActivity[date]) {
      metrics.userActivity[date] = new Set<string>();
    }
    metrics.userActivity[date].add(userId);

    // User views tracking
    metrics.userViews[userId] = (metrics.userViews[userId] || 0) + views;
  
  
      // Date processing
      const dateKey = new Date(date).toISOString().split('T')[0];
      metrics.viewsByDate[dateKey] = (metrics.viewsByDate[dateKey] || 0) + views;
      
      // For user-report views
    const userKey = `${userId}|${reportId}`;
    userReportViews.set(userKey, (userReportViews.get(userKey) || 0) + views);

      // Unique counts
      uniqueUsers.add(userId);
      uniqueReports.add(reportName);
      
      // Total views
      metrics.totalViews += views;
  
      // Report counts
      reportCounts.set(reportName, (reportCounts.get(reportName) || 0) + views);
      
      // User counts
      userCounts.set(userId, (userCounts.get(userId) || 0) + views);
    });
  
    // Convert to sorted arrays
    metrics.topReports = Array.from(reportCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, name: id, count }));
  
    metrics.topUsers = Array.from(userCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, count }));
  
    metrics.uniqueUsersCount = uniqueUsers.size;
    metrics.uniqueReportsCount = uniqueReports.size;
  
  // Compute additional metrics
  const result = {
    ...metrics,
    userReportViews: Array.from(userReportViews.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([userReport, count]) => {
        const [userId, reportId] = userReport.split('|');
        return { userId, reportId, count };
      }),
    activityTrend: Object.entries(metrics.userActivity)
      .map(([date, users]) => ({
        date,
        count: users.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    topUsers: Object.entries(metrics.userViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, count]) => ({ id, count }))
  };

  console.log('Activity Trend Data:', result.activityTrend);

  return result;
}


  prepareChartData() {
    this.prepareViewsChart();
    this.prepareTopReportsChart();
    this.prepareTopUsersChart();
    
    if (this.selectedReport !== 'all') {
      this.prepareUserReportViewsChart();
    }
  }
  prepareViewsChart() {
    // Convert date strings to timestamps for ApexCharts
    const dataPoints = Object.keys(this.metrics.viewsByDate || {})
      .map(date => ({
        x: new Date(`${date}T00:00:00Z`).getTime(), // Convert to timestamp
        y: this.metrics.viewsByDate[date]
      }))
      .sort((a, b) => a.x - b.x); // Sort chronologically
  
    this.viewsChartOptions = {
      series: [{
        name: 'Views',
        data: dataPoints,
      }],
      chart: {
        type: 'area',
        height: 350,
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: true // Force UTC in chart display
        }
      },
      yaxis: {
        title: {
          text: 'Views',
        },
      },
      stroke: {
        width: 1,
      },
      tooltip: {
        x: {
          format: 'dd MMM yyyy',
          formatter: (value: number) => {
            return new Date(value).toISOString().split('T')[0]; // Display UTC date
          }
        }
      },
      colors: ['#ffb703'],
    };
  }


  // prepareTopReportsChart() {
  //   if (!this.metrics.topReports || this.metrics.topReports.length === 0) return;
  
  //   const topReports = this.metrics.topReports.slice(0, 10);
  //   const reportNames = topReports.map((report: ReportMetric) => report.name);
  //   const viewCounts = topReports.map((report: ReportMetric) => report.count);
  
  //   this.topReportsChartOptions = {
  //     series: [{ name: 'Views', data: viewCounts }],
  //     chart: { type: 'bar', height: 350 },
  //     xaxis: {
  //       categories: reportNames,
  //       labels: {
  //         formatter: (value: string) => {
  //           const maxLength = 20; // Maximum characters per line
  //           const chunks = value.match(new RegExp(`.{1,${maxLength}}`, 'g')); // Split into chunks
  //           return chunks ? chunks.join('\n') : value; // Join chunks or return original value
  //         },
  //         style: {
  //           fontSize: '12px', // Adjust font size if needed
  //           colors: '#333' // Adjust label color if needed
  //         }
  //       }
  //     },
  //     title: { text: 'Top Reports by Views', align: 'left' },
  //     colors: ['#0077B6'],
  //     plotOptions: { bar: { horizontal: false, columnWidth: '40%' } },
  //     dataLabels: { enabled: false }
  //   };
  // }
// powerbi-usage-dashboard.component.ts

prepareTopReportsChart() {
  if (!this.metrics.topReports || this.metrics.topReports.length === 0) return;

  const topReports = this.metrics.topReports.slice(0, 10);
  const reportNames = topReports.map((report: ReportMetric) => report.name);

  // Function to split report names into arrays for multi-line labels
  const splitReportName = (name: string): string[] => {
    const maxLength = 15; // Maximum characters per line
    const words = name.split(' '); // Split by spaces
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word; // Add word to current line
      } else {
        lines.push(currentLine); // Push current line to lines array
        currentLine = word; // Start a new line
      }
    });

    if (currentLine) {
      lines.push(currentLine); // Push the last line
    }

    return lines;
  };

  // Prepare categories with multi-line labels
  const categories = reportNames.map((name: string) => {
    const lines = splitReportName(name);
    return lines.join('\n'); // Join lines with newline character
  });

  // Prepare chart options
  this.topReportsChartOptions = {
    series: [{ 
      name: 'Views', 
      data: topReports.map((report: ReportMetric) => report.count) 
    }],
    chart: { 
      type: 'bar', 
      height: 350 
    },
    xaxis: {
      categories: categories, // Use multi-line categories
      labels: {
        style: {
          fontSize: '11px',
          colors: '#333'
        },
        formatter: (value: string) => {
          return value; // Directly return the pre-formatted multi-line string
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '40%'
      }
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#0077B6']
  };
}


  prepareUserReportInteractionChart() {
    const users = Object.keys(this.metrics.userReportInteractions);
    const reports = Object.keys(this.metrics.userReportInteractions[users[0]] || {});
  
    const data = users.map((userId) => ({
      name: userId,
      data: reports.map((reportId) => this.metrics.userReportInteractions[userId][reportId] || 0),
    }));
  
    this.userReportInteractionChartOptions = {
      series: data,
      chart: {
        type: 'heatmap',
        height: 350,
      },
      xaxis: {
        categories: reports,
      },
      title: {
        text: 'User-Report Interaction',
        align: 'left',
      },
      colors: ['#3b82f6'],
    };
  }
  prepareEngagementRateChart() {
    this.engagementRateChartOptions = {
      series: [this.metrics.engagementRate],
      chart: {
        type: 'radialBar',
        height: 350,
      },
      labels: ['Engagement Rate'],
      title: {
        text: 'User Engagement Rate',
        align: 'left',
      },
      colors: ['#f59e0b'],
    };
  }

  filterDataByTimePeriod(data: any[], days: number): any[] {
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - days);
  
    return data.filter((row) => {
      const rowDate = new Date(row['Report views[Date]']);
      return rowDate >= startDate && rowDate <= currentDate;
    });
  }





// Add this method to update reports list
private updateReportsList(data: any[]) {
  const reportMap = new Map<string, string>();
  data.forEach(item => {
    reportMap.set(
      item['Report views[ReportId]'], 
      item['Report views[ReportName]'] || item['Report views[ReportId]']
    );
  });
  
  this.reports = Array.from(reportMap.entries()).map(([id, name]) => ({
    id,
    name
  }));
  
  // Add "All Reports" option
  this.reports = [{ id: 'all', name: 'All Reports' }, ...this.reports];
}

prepareUserReportViewsChart() {
  const users = this.metrics.userReportViews.map((u: any) => 
    u.userId.split('@')[0] // Show only username part of email
  );
  const counts = this.metrics.userReportViews.map((u: any) => u.count);

  this.userReportViewsChartOptions = {
    series: [{
      name: 'Views',
      data: counts
    }],
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: true,
      }
    },
    xaxis: {
      categories: users,
      title: { text: 'Number of Views' }
    },
    yaxis: {
      title: { text: 'Users' }
    },
    colors: ['#FF5993'],
    dataLabels: { enabled: false }
  };
}


private processRawData(data: any[]) {
  const workspaceMetrics = this.calculateMetrics(data);

  // User metrics calculation with proper typing
  const userData = data.reduce<Record<string, {
    id: string;
    totalViews: number;
    reports: Set<string>;
    lastActive: string;
    activity: Record<string, number>;
  }>>((acc, row) => {
    const userId = row['Report views[UserId]'];
    if (!userId) return acc;

    if (!acc[userId]) {
      acc[userId] = {
        id: userId,
        totalViews: 0,
        reports: new Set<string>(),
        lastActive: '',
        activity: {}
      };
    }

    const user = acc[userId];
    user.totalViews += row['[Views]'] || 0;
    user.reports.add(row['Report views[ReportId]']);
    const date = new Date(row['Report views[Date]']).toISOString().split('T')[0];
    user.activity[date] = (user.activity[date] || 0) + 1;
    if (date > user.lastActive) user.lastActive = date;
    
    return acc;
  }, {});

  return {
    workspaceMetrics,
    userMetrics: {
      totalUsers: Object.keys(userData).length,
      users: Object.values(userData),
      activityTrend: this.getActivityTrend(userData) // Pass userData as argument
    }
  };
}

// Update getActivityTrend to accept userData parameter
private getActivityTrend(userData: Record<string, {
  id: string;
  totalViews: number;
  reports: Set<string>;
  lastActive: string;
  activity: Record<string, number>;
}>): { date: string; count: number }[] {
  const trendMap = new Map<string, number>();

  Object.values(userData).forEach(user => {
    Object.keys(user.activity).forEach((date: string) => {
      trendMap.set(date, (trendMap.get(date) || 0) + 1);
    });
  });

  return Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}



selectUser(userId: string) {
  this.selectedUserId = userId;

  // Find the selected user
  const user = this.allUsers.find(u => u.id === userId);
  if (!user) return;

  // Explicitly type the entries array
  const entries: [string, number][] = Array.from(user.activityByDate.entries());

  // Update user metrics
  this.userMetrics = {
    ...user,
    activityChartData: entries
      .sort((a: [string, number], b: [string, number]) => a[0].localeCompare(b[0]))
      .map(([date, views]: [string, number]) => ({ x: date, y: views })),
  };

  // Prepare the pie chart
  const workspaceViews = this.getUserWorkspaceViews(userId);
  this.prepareUserWorkspacePieChart(workspaceViews);

  // Force change detection
  this.cdr.detectChanges();
}
filterUsers(query: string): any[] {
  if (!query) return this.allUsers;
  return this.allUsers.filter(user => 
    user.id.toLowerCase().includes(query.toLowerCase())
  );
}

updateUserMetrics(selectedUserId?: string) {
  if (!selectedUserId) {
    // Aggregate metrics for all users
    this.userMetrics = {
      totalUsers: this.allUsers.length,
      totalViews: this.allUsers.reduce((sum, u) => sum + u.totalViews, 0),
      avgViewsPerUser: this.allUsers.length ? 
        this.allUsers.reduce((sum, u) => sum + u.totalViews, 0) / this.allUsers.length : 0,
      topUsers: this.allUsers.slice(0, 10),
      activityTrend: this.getActivityTrend(Object.fromEntries(
        this.allUsers.map(user => [user.id, {
          id: user.id,
          totalViews: user.totalViews,
          reports: user.reports,
          lastActive: user.lastActivity,
          activity: Object.fromEntries(user.activityByDate)
        }])
      )),
    };

    // Precompute chart data
    this.activityTrendChartData = this.userMetrics.activityTrend?.map((t: any) => t.count) || [];
    this.activityTrendCategories = this.userMetrics.activityTrend?.map((t: any) => t.date) || [];
    this.topUsersChartData = this.userMetrics.topUsers?.slice(0, 10).map((u: any) => u.count) || [];
    this.topUsersCategories = this.userMetrics.topUsers?.slice(0, 10).map((u: any) => 
      u.id.split('@')[0] // Show only username part
    ) || [];

    // Prepare chart options
    this.prepareActivityTrendChartOptions();
    this.prepareTopUsersChartOptions();
  } else {
    // Specific user metrics
    const user = this.allUsers.find(u => u.id === selectedUserId);
    if (user) {
      // Filter data by time period for the selected user
      const filteredData = this.filterDataByTimePeriod(
        this.selectedWorkspace === 'all'
          ? this.allData
          : this.allData.filter(item => item.WorkspaceId === this.selectedWorkspace),
        this.selectedPeriod
      );

      // Recalculate user-specific metrics using the filtered data
      const userActivityByDate = new Map<string, number>();
      const userWorkspaceViews = new Map<string, number>();

      filteredData.forEach(row => {
        if (row['Report views[UserId]'] === selectedUserId) {
          // Update activity by date
          const date = new Date(row['Report views[Date]']).toISOString().split('T')[0];
          userActivityByDate.set(date, (userActivityByDate.get(date) || 0) + (row['[Views]'] || 0));

          // Update workspace views
          const workspace = row.WorkspaceId;
          userWorkspaceViews.set(workspace, (userWorkspaceViews.get(workspace) || 0) + (row['[Views]'] || 0));
        }
      });

      // Update user metrics
      this.userMetrics = {
        ...user,
        totalViews: Array.from(userActivityByDate.values()).reduce((sum, views) => sum + views, 0),
        activityChartData: Array.from(userActivityByDate.entries())
          .sort((a: [string, number], b: [string, number]) => a[0].localeCompare(b[0]))
          .map(([date, views]: [string, number]) => ({ x: date, y: views })),
      };

      // Prepare the pie chart
      const workspaceViews = Array.from(userWorkspaceViews.entries()).map(([workspace, views]) => ({
        workspace,
        views
      }));
      this.prepareUserWorkspacePieChart(workspaceViews);

      // Force UI update
      this.cdr.detectChanges();
    }
  }
}
private getUserActivityChartData(user: {
  activityByDate: Map<string, number>;
}): { x: string; y: number }[] {
  return Array.from(user.activityByDate.entries())
    .sort((a: [string, number], b: [string, number]) => a[0].localeCompare(b[0]))
    .map(([date, count]: [string, number]) => ({ 
      x: date, 
      y: count 
    }));
}

// public processUserMetrics() {
//   const userMap = new Map<string, {
//     id: string;
//     totalViews: number;
//     reports: Set<string>;
//     workspaces: Set<string>;
//     lastActivity: string;
//     activityByDate: Map<string, number>;
//   }>();
  
//   this.allData.forEach(row => {
//     const userId = row['Report views[UserId]'];
//     if (!userId) return;

//     if (!userMap.has(userId)) {
//       userMap.set(userId, {
//         id: userId,
//         totalViews: 0,
//         reports: new Set<string>(),
//         workspaces: new Set<string>(),
//         lastActivity: '',
//         activityByDate: new Map<string, number>()
//       });
//     }

//     const user = userMap.get(userId);
//     if (user) {
//       user.totalViews += row['[Views]'] || 0;
//       user.reports.add(row['Report views[ReportId]']);
//       user.workspaces.add(row.WorkspaceId);
      
//       const date = new Date(row['Report views[Date]']).toISOString().split('T')[0];
//       user.activityByDate.set(date, (user.activityByDate.get(date) || 0) + 1);
//       user.lastActivity = date > user.lastActivity ? date : user.lastActivity;
//     }
//   });

//   this.allUsers = Array.from(userMap.values()).sort((a, b) => b.totalViews - a.totalViews);
// }
public processUserMetrics(data: any[]) {  // Accept data as parameter
  const userMap = new Map<string, {
    id: string;
    totalViews: number;
    reports: Set<string>;
    workspaces: Set<string>;
    lastActivity: string;
    activityByDate: Map<string, number>;
  }>();

  data.forEach(row => {
    const userId = row['Report views[UserId]'];
    if (!userId) return;

    if (!userMap.has(userId)) {
      userMap.set(userId, {
        id: userId,
        totalViews: 0,
        reports: new Set<string>(),
        workspaces: new Set<string>(),
        lastActivity: '',
        activityByDate: new Map<string, number>(),
      });
    }

    const user = userMap.get(userId);
    if (user) {
      const views = row['[Views]'] || 0;
      user.totalViews += views;

      const reportId = row['Report views[ReportId]'];
      user.reports.add(reportId);

      const workspaceId = row.WorkspaceId;
      user.workspaces.add(workspaceId);

      const date = new Date(row['Report views[Date]']).toISOString().split('T')[0];
      user.activityByDate.set(date, (user.activityByDate.get(date) || 0) + views);

      if (date > user.lastActivity) {
        user.lastActivity = date;
      }
    }
  });

  this.allUsers = Array.from(userMap.values()).sort((a, b) => b.totalViews - a.totalViews);
}




prepareActivityTrendChartOptions() {
  this.activityTrendChartOptions = {
    chart: { type: 'line', height: 350 },
    series: [{ name: 'Active Users', data: this.activityTrendChartData }],
    xaxis: {
      type: 'datetime',
      categories: this.activityTrendCategories,
      labels: {
        datetimeUTC: true
      }
    },
    stroke: {
      width: 2
    },
    colors: ['#FF5993'] 
  };
}

prepareTopUsersChartOptions() {
  this.topUsersChartOptions = {
    chart: { type: 'bar', height: 350 },
    series: [{ name: 'Views', data: this.topUsersChartData }],
    xaxis: {
      categories: this.topUsersCategories,
      labels: {
        rotate: -45 // Rotate labels for better readability
      }
    },
    plotOptions: {
      bar: {
        columnWidth: '10%' // Adjust this value (e.g., '20%' for thinner bars, '50%' for wider bars)
      }
    }
  };
}

prepareActivityTrendChart() {
  if (!this.metrics.activityTrend || this.metrics.activityTrend.length === 0) {
    console.warn('No activity trend data available');
    return;
  }

  this.activityTrendChartOptions = {
    series: [{
      name: 'Active Users',
      data: this.metrics.activityTrend.map((t: any) => t.count)
    }],
    chart: {
      type: 'line',
      height: 350
    },
    xaxis: {
      categories: this.metrics.activityTrend.map((t: any) => t.date),
      type: 'datetime',
      labels: {
        datetimeUTC: true // Ensure dates are displayed correctly
      }
    },
    yaxis: {
      title: {
        text: 'Active Users'
      }
    },
    stroke: {
      width: 1,
       curve: 'smooth'
    },
    colors: ['#ffb703']
  };
}


// async prepareTopUsersChart() {
//   if (!this.metrics.topUsers || this.metrics.topUsers.length === 0) {
//     console.warn('No top users data available');
//     return;
//   }

//   console.log('Top Users Data:', this.metrics.topUsers); // Debugging

//   // Extract emails from top users
//   const emails = this.metrics.topUsers.map((user: UserMetric) => user.id);

//   // Fetch real names for emails that aren't already cached
//   await this.fetchRealNamesForEmails(emails);

//   // Map emails to real names using the cache
//   const topUsersWithNames = this.metrics.topUsers.map((user: UserMetric) => ({
//     id: this.userEmailToNameMap.get(user.id) || user.id, // Use cached name or fallback to full email
//     count: user.count
//   }));

//   console.log('Top Users with Names:', topUsersWithNames); // Debugging

//   // Prepare chart options
//   this.topUsersChartOptions = {
//     series: [{ 
//       name: 'Views', 
//       data: topUsersWithNames.map((user: UserMetric) => user.count) // Use UserMetric type
//     }],
//     chart: {
//       type: 'bar',
//       height: 350,
//       events: {
//         dataPointSelection: (event: any, chartContext: any, config: { dataPointIndex: number }) => {
//           this.onTopUserChartClick(config.dataPointIndex);
//         }
//       }
//     },
//     xaxis: {
//       categories: topUsersWithNames.map((user: UserMetric) => user.id), // Use UserMetric type
//       labels: {
//         rotate: -45, // Rotate labels for better readability
//         style: {
//           fontSize: '11px',
//           colors: '#333'
//         }
//       }
//     },
//     plotOptions: {
//       bar: {
//         horizontal: false,
//         columnWidth: '40%' 
//       }
//     },
//     dataLabels: {
//       enabled: false
//     },
//     colors: ["#0077B6"]
//   };
// }
async prepareTopUsersChart() {
  if (!this.metrics.topUsers || this.metrics.topUsers.length === 0) {
    console.warn('No top users data available');
    return;
  }

  console.log('Top Users Data:', this.metrics.topUsers); // Debugging

  // Extract emails from top users
  const emails = this.metrics.topUsers.map((user: UserMetric) => user.id);

  // Fetch real names for emails that aren't already cached
  await this.fetchRealNamesForEmails(emails);

  // Map emails to real names using the cache
  const topUsersWithNames = this.metrics.topUsers.map((user: UserMetric) => ({
    id: this.userEmailToNameMap.get(user.id) || user.id, // Use cached name or fallback to full email
    count: user.count
  }));

  console.log('Top Users with Names:', topUsersWithNames); // Debugging

  // Prepare chart options
  this.topUsersChartOptions = {
    series: [{ 
      name: 'Views', 
      data: topUsersWithNames.map((user: UserMetric) => user.count) // Use UserMetric type
    }],
    chart: {
      type: 'bar',
      height: 350,
      events: {
        dataPointSelection: (event: any, chartContext: any, config: { dataPointIndex: number }) => {
          this.onTopUserChartClick(config.dataPointIndex);
        }
      }
    },
    xaxis: {
      categories: topUsersWithNames.map((user: UserMetric) => {
        const fullName = user.id.split('@')[0]; // Remove email domain
        const [firstName, lastName] = fullName.split(/(?<=^\S+)\s/); // Split into first and last name
        return lastName ? `${firstName}\n${lastName}` : firstName; // Return two-line name
      }),
      labels: {
        rotate: -45, // Rotate labels for better readability
        style: {
          fontSize: '11px',
          colors: '#333'
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '40%' 
      }
    },
    dataLabels: {
      enabled: false
    },
    colors: ["#0077B6"]
  };
}
onTopUserChartClick(dataPointIndex: number) {
  const selectedUserId = this.metrics.topUsers[dataPointIndex]?.id;
  
  if (!selectedUserId) {
    console.error('No user ID found for the selected bar');
    return;
  }

  console.log('Selected User ID:', selectedUserId);
  
  // Update view state
  this.activeView = 'user';
  this.selectedUserId = selectedUserId;

  // Force update the view
  this.cdr.detectChanges();

  // Load user metrics
  this.updateUserMetrics(selectedUserId);
}


getPaginatedUsers(): any[] {
  const startIndex = (this.currentPage - 1) * this.usersPerPage;
  const endIndex = startIndex + this.usersPerPage;
  return this.allUsers.slice(startIndex, endIndex);
}

changePage(page: number): void {
  this.currentPage = page;
}

getPageNumbers(): number[] {
  const totalPages = Math.ceil(this.allUsers.length / this.usersPerPage);
  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

// onTopUserChartClick(dataPointIndex: number) {
//   const selectedUserId = this.metrics.topUsers[dataPointIndex]?.id;
  
//   if (!selectedUserId) {
//     console.error('No user ID found for the selected bar');
//     return;
//   }

//   console.log('Selected User ID:', selectedUserId);
  
//   // Update view state
//   this.activeView = 'user';
//   this.selectedUserId = selectedUserId;

//   // Force update the view
//   this.cdr.detectChanges();

//   // Load user metrics
//   this.updateUserMetrics(selectedUserId);
// }


toggleUserListAccordion() {
  this.isUserListExpanded = !this.isUserListExpanded;
}

// getUserWorkspaceViews(userId: string): { workspace: string, views: number }[] {
//   const workspaceViews = new Map<string, number>();

//   this.allData.forEach(row => {
//     if (row['Report views[UserId]'] === userId) {
//       const workspace = row.WorkspaceId;
//       const views = row['[Views]'] || 0;
//       workspaceViews.set(workspace, (workspaceViews.get(workspace) || 0) + views);
//     }
//   });

//   const result = Array.from(workspaceViews.entries()).map(([workspace, views]) => ({
//     workspace,
//     views
//   }));

//   console.log('Workspace Views Data:', result); // Debugging: Log the workspace views data
//   return result;
// }
getUserWorkspaceViews(userId: string): { workspace: string, views: number }[] {
  const workspaceViews = new Map<string, number>();

  // Use the filtered dataset
  const filteredData = this.filterDataByTimePeriod(
    this.selectedWorkspace === 'all'
      ? this.allData
      : this.allData.filter(item => item.WorkspaceId === this.selectedWorkspace),
    this.selectedPeriod
  );

  filteredData.forEach(row => {
    if (row['Report views[UserId]'] === userId) {
      const workspace = row.WorkspaceId;
      const views = row['[Views]'] || 0;
      workspaceViews.set(workspace, (workspaceViews.get(workspace) || 0) + views);
    }
  });

  const result = Array.from(workspaceViews.entries()).map(([workspace, views]) => ({
    workspace,
    views
  }));

  console.log('Workspace Views Data:', result); // Debugging
  return result;
}


prepareUserWorkspacePieChart(workspaceViews: { workspace: string, views: number }[]) {
  const labels = workspaceViews.map(w => {
    const workspaceName = this.workspaceNames.get(w.workspace) || `Workspace ${w.workspace}`;
    return workspaceName;
  });

  // Use the blue gradient colors
  const colors = workspaceViews.map((_, index) => 
    this.blueGradientColors[index % this.blueGradientColors.length]
  );

  this.userWorkspacePieChartOptions = {
    series: workspaceViews.map(w => w.views),
    chart: {
      type: 'pie',
      height: 350,
    },
    labels: labels,
    dataLabels: {
      enabled: true,
      formatter: (val: number, opts: any) => {
        return `${val.toFixed(1)}%`;
      },
      style: {
        fontSize: '12px',
        colors: ['#fff'], // White text for better visibility
      },
    },
    legend: {
      position: 'bottom',
      formatter: (legendName: string) => {
        return legendName;
      },
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (value: number) => `${value} views`,
      },
    },
    colors: colors, // Use the blue gradient colors
  };
}





// async fetchRealNamesForEmails(emails: string[]): Promise<void> {
//   for (const email of emails) {
//     try {
//       const users = await this.homeService.searchADUsers(email).toPromise();
//       if (users && users.length > 0) {
//         const realName = users[0].displayName || users[0].name; 
//         this.userEmailToNameMap.set(email, realName);
//       } else {
//         this.userEmailToNameMap.set(email, email.split('@')[0]); 
//       }
//     } catch (error) {
//       console.error(`Failed to fetch real name for ${email}:`, error);
//       this.userEmailToNameMap.set(email, email.split('@')[0]); 
//     }
//   }
// }
// async fetchRealNamesForEmails(emails: string[]): Promise<void> {
//   // Filter out emails that are already in the cache
//   const emailsToFetch = emails.filter(email => !this.userEmailToNameMap.has(email));

//   if (emailsToFetch.length === 0) {
//     // All emails are already cached
//     return;
//   }

//   // Fetch real names for the remaining emails
//   for (const email of emailsToFetch) {
//     try {
//       const users = await this.homeService.searchADUsers(email).toPromise();
//       if (users && users.length > 0) {
//         const realName = users[0].displayName || users[0].name; 
//         this.userEmailToNameMap.set(email, realName); // Cache the result
//       } else {
//         this.userEmailToNameMap.set(email, email.split('@')[0]); // Fallback to email username
//       }
//     } catch (error) {
//       console.error(`Failed to fetch real name for ${email}:`, error);
//       this.userEmailToNameMap.set(email, email.split('@')[0]); // Fallback to email username
//     }
//   }
// }
async fetchRealNamesForEmails(emails: string[]): Promise<void> {
  for (const email of emails) {
    if (this.userEmailToNameMap.has(email)) {
      // Mapping already exists in the frontend cache
      continue;
    }

    // Check the backend for a cached mapping
    const backendMapping = await this.homeService.getMapping(email).toPromise();
    if (backendMapping) {
      // Use the mapping from the backend
      this.userEmailToNameMap.set(email, backendMapping.real_name);
      continue;
    }

    // Fetch the real name from the AD service
    try {
      const users = await this.homeService.searchADUsers(email).toPromise();
      if (users && users.length > 0) {
        const realName = users[0].displayName || users[0].name;
        this.userEmailToNameMap.set(email, realName);

        // Save the mapping to the backend
        await this.homeService.createMapping(email, realName).toPromise();
      } else {
        // Fallback to email username
        this.userEmailToNameMap.set(email, email.split('@')[0]);
      }
    } catch (error) {
      console.error(`Failed to fetch real name for ${email}:`, error);
      this.userEmailToNameMap.set(email, email.split('@')[0]);
    }
  }
}
  saveCacheToLocalStorage() {
    const cache = JSON.stringify(Array.from(this.userEmailToNameMap.entries()));
    localStorage.setItem('emailToNameCache', cache);
  }

  exportUserListToCSV() {
    const headers = ['Name', 'Views', 'Last Seen'];
    const rows = this.allUsers.map(user => [
      user.id,
      user.totalViews,
      user.lastActivity,
    ]);
  
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')), 
    ].join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'user_list.csv';
    link.click();
  }
}