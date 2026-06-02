import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormGroup, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { PowerBIMetricsService, PowerBIReport, PowerBIWorkspace } from '../Services/powerbi-metrics.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HomeService } from '../Services/home.service';
import { ToastService } from '../Services/toast.service';
import { DropdownModule } from 'primeng/dropdown';
import { NameMapperService } from '../Services/name-mapper.service';
import { AvatarComponent } from '../components/avatar/avatar.component';
import { AuthService } from '../Auth/services/auth.service';
import { ActiveTimeTrackerService } from '../Services/active-time-tracker.service';

interface ViewCount {
  date: string;
  count: number;
}
interface ActivityData {
  date: string;
  count: number;
}
interface ReportMetric {
  reportId: string;
  reportName: string;
  count: number;
}

interface DateReportView {
  reportId: string;
  reportName: string;
  count: number;
  workspaceId?: string;
  workspaceName?: string;
}

// interface UserDetail {
//   id: string;
//   totalViews: number;
//   reports: number;
//   workspaces: number;
//   lastActivity: string;
//   activityByDate: {date: string, count: number}[];
// }

interface UserDetail {
  id: string;
  name: string; // Add this line
  email?: string;
  department: string; 
  totalViews: number;
  reports: number;
  workspaces: number;
  lastActivity: string;
  activityByDate: {date: string, count: number}[];
  assignedDashboards?: string[];
  estimatedTimeSpent?: number;
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
  imports: [CommonModule, NgApexchartsModule, ReactiveFormsModule, FormsModule, DropdownModule, AvatarComponent, RouterModule],

  standalone: true
})
export class PowerBIDashboardComponent implements OnInit, OnDestroy {

  @HostListener('window:beforeunload', [])
  onBeforeUnload() {
    this.tracker.flush();
  }

  ngOnDestroy() {
    this.tracker.stop();
  }

  private buildTrackingContext() {
    const workspaceId = this.selectedWorkspace === 'all' ? undefined : this.selectedWorkspace;
    const workspaceName = workspaceId
      ? (this.workspaceOptions.find(w => w.id === workspaceId)?.name || workspaceId)
      : 'All Workspaces';

    const hasReport = !!this.selectedReport;
    const reportId = hasReport ? this.selectedReport! : 'powerbi-analytics';
    const reportName = hasReport
      ? (this.reportOptions.find(r => r.id === this.selectedReport)?.name || 'Power BI Report')
      : 'Power BI Analytics Dashboard';

    const tabName = this.activeView === 'workspace'
      ? `Workspace: ${workspaceName}`
      : this.activeView === 'user'
        ? `Users: ${hasReport ? reportName : workspaceName}`
        : 'Access Matrix';

    return { reportId, reportName, tabName, workspaceId, workspaceName };
  }

  private startOrSwitchTracking() {
    const ctx = this.buildTrackingContext();
    if (!this.trackingStarted) {
      this.tracker.startTracking(ctx);
      this.trackingStarted = true;
    } else {
      this.tracker.switchContext(ctx);
    }
  }

  flushTelemetryTime() {
    this.tracker.flush();
  }

  // View state
  activeView: 'workspace' | 'user' | 'access' = 'workspace';
  private trackingStarted = false;
  selectedUserId: string | null = null;
  userWsShowAll = false;
  dashboardAccessData: any[] = [];
  loadingAccessMatrix = false;
  dashboardAccessSearchQuery = '';

  selectedPeriod = 30;
  isUserListExpanded = false;
  
  @Input() activeDashboard: 'powerbi' | 'webtool' = 'powerbi';
  @Output() dashboardChange = new EventEmitter<'powerbi' | 'webtool'>();
  
  // Data
  loading = false;
  error = '';
  dataLoaded = false;
  allUsers: UserDetail[] = [];
  filteredUsers: UserDetail[] = [];
  userMetrics: any = {};
  userSearchQuery = '';
  filteredReports: ReportMetric[] = [];

  dateIndexMapping: {[key: string]: number} = {};
  unusedReports: {id: number, dashboard: string, groupId: number | null}[] = [];
  loadingUnusedReports = false;
  allRegularUsers: UserDetail[] = [];
  allZeroViewUsers: UserDetail[] = [];

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
    '#1e3a8a', // Deep corporate navy
    '#2563eb', // Indigo-blue
    '#3b82f6', // Mid blue
    '#60a5fa', // Sky blue
    '#0d9488', // Teal
    '#06b6d4', // Cyan
    '#4f46e5', // Royal indigo
    '#64748b'  // Slate grey
  ];

userReportViews: {reportId: string, reportName: string, count: number}[] = [];
userTabTimeSpent: any[] = [];
lastRefreshedAt: string = '';
timeOverview: { topUsersByTime: any[]; topReportsByTime: any[] } | null = null;
totalTimeAllUsersSeconds = 0;

  // Pagination
  currentPage = 1;
  usersPerPage = 10;
  timePeriods = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 }
  ];

  // userCounts = {
  //   totalUsers: 0,
  //   totalViews: 0,
  //   zeroViewUsers: 0,
  //   lowActivityUsers: 0
  // };
userCounts = {
  totalUsers: 0,
  totalViews: 0,
  zeroViewUsers: 0,
  lowActivityUsers: 0,
  deactivatedUsers: 0,
  lastDeactivatedUsers: [] as {email: string, name: string, department: string, deactivatedAt: Date}[]
};
  

  constructor(
    private powerBIMetricsService: PowerBIMetricsService,
    private homeService: HomeService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private nameMapper: NameMapperService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private tracker: ActiveTimeTrackerService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['view'] && ['workspace', 'user', 'access'].includes(params['view'])) {
        this.activeView = params['view'] as 'workspace' | 'user' | 'access';
        this.startOrSwitchTracking();
      }
    });

    this.powerBIMetricsService.getLastRefresh().subscribe({
      next: (res) => { if (res && res.lastRefreshedAt) this.lastRefreshedAt = res.lastRefreshedAt; },
      error: (err) => console.error('Failed to load last refresh time:', err)
    });

    this.loadFilters().then(() => {
      this.startOrSwitchTracking();
      this.loadData(this.selectedPeriod);
    });
  }

    toggleDashboard(dashboard: 'powerbi' | 'webtool') {
      this.tracker.flush();
      this.dashboardChange.emit(dashboard);
    }
  


  
 

    private prepareTopReportsChart() {
      const reports = (this.timeOverview?.topReportsByTime || []).slice(0, 10);
      if (!reports.length) { this.topReportsChartOptions = null; return; }

      const categories = reports.map(r => {
        const cleanName = this.transformDisplayName(r?.reportName || 'Unknown Report');
        return cleanName.length > 25 ? cleanName.slice(0, 25) + '...' : cleanName;
      });

      this.topReportsChartOptions = {
        series: [{ name: 'Time Spent (min)', data: reports.map(r => Math.round((r?.totalSeconds || 0) / 60)) }],
        chart: { type: 'bar', height: 280, toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 4, borderRadiusApplication: 'end' } },
        xaxis: { categories, labels: { style: { fontSize: '10px', colors: '#64748b' } } },
        yaxis: { labels: { style: { fontSize: '11px', colors: '#334155', fontWeight: 500 } } },
        dataLabels: {
          enabled: true,
          style: { fontSize: '10px', colors: ['#ffffff'], fontWeight: '600' },
          offsetX: -6,
          formatter: (v: number) => v > 0 ? `${v}m` : ''
        },
        colors: ['#f59e0b'],
        tooltip: { y: { formatter: (v: number) => `${v} min` } }
      };
    }

    private processWorkspaces() {
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
        height: 280,
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: true,
          format: 'dd MMM', // More readable date format
          rotate: -45, // Rotate labels to prevent overlap
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: false, // Don't trim labels
          maxHeight: 120, // Give more space for rotated labels,
          showDuplicates: false,
          
        },
        // Add padding to ensure last label is visible
        axisBorder: {
          show: true
        },
        axisTicks: {
          show: true
        }
      },
      yaxis: {
        title: {
          text: 'Views'
        },
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
      colors: ['#2563eb'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.25,
          opacityTo: 0.05,
        }
      },
      // Add padding to the chart to ensure labels fit
      plotOptions: {
        area: {
          fillTo: 'end'
        }
      },
      // Ensure there's enough margin for labels
      grid: {
        padding: {
          right: 20,
          left: 20
        }
      }
    };
  }



  private prepareTopUsersChart() {
    const users = (this.timeOverview?.topUsersByTime || []).slice(0, 10);
    if (!users.length) { this.topUsersChartOptions = null; return; }

    const nameMappings = this.allRegularUsers.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {} as {[email: string]: string});

    const categories = users.map(u => {
      const name = nameMappings[u.userId] || u.userId.split('@')[0];
      return name.length > 20 ? name.slice(0, 20) + '...' : name;
    });

    this.topUsersChartOptions = {
      series: [{ name: 'Time Spent (min)', data: users.map(u => Math.round((u.totalSeconds || 0) / 60)) }],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: { show: false },
        events: {
          dataPointSelection: (_: any, __: any, config: { dataPointIndex: number }) => {
            const uid = users[config.dataPointIndex]?.userId;
            if (uid) this.onTopUserChartClick(config.dataPointIndex);
          }
        }
      },
      plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 4, borderRadiusApplication: 'end' } },
      xaxis: { categories, labels: { style: { fontSize: '10px', colors: '#64748b' } } },
      yaxis: { labels: { style: { fontSize: '11px', colors: '#334155', fontWeight: 500 } } },
      dataLabels: {
        enabled: true,
        style: { fontSize: '10px', colors: ['#ffffff'], fontWeight: '600' },
        offsetX: -6,
        formatter: (v: number) => v > 0 ? `${v}m` : ''
      },
      colors: ['#6366f1'],
      tooltip: { y: { formatter: (v: number) => `${v} min` } }
    };
  }

  formatSecondsLabel(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '<1m';
  }

  private prepareActivityTimelineChart() {
    // Create a complete date range including all dates between min and max
    const activityData: ActivityData[] = this.userMetrics.activityByDate || [];
    
    // Find min and max dates
    let minDate: Date | undefined;
    let maxDate: Date | undefined;
    
    if (activityData.length > 0) {
      minDate = new Date(activityData[0].date);
      maxDate = new Date(activityData[0].date);
      
      for (const item of activityData) {
        const itemDate = new Date(item.date);
        if (itemDate < minDate) minDate = itemDate;
        if (itemDate > maxDate) maxDate = itemDate;
      }
    }
  
    // Generate complete date range
    const allDates: string[] = [];
    const seriesData: number[] = [];
    const dateToIndexMap: {[key: string]: number} = {};
    
    if (minDate && maxDate) {
      const currentDate = new Date(minDate);
      let index = 0;
      
      while (currentDate <= maxDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        allDates.push(dateStr);
        
        // Find activity for this date (now properly typed)
        const activity = activityData.find(a => a.date === dateStr);
        seriesData.push(activity ? activity.count : 0);
        
        // Map the date to its original index in activityData
        if (activity) {
          dateToIndexMap[dateStr] = activityData.indexOf(activity);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
        index++;
      }
      
      // Store the date mapping for click handling
      this.dateIndexMapping = dateToIndexMap;
    }
  
    this.activityTimelineChartOptions = {
      series: [{
        name: 'Views',
        data: seriesData
      }],
      chart: {
        type: 'bar',
        height: 300,
        events: {
          dataPointSelection: (event: any, chartContext: any, config: { dataPointIndex: number }) => {
            const clickedDate = allDates[config.dataPointIndex];
            this.onActivityTimelineClick(clickedDate);
          }
        }
      },
      xaxis: {
        type: 'category',
        categories: allDates,
        labels: {
          rotate: -45,
          hideOverlappingLabels: true,
          offsetY: 5
        }
      },
      colors: ['#2563eb'],
      plotOptions: {
        bar: {
          columnWidth: '60%'
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} views`,
        }
      }
    };
  }
  private prepareActivityTrendChart() { 
    if (!this.metrics?.activityTrend) return; 
  
    // Sort activity trend data by date
    const sortedTrend = [...this.metrics.activityTrend].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  
    // Process data with explicit UTC handling
    const chartData = sortedTrend.map(item => ({ 
      x: new Date(item.date).getTime(), // UTC timestamp 
      y: item.count, 
      // Store original date for tooltips
      originalDate: item.date.split('T')[0] 
    }));
  
    this.activityTrendChartOptions = { 
      series: [{ 
        name: 'Active Users', 
        data: chartData 
      }],
      chart: { 
        type: 'line',
        height: 300,
        toolbar: { 
          show: false 
        } 
      },
      plotOptions: { 
        bar: { 
          columnWidth: '60%' // Adjust this percentage to control bar width 
        } 
      },
      xaxis: { 
        type: 'datetime', 
        // Force specific number of x-axis labels
        tickAmount: 7,
        // Show first and last date plus distribute evenly between
        tickPlacement: 'on',
        labels: { 
          formatter: (timestamp: number) => { 
            const dataPoint = chartData.find(d => d.x === timestamp); 
            return this.formatDisplayDate(dataPoint?.originalDate || ''); 
          },
          style: { 
            colors: '#93c5fd', 
            fontSize: '12px', 
            cssClass: 'apexcharts-xaxis-label' 
          },
          datetimeUTC: false,
          showDuplicates: true,
          rotate: 0
        },
        axisBorder: { 
          show: true, 
          color: '#E5E7EB' 
        }, 
        axisTicks: { 
          show: true, 
          color: '#E5E7EB' 
        }
      }, 
      yaxis: { 
        title: { 
          text: 'Active Users' 
        }, 
        labels: { 
          style: { 
            colors: '#93c5fd', 
            fontSize: '12px' 
          } 
        } 
      },
      stroke: { 
        width: 2, 
        curve: 'smooth' 
      }, 
      colors: ['#2563eb'], 
      grid: { 
        borderColor: '#dbeafe',
        strokeDashArray: 4,
      },
      tooltip: { 
        x: { 
          formatter: (timestamp: number) => { 
            const dataPoint = chartData.find(d => d.x === timestamp); 
            return this.formatTooltipDate(dataPoint?.originalDate || ''); 
          } 
        } 
      },
      dataLabels: { 
        enabled: false 
      } 
    }; 
  }
  
  private formatDisplayDate(isoDate: string) { 
    if (!isoDate) return ''; 
    const [year, month, day] = isoDate.split('-'); 
    return `${parseInt(day)} ${new Date(isoDate).toLocaleString('default', { month: 'short' })}`; 
  } 
  
  private formatTooltipDate(isoDate: string) { 
    if (!isoDate) return ''; 
    return new Date(isoDate).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }); 
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

  async selectUser(userId: string) {
    this.selectedUserId = userId;
    this.selectedDate = null; 
    this.dateReportViews = []; 
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - this.selectedPeriod);
  
    const workspaceId = this.selectedWorkspace === 'all' ? undefined : this.selectedWorkspace;
    const reportId = this.selectedReport === null ? undefined : this.selectedReport;
  
    try {
      const [userMetrics, workspaceDistribution, consumptionMethods, reportViews, tabTimeSpent] = await Promise.all([
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
        ).toPromise(),
        this.powerBIMetricsService.getUserReportViewsDistribution(
          userId,
          startDate,
          endDate,
          workspaceId
        ).toPromise(),
        this.powerBIMetricsService.getUserTimeSpent(
          userId,
          startDate,
          endDate
        ).toPromise()
      ]);
  
      if (!userMetrics || !workspaceDistribution || !consumptionMethods || !reportViews) {
        throw new Error('Failed to load user metrics');
      }
  
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
        consumptionMethods: this.userConsumptionMethods,
        activityByDate: userMetrics.activityByDate 
      };
  
      this.userReportViews = reportViews;
      this.userTabTimeSpent = tabTimeSpent || [];
      
      this.prepareUserWorkspacePieChart();
      this.prepareUserConsumptionChart();
      this.prepareUserReportViewsChart();
      this.prepareActivityTimelineChart(); 
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading user metrics:', error);
    }
  }
  transformDisplayName(name: string | undefined): string {
    if (!name) return 'Unknown';
    
    // Remove "HGU" prefix (case insensitive)
    let transformed = name.replace(/^HGU\s*-\s*/i, '')
                         .replace(/^HGU/i, '');
    
    // Remove "Dashboard" suffix (case insensitive)
    transformed = transformed.replace(/\s*-\s*Dashboard$/i, '')
                            .replace(/Dashboard$/i, '');
    
    // Trim any remaining whitespace
    return transformed.trim() || 'Unknown';
  }
  
  formatTimeSpent(seconds: number | undefined): string {
    if (!seconds || seconds <= 0) return '0m';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = (seconds / 3600).toFixed(1);
    return `${hours}h`;
  }
  
  private extractWorkspaceName(reportName: string | undefined): string | undefined {
    if (!reportName) return undefined;
    
    // Simple extraction logic - adjust as needed for your naming patterns
    const match = reportName.match(/^(.*?)\s*-\s*/);
    return match ? match[1] : undefined;
  }
  private prepareUserReportViewsChart() {
    if (!this.userReportViews || this.userReportViews.length === 0) {
      this.userReportViewsChartOptions = null;
      return;
    }

    // console.log("viewsss", this.userReportViews)
  
    const topReports = this.userReportViews.slice(0,10);
    
    this.userReportViewsChartOptions = {
      series: topReports.map(r => r.count),
      chart: {
        type: 'pie',
        height: 400, 
      },
      labels: topReports.map(r => r.reportName || `Report (${r.reportId.slice(0, 6)}...`),
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
          const reportData = topReports.find(r => 
            (r.reportName || `Report (${r.reportId.slice(0, 6)}...`) === legendName
          );
          return `${legendName} (${reportData?.count || 0})`;
        },
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value} views`,
        },
       
      },
      colors: this.blueGradientColors,
    };
  }
  private generateDailyActivityData(startDate: Date, endDate: Date, activityData: {date: string, count: number}[]): any[] {
    const activityMap = new Map<string, number>();
    activityData.forEach(item => {
      activityMap.set(item.date, item.count);
    });
  
    const allDates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      allDates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return allDates.map(date => ({
      x: date,
      y: activityMap.get(date) || 0
    }));
  }

  private prepareUserWorkspacePieChart() {
    const timeSpentData = this.groupedTabTimeSpent;
    if (!timeSpentData || timeSpentData.length === 0) {
      this.userWorkspacePieChartOptions = null;
      return;
    }

    this.userWorkspacePieChartOptions = {
      series: timeSpentData.map(w => w.totalSeconds),
      chart: {
        type: 'pie',
        height: 400,
      },
      labels: timeSpentData.map(w => this.transformDisplayName(w.workspaceName)),
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
          const workspaceData = timeSpentData.find(w => 
            this.transformDisplayName(w.workspaceName) === legendName
          );
          return `${legendName} (${this.formatTimeSpent(workspaceData?.totalSeconds || 0)})`;
        }
      },
      tooltip: {
        y: {
          formatter: (value: number) => this.formatTimeSpent(value),
        },
      },
      colors: this.blueGradientColors,
    };
  }


  onTopUserChartClick(dataPointIndex: number) {
    const selectedUserId = this.metrics.topUsers[dataPointIndex]?.userId;
    if (!selectedUserId) return;

    this.activeView = 'user';
    this.startOrSwitchTracking();
    this.selectedUserId = selectedUserId;
    this.cdr.detectChanges();
    this.selectUser(selectedUserId);
  }

  getPaginatedUsers(): UserDetail[] {
    const startIndex = (this.currentPage - 1) * this.usersPerPage;
    return this.filteredUsers.slice(startIndex, startIndex + this.usersPerPage);
  }



getUserDisplayName(userId: string): string {
  if (!userId) return '';
  
  const regularUser = this.allRegularUsers.find(u => u.id === userId);
  if (regularUser) return regularUser.name;
  
  const zeroViewUser = this.allZeroViewUsers.find(u => u.id === userId);
  if (zeroViewUser) return zeroViewUser.name;
  
  return userId;
}


async loadData(days: number): Promise<void> {
    this.loading = true;
    this.error = '';
    this.selectedPeriod = days;
  
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      this.loadingUnusedReports = true;

      // Handle workspace and report filters
      const workspaceId = this.selectedWorkspace === 'all' || this.selectedWorkspace === null 
        ? undefined 
        : this.selectedWorkspace as string;
      
      const reportId = this.selectedReport === null 
        ? undefined 
        : this.selectedReport as string;
  
      this.unusedReports = await this.powerBIMetricsService.getUnusedReports(
        startDate, 
        endDate,
        workspaceId
      ).toPromise() || [];
  
      // Get all metrics in parallel with filters applied
      const [
        viewsByDate, 
        topReports, 
        topUsers, 
        activityTrend,
        uniqueUserCount,
        counts
      ] = await Promise.all([
        this.powerBIMetricsService.getViewCountsByDate(startDate, endDate, workspaceId, reportId).toPromise(),
        reportId 
          ? this.powerBIMetricsService.getDistinctReports(startDate, endDate, workspaceId)
              .toPromise()
              .then(reports => {
                if (!reports) return [];
                return reports.filter(r => r.id === reportId)
                  .map(r => ({
                    reportId: r.id,
                    reportName: r.name,
                    count: 0 // Will be updated from viewsByDate
                  }));
              })
          : this.powerBIMetricsService.getTopReports(startDate, endDate, 10, workspaceId).toPromise(),
        this.powerBIMetricsService.getTopUsers(startDate, endDate, 10, workspaceId, reportId).toPromise(),
        this.powerBIMetricsService.getUserActivityTrend(startDate, endDate, workspaceId, reportId).toPromise(),
        this.powerBIMetricsService.getUniqueUserCount(startDate, endDate, workspaceId, reportId).toPromise(),
        this.powerBIMetricsService.getUserCounts(startDate, endDate, workspaceId, reportId).toPromise()
      ]);
  
      // Store user counts data with deactivated users
      this.userCounts = {
        totalUsers: counts?.totalUsers || 0,
        totalViews: counts?.totalViews || 0,
        zeroViewUsers: counts?.zeroViewUsers || 0,
        lowActivityUsers: counts?.lowActivityUsers || 0,
        deactivatedUsers: counts?.deactivatedUsers || 0,
        lastDeactivatedUsers: counts?.lastDeactivatedUsers || []
      };
  
      // Handle unique report count separately
      const uniqueReportCount = reportId 
        ? 1 
        : await this.powerBIMetricsService.getUniqueReportCount(startDate, endDate, workspaceId).toPromise();
  
      // If a report is selected, update its count from viewsByDate
      if (reportId && topReports && topReports.length > 0 && viewsByDate) {
        const totalViews = viewsByDate.reduce((sum, day) => sum + (day?.count || 0), 0);
        topReports[0].count = totalViews;
      }
  
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

      // Load time-spent overview for Top Reports & Top Users charts
      try {
        const timeData = await this.powerBIMetricsService.getTimeSpentOverview(startDate, endDate, workspaceId).toPromise();
        this.timeOverview = timeData || { topUsersByTime: [], topReportsByTime: [] };
        this.totalTimeAllUsersSeconds = (this.timeOverview.topUsersByTime || []).reduce((s, u) => s + (u.totalSeconds || 0), 0);
      } catch {
        this.timeOverview = { topUsersByTime: [], topReportsByTime: [] };
      }

      // Process users and workspaces
      await this.processUsers(startDate, endDate, workspaceId, reportId);
      
      if (this.activeView === 'access') {
        await this.loadAccessMatrix();
      }
      
      this.prepareCharts();
      
      // If a user is selected, refresh their data with the new filters
      if (this.selectedUserId) {
        await this.selectUser(this.selectedUserId);
      }
      
      this.dataLoaded = true;
    } catch (error) {
      console.error('Error loading data:', error);
      this.unusedReports = [];
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
      // Reset user counts data on error
      this.userCounts = {
        totalUsers: 0,
        totalViews: 0,
        zeroViewUsers: 0,
        lowActivityUsers: 0,
        deactivatedUsers: 0,
        lastDeactivatedUsers: []
      };
    } finally {
      this.loading = false;
      this.loadingUnusedReports = false;
    }
  }

  private prepareUserConsumptionChart() {
    // Check if there are no consumption methods or all counts are 0
    if (!this.userConsumptionMethods || this.userConsumptionMethods.length === 0 || 
        this.userConsumptionMethods.every(m => m.count === 0)) {
      this.userConsumptionChartOptions = null;
      return;
    }
  
    // console.log('User consumption methods before chart preparation:', this.userConsumptionMethods);
    const teamsData = this.userConsumptionMethods.find(m => m.method === 'Microsoft Teams');
    // console.log('Microsoft Teams data:', teamsData);
  
    this.userConsumptionChartOptions = {
      series: this.userConsumptionMethods.map(m => m.count),
      chart: {
        type: 'pie',
        height: 340,
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
      colors: this.blueGradientColors,
    };
    
    // console.log('Chart series values:', this.userConsumptionChartOptions.series);
    // console.log('Chart labels:', this.userConsumptionChartOptions.labels);
  }


private async processUsers(
  startDate: Date, 
  endDate: Date,
  workspaceId?: string,
  reportId?: string
): Promise<void> {
  try {
    const topUsers = await this.powerBIMetricsService.getTopUsers(
      startDate, 
      endDate, 
      1000,
      workspaceId || undefined,
      reportId || undefined
    ).toPromise().catch(() => [] as UserMetric[]);

    if (!topUsers || topUsers.length === 0) {
      this.allRegularUsers = [];
      this.allZeroViewUsers = [];
      this.filteredUsers = [];
      return;
    }

    // Get name and department mappings
    const { names: nameMappings, departments: departmentMappings } = 
      await this.powerBIMetricsService.getUserNameMappings(
        topUsers.map(u => u.userId)
      ).toPromise() || { names: {}, departments: {} };

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
          name: nameMappings[user.userId] || user.userId.split('@')[0],
          department: departmentMappings[user.userId] || 'Unknown',
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
          name: user.userId.split('@')[0],
          department: 'Unknown',
          totalViews: 0,
          reports: 0,
          workspaces: 0,
          lastActivity: 'Never',
          activityByDate: []
        } as UserDetail;
      }
    });

    let databaseUsers: any = await this.homeService.getDatabaseUsersByWorkspaceAndReportID(
      this.workspaceOptions.find((w) => w.id === workspaceId)?.name ?? '',
      this.reportOptions.find((r) => r.id === reportId)?.name ?? ''
    ).toPromise().catch(() => [] as any[]);
    
    databaseUsers = databaseUsers.map((user: any) => user.user_email);
    
    const users = await Promise.all(userPromises);
    const userEmails = users.map((user: any) => user.id);
    const difference = databaseUsers.filter((item: any) => !userEmails.includes(item));
    
    // For zero view users, we need to get their name and department too
    const { names: zeroViewNameMappings, departments: zeroViewDepartmentMappings } = 
      await this.powerBIMetricsService.getUserNameMappings(difference)
        .toPromise() || { names: {}, departments: {} };

    this.allRegularUsers = users;
    this.allZeroViewUsers = difference.map((user: any) => {
      return {
        id: user,
        name: zeroViewNameMappings[user] || user.split('@')[0],
        department: zeroViewDepartmentMappings[user] || 'Unknown',
        totalViews: 0,
        reports: 0,
        workspaces: 0,
        lastActivity: 'Never',
        activityByDate: []
      };
    });
    
    this.filteredUsers = [...this.allRegularUsers, ...this.allZeroViewUsers];
  } catch (error) {
    console.error('Error processing users:', error);
    this.allRegularUsers = [];
    this.allZeroViewUsers = [];
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

  // filterUsers() {
  //   if (!this.userSearchQuery) {
  //     this.filteredUsers = [...this.allUsers];
  //     return;
  //   }

  //   const query = this.userSearchQuery.toLowerCase();
  //   this.filteredUsers = this.allUsers.filter(user => 
  //     user.id.toLowerCase().includes(query)
  //   );
  //   this.currentPage = 1;
  // }
  // filterUsers() {
  //   if (!this.userSearchQuery) {
  //     this.filteredUsers = [...this.allRegularUsers, ...this.allZeroViewUsers];
  //     return;
  //   }
  
  //   const query = this.userSearchQuery.toLowerCase();
  //   this.filteredUsers = [...this.allRegularUsers, ...this.allZeroViewUsers].filter(user => 
  //     user.id.toLowerCase().includes(query)
  //   );
  //   this.currentPage = 1;
  // }
  filterUsers() {
    if (!this.userSearchQuery) {
      this.filteredUsers = [...this.allRegularUsers, ...this.allZeroViewUsers];
      return;
    }
  
    const query = this.userSearchQuery.toLowerCase();
    this.filteredUsers = [...this.allRegularUsers, ...this.allZeroViewUsers].filter(user => 
      user.id.toLowerCase().includes(query) || 
      (user.name && user.name.toLowerCase().includes(query))
    );
    this.currentPage = 1;
  }
  toggleUserListAccordion() {
    this.isUserListExpanded = !this.isUserListExpanded;
  }

  // exportUserListToCSV() {
  //   const usersToExport = this.filteredUsers;
    
  //   const headers = ['Email', 'Total Views', 'Last Activity'];
  //   const rows = usersToExport.map(user => [
  //     user.id, 
  //     user.totalViews, 
  //     user.lastActivity === 'Never' ? 'Never' : new Date(user.lastActivity).toLocaleDateString()
  //   ]);
  
  //   const csvContent = [
  //     headers.join(','),
  //     ...rows.map(row => row.join(',')) 
  //   ].join('\n');
  
  //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  //   const link = document.createElement('a');
  //   link.href = URL.createObjectURL(blob);
  //   link.download = 'powerbi-users.csv';
  //   link.click();
  // }
exportUserListToCSV() {
  const usersToExport = this.filteredUsers;
  
  // Updated headers with additional columns
  const headers = ['Name', 'Email', 'Department', 'Total Views', 'Last Activity'];
  
  // Updated rows with additional data
  const rows = usersToExport.map(user => [
    user.name || '', 
    user.id, 
    user.department || 'Unknown',
    user.totalViews, 
    user.lastActivity === 'Never' ? 'Never' : new Date(user.lastActivity).toLocaleDateString()
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')) 
  ].join('\n');

  // Create and trigger download
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
  this.startOrSwitchTracking();
}

onReportChange() {
  if (this.selectedReport === 'all') {
    this.selectedReport = null;
  }
  this.loadData(this.selectedPeriod);
  this.startOrSwitchTracking();
}


// The part for click event, Ill format and add the variables to the top afetr I confitm this thing is working
activityTimelineChartOptions: any;
selectedDate: string | null = null;
dateReportViews: DateReportView[] = [];

// onActivityTimelineClick(dataPointIndex: number) {
//   console.log('Chart clicked at index:', dataPointIndex);
//   const selectedDate = this.userMetrics.activityByDate[dataPointIndex].date;
//   console.log('Selected date:', selectedDate);
//   this.selectedDate = selectedDate;
  
//   this.loadReportViewsForDate(selectedDate);
// }
async onActivityTimelineClick(clickedDate: string) {
  this.selectedDateForPopup = clickedDate;
  
  try {
    this.showDatePopup = true;
    this.selectedDateReports = [];
    
    await this.loadReportViewsForDate(clickedDate);
    this.selectedDateReports = this.dateReportViews || [];
    
  } catch (error) {
    console.error('Error loading report views:', error);
    this.selectedDateReports = [];
  }
}

async loadReportViewsForDate(date: string) {
  if (!this.selectedUserId) return;

  try {
    const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
    
    const startDate = new Date(Date.UTC(year, month - 1, day, 4, 0, 0)); 
    const endDate = new Date(Date.UTC(year, month - 1, day, 28, 0, 0));  
    
    endDate.setTime(endDate.getTime() - 1);
    
    this.dateReportViews = await this.powerBIMetricsService.getUserReportViewsDistribution(
      this.selectedUserId,
      startDate,
      endDate,
      this.selectedWorkspace === 'all' ? undefined : this.selectedWorkspace
    ).toPromise() || [];
    
    // No need to manually add workspace information since it comes from the backend
    
    this.cdr.detectChanges();
  } catch (error) {
    console.error('Error loading report views:', error);
    this.dateReportViews = [];
    this.cdr.detectChanges();
  }
}
getWorkspaceName(workspaceId: string): string {
  if (!workspaceId) return 'Unknown Workspace';
  const workspace = this.workspaceOptions.find(w => w.id === workspaceId);
  return workspace ? workspace.name : 'Unknown Workspace';
}

showDatePopup = false;
selectedDateReports: DateReportView[] = [];
selectedDateForPopup: string | null = null;



closeDatePopup() {
  // console.log('Close clicked');
  this.showDatePopup = false;
  this.selectedDateForPopup = null;
  this.selectedDateReports = [];
   this.cdr.detectChanges();
}

showUserListModal = false;
modalTitle = '';
modalUsers: UserDetail[] = [];

// Add these methods to your component class
openUserListModal(type: 'all' | 'zero' | 'low' | 'active' | 'deactivated') {
  switch (type) {
    case 'all':
      this.modalTitle = 'All Users';
      this.modalUsers = [...this.allRegularUsers, ...this.allZeroViewUsers];
      break;
    case 'zero':
      this.modalTitle = 'Zero View Users (' + this.userCounts.zeroViewUsers + ')';
      this.modalUsers = this.allZeroViewUsers;
      break;
    case 'low':
      this.modalTitle = 'Low Activity Users (' + this.userCounts.lowActivityUsers + ')';
      // Filter users with less than 5 views
      this.modalUsers = [...this.allRegularUsers, ...this.allZeroViewUsers]
        .filter(user => user.totalViews > 0 && user.totalViews < 5);
      break;
    case 'active':
      this.modalTitle = 'Active Users (' + (this.metrics.uniqueUsers - this.userCounts.zeroViewUsers) + ')';
      this.modalUsers = this.allRegularUsers;
      break;
      case 'deactivated':
      this.modalTitle = 'Last Deactivated Users (' + this.userCounts.deactivatedUsers + ')';
      this.modalUsers = this.userCounts.lastDeactivatedUsers.map(u => ({
        id: u.email,
        name: u.name,
        department: u.department,
        totalViews: 0,
        reports: 0,
        workspaces: 0,
        lastActivity: u.deactivatedAt ? new Date(u.deactivatedAt).toLocaleDateString() : 'Never',
        activityByDate: []
      }));
      break;
  }
  this.showUserListModal = true;
}

closeUserListModal() {
  this.showUserListModal = false;
  this.modalTitle = '';
  this.modalUsers = [];
}

async loadAccessMatrix(): Promise<void> {
  this.loadingAccessMatrix = true;
  this.dashboardAccessData = [];
  try {
    const workspaceId = this.selectedWorkspace === 'all' || this.selectedWorkspace === null 
      ? undefined 
      : this.selectedWorkspace as string;
    
    const workspaceName = this.workspaceOptions.find(w => w.id === workspaceId)?.name || '';
    
    const reports = this.reportOptions;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.selectedPeriod);
    const endDate = new Date();

    const accessPromises = reports.map(async (report) => {
      try {
        let databaseUsersRaw: any = await this.homeService.getDatabaseUsersByWorkspaceAndReportID(
          workspaceName,
          report.name
        ).toPromise().catch(() => []);
        
        const databaseUsers: any[] = databaseUsersRaw || [];
        const dbEmails = databaseUsers.map(u => u.user_email.toLowerCase());
        
        const activeUsersRaw: any = await this.powerBIMetricsService.getTopUsers(
          startDate,
          endDate,
          1000,
          workspaceId,
          report.id
        ).toPromise().catch(() => []);
        
        const activeUsers: any[] = activeUsersRaw || [];

        const activeUserIds = activeUsers.map(u => u.userId);
        const allUserIds = Array.from(new Set([...dbEmails, ...activeUserIds]));
        
        const mappings: any = await this.powerBIMetricsService.getUserNameMappings(allUserIds)
          .toPromise()
          .catch(() => ({ names: {}, departments: {} }));

        const nameMappings = mappings?.names || {};
        const departmentMappings = mappings?.departments || {};

        const usersList = await Promise.all(allUserIds.map(async (userId) => {
          const hasAccess = dbEmails.includes(userId.toLowerCase());
          
          const activeUser = activeUsers.find(u => u.userId.toLowerCase() === userId.toLowerCase());
          const totalViews = activeUser ? activeUser.count : 0;
          
          let lastViewed = 'Never';
          let timeSpent = 0;
          
          if (totalViews > 0) {
            const userMetrics: any = await this.powerBIMetricsService.getUserMetrics(
              userId,
              startDate,
              endDate,
              workspaceId,
              report.id
            ).toPromise().catch(() => null);
            
            if (userMetrics) {
              lastViewed = userMetrics.activityByDate && userMetrics.activityByDate.length > 0 
                ? userMetrics.activityByDate[userMetrics.activityByDate.length - 1].date 
                : 'Never';
              timeSpent = userMetrics.estimatedTimeSpent || 0;
            }
          }

          return {
            email: userId,
            name: nameMappings[userId] || userId.split('@')[0],
            department: departmentMappings[userId] || 'Unknown',
            hasAccess,
            totalViews,
            lastViewed,
            estimatedTimeSpent: timeSpent
          };
        }));

        usersList.sort((a, b) => {
          if (a.hasAccess !== b.hasAccess) return a.hasAccess ? -1 : 1;
          return b.totalViews - a.totalViews;
        });

        const activeUsersCount = usersList.filter(u => u.totalViews > 0).length;

        return {
          reportId: report.id,
          reportName: report.name,
          assignedUsersCount: dbEmails.length,
          activeUsersCount,
          users: usersList,
          searchQuery: '',
          accessFilter: 'all',
          currentPage: 1,
          pageSize: 5
        };
      } catch (err) {
        console.error(`Error loading access details for report ${report.name}:`, err);
        return {
          reportId: report.id,
          reportName: report.name,
          assignedUsersCount: 0,
          activeUsersCount: 0,
          users: [],
          searchQuery: '',
          accessFilter: 'all',
          currentPage: 1,
          pageSize: 5
        };
      }
    });

    this.dashboardAccessData = await Promise.all(accessPromises);
  } catch (error) {
    console.error('Error loading Access Control Matrix:', error);
  } finally {
    this.loadingAccessMatrix = false;
  }
}

getFilteredAccessDashboards(): any[] {
  if (!this.dashboardAccessSearchQuery) {
    return this.dashboardAccessData;
  }
  const q = this.dashboardAccessSearchQuery.toLowerCase().trim();
  return this.dashboardAccessData.filter(report => 
    (report.reportName || '').toLowerCase().includes(q) || 
    (this.transformDisplayName(report.reportName) || '').toLowerCase().includes(q)
  );
}

getPaginatedReportUsers(report: any): any[] {
  let list = report.users || [];
  
  if (report.searchQuery) {
    const q = report.searchQuery.toLowerCase();
    list = list.filter((u: any) => 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  }
  
  if (report.accessFilter && report.accessFilter !== 'all') {
    if (report.accessFilter === 'assigned') {
      list = list.filter((u: any) => u.hasAccess);
    } else if (report.accessFilter === 'external') {
      list = list.filter((u: any) => !u.hasAccess);
    }
  }
  
  const startIndex = (report.currentPage - 1) * report.pageSize;
  return list.slice(startIndex, startIndex + report.pageSize);
}

getReportUsersTotalCount(report: any): number {
  let list = report.users || [];
  
  if (report.searchQuery) {
    const q = report.searchQuery.toLowerCase();
    list = list.filter((u: any) => 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  }
  
  if (report.accessFilter && report.accessFilter !== 'all') {
    if (report.accessFilter === 'assigned') {
      list = list.filter((u: any) => u.hasAccess);
    } else if (report.accessFilter === 'external') {
      list = list.filter((u: any) => !u.hasAccess);
    }
  }
  
  return list.length;
}

getReportPageNumbers(report: any): number[] {
  const total = this.getReportUsersTotalCount(report);
  const pages = Math.ceil(total / report.pageSize);
  return Array.from({ length: pages }, (_, i) => i + 1);
}

changeReportPage(report: any, page: number): void {
  report.currentPage = page;
}

MathMin(a: number, b: number): number {
  return Math.min(a, b);
}

get groupedTabTimeSpent(): { workspaceName: string, totalSeconds: number, items: any[] }[] {
  if (!this.userTabTimeSpent || this.userTabTimeSpent.length === 0) return [];
  
  const groups: { [key: string]: { workspaceName: string, totalSeconds: number, items: any[] } } = {};
  
  this.userTabTimeSpent.forEach(item => {
    const wsName = item.workspaceName || 'Personal Workspace';
    if (!groups[wsName]) {
      groups[wsName] = {
        workspaceName: wsName,
        totalSeconds: 0,
        items: []
      };
    }
    groups[wsName].totalSeconds += item.totalSeconds;
    groups[wsName].items.push(item);
  });
  
  return Object.values(groups).sort((a, b) => b.totalSeconds - a.totalSeconds);
}

}