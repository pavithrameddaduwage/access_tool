import { Component, HostListener, OnInit } from '@angular/core';
import { WebtoolService } from '../Services/webtool.service';
import { UserWebtoolService } from '../Services/user-webtool.service';
import { RolesService } from '../Services/roles.service';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';
import { Role, UserWebtool, Webtool } from '../../../interfaces/webtool.interfaces';
import { catchError, forkJoin, map, of, Subject } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { LoginAnalyticsService } from '../Services/login-analytics.service';
import { ApexChart, ApexOptions } from 'ng-apexcharts';
import {  AfterViewChecked } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

import {EventEmitter, Input, Output } from '@angular/core';

interface LoginChartData {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  colors: string[];
  stroke?: { 
    width?: number;  
    curve?: "straight" | "smooth" | "stepline" | "monotoneCubic";  
  };
}
interface UserKPIs {
  name: string;
  department: string;
  webtools: any[];
  loginStats: {
    totalLogins: number;
    mostUsedWebtool: string;
    lastLogin: Date | null;
    webtoolUsage: { webtool: string; count: number }[];
  };
}

interface User {
  email: string;
  username: string;  
  department?: string;
  lastLogin?: Date;
  mostUsedWebtool?: string;
  loginCount?: number;
}

interface LoginCharts {
  dailyLoginsChart: LoginChartData;
  hourlyLoginsChart: LoginChartData;
  dayOfWeekChart: LoginChartData;
}
interface ProcessedUser {
  email: string;
  name: string;
  department: string;
  webtools: Set<number>;
  roles: Set<number>;
}

interface MetricItem {
  id: number;
  name: string;
  count: number;
}

interface DailyLoginData {
  date: string;
  count: number;
}

interface DashboardMetrics {
  totalUsers: number;
  totalWebtools: number;
  totalRoles: number;
  topUsers: { name: string; count: number; email: string }[];
  avgWebtoolsPerUser: number;
  usersByDepartment: { [key: string]: number };
  topWebtools: MetricItem[];
  roleDistribution: MetricItem[];
  rolesPerWebtool: MetricItem[];
  departmentWebtoolUsage: {
    department: string;
    webtools: { name: string; count: number }[];
  }[];
  loginStats?: { 
    totalLogins: number;
    activeUsers: number;
    avgDailyLogins: number;
    peakHour: number;
  };
}
interface UserLoginData {
  count: number;
  lastLogin: Date;
}

interface PeakHourUser {
  email: string;
  username: string;
  department: string;
  loginCount: number;
  lastLogin: Date;
}

@Component({
  selector: 'app-webtool-analytics',
  templateUrl: './webtool-analytics.component.html',
  imports: [CommonModule, NgApexchartsModule, FormsModule],
  styleUrls: ['./webtool-analytics.component.css']
})
export class WebtoolAnalyticsComponent implements OnInit {

   // DATA Variables
 
     webtools: Webtool[] = [];
     users: ProcessedUser[] = [];
     roles: Role[] = [];
     rawData: UserWebtool[] = [];
 public userWebtoolStats: any[] = [];

 


     metrics: DashboardMetrics = {                       // For User Webtool Metrics
       totalUsers: 0,
       totalWebtools: 0,
       totalRoles: 0,
       avgWebtoolsPerUser: 0,
       usersByDepartment: {},
       topWebtools: [],
       roleDistribution: [],
       rolesPerWebtool: [],
       departmentWebtoolUsage: [],
       topUsers: []
     };
     
     userStatusData: { active: number, inactive: number } = { active: 0, inactive: 0 };
 
 
     // Filter/Selection State
 
     showMostActiveUserDetails = false;
showTopDepartmentDetails = false;
showRecentActivityDetails = false;
public peakHourDetails: {hour: string, logins: any[]} = {hour: '', logins: []};
selectedMostActiveUser: any = null;
selectedDepartmentUsers: any[] = [];
selectedRecentActivityDetails: any[] = [];

     timeRangeOptions = [
       { label: '7 Days', value: 7 },
       { label: '30 Days', value: 30 },
       { label: '90 Days', value: 90 }
     ];
     public filteredTotalLogins: number = 0;

     selectedTimeRange = 30; 
     public selectedUser: string = 'All';  
     public selectedUserData: User | null = null;

     selectedWebtool: string | number = 'all';
     public searchQuery: string = '';
     public currentPage = 1;
     public itemsPerPage = 5;
     isUserListExpanded = false;
     userSearchQuery = '';
      
 
     // CHART Declarations
       
     webtoolUsageChart: any = null;
     roleDistributionChart: any = null;
     departmentDistributionChart: any = null;
     userWebtoolMatrix: any = null;
     rolesPerWebtoolChart: any = null;
     departmentUsageChart: any = null;
     topUsersChart: any = null;
     userStatusChart: any = null;
 
       chartOptions: any;
       departmentChartOptions: any;

public topActiveUsersChart: any;
public topUsedWebtoolsChart: any;

     filteredWebtoolUsageChart: any = null;
     filteredDepartmentDistributionChart: any = null;
     filteredUserWebtoolMatrix: any = null;
     filteredDepartmentUsageChart: any = null;
     filteredTopUsersChart: any = null;
   
     public activityTimelineChartOptions: any;

 
     // Login Analytics Variables
 
     loginMetrics: any = {
       totalLogins: 0,
       activeUsers: 0,
       dailyLogins: [],
       loginsByHour: [],
       loginsByDay: []
     };
     
     public showPeakHourModal = false;
public peakHourUsers: any[] = [];
public selectedPeakHour: string = '';


     public filteredUserLoginData: any[] = [];
     userKPIs: any;
     public peakHour: string = 'N/A';
     public userLoginData: any[] = [];
     public departmentLoginStats: any[] = [];
     public departmentHourlyLogins: any[] = [];
     public departmentDailyLogins: any[] = [];
 
   
     // UI State
 public showDatePopup = false;
public selectedDateForPopup: string | null = null;
public selectedDateWebtools: {webtool: string, count: number}[] = [];
     public loadingDepartmentStats = false;
     public chartsNeedRedraw = false;
     chartsInitialized = false;
     public userDetailsLoading = false;
     public userWebtoolsData: any[] = [];
     public userLoginStats: any = null;
     loadingLoginMetrics = false;
     screenWidth: number;
 public loadingTopCharts = false;

 public showModal = false;
public modalTitle = '';
public activeModal: 'webtools' | 'users' | 'logins' | 'activeUsers' = 'webtools';


     // Utility
 
     Math = Math;
     private log = {
       debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
       error: (...args: any[]) => console.error('[ERROR]', ...args)
     };
 
   public activeView: 'webtool' | 'user' = 'webtool';
     @Input() activeDashboard: 'powerbi' | 'webtool' = 'webtool';
     @Output() dashboardChange = new EventEmitter<'powerbi' | 'webtool'>();
   
 
     // Initialisation
      constructor(
        private webtoolService: WebtoolService,
        private userWebtoolService: UserWebtoolService,
        private rolesService: RolesService,
        private loginAnalyticsService: LoginAnalyticsService,
        private cdr: ChangeDetectorRef

      ) {
        this.screenWidth = window.innerWidth;
      }

      async ngOnInit() {
        await this.loadData();
        await this.loadLoginMetrics();
        await this.filterByWebtool();
        await this.loadUserLoginData();
        await this.loadDepartmentStats();
          await this.loadTopCharts();
        this.chartOptions = this.initLoginCharts();
        this.departmentChartOptions = this.getDepartmentCharts();
         console.log("chart options", this.chartOptions)
      }

      async loadData() {
        try {
          const [webtools, userWebtools, roles] = await Promise.all([
            firstValueFrom(this.webtoolService.getWebtools()),
            firstValueFrom(this.userWebtoolService.getAllActiveUserWebtools()),
            firstValueFrom(this.rolesService.getRoles())
          ]);
      
          this.webtools = webtools || [];
          this.roles = roles || [];
          this.rawData = userWebtools || [];
          this.users = this.processUsers(this.rawData);
      
          this.calculateMetrics();
                this.chartsNeedRedraw = true;

          this.initCharts();
          this.chartsInitialized = true;
          this.cdr.detectChanges();
        } catch (error) {
          console.error('Error loading data:', error);
          this.initEmptyCharts();
          this.chartsInitialized = true;
        }
      }
      
      private processUsers(userWebtools: UserWebtool[]): ProcessedUser[] {
        const userMap = new Map<string, ProcessedUser>();

        console.log(userWebtools, "userWebtools")
        
        userWebtools.forEach(record => {
          if (!userMap.has(record.email)) {
            userMap.set(record.email, {
              email: record.email,
              name: record.userName,
              department: record.department,
              webtools: new Set<number>(),
              roles: new Set<number>()
            });
          }

          
          const user = userMap.get(record.email)!;
          user.webtools.add(record.webtoolId);
          
          // Check if roles array exists and has at least one element
          if (record.roles && record.roles.length > 0) {
            record.roles.forEach(role => {
              user.roles.add(role.id);
            });
          }
        });
        
        return Array.from(userMap.values());
      }

private calculateMetrics() {
  if (!this.webtools.length || !this.users.length) return;

  // Debug: Basic data verification
  console.log('[DEBUG] Data verification:');
  console.log('- Total webtools:', this.webtools.length);
  console.log('- Total users (this.users):', this.users.length);
  console.log('- Total raw records:', this.rawData.length);
  const uniqueEmailsInRawData = new Set(this.rawData.map(r => r.email.toLowerCase()));
  console.log('- Unique emails in raw data:', uniqueEmailsInRawData.size);

  // Basic counts
  this.metrics.totalUsers = this.users.length;
  this.metrics.totalWebtools = this.webtools.length;
  this.metrics.totalRoles = this.roles.length;

  // Debug: Verify users array
  const usersEmails = new Set(this.users.map(u => u.email.toLowerCase()));
  console.log('[DEBUG] Users array check:');
  console.log('- Unique emails in this.users:', usersEmails.size);
  console.log('- Emails in raw data but missing in users:', 
    [...uniqueEmailsInRawData].filter(email => !usersEmails.has(email)));

  // Average webtools per user
  const totalWebtoolAssignments = this.users.reduce((sum, user) => sum + user.webtools.size, 0);
  this.metrics.avgWebtoolsPerUser = this.metrics.totalUsers > 0 
    ? totalWebtoolAssignments / this.metrics.totalUsers 
    : 0;

  // Users by department
  this.metrics.usersByDepartment = this.users.reduce((acc, user) => {
    const dept = user.department || 'Unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Webtools by distinct user count - FIXED VERSION
  console.log('[DEBUG] Calculating webtool user counts...');
  const webtoolUserMap = new Map<number, Set<string>>();
  
  // Initialize map with all webtools
  this.webtools.forEach(webtool => {
    webtoolUserMap.set(webtool.id, new Set<string>());
  });

  // Count users per webtool from this.users (should be unique)
  this.users.forEach(user => {
    user.webtools.forEach(webtoolId => {
      webtoolUserMap.get(webtoolId)?.add(user.email.toLowerCase());
    });
  });

  // Debug: Verify webtool counts
  console.log('[DEBUG] Webtool user counts:');
  let totalCountedUsers = 0;
  webtoolUserMap.forEach((userSet, webtoolId) => {
    const webtoolName = this.webtools.find(w => w.id === webtoolId)?.webtool || webtoolId;
    console.log(`- ${webtoolName}: ${userSet.size} users`);
    totalCountedUsers += userSet.size;
  });
  console.log(`Total users counted across all webtools: ${totalCountedUsers}`);
  console.log(`Note: This may be higher than total users as users can have multiple webtools`);

  this.metrics.topWebtools = Array.from(webtoolUserMap.entries())
    .map(([id, userSet]) => ({
      id,
      name: this.webtools.find(w => w.id === id)?.webtool || `Webtool ${id}`,
      count: userSet.size
    }))
    .sort((a, b) => b.count - a.count);

  // Roles per Webtool
  this.metrics.rolesPerWebtool = this.webtools.map(webtool => {
    const roleCounts = new Set<number>();
    this.users.forEach(user => {
      if (user.webtools.has(webtool.id)) {
        user.roles.forEach(roleId => roleCounts.add(roleId));
      }
    });
    return {
      id: webtool.id,
      name: webtool.webtool,
      count: roleCounts.size
    };
  }).sort((a, b) => b.count - a.count);

  // Department vs Webtool Usage
  const departmentMap = new Map<string, Map<string, number>>();
  this.users.forEach(user => {
    if (!departmentMap.has(user.department)) {
      departmentMap.set(user.department, new Map<string, number>());
    }
    const deptWebtools = departmentMap.get(user.department)!;
    user.webtools.forEach(webtoolId => {
      const webtoolName = this.webtools.find(w => w.id === webtoolId)?.webtool || '';
      deptWebtools.set(webtoolName, (deptWebtools.get(webtoolName) || 0) + 1);
    });
  });
  
  this.metrics.departmentWebtoolUsage = Array.from(departmentMap.entries())
    .map(([department, webtoolCounts]) => ({
      department,
      webtools: Array.from(webtoolCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    }));

  // Top Users
  this.metrics.topUsers = this.users
    .map(user => ({
      name: user.name,
      email: user.email,
      count: user.webtools.size
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Login Stats
  if (this.loginMetrics) {
    this.metrics.loginStats = {
      totalLogins: this.loginMetrics.totalLogins || 0,
      activeUsers: this.loginMetrics.activeUsers || 0,
      avgDailyLogins: this.loginMetrics.totalLogins ? this.loginMetrics.totalLogins / 30 : 0,
      peakHour: this.peakHourNumber
    };
  }

  // Final validation
  console.log('[DEBUG] Final validation:');
  console.log('- Metrics.totalUsers:', this.metrics.totalUsers);
  const maxWebtoolUsers = Math.max(...this.metrics.topWebtools.map(w => w.count));
  console.log('- Max users in any webtool:', maxWebtoolUsers);
  
  if (maxWebtoolUsers > this.metrics.totalUsers) {
    console.error('ERROR: A webtool has more users than total users!');
    const problematicWebtools = this.metrics.topWebtools.filter(w => w.count > this.metrics.totalUsers);
    console.error('Problematic webtools:', problematicWebtools);
  }
}
      


  // Chart Management

   private initCharts(): void {
  if (!this.webtools?.length || !this.users?.length) {
    this.initEmptyCharts();
    return;
  }

  // Destroy existing charts first
  this.destroyCharts();

  // Initialize charts with timeout to ensure DOM is ready
  setTimeout(() => {
    try {
      const baseHeight = this.screenWidth < 768 ? 180 : 220;
      const matrixHeight = Math.min(baseHeight * 0.4, Math.max(80, this.users.length * 6));

      // 1. Webtool Usage Chart
      this.webtoolUsageChart = {
        series: [{
          name: 'Users',
          data: this.metrics.topWebtools.map(w => w.count)
        }],
        chart: {
          type: 'bar',
          height: baseHeight,
          toolbar: { show: false },
          fontFamily: 'inherit'
        },
        plotOptions: {
          bar: {
            borderRadius: 2,
            horizontal: true,
            barHeight: '70%'
          }
        },
        xaxis: {
          categories: this.metrics.topWebtools.map(w => w.name),
          title: { text: 'Users' },
          labels: { style: { fontSize: '10px' } }
        },
        yaxis: { labels: { style: { fontSize: '10px' } } },
        colors: ['#3B82F6'],
        grid: { padding: { left: 5, right: 5 } }
      };

      // 2. Department Distribution Chart
      this.departmentDistributionChart = {
        series: Object.values(this.metrics.usersByDepartment),
        labels: Object.keys(this.metrics.usersByDepartment),
        chart: {
          type: 'pie',
          height: baseHeight,
          fontFamily: 'inherit'
        },
        dataLabels: {
          enabled: true,
          formatter: (val: number) => `${Math.round(val)}%`
        },
        legend: {
          position: 'bottom',
          fontSize: '10px',
          itemMargin: { horizontal: 5, vertical: 0 }
        },
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      };

// 3. User Webtool Matrix
this.userWebtoolMatrix = {
  series: this.webtools.map(webtool => ({
    name: webtool.webtool,
    data: this.users.map(user => ({ 
      x: user.name,
      y: user.webtools.has(webtool.id) ? 1 : 0
    }))
  })),
  chart: {
    type: 'heatmap',
    height: matrixHeight,
    toolbar: { show: false },
    fontFamily: 'inherit'
  },
  dataLabels: { enabled: false },
  colors: ["#E5E7EB", "#0077B6"],
  xaxis: { 
    type: 'category',
    labels: { 
      show: true,
      rotate: -45,
      style: { fontSize: '9px' },
      trim: true,
      hideOverlappingLabels: true
    }
  },
  yaxis: { 
    categories: this.webtools.map(w => w.webtool),
    labels: { style: { fontSize: '6px' }, trim: true }
  },
  tooltip: {
    custom: ({ seriesIndex, dataPointIndex }: { seriesIndex: number, dataPointIndex: number }) => {
      const user = this.users[dataPointIndex];
      const webtool = this.webtools[seriesIndex];
      const access = user.webtools.has(webtool.id) ? 'Has access' : 'No access';
      return `
        <div class="p-1 text-2xs">
          <div><strong>User:</strong> ${user.name}</div>
          <div><strong>Webtool:</strong> ${webtool.webtool}</div>
          <div><strong>Access:</strong> ${access}</div>
        </div>
      `;
    }
  }
};
      // 4. Department Usage Chart
      this.departmentUsageChart = {
        series: this.metrics.departmentWebtoolUsage.map(dept => ({
          name: dept.department,
          data: dept.webtools.map(w => w.count)
        })),
        chart: {
          type: 'bar',
          height: baseHeight,
          stacked: true,
          toolbar: { show: false },
          fontFamily: 'inherit'
        },
        xaxis: {
          categories: this.webtools.map(w => w.webtool),
          labels: { style: { fontSize: '10px' }, rotate: -45 }
        },
        yaxis: { labels: { style: { fontSize: '10px' } } },
        legend: {
          position: 'bottom',
          fontSize: '10px',
          itemMargin: { horizontal: 5, vertical: 0 }
        },
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        grid: { padding: { left: 5, right: 5 } }
      };

      // 5. Top Users Chart
      this.topUsersChart = {
        series: [{
          name: 'Webtools',
          data: this.metrics.topUsers.map(u => u.count)
        }],
        chart: {
          type: 'bar',
          height: baseHeight,
          toolbar: { show: false },
          fontFamily: 'inherit'
        },
        plotOptions: {
          bar: {
            borderRadius: 2,
            horizontal: true,
            barHeight: '70%'
          }
        },
        xaxis: {
          categories: this.metrics.topUsers.map(u => u.name),
          title: { text: 'Webtools' },
          labels: { style: { fontSize: '10px' } }
        },
        yaxis: { labels: { style: { fontSize: '10px' } } },
        colors: ['#8B5CF6'],
        grid: { padding: { left: 5, right: 5 } },
        tooltip: {
          custom: ({ dataPointIndex }: any) => {
            const user = this.metrics.topUsers[dataPointIndex];
            return `
              <div class="p-1 text-xs">
                <div><strong>User:</strong> ${user.name}</div>
                <div><strong>Email:</strong> ${user.email}</div>
                <div><strong>Webtools:</strong> ${user.count}</div>
              </div>
            `;
          }
        }
      };

      // Initialize filtered charts with same data
      this.filteredWebtoolUsageChart = { ...this.webtoolUsageChart };
      this.filteredDepartmentDistributionChart = { ...this.departmentDistributionChart };
      this.filteredUserWebtoolMatrix = { ...this.userWebtoolMatrix };
      this.filteredDepartmentUsageChart = { ...this.departmentUsageChart };
      this.filteredTopUsersChart = { ...this.topUsersChart };

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error initializing charts:', error);
      this.initEmptyCharts();
    }
  });
}

private prepareActivityTimelineChart() {
  if (!this.userKPIs?.dailyLogins) {
    this.activityTimelineChartOptions = null;
    return;
  }

  // Process daily login data
  const dailyLogins = [...this.userKPIs.dailyLogins].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const allDates = dailyLogins.map(day => day.date);
  const seriesData = dailyLogins.map(day => day.count);

  this.activityTimelineChartOptions = {
    series: [{
      name: 'Logins',
      data: seriesData
    }],
    chart: {
      type: 'bar',
      height: 350,
      events: {
        dataPointSelection: (event: Event, chartContext: any, config: { dataPointIndex: number }) => {
          try {
            const clickedDate = allDates[config.dataPointIndex];
            console.log('Bar clicked - date:', clickedDate);
            this.onActivityTimelineClick(clickedDate);
          } catch (error) {
            console.error('Error handling chart click:', error);
          }
        }
      }
    },
    xaxis: {
      categories: allDates.map(date => {
        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}`;
      }),
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
        formatter: (val: number) => `${val} logins`,
      }
    },
    noData: {
      text: 'No data available',
      align: 'center',
      verticalAlign: 'middle'
    }
  };
}
async onActivityTimelineClick(date: string) {
  console.log('Opening modal for date:', date);
  this.selectedDateForPopup = date;
  this.selectedDateWebtools = [];
  this.showDatePopup = true;

  try {
    // Get login events for the selected user and date
    const loginEvents = await firstValueFrom(
      this.loginAnalyticsService.getLoginEvents().pipe(
        catchError(error => {
          console.error('Error fetching login events:', error);
          return of([]);
        })
      )
    );
    
    // Filter events for the selected user and date
    const normalizedEmail = this.selectedUser.toLowerCase().trim();
    const selectedDate = new Date(date).toISOString().split('T')[0];
    
    const dateEvents = loginEvents.filter((event: any) => {
      const eventDate = new Date(event.loginTime).toISOString().split('T')[0];
      return event.email.toLowerCase().trim() === normalizedEmail && 
             eventDate === selectedDate;
    });
    
    console.log(`Found ${dateEvents.length} events for ${selectedDate}`);

    // Group by webtool
    const webtoolCounts = dateEvents.reduce((acc: Record<string, number>, event: any) => {
      const webtool = event.webtool || 'Unknown';
      acc[webtool] = (acc[webtool] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Convert to array and sort
    this.selectedDateWebtools = Object.entries(webtoolCounts)
      .map(([webtool, count]) => ({ webtool, count }))
      .sort((a, b) => b.count - a.count);
      this.cdr.detectChanges();

    console.log('Webtools for date:', this.selectedDateWebtools);
  } catch (error) {
    console.error('Error loading date details:', error);
    this.selectedDateWebtools = [];
  }
}

closeDatePopup() {
  this.showDatePopup = false;
  this.selectedDateForPopup = null;
  this.selectedDateWebtools = [];
   this.cdr.detectChanges()
}


private initEmptyCharts(): void {
  const emptyBarConfig = {
    series: [{ data: [] }],
    chart: { type: 'bar', height: 220 },
    xaxis: { categories: [] }
  };

  const emptyPieConfig = {
    series: [],
    chart: { type: 'pie', height: 220 },
    labels: []
  };

  const emptyHeatmapConfig = {
    series: [],
    chart: { type: 'heatmap', height: 80 }
  };

  this.webtoolUsageChart = { ...emptyBarConfig };
  this.departmentDistributionChart = { ...emptyPieConfig };
  this.userWebtoolMatrix = { ...emptyHeatmapConfig };
  this.departmentUsageChart = { ...emptyBarConfig, chart: { ...emptyBarConfig.chart, stacked: true } };
  this.topUsersChart = { ...emptyBarConfig };

  // Initialize filtered empty charts
  this.filteredWebtoolUsageChart = { ...emptyBarConfig };
  this.filteredDepartmentDistributionChart = { ...emptyPieConfig };
  this.filteredUserWebtoolMatrix = { ...emptyHeatmapConfig };
  this.filteredDepartmentUsageChart = { ...emptyBarConfig, chart: { ...emptyBarConfig.chart, stacked: true } };
  this.filteredTopUsersChart = { ...emptyBarConfig };
}

 

public initLoginCharts(): LoginCharts {
  console.log('=== DEBUGGING LOGIN CHARTS INITIALIZATION ===');
  console.log('Initializing login charts with time range:', this.selectedTimeRange);
  console.log('isUserSelected:', this.isUserSelected);
  
  // Use user-specific data if available, otherwise use global data
  const dailyData = this.isUserSelected && this.userKPIs?.dailyLogins 
    ? this.userKPIs.dailyLogins 
    : this.loginMetrics.dailyLogins || [];
    
  const hourlyData = this.isUserSelected && this.userKPIs?.loginsByHour 
    ? this.userKPIs.loginsByHour 
    : this.loginMetrics.loginsByHour || [];
    
  const dayOfWeekData = this.isUserSelected && this.userKPIs?.loginsByDay 
    ? this.userKPIs.loginsByDay 
    : this.loginMetrics.loginsByDay || [];

  console.log('Raw dayOfWeekData from backend:', dayOfWeekData);
  console.log('dayOfWeekData type:', typeof dayOfWeekData);
  console.log('dayOfWeekData is array:', Array.isArray(dayOfWeekData));

  // Ensure we have at least empty arrays for each chart type
  const safeDailyData = Array.isArray(dailyData) ? dailyData : [];
  const safeHourlyData = Array.isArray(hourlyData) ? hourlyData : [];
  const safeDayOfWeekData = Array.isArray(dayOfWeekData) ? dayOfWeekData : [];

  console.log('Safe dayOfWeekData:', safeDayOfWeekData);
  console.log('Safe dayOfWeekData length:', safeDayOfWeekData.length);

  // Log each item in the array to see the structure
  safeDayOfWeekData.forEach((item, index) => {
    console.log(`dayOfWeekData[${index}]:`, {
      item: item,
      day: item.day,
      dayType: typeof item.day,
      dayValue: item.day,
      count: item.count,
      countType: typeof item.count
    });
  });

  // For day of week chart - ensure data is in correct order
  const dayOrder = [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  console.log('Expected dayOrder:', dayOrder);
  console.log('Expected dayNames:', dayNames);
  
  // Create an array with counts in correct order
  const dayCounts = dayOrder.map(dayNum => {
    console.log(`\n--- Processing day ${dayNum} (${dayNames[dayNum]}) ---`);
    
    // Try multiple comparison methods to see which one works
    const dayDataByString = safeDayOfWeekData.find(d => d.day == dayNum); // Loose equality
    const dayDataByNumber = safeDayOfWeekData.find(d => parseInt(d.day) === dayNum); // Parse to int
    const dayDataByExact = safeDayOfWeekData.find(d => d.day === dayNum); // Exact match
    const dayDataByStringExact = safeDayOfWeekData.find(d => d.day === dayNum.toString()); // String exact
    
    console.log(`Looking for day ${dayNum}:`);
    console.log(`  - Loose equality (==): `, dayDataByString);
    console.log(`  - parseInt comparison: `, dayDataByNumber);
    console.log(`  - Exact match (===): `, dayDataByExact);
    console.log(`  - String exact match: `, dayDataByStringExact);
    
    // Use the most reliable method - parseInt
    const dayData = dayDataByNumber || dayDataByString || dayDataByExact || dayDataByStringExact;
    const count = dayData ? (dayData.count || 0) : 0;
    
    console.log(`  - Final selected dayData:`, dayData);
    console.log(`  - Final count for ${dayNames[dayNum]}:`, count);
    
    return count;
  });

  console.log('\n=== FINAL RESULTS ===');
  console.log('Final dayCounts array:', dayCounts);
  console.log('Day mapping:');
  dayCounts.forEach((count, index) => {
    console.log(`  ${dayNames[index]} (${index}): ${count} logins`);
  });

  // Additional debugging - check if all counts are going to one day
  const totalExpectedCount = safeDayOfWeekData.reduce((sum, item) => sum + (item.count || 0), 0);
  const totalMappedCount = dayCounts.reduce((sum, count) => sum + count, 0);
  console.log('Total expected count from backend:', totalExpectedCount);
  console.log('Total mapped count in frontend:', totalMappedCount);
  
  if (totalExpectedCount !== totalMappedCount) {
    console.error('ERROR: Count mismatch! Some data is being lost in mapping.');
  }

  // Check for data clustering in one day
  const nonZeroDays = dayCounts.filter(count => count > 0).length;
  console.log('Number of days with data:', nonZeroDays);
  
  if (nonZeroDays === 1) {
    console.warn('WARNING: All data is clustered in one day - this suggests a mapping issue!');
    const dayWithData = dayCounts.findIndex(count => count > 0);
    console.warn(`All data is in: ${dayNames[dayWithData]} (index ${dayWithData})`);
  }

  return {
    dailyLoginsChart: {
      series: [{
        name: 'Logins',
        data: safeDailyData.map((day: any) => day.count || 0)
      }],
      chart: { 
        type: 'line', 
        height: 220, 
        toolbar: { show: false } 
      },
      xaxis: {
        categories: safeDailyData.map((day: any) => {
          const date = new Date(day.date);
          return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth()+1).toString().padStart(2, '0')}`;
        }),
        labels: { style: { fontSize: '10px' } }
      },
      colors: ['#FFA500'],
      stroke: { width: 1.5, curve: 'straight' }
    },
    hourlyLoginsChart: {
      series: [{
        name: 'Logins',
        data: safeHourlyData.map((hour: any) => hour.count || 0)
      }],
      chart: { 
        type: 'bar', 
        height: 220, 
        toolbar: { show: false } 
      },
      xaxis: {
        categories: safeHourlyData.map((hour: any) => `${hour.hour}:00`),
        labels: { style: { fontSize: '10px' } }
      },
      colors: ['#00B4D8']
    },
    dayOfWeekChart: {
      series: [{
        name: 'Logins',
        data: dayCounts
      }],
      chart: { type: 'bar', height: 220, toolbar: { show: false } },
      xaxis: {
        categories: dayNames,
        labels: { style: { fontSize: '10px' } }
      },
      colors: ['#90E0EF']
    }
  };
}
      private adjustChartDimensions() {
          const baseHeight = this.screenWidth < 768 ? 180 : 220;
          const matrixHeight = Math.min(baseHeight, Math.max(200, this.users.length * 15));
          
          // Update chart heights
          if (this.webtoolUsageChart) {
            this.webtoolUsageChart.chart.height = baseHeight;
          }
          
          if (this.departmentDistributionChart) {
            this.departmentDistributionChart.chart.height = baseHeight;
          }
          
          if (this.departmentUsageChart) {
            this.departmentUsageChart.chart.height = baseHeight;
          }
          
          if (this.topUsersChart) {
            this.topUsersChart.chart.height = baseHeight;
          }
          
          if (this.userWebtoolMatrix) {
            this.userWebtoolMatrix.chart.height = matrixHeight;
          }
        }

async loadTopCharts(): Promise<void> {
  this.loadingTopCharts = true;
  try {
    const webtoolFilter = this.selectedWebtool === 'all' 
      ? undefined 
      : this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
    
    const emailFilter = this.selectedUser === 'All' ? undefined : this.selectedUser;

    // For user-specific view, we'll use the userKPIs data
    if (this.isUserSelected) {
      this.initTopActiveUsersChart([]); // Will be handled in init method
      const usedWebtools = await firstValueFrom(
        this.loginAnalyticsService.getUserWebtoolStats(this.selectedUser, this.selectedTimeRange)
          .pipe(catchError(() => of([])))
      );
      this.initTopUsedWebtoolsChart(usedWebtools);
    } else {
      // For "All Users" view, load both charts normally
      const [activeUsers, usedWebtools] = await Promise.all([
        firstValueFrom(
          this.loginAnalyticsService.getTopActiveUsers(this.selectedTimeRange, webtoolFilter)
            .pipe(catchError(() => of([])))
        ),
        firstValueFrom(
          this.loginAnalyticsService.getTopUsedWebtools(this.selectedTimeRange, emailFilter)
            .pipe(catchError(() => of([])))
        )
      ]);
      this.initTopActiveUsersChart(activeUsers);
      this.initTopUsedWebtoolsChart(usedWebtools);
    }
  } catch (error) {
    console.error('Error loading top charts:', error);
    this.initTopActiveUsersChart([]);
    this.initTopUsedWebtoolsChart([]);
  } finally {
    this.loadingTopCharts = false;
  }
}

private initTopActiveUsersChart(data: any[]): void {
  // When a specific user is selected, show only that user's data
  if (this.isUserSelected) {
    data = [{
      email: this.userKPIs?.email,
      name: this.userKPIs?.name || this.userKPIs?.email.split('@')[0],
      count: this.userKPIs?.totalLogins || 0
    }];
  }

  // Create a map to normalize email casing and track the most recent name
  const userMap = new Map<string, {name: string, count: number}>();
  
  // Process the raw data to consolidate case variations and get names
  data.forEach(user => {
    const normalizedEmail = user.email.toLowerCase();
    
    // Find the user in our filteredUserLoginData to get their name
    const userInfo = this.filteredUserLoginData.find(u => 
      u.email.toLowerCase() === normalizedEmail
    );
    
    const userName = userInfo?.username || 
                    user.name || 
                    user.email.split('@')[0];
    
    if (userMap.has(normalizedEmail)) {
      // If we already have this email (case-insensitive), sum the counts
      const existing = userMap.get(normalizedEmail)!;
      userMap.set(normalizedEmail, {
        name: existing.name, // Keep the first name we encountered
        count: existing.count + user.count
      });
    } else {
      // New email (case-insensitive)
      userMap.set(normalizedEmail, {
        name: userName,
        count: user.count
      });
    }
  });

  // Convert the map back to an array
  const consolidatedData = Array.from(userMap.entries()).map(([email, {name, count}]) => ({
    email,
    name,
    count
  }));

  // Sort by count descending
  consolidatedData.sort((a, b) => b.count - a.count);

  // Take top 5 (unless we have a specific user selected)
  const chartData = this.isUserSelected ? consolidatedData : consolidatedData.slice(0, 5);

  this.topActiveUsersChart = {
    series: [{
      name: 'Logins',
      data: chartData.map(user => user.count)
    }],
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
      }
    },
    xaxis: {
      categories: chartData.map(user => user.name),
      labels: { 
        style: { fontSize: '10px' },
        rotate: -45 
      }
    },
    yaxis: {
      title: { text: 'Login Count' },
      min: 0,
      forceNiceScale: true
    },
    colors: ['#0077B6'],
    tooltip: {
      custom: ({ dataPointIndex }: any) => {
        const user = chartData[dataPointIndex];
        return `
          <div class="p-1 text-xs">
            <div><strong>User:</strong> ${user.name}</div>
            <div><strong>Email:</strong> ${user.email}</div>
            <div><strong>Logins:</strong> ${user.count}</div>
          </div>
        `;
      }
    },
    noData: {
      text: 'No data available',
      align: 'center',
      verticalAlign: 'middle',
      style: {
        color: '#64748b',
        fontSize: '14px'
      }
    }
  };
}
private initTopUsedWebtoolsChart(data: any[]): void {
  // When a specific user is selected, use their webtool stats directly
  if (this.isUserSelected) {
    data = this.userWebtoolStats.map(item => ({
      webtool: item.webtool,
      count: item.count
    }));
  }

  // When a specific webtool is selected, show only that webtool
  if (this.selectedWebtool !== 'all') {
    const selectedWebtoolName = this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
    data = data.filter(item => item.webtool === selectedWebtoolName);
    
    // If no data exists, create an empty entry
    if (data.length === 0 && selectedWebtoolName) {
      data = [{ webtool: selectedWebtoolName, count: 0 }];
    }
  }

  // Ensure we always have items for consistent chart display
  const chartData = data.length > 0 ? data : 
    Array(5).fill({ webtool: 'No data', count: 0 });

  this.topUsedWebtoolsChart = {
    series: [{
      name: 'Logins',
      data: chartData.map(webtool => webtool.count)
    }],
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
      }
    },
    xaxis: {
      categories: chartData.map(webtool => webtool.webtool || 'No data'),
      labels: { 
        style: { fontSize: '10px' },
        rotate: -45 
      }
    },
    yaxis: {
      title: { text: 'Login Count' },
      min: 0,
      forceNiceScale: true
    },
    colors: ['#00B4D8'],
    tooltip: {
      custom: ({ dataPointIndex }: any) => {
        const webtool = chartData[dataPointIndex];
        return `
          <div class="p-1 text-xs">
            <div><strong>Webtool:</strong> ${webtool.webtool || 'No data'}</div>
            <div><strong>Logins:</strong> ${webtool.count}</div>
          </div>
        `;
      }
    },
    noData: {
      text: 'No data available',
      align: 'center',
      verticalAlign: 'middle',
      style: {
        color: '#64748b',
        fontSize: '14px'
      }
    }
  };
}
      getDepartmentCharts() {
         if (this.isUserSelected && this.departmentLoginStats.length === 0) {
    this.departmentLoginStats = [{
      department: this.userKPIs?.department || 'User Department',
      logins: 0
    }];
  }
        console.log('Generating department charts for time range:', this.selectedTimeRange);
        console.log('Department login stats:', this.departmentLoginStats);
        const departmentDistribution = {
          series: this.departmentLoginStats.map(d => Number(d.logins)),
          chart: {
            type: 'pie' as const,
            height: 250,
            toolbar: { show: false }
          },
          labels: this.departmentLoginStats.map(d => d.department || 'Unknown'),
          colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#789DBC', '#8ACDD7'],
          legend: {
            position: 'bottom' as const
          },
          dataLabels: {
            enabled: true
          }
        };

        const uniqueHours = Array.from({length: 24}, (_, i) => i);
        const departmentHourlyHeatmap = {
          series: this.departmentLoginStats.map(department => {
            const departmentData = this.departmentHourlyLogins
              .filter(d => d.department === department.department)
              .reduce((acc, curr) => {
                acc[curr.hour] = curr.count;
                return acc;
              }, {} as Record<number, number>);

            return {
              name: department.department || 'Unknown',
              data: uniqueHours.map(hour => ({
                x: `${hour}:00`,
                y: departmentData[hour] || 0
              }))
            };
          }),
          chart: {
            type: 'heatmap' as const,
            height: 400,
            toolbar: { show: false }
          },
          dataLabels: {
            enabled: false
          },
          colors: ["#E5E7EB", "#0077B6"],
          xaxis: {
            type: 'category' as const,
            categories: uniqueHours.map(h => `${h}:00`)
          },
          plotOptions: {
            heatmap: {
              colorScale: {
                ranges: [
                  { from: 0, to: 0, color: "#E5E7EB", name: "No Logins" },
                  { from: 1, to: 5, color: "#90E0EF", name: "Low" },
                  { from: 6, to: 15, color: "#00B4D8", name: "Medium" },
                  { from: 16, to: 1000, color: "#0077B6", name: "High" }
                ]
              }
            }
          }
        };

        const allDates = [...new Set(this.departmentDailyLogins.map(d => d.date))].sort();
        const departmentDailyLine = {
          series: this.departmentLoginStats.map(department => {
            const departmentData = this.departmentDailyLogins
              .filter(d => d.department === department.department)
              .reduce((acc, curr) => {
                acc[curr.date] = curr.count;
                return acc;
              }, {} as Record<string, number>);

            return {
              name: department.department || 'Unknown',
              data: allDates.map(date => departmentData[date] || 0)
            };
          }),
          chart: {
            type: 'line' as const,
            height: 300,
            toolbar: { show: false },
            stacked: false
          },
          stroke: {
            width: 2,
            curve: 'smooth' as const
          },
          xaxis: {
            categories: allDates.map(date => {
              const d = new Date(date);
              return `${d.getDate()}/${d.getMonth()+1}`;
            }),
            labels: {
              rotate: -45
            }
          },
          colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#789DBC', '#8ACDD7'],
          legend: {
            position: 'bottom' as const
          }
        };

        console.log('Generated department charts:', {
          departmentDistribution,
          departmentHourlyHeatmap,
          departmentDailyLine
        });

        return {
          departmentDistribution,
          departmentHourlyHeatmap,
          departmentDailyLine
        };
      }

      public getUserSpecificCharts(): any {
        if (!this.userKPIs) return null;

        // Webtool Usage Pie Chart
        const webtoolUsageChart = {
          series: this.userKPIs.webtoolUsage.map((w: any) => w.count),
          chart: {
            type: 'pie',
            height: 300,
            toolbar: { show: false }
          },
          labels: this.userKPIs.webtoolUsage.map((w: any) => w.webtool),
          colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#789DBC', '#8ACDD7'],
          legend: {
            position: 'bottom'
          },
          dataLabels: {
            enabled: true,
            formatter: function(val: number) {
              return Math.round(val) + '%';
            }
          }
        };

        // Peak Hours Bar Chart
        const peakHoursChart = {
          series: [{
            name: 'Logins',
            data: this.userLoginStats?.loginsByHour?.map((h: any) => h.count) || []
          }],
          chart: {
            type: 'bar',
            height: 300,
            toolbar: { show: false }
          },
          xaxis: {
            categories: this.userLoginStats?.loginsByHour?.map((h: any) => `${h.hour}:00`) || [],
            title: { text: 'Hour of Day' }
          },
          yaxis: {
            title: { text: 'Login Count' }
          },
          colors: ['#0077B6'],
          plotOptions: {
            bar: {
              borderRadius: 4,
              horizontal: false
            }
          }
        };

        return {
          webtoolUsageChart,
          peakHoursChart
        };
      }

      public getUserLoginCharts(): LoginCharts {
        if (!this.userLoginStats) {
          return this.initLoginCharts(); 
        }

        return {
          dailyLoginsChart: {
            series: [{
              name: 'Logins',
              data: this.userLoginStats.dailyLogins.map((day: any) => day.count)
            }],
            chart: { type: 'line', height: 220, toolbar: { show: false } },
            xaxis: {
              categories: this.userLoginStats.dailyLogins.map((day: any) => {
                const date = new Date(day.date);
                return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth()+1).toString().padStart(2, '0')}`;
              }),
              labels: { style: { fontSize: '10px' } }
            },
            colors: ['#FFA500'],
            stroke: { width: 1.5, curve: 'straight' }
          },
          hourlyLoginsChart: {
            series: [{
              name: 'Logins',
              data: this.userLoginStats.loginsByHour.map((hour: any) => hour.count)
            }],
            chart: { type: 'bar', height: 220, toolbar: { show: false } },
            xaxis: {
              categories: this.userLoginStats.loginsByHour.map((hour: any) => `${hour.hour}:00`),
              labels: { style: { fontSize: '10px' } }
            },
            colors: ['#00B4D8']
          },
          dayOfWeekChart: {
            series: [{
              name: 'Logins',
              data: this.userLoginStats.loginsByDay.map((day: any) => day.count)
            }],
            chart: { type: 'bar', height: 220, toolbar: { show: false } },
            xaxis: {
              categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
              labels: { style: { fontSize: '10px' } }
            },
            colors: ['#90E0EF']
          }
        };
      }


  // Filtering and Selection

// private updateFilteredCharts(): void {
//   // Update Webtool Usage Chart
//   if (this.selectedWebtool !== 'all') {
//     const selected = this.webtools.find(w => w.id === Number(this.selectedWebtool));
    
//     // Add null check
//     if (!selected) {
//       console.warn('Selected webtool not found');
//       return;
//     }
    
//     this.filteredWebtoolUsageChart = {
//       ...this.webtoolUsageChart,
//       series: [{
//         name: 'Users',
//         data: [this.rawData.filter(r => r.webtoolId === selected.id).length]
//       }],
//       xaxis: {
//         ...this.webtoolUsageChart.xaxis,
//         categories: [selected.webtool]
//       }
//     };
//   } else {
//     this.filteredWebtoolUsageChart = { ...this.webtoolUsageChart };
//   }

//   // Update Department Distribution Chart
//   if (this.selectedWebtool !== 'all') {
//     const selectedId = Number(this.selectedWebtool);
//     const departmentCounts = this.rawData
//       .filter(r => r.webtoolId === selectedId)
//       .reduce((acc, curr) => {
//         acc[curr.department] = (acc[curr.department] || 0) + 1;
//         return acc;
//       }, {} as Record<string, number>);

//     const departments = Object.keys(departmentCounts);
//     const counts = departments.map(d => departmentCounts[d]);

//     this.filteredDepartmentDistributionChart = {
//       ...this.departmentDistributionChart,
//       series: counts,
//       labels: departments,
//       chart: {
//         ...this.departmentDistributionChart.chart,
//         type: 'pie'
//       },
//       dataLabels: {
//         enabled: true,
//         formatter: (val: number) => `${Math.round(val)}%`
//       }
//     };
//   } else {
//     this.filteredDepartmentDistributionChart = { ...this.departmentDistributionChart };
//   }

//   this.cdr.detectChanges();
// }
getPeakHour(): string {
  if (!this.loginMetrics.loginsByHour?.length) return 'N/A';
  
  const peak = this.loginMetrics.loginsByHour.reduce(
    (prev: {hour: number, count: number}, current: {hour: number, count: number}) => 
      (prev.count > current.count) ? prev : current, 
    { hour: 0, count: 0 }
  );
  
  // Return "N/A" if there are actually no logins
  return peak.count > 0 ? `${peak.hour}:00` : 'N/A';
}
async openPeakHourModal() {
  if (!this.peakHour || this.peakHour === 'N/A') return;
  
  // Get the hour number from the peak hour string (e.g., "14:00" -> 14)
  const hourNumber = parseInt(this.peakHour.split(':')[0]);
  
  this.selectedPeakHour = this.peakHour;
  this.showPeakHourModal = true;
  
  try {
    // Determine if we need to filter by webtool
    const webtoolFilter = this.selectedWebtool === 'all' 
      ? undefined 
      : this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
    
    // Get users for this peak hour
    this.peakHourUsers = await this.getUsersByHour(hourNumber);
    
    // If in user view and a specific user is selected, filter to just that user
    if (this.activeView === 'user' && this.isUserSelected) {
      const normalizedEmail = this.selectedUser.toLowerCase().trim();
      this.peakHourUsers = this.peakHourUsers.filter(user => 
        user.email.toLowerCase().trim() === normalizedEmail
      );
    }
  } catch (error) {
    console.error('Error loading peak hour users:', error);
    this.peakHourUsers = [];
  }
}
closePeakHourModal() {
  this.showPeakHourModal = false;
  this.peakHourDetails = {hour: '', logins: []};
}
private updateFilteredCharts(): void {
  // When a specific webtool is selected
  if (this.selectedWebtool !== 'all') {
    const selectedId = Number(this.selectedWebtool);
    const selectedWebtool = this.webtools.find(w => w.id === selectedId);
    
    if (!selectedWebtool) {
      console.warn('Selected webtool not found');
      return;
    }
    
    // Get unique users for this webtool
    const usersForWebtool = new Set<string>();
    this.rawData.forEach(record => {
      if (record.webtoolId === selectedId) {
        usersForWebtool.add(record.email.toLowerCase());
      }
    });
    
    const userCount = usersForWebtool.size;
    
    // Update Webtool Usage Chart
    this.filteredWebtoolUsageChart = {
      ...this.webtoolUsageChart,
      series: [{
        name: 'Users',
        data: [userCount]
      }],
      xaxis: {
        ...this.webtoolUsageChart.xaxis,
        categories: [selectedWebtool.webtool]
      }
    };
    
    // Update Department Distribution Chart
    const departmentCounts: Record<string, number> = {};
    this.rawData.forEach(record => {
      if (record.webtoolId === selectedId) {
        const dept = record.department || 'Unknown';
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      }
    });
    
    this.filteredDepartmentDistributionChart = {
      ...this.departmentDistributionChart,
      series: Object.values(departmentCounts),
      labels: Object.keys(departmentCounts)
    };
    
    // Update the total users metric for the filtered view
    this.metrics.totalUsers = userCount;
    
  } else {
    // Reset to all webtools view
    this.filteredWebtoolUsageChart = { ...this.webtoolUsageChart };
    this.filteredDepartmentDistributionChart = { ...this.departmentDistributionChart };
    // Reset total users to the full count
    this.metrics.totalUsers = this.users.length;
  }
  
  this.cdr.detectChanges();
}

// async filterByWebtool(): Promise<void> {
//   try {
//     const webtoolFilter = this.selectedWebtool === 'all' 
//       ? undefined 
//       : this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
    
//     if (this.activeView === 'user') {
//       // Reload all relevant data
//       await this.loadLoginMetrics(webtoolFilter, this.selectedUser !== 'All' ? this.selectedUser : undefined);
//       await this.loadUserLoginData();
      
//       // If a user is selected, reload their data
//       if (this.isUserSelected) {
//         await this.loadUserData(this.selectedUser, webtoolFilter);
//       }
      
//       // Always reload department stats and top charts
//       await this.loadDepartmentStats();
//       await this.loadTopCharts();
      
//       // Update charts
//       this.chartOptions = this.initLoginCharts();
//       this.departmentChartOptions = this.getDepartmentCharts();
//     } else if (this.activeView === 'webtool') {
//       // Existing webtool view logic...
//       if (this.selectedUser === 'All') {
//         await this.loadLoginMetrics(webtoolFilter);
//         await this.loadDepartmentStats();
//         await this.loadTopCharts();
//         this.updateFilteredCharts();
//       } else if (this.selectedUser) {
//         await this.loadUserData(this.selectedUser, webtoolFilter);
//         await this.loadDepartmentStats();
//         this.departmentChartOptions = this.getDepartmentCharts();
//       }
//     }
    
//     // Force UI updates
//     this.cdr.detectChanges();
//   } catch (error) {
//     console.error('Error in filterByWebtool:', error);
//   }
// }
async filterByWebtool(): Promise<void> {
  try {
    const webtoolFilter = this.selectedWebtool === 'all' 
      ? undefined 
      : this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
    
    if (this.activeView === 'user') {
      // Reload all relevant data
      await this.loadLoginMetrics(webtoolFilter, this.selectedUser !== 'All' ? this.selectedUser : undefined);
      await this.loadUserLoginData();
      
      // If a user is selected, reload their data
      if (this.isUserSelected) {
        await this.loadUserData(this.selectedUser, webtoolFilter);
      }
      
      // Always reload department stats and top charts
      await this.loadDepartmentStats();
      await this.loadTopCharts();
      
      // Update charts
      this.chartOptions = this.initLoginCharts();
      this.departmentChartOptions = this.getDepartmentCharts();
    } else if (this.activeView === 'webtool') {
      // Recalculate metrics with webtool filter
      this.calculateMetrics();
      
      // Update the filtered charts
      this.updateFilteredCharts();
      
      if (this.selectedUser === 'All') {
        await this.loadLoginMetrics(webtoolFilter);
        await this.loadDepartmentStats();
        await this.loadTopCharts();
      } else if (this.selectedUser) {
        await this.loadUserData(this.selectedUser, webtoolFilter);
        await this.loadDepartmentStats();
        this.departmentChartOptions = this.getDepartmentCharts();
      }
    }
    
    // Force UI updates
    this.cdr.detectChanges();
  } catch (error) {
    console.error('Error in filterByWebtool:', error);
  }
}
async onUserFilterChange(event: Event): Promise<void> {
  try {
    const selectElement = event.target as HTMLSelectElement;
    const selectedValue = selectElement?.value || 'All';
    this.selectedUser = selectedValue;
    console.log('User filter changed to:', this.selectedUser);

    const webtoolFilter = this.selectedWebtool === 'all' 
      ? undefined 
      : this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;

    if (selectedValue === "All") {
      await this.resetToDefaultView(webtoolFilter);
    } else {
      await this.loadUserData(selectedValue, webtoolFilter);
    }
    
    await this.loadDepartmentStats();
    await this.loadTopCharts(); // Ensure charts are refreshed
    this.departmentChartOptions = this.getDepartmentCharts();
    this.chartOptions = this.initLoginCharts();
  } catch (error) {
    console.error('Error in onUserFilterChange:', error);
  }
}
private async resetToDefaultView(webtoolFilter?: string): Promise<void> {
  this.userKPIs = null;
  await this.loadLoginMetrics(webtoolFilter);
  this.loadDepartmentStats();
  this.loadUserLoginData();
}






// private async loadUserData(email: string, webtoolFilter?: string): Promise<void> {
//   try {
//     const [userStats, webtoolStats] = await Promise.all([
//       firstValueFrom(
//         this.loginAnalyticsService.getUserStats(email, webtoolFilter, this.selectedTimeRange)
//       ),
//       firstValueFrom(
//         this.loginAnalyticsService.getUserWebtoolStats(email, this.selectedTimeRange)
//           .pipe(
//             map(stats => {
//               if (webtoolFilter) {
//                 return stats.filter((s: any) => s.webtool === webtoolFilter);
//               }
//               return stats;
//             }),
//             catchError(() => of([]))
//       ))
//     ]);

//     this.filteredTotalLogins = userStats.totalLogins;
    
//     // Get the full user object from the filtered list
//     const userFromList = this.filteredUserLoginData.find(u => u.email === email);
    
//     // Use the username from the user list (which has the full name)
//     const userName = userFromList?.username || email.split('@')[0];

//     this.userKPIs = {
//       name: userName,
//       email: email,
//       department: userStats.department || userFromList?.department || 'Unknown',
//       lastLogin: userStats.lastLogin || userFromList?.lastLogin,
//       mostUsedWebtool: userStats.mostUsedWebtool || 'N/A',
//       totalLogins: userStats.totalLogins,
//       webtoolUsage: userStats.webtoolUsage,
//       peakHour: userStats.peakHour || 'N/A',
//       dailyLogins: userStats.dailyLogins || [],
//       loginsByHour: userStats.loginsByHour || [],
//       loginsByDay: userStats.loginsByDay || []
//     };
    
//     this.userWebtoolStats = webtoolStats || [];
//   } catch (error) {
//     console.error('Error loading user data:', error);
//     const userName = this.filteredUserLoginData.find(u => u.email === email)?.username || email.split('@')[0];
//     this.userKPIs = {
//       name: userName,
//       email: email,
//       department: 'Unknown',
//       lastLogin: null,
//       mostUsedWebtool: 'N/A',
//       totalLogins: 0,
//       webtoolUsage: [],
//       peakHour: 'N/A',
//       dailyLogins: [],
//       loginsByHour: [],
//       loginsByDay: []
//     };
//     this.userWebtoolStats = [];
//     this.filteredTotalLogins = 0;
//   }
// }
private async loadUserData(email: string, webtoolFilter?: string): Promise<void> {
  try {
    const [userStats, webtoolStats] = await Promise.all([
      firstValueFrom(
        this.loginAnalyticsService.getUserStats(email, webtoolFilter, this.selectedTimeRange)
      ),
      firstValueFrom(
        this.loginAnalyticsService.getUserWebtoolStats(email, this.selectedTimeRange)
          .pipe(
            map(stats => {
              if (webtoolFilter) {
                return stats.filter((s: any) => s.webtool === webtoolFilter);
              }
              return stats;
            }),
            catchError(() => of([]))
          )
      )
    ]);

    this.filteredTotalLogins = userStats.totalLogins;
    
    const userFromList = this.filteredUserLoginData.find(u => u.email === email);
    const userName = userFromList?.username || email.split('@')[0];

    this.userKPIs = {
      name: userName,
      email: email,
      department: userStats.department || userFromList?.department || 'Unknown',
      lastLogin: userStats.lastLogin || userFromList?.lastLogin,
      mostUsedWebtool: userStats.mostUsedWebtool || 'N/A',
      totalLogins: userStats.totalLogins,
      webtoolUsage: userStats.webtoolUsage,
      peakHour: userStats.peakHour || 'N/A',
      dailyLogins: userStats.dailyLogins || [],
      loginsByHour: userStats.loginsByHour || [],
      loginsByDay: userStats.loginsByDay || []
    };
    
    this.userWebtoolStats = webtoolStats || [];
    
    // Prepare the activity timeline chart
    this.prepareActivityTimelineChart();
    
  } catch (error) {
    console.error('Error loading user data:', error);
    const userName = this.filteredUserLoginData.find(u => u.email === email)?.username || email.split('@')[0];
    this.userKPIs = {
      name: userName,
      email: email,
      department: 'Unknown',
      lastLogin: null,
      mostUsedWebtool: 'N/A',
      totalLogins: 0,
      webtoolUsage: [],
      peakHour: 'N/A',
      dailyLogins: [],
      loginsByHour: [],
      loginsByDay: []
    };
    this.userWebtoolStats = [];
    this.filteredTotalLogins = 0;
    this.activityTimelineChartOptions = null;
  }
}
    async onSelectUser(user: User) {
    if (this.selectedUser === user.email) {
      this.selectedUser = "";
      this.selectedUserData = null;
    } else {
      this.selectedUser = user.email;
      this.selectedUserData = user;
      await this.loadUserDetails();
    }
  }


async onTimeRangeChange() {
  console.log('Time range changed to:', this.selectedTimeRange);
  
  const webtoolFilter = this.selectedWebtool === 'all' ? undefined : 
    this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
  
  console.log('Reloading all data with time range:', this.selectedTimeRange);
  
  // Show loading states
  this.loadingLoginMetrics = true;
  this.loadingDepartmentStats = true;
  this.loadingTopCharts = true;
  
  try {
    const promises = [
      this.loadLoginMetrics(webtoolFilter, this.selectedUser || undefined),
      this.loadDepartmentStats(),
      this.loadUserLoginData(),
      this.loadTopCharts()
    ];
    
    if (this.selectedUser) {
      promises.push(this.loadUserData(this.selectedUser, webtoolFilter));
    }
    
    await Promise.all(promises);
    
    // Regenerate charts after data is loaded
    this.chartOptions = this.initLoginCharts();
    this.departmentChartOptions = this.getDepartmentCharts();
    
    // Trigger change detection
    this.cdr.detectChanges();
    
  } catch (error) {
    console.error('Error reloading data for time range change:', error);
  } finally {
    this.loadingLoginMetrics = false;
    this.loadingDepartmentStats = false;
    this.loadingTopCharts = false;
  }
}
private filterEventsByTimeRange(events: any[]): any[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - this.selectedTimeRange);
  
  return events.filter(event => {
    const eventDate = new Date(event.loginTime);
    return eventDate >= cutoffDate;
  });
}
toggleUserListAccordion(): void {
  this.isUserListExpanded = !this.isUserListExpanded;
}
get isUserSelected(): boolean {
    return !!this.selectedUser && this.selectedUser !== 'All';
}
get isSpecificUserSelected(): boolean {
  // Returns true only if a specific user is selected (not empty and not 'All')
  return !!this.selectedUser && this.selectedUser !== 'All';
}
    applySearch() {
    if (!this.searchQuery) {
      this.filteredUserLoginData = [...this.userLoginData];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredUserLoginData = this.userLoginData.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.department.toLowerCase().includes(query) ||
      user.mostUsedWebtool.toLowerCase().includes(query)
    );
    this.currentPage = 1; // Reset to first page when searching
  }

  applyUserSearch(): void {
  if (!this.userSearchQuery) {
    this.filteredUserLoginData = [...this.userLoginData];
    return;
  }

  const query = this.userSearchQuery.toLowerCase();
  this.filteredUserLoginData = this.userLoginData.filter(user => 
    user.username.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query) ||
    (user.department && user.department.toLowerCase().includes(query)) ||
    (user.mostUsedWebtool && user.mostUsedWebtool.toLowerCase().includes(query))
  );
  this.currentPage = 1;
}


async selectUser(user: any): Promise<void> {
  if (this.selectedUser === user.email) {
    // Deselect if same user is clicked
    this.selectedUser = '';
    this.selectedUserData = null;
    this.userKPIs = null;
    
    // Reset to default view (same as dropdown)
    const webtoolFilter = this.selectedWebtool === 'all' 
      ? undefined 
      : this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
    await this.resetToDefaultView(webtoolFilter);
  } else {
    // Select the user
    this.selectedUser = user.email;
    this.selectedUserData = user;
    
    // Trigger the same filtering logic as the dropdown
    const webtoolFilter = this.selectedWebtool === 'all' 
      ? undefined 
      : this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
    
    await this.loadUserData(user.email, webtoolFilter);
  }
  
  // Explicitly reload department stats
  this.loadingDepartmentStats = true;
  try {
    await this.loadDepartmentStats();
    this.departmentChartOptions = this.getDepartmentCharts();
  } catch (error) {
    console.error('Error loading department stats:', error);
  } finally {
    this.loadingDepartmentStats = false;
  }
  
  // Update the dropdown to match
  const selectElement = document.querySelector('.user-select') as HTMLSelectElement;
  if (selectElement) {
    selectElement.value = this.selectedUser;
  }
  
  // Force chart updates
  this.chartOptions = this.initLoginCharts();
  await this.loadTopCharts();
  this.cdr.detectChanges();
}

// Data Loading

async loadLoginMetrics(webtool?: string, userEmail?: string): Promise<void> {
  this.log.debug('loadLoginMetrics called with:', { 
    webtool, 
    userEmail,
    selectedTimeRange: this.selectedTimeRange 
  });
  this.loadingLoginMetrics = true;
  
  try {
    let params: any = { days: this.selectedTimeRange.toString() };
    if (webtool) params.webtool = webtool;
    if (userEmail && userEmail !== 'All') params.email = userEmail;
    
    console.log('Making API calls with params:', params);
    
    const [summary, dailyLogins, loginsByHour, loginsByDay] = await Promise.all([
      firstValueFrom(this.loginAnalyticsService.getSummary(params.days, params.webtool, params.email)),
      firstValueFrom(this.loginAnalyticsService.getDailyLogins(params.days, params.webtool, params.email)),
      firstValueFrom(this.loginAnalyticsService.getLoginsByHour(params.days, params.webtool, params.email)),
      firstValueFrom(this.loginAnalyticsService.getLoginsByDayOfWeek(params.days, params.webtool, params.email))
    ]);

    // Ensure data is properly formatted
    const processData = (data: any[]) => {
      if (!Array.isArray(data)) return [];
      return data.map(item => ({
        ...item,
        count: Number(item.count) || 0
      }));
    };

    this.loginMetrics = {
      ...summary,
      dailyLogins: processData(dailyLogins),
      loginsByHour: processData(loginsByHour),
      loginsByDay: processData(loginsByDay)
    };

    this.calculatePeakHour();
    
    // Force chart redraw
    this.chartOptions = this.initLoginCharts();
    this.cdr.detectChanges();
  } catch (error) {
    this.log.error('Error loading login metrics:', error);
    // Initialize empty metrics to prevent errors
    this.loginMetrics = {
      totalLogins: 0,
      activeUsers: 0,
      dailyLogins: [],
      loginsByHour: [],
      loginsByDay: []
    };
  } finally {
    this.loadingLoginMetrics = false;
  }
}

async loadDepartmentStats() {
  console.log('Loading department stats with filters:', {
    timeRange: this.selectedTimeRange,
    webtool: this.selectedWebtool,
    user: this.selectedUser
  });  
  this.loadingDepartmentStats = true;
  try {
    const webtoolFilter = this.selectedWebtool === 'all' 
      ? undefined 
      : this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
    
    const emailFilter = this.selectedUser === 'All' ? undefined : this.selectedUser;

    const [stats, hourly, daily] = await Promise.all([
      firstValueFrom(this.loginAnalyticsService.getDepartmentLoginStats(this.selectedTimeRange, webtoolFilter, emailFilter)),
      firstValueFrom(this.loginAnalyticsService.getDepartmentHourlyLogins(this.selectedTimeRange, webtoolFilter, emailFilter)),
      firstValueFrom(this.loginAnalyticsService.getDepartmentDailyLogins(this.selectedTimeRange, webtoolFilter, emailFilter))
    ]);

    // Ensure we always have arrays, even if empty
    this.departmentLoginStats = Array.isArray(stats) ? stats : [];
    this.departmentHourlyLogins = Array.isArray(hourly) ? hourly : [];
    this.departmentDailyLogins = Array.isArray(daily) ? daily : [];

    // Initialize empty data if no results
    if (this.departmentLoginStats.length === 0 && this.selectedUser !== 'All') {
      this.departmentLoginStats = [{
        department: this.userKPIs?.department || 'User Department',
        logins: 0
      }];
    }
  } catch (error) {
    console.error('Error loading department stats:', error);
    // Initialize empty data on error
    this.departmentLoginStats = this.selectedUser !== 'All' ? 
      [{ department: this.userKPIs?.department || 'User Department', logins: 0 }] : 
      [];
    this.departmentHourlyLogins = [];
    this.departmentDailyLogins = [];
  } finally {
    this.loadingDepartmentStats = false;
  }
}

async loadUserLoginData() {
    try {
    const webtoolFilter = this.selectedWebtool === 'all' 
      ? undefined 
      : this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;

    const [loginEvents, userWebtools] = await Promise.all([
      firstValueFrom(
        this.loginAnalyticsService.getLoginEvents()
      ).then(events => {
        // Apply time range filter
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.selectedTimeRange);
        
        return events.filter(event => {
          const eventDate = new Date(event.loginTime);
          const isWithinTimeRange = eventDate >= cutoffDate;
          const matchesWebtool = !webtoolFilter || event.webtool === webtoolFilter;
          return isWithinTimeRange && matchesWebtool;
        });
      }),
      firstValueFrom(this.userWebtoolService.getAllActiveUserWebtools())
    ]);


    console.log('Filtered login events:', {
      totalEvents: loginEvents.length,
      timeRange: this.selectedTimeRange,
      webtoolFilter
    });
      // Create a normalized email map (lowercase)
     const userMap = new Map<string, {username: string, department: string}>();
    userWebtools.forEach(user => {
      const normalizedEmail = user.email.toLowerCase().trim();
      if (!userMap.has(normalizedEmail)) {
        userMap.set(normalizedEmail, {
          username: user.userName || user.email.split('@')[0],
          department: user.department || 'Unknown'
        });
      }
    });

    // Process login counts with normalized emails
    const loginCountMap = new Map<string, number>();
    const lastLoginMap = new Map<string, Date>();
    const webtoolUsageMap = new Map<string, Record<string, number>>();

    loginEvents.forEach(event => {
      const normalizedEmail = event.email.toLowerCase().trim();
      
      // Count logins
      loginCountMap.set(normalizedEmail, (loginCountMap.get(normalizedEmail) || 0) + 1);
      
      // Track most recent login
      const eventDate = new Date(event.loginTime);
      if (!lastLoginMap.has(normalizedEmail)) {
        lastLoginMap.set(normalizedEmail, eventDate);
      } else if (eventDate > lastLoginMap.get(normalizedEmail)!) {
        lastLoginMap.set(normalizedEmail, eventDate);
      }
      
      // Track webtool usage
      if (!webtoolUsageMap.has(normalizedEmail)) {
        webtoolUsageMap.set(normalizedEmail, {});
      }
      const userWebtools = webtoolUsageMap.get(normalizedEmail)!;
      userWebtools[event.webtool] = (userWebtools[event.webtool] || 0) + 1;
    });

    // Create user data with normalized emails
    this.userLoginData = Array.from(userMap.entries()).map(([email, userInfo]) => {
      const userWebtools = webtoolUsageMap.get(email) || {};
      const sortedWebtools = Object.entries(userWebtools).sort((a, b) => b[1] - a[1]);
      
      return {
        username: userInfo.username,
        email: email,
        department: userInfo.department,
        lastLogin: lastLoginMap.get(email),
        mostUsedWebtool: sortedWebtools[0]?.[0] || 'N/A',
        loginCount: loginCountMap.get(email) || 0,
        webtools: sortedWebtools.map(([webtool, count]) => ({ webtool, count }))
      };
    }).sort((a, b) => {
      // Sort by login count (descending), then by last login (newest first)
      if (b.loginCount !== a.loginCount) {
        return b.loginCount - a.loginCount;
      }
      return (b.lastLogin?.getTime() || 0) - (a.lastLogin?.getTime() || 0);
    });

    // Initialize filtered data
    this.filteredUserLoginData = [...this.userLoginData];
    
  } catch (error) {
    this.log.error('Error loading user login data:', error);
    this.userLoginData = [];
    this.filteredUserLoginData = [];
  }
}

async loadUserDetails() {
  if (!this.selectedUser) return;
  
  this.userDetailsLoading = true;
  
  try {
    const webtoolFilter = this.selectedWebtool === 'all' ? undefined : 
      this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;

    const [webtools, loginStats] = await Promise.all([
      firstValueFrom(this.userWebtoolService.getUserWebtoolsByUser(this.selectedUser)),
      // ✅ Add selectedTimeRange parameter
      firstValueFrom(this.loginAnalyticsService.getUserStats(
        this.selectedUser, 
        webtoolFilter, 
        this.selectedTimeRange
      ))
    ]);

    this.userWebtoolsData = webtools;
    this.userLoginStats = loginStats;
    
  } catch (error) {
    console.error('Error loading user details:', error);
  } finally {
    this.userDetailsLoading = false;
  }
}
async getWebtoolUsageForUser(email: string): Promise<{ webtool: string; count: number }[]> {
  try {
    const loginEvents = await firstValueFrom(
      this.loginAnalyticsService.getLoginEvents()
    );
    
    // ✅ Apply time filtering
    const filteredEvents = this.filterEventsByTimeRange(loginEvents);
    
    const normalizedEmail = email.toLowerCase().trim();
    const userEvents = filteredEvents.filter(event => 
      event.email.toLowerCase().trim() === normalizedEmail
    );
    
    // Count webtool usage
    const webtoolCounts = userEvents.reduce((acc: Record<string, number>, event) => {
      acc[event.webtool] = (acc[event.webtool] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(webtoolCounts)
      .map(([webtool, count]) => ({ webtool, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error getting webtool usage:', error);
    return [];
  }
}
  // Utility Calculations

//   async openPeakHourModal() {
//   if (!this.peakHour || this.peakHour === 'N/A') return;
  
//   this.selectedPeakHour = this.peakHour;
//   const hourNumber = Number(this.peakHour.split(':')[0]);
//   this.peakHourUsers = await this.getUsersByHour(hourNumber);
//   this.showPeakHourModal = true;
// }
getTotalPeakHourLogins(): number {
  return this.peakHourUsers.reduce((total, user) => total + user.loginCount, 0);
}

async getUsersByHour(hour: number): Promise<PeakHourUser[]> {
  try {
    const webtoolFilter = this.selectedWebtool === 'all' 
      ? undefined 
      : this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;

    const rawUsers = await firstValueFrom(
      this.loginAnalyticsService.getPeakHourUsers(
        hour,
        this.selectedTimeRange,
        webtoolFilter
      )
    );

    // Map to our frontend format
    return rawUsers.map(rawUser => {
      const userFromList = this.filteredUserLoginData.find(u => 
        u.email?.toLowerCase() === rawUser.email.toLowerCase()
      );

      return {
        email: rawUser.email,
        username: userFromList?.username || rawUser.email.split('@')[0],
        department: userFromList?.department || 'Unknown',
        loginCount: rawUser.count,
        lastLogin: rawUser.lastLogin
      };
    });

  } catch (error) {
    console.error('Error getting peak hour users:', error);
    return [];
  }
}


    private calculatePeakHour(): void {
    if (!this.loginMetrics.loginsByHour?.length) {
      this.peakHour = 'N/A';
      return;
    }
    
    const peak = this.loginMetrics.loginsByHour.reduce((prev: {hour: number, count: number}, current: {hour: number, count: number}) => 
      (prev.count > current.count) ? prev : current, 
      {hour: 0, count: 0}
    );
    this.peakHour = `${peak.hour}:00`;
}

    private generateColorPalette(count: number): string[] {
      const baseColors = ['#0077B6', '#556FB5', '#3B82F6', '#1D4ED8', '#1E40AF'];
      if (count <= baseColors.length) {
        return baseColors.slice(0, count);
      }
      return [...baseColors, ...Array(count - baseColors.length).fill('#0077B6')];
    }

    get peakHourNumber(): number {
      if (!this.loginMetrics.loginsByHour?.length) return 0;
      return this.loginMetrics.loginsByHour.reduce((prev: {hour: number, count: number}, current: {hour: number, count: number}) => 
        (prev.count > current.count) ? prev : current, 
        {hour: 0, count: 0}
      ).hour;
  }

  openMostActiveUserModal(user: any) {
  this.selectedMostActiveUser = user;
  this.showMostActiveUserDetails = true;
  // Load webtool usage for this user
  this.getWebtoolUsageForUser(user.email).then(usage => {
    this.selectedMostActiveUser.webtoolUsage = usage;
  });
}

openTopDepartmentModal(department: any) {
  this.selectedDepartmentUsers = this.filteredUserLoginData
    .filter(u => u.department === department.department)
    .sort((a, b) => (b.loginCount || 0) - (a.loginCount || 0));
  this.showTopDepartmentDetails = true;
}

openRecentActivityModal() {
  // Get today's logins
  const today = new Date().toISOString().split('T')[0];
  this.selectedRecentActivityDetails = this.filteredUserLoginData
    .filter(user => {
      if (!user.lastLogin) return false;
      const loginDate = new Date(user.lastLogin).toISOString().split('T')[0];
      return loginDate === today;
    })
    .sort((a, b) => (b.loginCount || 0) - (a.loginCount || 0));
  this.showRecentActivityDetails = true;
}

    // getPeakHour(): string {
    //   if (!this.loginMetrics.loginsByHour?.length) return 'N/A';
      
    //   const peak = this.loginMetrics.loginsByHour.reduce(
    //     (prev: {hour: number, count: number}, current: {hour: number, count: number}) => 
    //       (prev.count > current.count) ? prev : current, 
    //     { hour: 0, count: 0 }
    //   );
    //   return `${peak.hour}:00`;
    // }

    get paginatedUserData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUserLoginData.slice(startIndex, startIndex + this.itemsPerPage);
  }



getUserListForFilter(): User[] {
  // Create a map to handle case-insensitive emails
  const userMap = new Map<string, User>();
  
  this.userLoginData.forEach(user => {
    const normalizedEmail = user.email.toLowerCase();
    const currentCount = user.loginCount || 0; // Handle undefined
    const currentLastLogin = user.lastLogin || null;
    
    if (!userMap.has(normalizedEmail)) {
      userMap.set(normalizedEmail, {
        email: user.email.toLowerCase(),
        username: user.username,
        department: user.department || 'Unknown', // Provide default
        lastLogin: currentLastLogin,
        mostUsedWebtool: user.mostUsedWebtool || 'N/A', // Provide default
        loginCount: currentCount
      });
    } else {
      // If we have duplicate emails (case-insensitive), merge the data
      const existing = userMap.get(normalizedEmail)!;
      const existingCount = existing.loginCount || 0;
      const existingLastLogin = existing.lastLogin || null;
      
      userMap.set(normalizedEmail, {
        ...existing,
        loginCount: existingCount + currentCount,
        lastLogin: existingLastLogin && currentLastLogin 
          ? new Date(Math.max(existingLastLogin.getTime(), currentLastLogin.getTime()))
          : existingLastLogin || currentLastLogin
      });
    }
  });
  
  return Array.from(userMap.values())
    .filter(user => (user.loginCount || 0) > 0) // Handle undefined in filter
    .sort((a, b) => (b.loginCount || 0) - (a.loginCount || 0)); // Handle undefined in sort
}

    getPaginatedUsers(): any[] {
  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  const endIndex = startIndex + this.itemsPerPage;
  return this.filteredUserLoginData.slice(startIndex, endIndex);
}

getTotalPages(): number {
  return Math.ceil(this.filteredUserLoginData.length / this.itemsPerPage);
}

getPageNumbers(): number[] {
  const totalPages = this.getTotalPages();
  const maxVisiblePages = 5; // Show up to 5 page numbers
  const pages: number[] = [];
  
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);
    
    // Calculate start and end pages
    let startPage = Math.max(2, this.currentPage - 1);
    let endPage = Math.min(totalPages - 1, this.currentPage + 1);
    
    // Adjust if we're at the beginning or end
    if (this.currentPage <= 3) {
      endPage = 4;
    } else if (this.currentPage >= totalPages - 2) {
      startPage = totalPages - 3;
    }
    
    // Add ellipsis if needed
    if (startPage > 2) {
      pages.push(-1); // Use -1 to represent ellipsis
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if needed
    if (endPage < totalPages - 1) {
      pages.push(-1);
    }
    
    // Always show last page
    pages.push(totalPages);
  }
  
  return pages;
}

goToPage(page: number): void {
  if (page > 0 && page <= this.getTotalPages()) {
    this.currentPage = page;
  }
}

nextPage(): void {
  if (this.currentPage < this.getTotalPages()) {
    this.currentPage++;
  }
}
// getMostActiveUser(): any {
//   if (!this.filteredUserLoginData.length) return null;
//   return this.filteredUserLoginData.reduce((prev, current) => 
//     (prev.loginCount > current.loginCount) ? prev : current
//   );
// }
getMostActiveUser(): any {
  if (!this.filteredUserLoginData.length) return null;
  
  // Filter users who have actually logged in (loginCount > 0)
  const activeUsers = this.filteredUserLoginData.filter(user => user.loginCount > 0);
  if (activeUsers.length === 0) return null;
  
  return activeUsers.reduce((prev, current) => 
    (prev.loginCount > current.loginCount) ? prev : current
  );
}

getTopDepartment(): any {
  if (!this.filteredUserLoginData.length) return null;
  
  // Filter users who have actually logged in
  const activeUsers = this.filteredUserLoginData.filter(user => user.loginCount > 0);
  if (activeUsers.length === 0) return null;

  const departmentCounts = activeUsers.reduce((acc, user) => {
    const dept = user.department || 'Unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departments = Object.keys(departmentCounts).map(dept => ({
    department: dept,
    count: departmentCounts[dept]
  }));

  return departments.sort((a, b) => b.count - a.count)[0];
}

getRecentActivityCount(): number {
  // If we have daily logins data, use the most recent day
  if (this.loginMetrics.dailyLogins?.length > 0) {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Find today's entry in the daily logins with proper typing
    const todayData = this.loginMetrics.dailyLogins.find((day: DailyLoginData) => {
      const dayDate = new Date(day.date).toISOString().split('T')[0];
      return dayDate === today;
    });
    
    return todayData?.count || 0;
  }
  
  // Fallback to checking user login data if available
  if (this.filteredUserLoginData.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    return this.filteredUserLoginData.reduce((total: number, user: any) => {
      if (user.lastLogin) {
        const loginDate = new Date(user.lastLogin).toISOString().split('T')[0];
        if (loginDate === today) {
          return total + (user.loginCount || 0);
        }
      }
      return total;
    }, 0);
  }
  
  return 0;
}
testClick() {
  console.log('Tile clicked!'); // Check if this appears in console
  this.openPeakHourModal();
}
// getPeakHour(): string {
//   if (!this.loginMetrics.loginsByHour?.length) return 'N/A';
  
//   const peak = this.loginMetrics.loginsByHour.reduce(
//     (prev: {hour: number, count: number}, current: {hour: number, count: number}) => 
//       (prev.count > current.count) ? prev : current, 
//     { hour: 0, count: 0 }
//   );
  
//   // Return "N/A" if there are actually no logins
//   return peak.count > 0 ? `${peak.hour}:00` : 'N/A';
// }
previousPage(): void {
  if (this.currentPage > 1) {
    this.currentPage--;
  }
}

getFirstItemIndex(): number {
  return (this.currentPage - 1) * this.itemsPerPage + 1;
}

getLastItemIndex(): number {
  return Math.min(this.currentPage * this.itemsPerPage, this.filteredUserLoginData.length);
}
getFilteredActiveUsers(): any[] {
  // Start with users who have at least one login
  let users = this.filteredUserLoginData.filter(user => 
    (user.loginCount || 0) > 0
  );

  // Apply webtool filter if selected
  if (this.selectedWebtool !== 'all') {
    const webtoolName = this.getWebtoolName(this.selectedWebtool);
    users = users.filter(user => 
      user.webtools?.some((wt: any) => wt.webtool === webtoolName)
    );
  }

  // Apply time range filter
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - this.selectedTimeRange);
  
  return users.filter(user => 
    user.lastLogin && new Date(user.lastLogin) >= cutoffDate
  );
}
get activeUsersCount(): number {
  // For default view (no filters), only count users with logins
  if (this.selectedWebtool === 'all' && this.selectedUser === 'All') {
    return this.filteredUserLoginData.filter(user => 
      (user.loginCount || 0) > 0
    ).length;
  }
  
  // For filtered views, use the full filtered logic
  return this.getFilteredActiveUsers().length;
}
openModal(type: 'webtools' | 'users' | 'logins' | 'activeUsers') {
  this.activeModal = type;
  
  switch(type) {
    case 'webtools':
      this.modalTitle = 'All Webtools';
      break;
    case 'users':
      this.modalTitle = this.selectedWebtool === 'all' 
        ? 'All Users' 
        : `Users with access to ${this.getWebtoolName(this.selectedWebtool)}`;
      break;
    case 'logins':
      this.modalTitle = 'Login Statistics';
      break;
case 'activeUsers':
  const timeText = this.selectedTimeRange === 7 ? 'week' : 
                 this.selectedTimeRange === 30 ? 'month' : 
                 `${this.selectedTimeRange} days`;
  const webtoolText = this.selectedWebtool === 'all' ? '' : 
                     ` for ${this.getWebtoolName(this.selectedWebtool)}`;
  
  if (this.selectedWebtool === 'all' && this.selectedUser === 'All') {
    this.modalTitle = `Users With Logins (last ${timeText})`;
  } else {
    this.modalTitle = `Active Users (last ${timeText}${webtoolText})`;
  }
  break;
  }
  
  this.showModal = true;
}
getFilteredUsers(): ProcessedUser[] {
  if (this.selectedWebtool === 'all') {
    return this.users;
  }
  
  const selectedWebtoolId = Number(this.selectedWebtool);
  return this.users.filter(user => 
    user.webtools.has(selectedWebtoolId)
  );
}

getWebtoolName(id: number | string): string {
  if (id === 'all') return 'All Webtools';
  const numId = Number(id);
  const webtool = this.webtools.find(w => w.id === numId);
  return webtool?.webtool || 'Unknown Webtool';
}
closeModal() {
  this.showModal = false;
  this.showMostActiveUserDetails = false;
  this.showTopDepartmentDetails = false;
  this.showRecentActivityDetails = false;
}
// Event Handlers

    onPageChange(page: number) {
      this.currentPage = page;
    }

    toggleDashboard(dashboard: 'powerbi' | 'webtool') {
      this.dashboardChange.emit(dashboard);
    }

    @HostListener('window:resize', ['$event'])
    onResize() {
      this.screenWidth = window.innerWidth;
      // Re-initialize charts with adjusted dimensions
      if (this.chartsInitialized) {
        this.adjustChartDimensions();
        this.filterByWebtool();
      }
    }

    private destroy$ = new Subject<void>();

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
  this.destroyCharts();
}

private destroyCharts(): void {
  // Reset all chart variables to null
  this.webtoolUsageChart = null;
  this.departmentDistributionChart = null;
  this.userWebtoolMatrix = null;
  this.rolesPerWebtoolChart = null;
  this.departmentUsageChart = null;
  this.topUsersChart = null;
  this.userStatusChart = null;
  
  // Reset filtered charts
  this.filteredWebtoolUsageChart = null;
  this.filteredDepartmentDistributionChart = null;
  this.filteredUserWebtoolMatrix = null;
  this.filteredDepartmentUsageChart = null;
  this.filteredTopUsersChart = null;
}
}