import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { PowerBIMetricsService, PowerBIReport, PowerBIWorkspace } from '../Services/powerbi-metrics.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HomeService } from '../Services/home.service';
import { ToastService } from '../Services/toast.service';
import { NameMapperService } from '../Services/name-mapper.service';


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
    '#03045E', '#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#789DBC', '#8ACDD7'
  ];

userReportViews: {reportId: string, reportName: string, count: number}[] = [];

  // Pagination
  currentPage = 1;
  usersPerPage = 10;
  timePeriods = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 }
  ];

  userCounts = {
    totalUsers: 0,
    totalViews: 0,
    zeroViewUsers: 0,
    lowActivityUsers: 0
  };

  

  constructor(
    private powerBIMetricsService: PowerBIMetricsService,
    private homeService: HomeService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private nameMapper: NameMapperService
  ) {}

  ngOnInit(): void {
    this.loadFilters().then(() => {
      this.loadData(this.selectedPeriod);
    });  }

    toggleDashboard(dashboard: 'powerbi' | 'webtool') {
      this.dashboardChange.emit(dashboard);
    }
  


  
 

    private prepareTopReportsChart() {
      const reports = this.metrics.topReports || [];
      
      // Function to split long labels into two lines
      const formatLabel = (label: string): string => {
        if (!label) return 'Unknown\nReport';
        
        // Split the label into words
        const words = label.split(' ');
        
        // If only one word, return as is
        if (words.length <= 2) return label;
        
        // Try to split roughly in the middle
        const midPoint = Math.ceil(words.length / 2);
        const firstLine = words.slice(0, midPoint).join(' ');
        const secondLine = words.slice(midPoint).join(' ');
        
        return `${firstLine}\n${secondLine}`;
      };
    
      this.topReportsChartOptions = {
        series: [{ 
          name: 'Views', 
          data: reports.map(r => r?.count || 0) 
        }],
        chart: { 
          type: 'bar', 
          height: 280, // Increased height to accommodate two-line labels
          toolbar: { show: false }
        },
        xaxis: {
          categories: reports.map(r => formatLabel(r?.reportName || 'Unknown Report')),
          labels: {
            style: {
              fontSize: '10px', // Smaller font size
              cssClass: 'apexcharts-multiline-label'
            },
            formatter: undefined // Remove any previous formatter
          }
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '45%' // Slightly wider bars
          }
        },
        dataLabels: {
          enabled: false
        },
        colors: ['#0077B6'],
        tooltip: {
          y: {
            formatter: (val: number) => `${val} views`
          }
        }
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
        height: 300,
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
    // Get name mappings for top users
    const nameMappings = this.allRegularUsers.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {} as {[email: string]: string});
  
    this.topUsersChartOptions = {
      series: [{ 
        name: 'Views', 
        data: this.metrics.topUsers.map(u => u.count) 
      }],
      chart: {
        type: 'bar',
        height: 300,
        events: {
          dataPointSelection: (event: any, chartContext: any, config: { dataPointIndex: number }) => {
            this.onTopUserChartClick(config.dataPointIndex);
          }
        }
      },
      xaxis: {
        categories: this.metrics.topUsers.map(u => {
          return nameMappings[u.userId] || u.userId.split('@')[0];
        }),
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
      colors: ['#0077B6'],
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
            colors: '#6B7280', 
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
            colors: '#6B7280', 
            fontSize: '12px' 
          } 
        } 
      },
      stroke: { 
        width: 2, 
        curve: 'smooth' 
      }, 
      colors: ['#ffb703'], 
      grid: { 
        borderColor: '#E5E7EB' 
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

  // async selectUser(userId: string) {
  //   this.selectedUserId = userId;
  //   const endDate = new Date();
  //   const startDate = new Date();
  //   startDate.setDate(endDate.getDate() - this.selectedPeriod);
  
  //   const workspaceId = this.selectedWorkspace === 'all' ? undefined : this.selectedWorkspace;
  //   const reportId = this.selectedReport === null ? undefined : this.selectedReport;
  
  //   try {
  //     const [userMetrics, workspaceDistribution, consumptionMethods, reportViews] = await Promise.all([
  //       this.powerBIMetricsService.getUserMetrics(
  //         userId, 
  //         startDate, 
  //         endDate,
  //         workspaceId,
  //         reportId
  //       ).toPromise(),
  //       this.powerBIMetricsService.getWorkspaceViewsDistribution(
  //         userId, 
  //         startDate, 
  //         endDate,
  //         reportId
  //       ).toPromise(),
  //       this.powerBIMetricsService.getUserConsumptionMethods(
  //         userId, 
  //         startDate, 
  //         endDate
  //       ).toPromise(),
  //       this.powerBIMetricsService.getUserReportViewsDistribution(
  //         userId,
  //         startDate,
  //         endDate,
  //         workspaceId
  //       ).toPromise()
  //     ]);
  
  //     if (!userMetrics || !workspaceDistribution || !consumptionMethods || !reportViews) {
  //       throw new Error('Failed to load user metrics');
  //     }
  
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
  
  //     this.userReportViews = reportViews;
      
  //     this.prepareUserWorkspacePieChart();
  //     this.prepareUserConsumptionChart();
  //     this.prepareUserReportViewsChart();
  //     this.cdr.detectChanges();
  //   } catch (error) {
  //     console.error('Error loading user metrics:', error);
  //   }
  // }
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
      const [userMetrics, workspaceDistribution, consumptionMethods, reportViews] = await Promise.all([
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
      
      this.prepareUserWorkspacePieChart();
      this.prepareUserConsumptionChart();
      this.prepareUserReportViewsChart();
      this.prepareActivityTimelineChart(); 
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading user metrics:', error);
    }
  }
  private transformDisplayName(name: string | undefined): string {
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
        height: 300, 
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
      colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#789DBC', '#8ACDD7', '#5E8CBE', '#4A7FB7', '#3672B0', '#2365A9'],
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
    if (!this.userMetrics?.workspaceDistribution) return;

    let viewsData = this.userMetrics.workspaceDistribution as WorkspaceViewDistribution[];
    let personalWorkspaceCount = 0;
    viewsData.forEach((w:any)=> {
      if (w.workspaceName === 'PersonalWorkspace') {
        w.workspaceId = '000000'
        personalWorkspaceCount += w.count;
      }

    })

    viewsData = viewsData.filter((w:any) => w.workspaceName !== 'PersonalWorkspace');


    if (personalWorkspaceCount > 0) {
      viewsData.push({
        workspaceId: '000000',
        workspaceName: 'Personal Workspace',
        count: personalWorkspaceCount
      });
    }


    // console.log("viewsData", viewsData)

    this.userWorkspacePieChartOptions = {
      series: viewsData.map(w => w.count),
      chart: {
        type: 'pie',
        height: 250,
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
  //     this.loadingUnusedReports = true;

  
  //     // Handle workspace and report filters
  //     const workspaceId = this.selectedWorkspace === 'all' || this.selectedWorkspace === null 
  //       ? undefined 
  //       : this.selectedWorkspace as string;
      
  //     const reportId = this.selectedReport === null 
  //       ? undefined 
  //       : this.selectedReport as string;
  
  //       this.unusedReports = await this.powerBIMetricsService.getUnusedReports(
  //         startDate, 
  //         endDate,
  //         workspaceId
  //       ).toPromise() || [];

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

  //     console.log("vies check", viewsByDate)
  
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
      
  //     // If a user is selected, refresh their data with the new filters
  //     if (this.selectedUserId) {
  //       await this.selectUser(this.selectedUserId);
  //     }
      
  //     this.dataLoaded = true;
  //   } catch (error) {
  //     console.error('Error loading data:', error);
  //     this.unusedReports = [];
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
  //     this.loadingUnusedReports = false;

  //   }
  // }

getUserDisplayName(userId: string): string {
  if (!userId) return '';
  
  const regularUser = this.allRegularUsers.find(u => u.id === userId);
  if (regularUser) return regularUser.name;
  
  const zeroViewUser = this.allZeroViewUsers.find(u => u.id === userId);
  if (zeroViewUser) return zeroViewUser.name;
  
  return userId;
}

  // async loadData(days: number): Promise<void> {
  //   this.loading = true;
  //   this.error = '';
  //   this.selectedPeriod = days;
  
  //   try {
  //     const endDate = new Date();
  //     const startDate = new Date();
  //     startDate.setDate(endDate.getDate() - days);
  //     this.loadingUnusedReports = true;

  //     // Handle workspace and report filters
  //     const workspaceId = this.selectedWorkspace === 'all' || this.selectedWorkspace === null 
  //       ? undefined 
  //       : this.selectedWorkspace as string;
      
  //     const reportId = this.selectedReport === null 
  //       ? undefined 
  //       : this.selectedReport as string;
  
  //     this.unusedReports = await this.powerBIMetricsService.getUnusedReports(
  //       startDate, 
  //       endDate,
  //       workspaceId
  //     ).toPromise() || [];

  //     // Get all metrics in parallel with filters applied
  //     const [
  //       viewsByDate, 
  //       topReports, 
  //       topUsers, 
  //       activityTrend,
  //       uniqueUserCount
  //     ] = await Promise.all([
  //       this.powerBIMetricsService.getViewCountsByDate(startDate, endDate, workspaceId, reportId).toPromise(),
  //       reportId 
  //         ? this.powerBIMetricsService.getDistinctReports(startDate, endDate, workspaceId)
  //             .toPromise()
  //             .then(reports => {
  //               if (!reports) return [];
  //               return reports.filter(r => r.id === reportId)
  //                 .map(r => ({
  //                   reportId: r.id,
  //                   reportName: r.name,
  //                   count: 0 // Will be updated from viewsByDate
  //                 }));
  //             })
  //         : this.powerBIMetricsService.getTopReports(startDate, endDate, 10, workspaceId).toPromise(),
  //       this.powerBIMetricsService.getTopUsers(startDate, endDate, 10, workspaceId, reportId).toPromise(),
  //       this.powerBIMetricsService.getUserActivityTrend(startDate, endDate, workspaceId, reportId).toPromise(),
  //       this.powerBIMetricsService.getUniqueUserCount(startDate, endDate, workspaceId, reportId).toPromise()
        
  //     ]);

  //     // Handle unique report count separately
  //     const uniqueReportCount = reportId 
  //       ? 1 
  //       : await this.powerBIMetricsService.getUniqueReportCount(startDate, endDate, workspaceId).toPromise();

  //     // If a report is selected, update its count from viewsByDate
  //     if (reportId && topReports && topReports.length > 0 && viewsByDate) {
  //       const totalViews = viewsByDate.reduce((sum, day) => sum + (day?.count || 0), 0);
  //       topReports[0].count = totalViews;
  //     }

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
      
  //     // If a user is selected, refresh their data with the new filters
  //     if (this.selectedUserId) {
  //       await this.selectUser(this.selectedUserId);
  //     }
      
  //     this.dataLoaded = true;
  //   } catch (error) {
  //     console.error('Error loading data:', error);
  //     this.unusedReports = [];
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
  //     this.loadingUnusedReports = false;
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
  
      // Store user counts data
      this.userCounts = counts || {
        totalUsers: 0,
        totalViews: 0,
        zeroViewUsers: 0,
        lowActivityUsers: 0
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
        lowActivityUsers: 0
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
        height: 250,
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
    
    // console.log('Chart series values:', this.userConsumptionChartOptions.series);
    // console.log('Chart labels:', this.userConsumptionChartOptions.labels);
  }

// private async processUsers(
//   startDate: Date, 
//   endDate: Date,
//   workspaceId?: string,
//   reportId?: string
// ): Promise<void> {
//   try {
//     const topUsers = await this.powerBIMetricsService.getTopUsers(
//       startDate, 
//       endDate, 
//       1000,
//       workspaceId || undefined,
//       reportId || undefined
//     ).toPromise().catch(() => [] as UserMetric[]);

//     if (!topUsers || topUsers.length === 0) {
//       this.allRegularUsers = [];
//       this.allZeroViewUsers = [];
//       this.filteredUsers = [];
//       return;
//     }

//     // Get name mappings for all users
//     const nameMappings = await this.powerBIMetricsService.getUserNameMappings(
//       topUsers.map(u => u.userId)
//     ).toPromise() || {};

//     const userPromises = topUsers.map(async user => {
//       try {
//         const metrics = await this.powerBIMetricsService.getUserMetrics(
//           user.userId, 
//           startDate, 
//           endDate,
//           workspaceId || undefined,
//           reportId || undefined
//         ).toPromise();

//         return {
//           id: user.userId,
//           name: nameMappings[user.userId] || user.userId.split('@')[0], // Fallback to email prefix if no name
//           totalViews: metrics?.totalViews || 0,
//           reports: metrics?.reports?.length || 0,
//           workspaces: metrics?.workspaces?.length || 0,
//           lastActivity: metrics?.activityByDate && metrics.activityByDate.length > 0 
//             ? metrics.activityByDate[metrics.activityByDate.length - 1].date 
//             : 'Never',
//           activityByDate: metrics?.activityByDate || []
//         } as UserDetail;
//       } catch (error) {
//         console.error(`Error processing user ${user.userId}:`, error);
//         return {
//           id: user.userId,
//           name: nameMappings[user.userId] || user.userId.split('@')[0],
//           totalViews: 0,
//           reports: 0,
//           workspaces: 0,
//           lastActivity: 'Never',
//           activityByDate: []
//         } as UserDetail;
//       }
//     });

//     let databaseUsers: any = await this.homeService.getDatabaseUsersByWorkspaceAndReportID(
//       this.workspaceOptions.find((w) => w.id === workspaceId)?.name ?? '',
//       this.reportOptions.find((r) => r.id === reportId)?.name ?? ''
//     ).toPromise().catch(() => [] as any[]);
    
//     databaseUsers = databaseUsers.map((user: any) => user.user_email);
    
//     const users = await Promise.all(userPromises);
//     const userEmails = users.map((user: any) => user.id);
//     const difference = databaseUsers.filter((item: any) => !userEmails.includes(item));
    
//     this.allRegularUsers = users;
//     this.allZeroViewUsers = difference.map((user: any) => {
//       return {
//         id: user,
//         name: nameMappings[user] || user.split('@')[0],
//         totalViews: 0,
//         reports: 0,
//         workspaces: 0,
//         lastActivity: 'Never',
//         activityByDate: []
//       }
//     });
    
//     this.filteredUsers = [...this.allRegularUsers, ...this.allZeroViewUsers];
//   } catch (error) {
//     console.error('Error processing users:', error);
//     this.allRegularUsers = [];
//     this.allZeroViewUsers = [];
//     this.filteredUsers = [];
//   }
// }
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
  filterUsers() {
    if (!this.userSearchQuery) {
      this.filteredUsers = [...this.allRegularUsers, ...this.allZeroViewUsers];
      return;
    }
  
    const query = this.userSearchQuery.toLowerCase();
    this.filteredUsers = [...this.allRegularUsers, ...this.allZeroViewUsers].filter(user => 
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
// async loadReportViewsForDate(date: string) {
//   if (!this.selectedUserId) return;

//   try {
//     // Create date in EDT timezone
//     const edtDate = new Date(date + 'T00:00:00-04:00'); // EDT is UTC-4
    
//     // Set start/end to beginning and end of day in EDT
//     const startDate = new Date(edtDate);
//     startDate.setHours(0, 0, 0, 0);
    
//     const endDate = new Date(edtDate);
//     endDate.setHours(23, 59, 59, 999);
    
//     // Convert to UTC for the API call
//     const utcStart = new Date(startDate.toISOString());
//     const utcEnd = new Date(endDate.toISOString());

//     this.dateReportViews = await this.powerBIMetricsService.getUserReportViewsDistribution(
//       this.selectedUserId,
//       utcStart,
//       utcEnd,
//       this.selectedWorkspace === 'all' ? undefined : this.selectedWorkspace
//     ).toPromise() || [];
    
//     this.cdr.detectChanges();
//   } catch (error) {
//     console.error('Error loading report views:', error);
//     this.dateReportViews = [];
//     this.cdr.detectChanges();
//   }
// }

//latest
// async loadReportViewsForDate(date: string) {
//   if (!this.selectedUserId) return;

//   try {
    
//     const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
    
//     const startDate = new Date(Date.UTC(year, month - 1, day, 4, 0, 0)); 
//     const endDate = new Date(Date.UTC(year, month - 1, day, 28, 0, 0));  // 24:00 EDT = 04:00 UTC (next day)
    
//     // Adjust end time to 23:59:59.999
//     endDate.setTime(endDate.getTime() - 1);
    
//     this.dateReportViews = await this.powerBIMetricsService.getUserReportViewsDistribution(
//       this.selectedUserId,
//       startDate,
//       endDate,
//       this.selectedWorkspace === 'all' ? undefined : this.selectedWorkspace
//     ).toPromise() || [];
    
//     this.cdr.detectChanges();
//   } catch (error) {
//     console.error('Error loading report views:', error);
//     this.dateReportViews = [];
//     this.cdr.detectChanges();
//   }
// }

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
openUserListModal(type: 'all' | 'zero' | 'low' | 'active') {
  switch (type) {
    case 'all':
      this.modalTitle = 'All Users (' + this.metrics.uniqueUsers + ')';
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
  }
  this.showUserListModal = true;
}

closeUserListModal() {
  this.showUserListModal = false;
  this.modalTitle = '';
  this.modalUsers = [];
}

}