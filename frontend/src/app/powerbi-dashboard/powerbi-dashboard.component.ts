import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { PowerBIMetricsService, PowerBIReport, PowerBIWorkspace } from '../Services/powerbi-metrics.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface ViewCount {
  date: string;
  count: number;
}

interface ReportMetric {
  reportId: string;
  reportName: string;
  count: number;
}

interface UserMetric {
  userId: string;
  count: number;
}

interface UserActivity {
  date: string;
  count: number;
}

interface UserDetail {
  id: string;
  totalViews: number;
  reports: number; // Changed from Set to number
  workspaces: number; // Changed from Set to number
  lastActivity: string;
  activityByDate: {date: string, count: number}[]; // Changed from Map
}

interface WorkspaceViewDistribution {
  workspaceId: string;
  workspaceName: string;
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
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData(this.selectedPeriod);
  }

  
  
  async loadData(days: number) {
    this.loading = true;
    this.error = '';
    this.selectedPeriod = days;
  
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
  
      // Get all metrics in parallel
      const [
        viewsByDate = [], 
        topReports = [], 
        topUsers = [], 
        activityTrend = [],
        uniqueUserCount = 0,
        uniqueReportCount = 0
      ] = await Promise.all([
        this.powerBIMetricsService.getViewsByDate(startDate, endDate).toPromise(),
        this.powerBIMetricsService.getTopReports(startDate, endDate, 10).toPromise(),
        this.powerBIMetricsService.getTopUsers(startDate, endDate, 10).toPromise(),
        this.powerBIMetricsService.getUserActivityTrend(startDate, endDate).toPromise(),
        this.powerBIMetricsService.getUniqueUserCount(startDate, endDate).toPromise(),
        this.powerBIMetricsService.getUniqueReportCount(startDate, endDate).toPromise()
      ]);
  
      
      // Calculate total views
      const totalViews = (viewsByDate as ViewCount[]).reduce((sum, day) => sum + (day?.count || 0), 0);
  
      // Update metrics
      this.metrics = {
        totalViews,
        uniqueUsers: uniqueUserCount as number,
        uniqueReports: uniqueReportCount as number,
        topReports: topReports as ReportMetric[],
        topUsers: topUsers as UserMetric[],
        activityTrend: activityTrend as UserActivity[],
        viewsByDate: (viewsByDate as ViewCount[]).reduce((acc, day) => {
          if (day?.date) {
            acc[day.date] = day.count || 0;
          }
          return acc;
        }, {} as Record<string, number>)
      };
  
      // Process users and workspaces
      await this.processUsers(startDate, endDate);
      this.processWorkspaces();
      this.prepareCharts();
      
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


  
 
  onWorkspaceChange() {
    this.selectedReport = null; // Reset report filter when workspace changes
    this.updateReports();
    this.loadData(this.selectedPeriod); // Reload data with new filters
  }
  
  onReportChange() {
    this.loadData(this.selectedPeriod); // Reload data with new filters
  }
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
  private async processUsers(startDate: Date, endDate: Date) {
    try {
      const topUsers = await this.powerBIMetricsService.getTopUsers(startDate, endDate, 100)
        .toPromise()
        .catch(() => [] as UserMetric[]);
  
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
            endDate
          ).toPromise();
  
          // Provide default values if metrics is undefined
          if (!metrics) {
            return {
              id: user.userId,
              totalViews: 0,
              reports: 0,
              workspaces: 0,
              lastActivity: 'Never',
              activityByDate: []
            } as UserDetail;
          }
  
          return {
            id: user.userId,
            totalViews: metrics.totalViews,
            reports: metrics.reports?.length || 0,
            workspaces: metrics.workspaces?.length || 0,
            lastActivity: metrics.activityByDate?.length > 0 
              ? metrics.activityByDate[metrics.activityByDate.length - 1].date 
              : 'Never',
            activityByDate: metrics.activityByDate || []
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
  
      const users = await Promise.all(userPromises);
      this.allUsers = users;
      this.filteredUsers = [...this.allUsers];
    } catch (error) {
      console.error('Error processing users:', error);
      this.allUsers = [];
      this.filteredUsers = [];
    }
  }
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
      colors: ['#0077B6'],
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

  async selectUser(userId: string) {
    this.selectedUserId = userId;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - this.selectedPeriod);
  
    try {
      const [userMetrics, workspaceDistribution] = await Promise.all([
        this.powerBIMetricsService.getUserMetrics(userId, startDate, endDate).toPromise(),
        this.powerBIMetricsService.getWorkspaceViewsDistribution(userId, startDate, endDate).toPromise()
      ]);
  
      if (!userMetrics || !workspaceDistribution) {
        throw new Error('Failed to load user metrics');
      }
  
      this.userMetrics = {
        ...userMetrics,
        activityChartData: userMetrics.activityByDate.map(a => ({
          x: a.date,
          y: a.count
        })),
        workspaceDistribution
      };
  
      this.prepareUserWorkspacePieChart();
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



// In your component class
workspaces: PowerBIWorkspace[] = [];
reports: PowerBIReport[] = [];
selectedWorkspace: string | null = null;
selectedReport: string | null = null;

async updateReports(): Promise<void> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - this.selectedPeriod);

  const reports = await this.powerBIMetricsService.getReports(
    startDate, 
    endDate, 
    this.selectedWorkspace || undefined
  ).toPromise();
  
  this.reports = reports || [];
}


async loadFilters(): Promise<void> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - this.selectedPeriod);

  const workspaces = await this.powerBIMetricsService.getWorkspaces(startDate, endDate).toPromise();
  this.workspaces = workspaces || [];
  await this.updateReports();
}



}