import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { PowerBIMetricsService, PowerBIReport, PowerBIWorkspace } from '../Services/powerbi-metrics.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HomeService } from '../Services/home.service';

interface ViewCount {
  date: string;
  count: number;
}

interface ReportMetric {
  reportId: string;
  reportName: string;
  count: number;
}

interface UserDetail {
  id: string;
  totalViews: number;
  reports: number;
  workspaces: number;
  lastActivity: string;
  activityByDate: {date: string, count: number}[];
}

interface UserMetric {
  userId: string;
  count: number;
}

interface Metrics {
  totalViews: number;
  uniqueUsers: number;
  uniqueReports: number;
  topReports: ReportMetric[];
  topUsers: UserMetric[];
  activityTrend: UserActivity[];
  viewsByDate: Record<string, number>;
}

interface UserActivity {
  date: string;
  count: number;
}



interface WorkspaceViewDistribution {
  workspaceId: string;
  workspaceName: string;
  count: number;
}


interface ConsumptionMethod {
  method: string;
  count: number;
}
interface Workspace {
  id: string;
  name: string;
}

interface User {
  id: string;
  totalViews: number;
  lastActivity: string;
}

@Component({
  selector: 'app-powerbi-dashboard',
  templateUrl: './powerbi-dashboard.component.html',
  styleUrls: ['./powerbi-dashboard.component.css'],
  imports: [CommonModule, NgApexchartsModule, ReactiveFormsModule, FormsModule],
  standalone: true
})
export class PowerBIDashboardComponent implements OnInit {
  // View state
  activeView: 'workspace' | 'user' = 'workspace';
  selectedUserId: string | null = null;

  selectedPeriod = 30;
  isUserListExpanded = false;
  
  // Data
  loading = false;
  error = '';
  dataLoaded = false;
  allUsers: UserDetail[] = [];
  filteredUsers: UserDetail[] = [];
  userMetrics: any = {};
  userSearchQuery = '';
  filteredReports: ReportMetric[] = [];

  // Metrics
  metrics: Metrics = {
    totalViews: 0,
    uniqueUsers: 0,
    uniqueReports: 0,
    topReports: [],
    topUsers: [],
    activityTrend: [],
    viewsByDate: {}
  };

  // Chart options
  viewsChartOptions: any;
  topReportsChartOptions: any;
  topUsersChartOptions: any;
  userReportViewsChartOptions: any;
  activityTrendChartOptions: any;
  userWorkspacePieChartOptions: any;
  userConsumptionChartOptions: any;
  userConsumptionMethods: ConsumptionMethod[] = []; 
  // Colors
  private blueGradientColors = [
    '#03045E', '#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#789DBC', '#8ACDD7'
  ];

  // Pagination
  currentPage = 1;
  usersPerPage = 10;
  timePeriods = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 }
  ];

  constructor(
    private powerBIMetricsService: PowerBIMetricsService,
    private homeService: HomeService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFilters().then(() => {
      this.loadData(this.selectedPeriod);
    });  }

  
  
  // async loadData(days: number) {
  //   this.loading = true;
  //   this.error = '';
  //   this.selectedPeriod = days;
  
  //   try {
  //     const endDate = new Date();
  //     const startDate = new Date();
  //     startDate.setDate(endDate.getDate() - days);
  
  //     // Load filters first
  //     await this.loadFilters(startDate, endDate);
  
  //     // Get all metrics in parallel
  //     const [
  //       viewsByDate = [], 
  //       topReports = [], 
  //       topUsers = [], 
  //       activityTrend = [],
  //       uniqueUserCount = 0,
  //       uniqueReportCount = 0
  //     ] = await Promise.all([
  //       this.powerBIMetricsService.getViewsByDate(startDate, endDate).toPromise(),
  //       this.powerBIMetricsService.getTopReports(startDate, endDate, 10).toPromise(),
  //       this.powerBIMetricsService.getTopUsers(startDate, endDate, 10).toPromise(),
  //       this.powerBIMetricsService.getUserActivityTrend(startDate, endDate).toPromise(),
  //       this.powerBIMetricsService.getUniqueUserCount(startDate, endDate).toPromise(),
  //       this.powerBIMetricsService.getUniqueReportCount(startDate, endDate).toPromise()
  //     ]);
  
  //     // Calculate total views
  //     const totalViews = (viewsByDate as ViewCount[]).reduce((sum, day) => sum + (day?.count || 0), 0);
  
  //     // Update metrics
  //     this.metrics = {
  //       totalViews,
  //       uniqueUsers: uniqueUserCount as number,
  //       uniqueReports: uniqueReportCount as number,
  //       topReports: topReports as ReportMetric[],
  //       topUsers: topUsers as UserMetric[],
  //       activityTrend: activityTrend as UserActivity[],
  //       viewsByDate: (viewsByDate as ViewCount[]).reduce((acc, day) => {
  //         if (day?.date) {
  //           acc[day.date] = day.count || 0;
  //         }
  //         return acc;
  //       }, {} as Record<string, number>)
  //     };
  
  //     // Process users and workspaces
  //     await this.processUsers(startDate, endDate);
  //     this.prepareCharts();
      
  //     this.dataLoaded = true;
  //   } catch (error) {
  //     console.error('Error loading data:', error);
  //     this.error = 'Failed to load data';
  //     this.metrics = {
  //       totalViews: 0,
  //       uniqueUsers: 0,
  //       uniqueReports: 0,
  //       topReports: [],
  //       topUsers: [],
  //       activityTrend: [],
  //       viewsByDate: {}
  //     };
  //   } finally {
  //     this.loading = false;
  //   }
  // }

  
 

  private prepareTopReportsChart() {
    // Safely access metrics with fallback for undefined cases
    const reports = this.metrics.topReports || [];
    
    this.topReportsChartOptions = {
      series: [{ 
        name: 'Views', 
        data: reports.map(r => r?.count || 0) 
      }],
      chart: { 
        type: 'bar', 
        height: 350 
      },
      xaxis: {
        categories: reports.map(r => r?.reportName || 'Unknown Report'),
        labels: {
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
      colors: ['#0077B6']
    };
  }
  // private async processUsers(startDate: Date, endDate: Date) {
  //   try {
  //     const topUsers = await this.powerBIMetricsService.getTopUsers(startDate, endDate, 100)
  //       .toPromise()
  //       .catch(() => [] as UserMetric[]);
  
  //     if (!topUsers || topUsers.length === 0) {
  //       this.allUsers = [];
  //       this.filteredUsers = [];
  //       return;
  //     }
  
  //     const userPromises = topUsers.map(async user => {
  //       try {
  //         const metrics = await this.powerBIMetricsService.getUserMetrics(
  //           user.userId, 
  //           startDate, 
  //           endDate
  //         ).toPromise();
  
  //         // Provide default values if metrics is undefined
  //         if (!metrics) {
  //           return {
  //             id: user.userId,
  //             totalViews: 0,
  //             reports: 0,
  //             workspaces: 0,
  //             lastActivity: 'Never',
  //             activityByDate: []
  //           } as UserDetail;
  //         }
  
  //         return {
  //           id: user.userId,
  //           totalViews: metrics.totalViews,
  //           reports: metrics.reports?.length || 0,
  //           workspaces: metrics.workspaces?.length || 0,
  //           lastActivity: metrics.activityByDate?.length > 0 
  //             ? metrics.activityByDate[metrics.activityByDate.length - 1].date 
  //             : 'Never',
  //           activityByDate: metrics.activityByDate || []
  //         } as UserDetail;
  //       } catch (error) {
  //         console.error(`Error processing user ${user.userId}:`, error);
  //         return {
  //           id: user.userId,
  //           totalViews: 0,
  //           reports: 0,
  //           workspaces: 0,
  //           lastActivity: 'Never',
  //           activityByDate: []
  //         } as UserDetail;
  //       }
  //     });
  
  //     const users = await Promise.all(userPromises);
  //     this.allUsers = users;
  //     this.filteredUsers = [...this.allUsers];
  //   } catch (error) {
  //     console.error('Error processing users:', error);
  //     this.allUsers = [];
  //     this.filteredUsers = [];
  //   }
  // }
  private processWorkspaces() {
    // Get unique workspaces from the reports
    const workspaceSet = new Set<string>();
    this.metrics.topReports.forEach(report => {
      const workspace = this.workspaces.find(w => w.id === report.reportId?.split('/')[0]);
      if (workspace) {
        workspaceSet.add(workspace.id);
      }
    });
    
    this.workspaces = Array.from(workspaceSet).map(id => ({
      id,
      name: this.workspaces.find(w => w.id === id)?.name || id
    }));
    
    // Add "All Workspaces" option
    this.workspaces = [{ id: 'all', name: 'All Workspaces' }, ...this.workspaces];
  }

  private prepareCharts() {
    this.prepareViewsChart();
    this.prepareTopReportsChart();
    this.prepareTopUsersChart();
    this.prepareActivityTrendChart();
  }

  private prepareViewsChart() {
    if (!this.metrics.viewsByDate) return;
  
    // Convert date strings to timestamps and sort chronologically
    const dataPoints = Object.entries(this.metrics.viewsByDate)
      .map(([dateString, count]) => ({
        x: new Date(dateString).getTime(), // Convert to timestamp
        y: count
      }))
      .sort((a, b) => a.x - b.x); // Sort by date
  
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
          datetimeUTC: true,
          format: 'dd MMM' // More readable date format
        }
      },
      yaxis: {
        title: { text: 'Views' },
        min: 0 // Always start at 0
      },
      stroke: {
        width: 2,
        curve: 'smooth'
      },
      tooltip: {
        x: {
          format: 'dd MMM yyyy'
        }
      },
      colors: ['#ffb703'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
        }
      }
    };
  }



  private prepareTopUsersChart() {
    this.topUsersChartOptions = {
      series: [{ 
        name: 'Views', 
        data: this.metrics.topUsers.map(u => u.count) 
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
        categories: this.metrics.topUsers.map(u => u.userId.split('@')[0]),
        labels: {
          rotate: -45,
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

  private prepareActivityTrendChart() {
    this.activityTrendChartOptions = {
      series: [{
        name: 'Active Users',
        data: this.metrics.activityTrend.map(t => t.count)
      }],
      chart: {
        type: 'line',
        height: 350
      },
      xaxis: {
        categories: this.metrics.activityTrend.map(t => t.date),
        type: 'datetime',
        labels: {
          datetimeUTC: true
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

  private getConsumptionMethodDisplayName(method: string): string {
    const methodExplanations: {[key: string]: string} = {
      'Microsoft Teams': 'Microsoft Teams (embedded views)',
      'EmbeddingForYourOrganization': 'Power BI Embedded in your apps',
      'PowerPointAddIn': 'Power BI visuals in PowerPoint',
      'Web': 'Direct access via browser',
      'Mobile': 'Mobile app access',
      'Desktop': 'Power BI Desktop'
    };

    return methodExplanations[method] || method;
  }
  // async selectUser(userId: string) {
  //   this.selectedUserId = userId;
  //   const endDate = new Date();
  //   const startDate = new Date();
  //   startDate.setDate(endDate.getDate() - this.selectedPeriod);
  
  //   try {
  //     const [userMetrics, workspaceDistribution, consumptionMethods] = await Promise.all([
  //       this.powerBIMetricsService.getUserMetrics(userId, startDate, endDate).toPromise(),
  //       this.powerBIMetricsService.getWorkspaceViewsDistribution(userId, startDate, endDate).toPromise(),
  //       this.powerBIMetricsService.getUserConsumptionMethods(userId, startDate, endDate).toPromise()
  //     ]);
  
  //     if (!userMetrics || !workspaceDistribution || !consumptionMethods) {
  //       throw new Error('Failed to load user metrics');
  //     }
  
  //     // Process consumption methods to replace null with 'Microsoft Teams'
  //     this.userConsumptionMethods = consumptionMethods.map(m => ({
  //       method: m.method === null ? 'Microsoft Teams' : m.method,
  //       count: m.count
  //     }));
  
  //     this.userMetrics = {
  //       ...userMetrics,
  //       activityChartData: userMetrics.activityByDate.map(a => ({
  //         x: a.date,
  //         y: a.count
  //       })),
  //       workspaceDistribution,
  //       consumptionMethods: this.userConsumptionMethods
  //     };
  
  //     this.prepareUserWorkspacePieChart();
  //     this.prepareUserConsumptionChart();
  //     this.cdr.detectChanges();
  //   } catch (error) {
  //     console.error('Error loading user metrics:', error);
  //   }
  // }

  async selectUser(userId: string) {
    this.selectedUserId = userId;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - this.selectedPeriod);
  
    // Get current filter values
    const workspaceId = this.selectedWorkspace === 'all' ? undefined : this.selectedWorkspace;
    const reportId = this.selectedReport === null ? undefined : this.selectedReport;
  
    try {
      const [userMetrics, workspaceDistribution, consumptionMethods] = await Promise.all([
        this.powerBIMetricsService.getUserMetrics(
          userId, 
          startDate, 
          endDate,
          workspaceId,
          reportId
        ).toPromise(),
        this.powerBIMetricsService.getWorkspaceViewsDistribution(
          userId, 
          startDate, 
          endDate,
          reportId
        ).toPromise(),
        this.powerBIMetricsService.getUserConsumptionMethods(
          userId, 
          startDate, 
          endDate
        ).toPromise()
      ]);
  
      if (!userMetrics || !workspaceDistribution || !consumptionMethods) {
        throw new Error('Failed to load user metrics');
      }
  
      // Process consumption methods to replace null with 'Microsoft Teams'
      this.userConsumptionMethods = consumptionMethods.map(m => ({
        method: m.method === null ? 'Microsoft Teams' : m.method,
        count: m.count
      }));
  
      this.userMetrics = {
        ...userMetrics,
        activityChartData: userMetrics.activityByDate.map(a => ({
          x: a.date,
          y: a.count
        })),
        workspaceDistribution,
        consumptionMethods: this.userConsumptionMethods
      };
  
      this.prepareUserWorkspacePieChart();
      this.prepareUserConsumptionChart();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading user metrics:', error);
    }
  }
  
  private prepareUserWorkspacePieChart() {
    if (!this.userMetrics?.workspaceDistribution) return;

    const viewsData = this.userMetrics.workspaceDistribution as WorkspaceViewDistribution[];

    this.userWorkspacePieChartOptions = {
      series: viewsData.map(w => w.count),
      chart: {
        type: 'pie',
        height: 350,
      },
      labels: viewsData.map(w => w.workspaceName),
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
        style: {
          fontSize: '12px',
          colors: ['#fff'],
        },
      },
      legend: {
        position: 'bottom'
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value} views`,
        },
      },
      colors: this.blueGradientColors,
    };
  }

  onTopUserChartClick(dataPointIndex: number) {
    const selectedUserId = this.metrics.topUsers[dataPointIndex]?.userId;
    if (!selectedUserId) return;

    this.activeView = 'user';
    this.selectedUserId = selectedUserId;
    this.cdr.detectChanges();
    this.selectUser(selectedUserId);
  }

  getPaginatedUsers(): UserDetail[] {
    const startIndex = (this.currentPage - 1) * this.usersPerPage;
    return this.filteredUsers.slice(startIndex, startIndex + this.usersPerPage);
  }
  // async loadData(days: number): Promise<void> {
  //   this.loading = true;
  //   this.error = '';
  //   this.selectedPeriod = days;
  
  //   try {
  //     const endDate = new Date();
  //     const startDate = new Date();
  //     startDate.setDate(endDate.getDate() - days);
  
  //     // Handle workspace and report filters
  //     const workspaceId = this.selectedWorkspace === 'all' || this.selectedWorkspace === null 
  //       ? undefined 
  //       : this.selectedWorkspace as string;
      
  //     const reportId = this.selectedReport === null 
  //       ? undefined 
  //       : this.selectedReport as string;
  
  //     // Get all metrics in parallel with filters applied
  //     const [
  //       viewsByDate, 
  //       topReports, 
  //       topUsers, 
  //       activityTrend,
  //       uniqueUserCount,
  //       uniqueReportCount
  //     ] = await Promise.all([
  //       this.powerBIMetricsService.getViewCountsByDate(startDate, endDate, workspaceId, reportId).toPromise(),
  //       this.powerBIMetricsService.getTopReports(startDate, endDate, 10, workspaceId).toPromise(),
  //       this.powerBIMetricsService.getTopUsers(startDate, endDate, 10, workspaceId, reportId).toPromise(),
  //       this.powerBIMetricsService.getUserActivityTrend(startDate, endDate, workspaceId, reportId).toPromise(),
  //       this.powerBIMetricsService.getUniqueUserCount(startDate, endDate, workspaceId, reportId).toPromise(),
  //       this.powerBIMetricsService.getUniqueReportCount(startDate, endDate, workspaceId).toPromise()
  //     ]);
  
  //     // Calculate total views
  //     const totalViews = (viewsByDate || []).reduce((sum, day) => sum + (day?.count || 0), 0);
  
  //     // Update metrics
  //     this.metrics = {
  //       totalViews,
  //       uniqueUsers: uniqueUserCount || 0,
  //       uniqueReports: uniqueReportCount || 0,
  //       topReports: topReports || [],
  //       topUsers: topUsers || [],
  //       activityTrend: activityTrend || [],
  //       viewsByDate: (viewsByDate || []).reduce((acc, day) => {
  //         if (day?.date) {
  //           acc[day.date] = day.count || 0;
  //         }
  //         return acc;
  //       }, {} as Record<string, number>)
  //     };
  
  //     // Process users and workspaces
  //     await this.processUsers(startDate, endDate, workspaceId, reportId);
  //     this.prepareCharts();
      
  //     this.dataLoaded = true;
  //   } catch (error) {
  //     console.error('Error loading data:', error);
  //     this.error = 'Failed to load data';
  //     this.metrics = {
  //       totalViews: 0,
  //       uniqueUsers: 0,
  //       uniqueReports: 0,
  //       topReports: [],
  //       topUsers: [],
  //       activityTrend: [],
  //       viewsByDate: {}
  //     };
  //   } finally {
  //     this.loading = false;
  //   }
  // }

  async loadData(days: number): Promise<void> {
    this.loading = true;
    this.error = '';
    this.selectedPeriod = days;
  
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
  
      // Handle workspace and report filters
      const workspaceId = this.selectedWorkspace === 'all' || this.selectedWorkspace === null 
        ? undefined 
        : this.selectedWorkspace as string;
      
      const reportId = this.selectedReport === null 
        ? undefined 
        : this.selectedReport as string;
  
      // Get all metrics in parallel with filters applied
      const [
        viewsByDate, 
        topReports, 
        topUsers, 
        activityTrend,
        uniqueUserCount,
        uniqueReportCount
      ] = await Promise.all([
        this.powerBIMetricsService.getViewCountsByDate(startDate, endDate, workspaceId, reportId).toPromise(),
        this.powerBIMetricsService.getTopReports(startDate, endDate, 10, workspaceId).toPromise(),
        this.powerBIMetricsService.getTopUsers(startDate, endDate, 10, workspaceId, reportId).toPromise(),
        this.powerBIMetricsService.getUserActivityTrend(startDate, endDate, workspaceId, reportId).toPromise(),
        this.powerBIMetricsService.getUniqueUserCount(startDate, endDate, workspaceId, reportId).toPromise(),
        this.powerBIMetricsService.getUniqueReportCount(startDate, endDate, workspaceId).toPromise()
      ]);
  
      // Calculate total views
      const totalViews = (viewsByDate || []).reduce((sum, day) => sum + (day?.count || 0), 0);
  
      // Update metrics
      this.metrics = {
        totalViews,
        uniqueUsers: uniqueUserCount || 0,
        uniqueReports: uniqueReportCount || 0,
        topReports: topReports || [],
        topUsers: topUsers || [],
        activityTrend: activityTrend || [],
        viewsByDate: (viewsByDate || []).reduce((acc, day) => {
          if (day?.date) {
            acc[day.date] = day.count || 0;
          }
          return acc;
        }, {} as Record<string, number>)
      };
  
      // Process users and workspaces
      await this.processUsers(startDate, endDate, workspaceId, reportId);
      this.prepareCharts();
      
      // If a user is selected, refresh their data with the new filters
      if (this.selectedUserId) {
        await this.selectUser(this.selectedUserId);
      }
      
      this.dataLoaded = true;
    } catch (error) {
      console.error('Error loading data:', error);
      this.error = 'Failed to load data';
      this.metrics = {
        totalViews: 0,
        uniqueUsers: 0,
        uniqueReports: 0,
        topReports: [],
        topUsers: [],
        activityTrend: [],
        viewsByDate: {}
      };
    } finally {
      this.loading = false;
    }
  }
  private prepareUserConsumptionChart() {
    if (!this.userConsumptionMethods || this.userConsumptionMethods.length === 0) return;
    
    console.log('User consumption methods before chart preparation:', this.userConsumptionMethods);
    const teamsData = this.userConsumptionMethods.find(m => m.method === 'Microsoft Teams');
    console.log('Microsoft Teams data:', teamsData);
  
    this.userConsumptionChartOptions = {
      series: this.userConsumptionMethods.map(m => m.count),
      chart: {
        type: 'pie',
        height: 350,
      },
      labels: this.userConsumptionMethods.map(m => this.getConsumptionMethodDisplayName(m.method)),
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
        style: {
          fontSize: '12px',
          colors: ['#fff'],
        },
      },
      legend: {
        position: 'bottom',
        formatter: (legendName: string) => {
          const methodData = this.userConsumptionMethods.find(
            m => this.getConsumptionMethodDisplayName(m.method) === legendName
          );
          return `${legendName} (${methodData?.count || 0})`;
        },
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value} views`,
        },
      },
      colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#789DBC', '#8ACDD7'],
    };
    
    // After chart preparation, log the final chart options to verify the data
    console.log('Chart series values:', this.userConsumptionChartOptions.series);
    console.log('Chart labels:', this.userConsumptionChartOptions.labels);
  }
  
  async processUsers(
    startDate: Date, 
    endDate: Date,
    workspaceId?: string,
    reportId?: string
  ): Promise<void> {
    try {
      const topUsers = await this.powerBIMetricsService.getTopUsers(
        startDate, 
        endDate, 
        100,
        workspaceId || undefined,
        reportId || undefined
      ).toPromise().catch(() => [] as UserMetric[]);
  
      if (!topUsers || topUsers.length === 0) {
        this.allUsers = [];
        this.filteredUsers = [];
        return;
      }
  
      const userPromises = topUsers.map(async user => {
        try {
          const metrics = await this.powerBIMetricsService.getUserMetrics(
            user.userId, 
            startDate, 
            endDate,
            workspaceId || undefined,
            reportId || undefined
          ).toPromise();
  
          return {
            id: user.userId,
            totalViews: metrics?.totalViews || 0,
            reports: metrics?.reports?.length || 0,
            workspaces: metrics?.workspaces?.length || 0,
            lastActivity: metrics?.activityByDate && metrics.activityByDate.length > 0 
              ? metrics.activityByDate[metrics.activityByDate.length - 1].date 
              : 'Never',
            activityByDate: metrics?.activityByDate || []
          } as UserDetail;
        } catch (error) {
          console.error(`Error processing user ${user.userId}:`, error);
          return {
            id: user.userId,
            totalViews: 0,
            reports: 0,
            workspaces: 0,
            lastActivity: 'Never',
            activityByDate: []
          } as UserDetail;
        }
      });

      let databaseUsers:any = await this.homeService.getDatabaseUsers().toPromise();
      databaseUsers = databaseUsers.map((user: any) => user.user_email)
      console.log("database users", databaseUsers);


      
      
      const users = await Promise.all(userPromises);
      const userEmails = users.map((user: any) => user.id);
      console.log("email", userEmails);
      console.log("user check", users);
      const difference = databaseUsers.filter((item:any) => !userEmails.includes(item));
      console.log("difference", difference);

      const zeroViewedUsers = difference.map((user: any) => {
        return {
          id: user,
          totalViews: 0,
          reports: 0,
          workspaces: 0,
          lastActivity: 'Never',
          activityByDate: []
        }
      }
      )

    
      this.allUsers = users;
      this.filteredUsers = [...this.allUsers, ...zeroViewedUsers];
    } catch (error) {
      console.error('Error processing users:', error);
      this.allUsers = [];
      this.filteredUsers = [];
    }
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  getPageNumbers(): number[] {
    const totalPages = Math.ceil(this.filteredUsers.length / this.usersPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  filterUsers() {
    if (!this.userSearchQuery) {
      this.filteredUsers = [...this.allUsers];
      return;
    }

    const query = this.userSearchQuery.toLowerCase();
    this.filteredUsers = this.allUsers.filter(user => 
      user.id.toLowerCase().includes(query)
    );
    this.currentPage = 1;
  }

  toggleUserListAccordion() {
    this.isUserListExpanded = !this.isUserListExpanded;
  }

  exportUserListToCSV() {
    const usersToExport = this.filteredUsers;
    
    const headers = ['Email', 'Total Views', 'Last Activity'];
    const rows = usersToExport.map(user => [
      user.id, 
      user.totalViews, 
      user.lastActivity === 'Never' ? 'Never' : new Date(user.lastActivity).toLocaleDateString()
    ]);
  
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')) 
    ].join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'powerbi-users.csv';
    link.click();
  }



workspaces: PowerBIWorkspace[] = [];
reports: PowerBIReport[] = [];

workspaceOptions: {id: string, name: string}[] = [];
reportOptions: {id: string, name: string, workspaceId: string}[] = [];
selectedWorkspace: string = 'all'; 
selectedReport: string | null = null;




async loadFilters(): Promise<void> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - this.selectedPeriod);

  this.workspaceOptions = await this.powerBIMetricsService.getDistinctWorkspaces(startDate, endDate)
    .toPromise() || [];
  
  this.workspaceOptions = [{ id: 'all', name: 'All Workspaces' }, ...this.workspaceOptions];
  
  this.selectedWorkspace = 'all';
  
  await this.updateReports();
}

async updateReports(): Promise<void> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - this.selectedPeriod);

  this.reportOptions = (await this.powerBIMetricsService.getDistinctReports(
    startDate, 
    endDate, 
    this.selectedWorkspace === 'all' ? undefined : this.selectedWorkspace
  ).toPromise()) || [];
  
  if (this.selectedReport && !this.reportOptions.some(r => r.id === this.selectedReport)) {
    this.selectedReport = null;
  }
}
onWorkspaceChange() {
  this.selectedReport = null; 
  this.updateReports();
  this.loadData(this.selectedPeriod); 
}

onReportChange() {
  if (this.selectedReport === 'all') {
    this.selectedReport = null;
  }
  this.loadData(this.selectedPeriod); 
}



}