import { Component, HostListener, OnInit } from '@angular/core';
import { WebtoolService } from '../Services/webtool.service';
import { UserWebtoolService } from '../Services/user-webtool.service';
import { RolesService } from '../Services/roles.service';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';
import { Role, UserWebtool, Webtool } from '../../../interfaces/webtool.interfaces';
import { forkJoin } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { LoginAnalyticsService } from '../Services/login-analytics.service';
import { ApexChart, ApexOptions } from 'ng-apexcharts';

import {EventEmitter, Input, Output } from '@angular/core';

interface LoginChartData {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  colors: string[];
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

// interface DashboardMetrics {
//   totalUsers: number;
//   totalWebtools: number;
//   totalRoles: number;
//   topUsers: { name: string; count: number; email: string }[];
//   avgWebtoolsPerUser: number;
//   usersByDepartment: { [key: string]: number };
//   topWebtools: MetricItem[];
//   roleDistribution: MetricItem[];
//   rolesPerWebtool: MetricItem[];
//   departmentWebtoolUsage: {
//     department: string;
//     webtools: { name: string; count: number }[];
//   }[];
// }
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
  loginStats?: { // Make it optional with ?
    totalLogins: number;
    activeUsers: number;
    avgDailyLogins: number;
    peakHour: number;
  };
}
@Component({
  selector: 'app-webtool-analytics',
  templateUrl: './webtool-analytics.component.html',
  imports: [CommonModule, NgApexchartsModule, FormsModule],
  styleUrls: ['./webtool-analytics.component.css']
})
export class WebtoolAnalyticsComponent implements OnInit {
  webtools: Webtool[] = [];
  users: ProcessedUser[] = [];
  roles: Role[] = [];
  rawData: UserWebtool[] = [];

  metrics: DashboardMetrics = {
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

  timeRangeOptions = [
    { label: 'Last 7 Days', value: 7 },
    { label: 'Last 30 Days', value: 30 },
    { label: 'Last 90 Days', value: 90 }
  ];
  selectedTimeRange = 30; 

  public peakHour: string = 'N/A';

  chartsInitialized = false;
  webtoolUsageChart: any = null;
  roleDistributionChart: any = null;
  departmentDistributionChart: any = null;
  userWebtoolMatrix: any = null;
  rolesPerWebtoolChart: any = null;
  departmentUsageChart: any = null;
  topUsersChart: any = null;
  userStatusChart: any = null;

  filteredWebtoolUsageChart: any = null;
  filteredDepartmentDistributionChart: any = null;
  filteredUserWebtoolMatrix: any = null;
  filteredDepartmentUsageChart: any = null;
  filteredTopUsersChart: any = null;

  selectedWebtool: string | number = 'all';

  userStatusData: { active: number, inactive: number } = { active: 0, inactive: 0 };
  screenWidth: number;

  loginMetrics: any = {
    totalLogins: 0,
    activeUsers: 0,
    dailyLogins: [],
    loginsByHour: [],
    loginsByDay: []
  };
  
  loadingLoginMetrics = false;

  @Input() activeDashboard: 'powerbi' | 'webtool' = 'webtool';
  @Output() dashboardChange = new EventEmitter<'powerbi' | 'webtool'>();


  toggleDashboard(dashboard: 'powerbi' | 'webtool') {
    this.dashboardChange.emit(dashboard);
  }
  constructor(
    private webtoolService: WebtoolService,
    private userWebtoolService: UserWebtoolService,
    private rolesService: RolesService,
    private loginAnalyticsService: LoginAnalyticsService
  ) {
    this.screenWidth = window.innerWidth;

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
  // async loadLoginMetrics() {
  //   this.loadingLoginMetrics = true;
  //   try {
  //     const [summary, dailyLogins, loginsByHour, loginsByDay] = await Promise.all([
  //       firstValueFrom(this.loginAnalyticsService.getSummary(this.selectedTimeRange)),
  //       firstValueFrom(this.loginAnalyticsService.getDailyLogins(this.selectedTimeRange)),
  //       firstValueFrom(this.loginAnalyticsService.getLoginsByHour()),
  //       firstValueFrom(this.loginAnalyticsService.getLoginsByDayOfWeek())
  //     ]);
  
  //     this.loginMetrics = {
  //       ...summary,
  //       dailyLogins,
  //       loginsByHour,
  //       loginsByDay
  //     };
  
  //     this.calculatePeakHour();
  //   } catch (error) {
  //     console.error('Error loading login metrics:', error);
  //   } finally {
  //     this.loadingLoginMetrics = false;
  //   }
  // }
  async loadLoginMetrics(webtool?: string): Promise<void> {
    console.log('Loading login metrics with webtool:', webtool);
    this.loadingLoginMetrics = true;
    
    try {
      const [summary, dailyLogins, loginsByHour, loginsByDay] = await Promise.all([
        firstValueFrom(this.loginAnalyticsService.getSummary(this.selectedTimeRange, webtool)),
        firstValueFrom(this.loginAnalyticsService.getDailyLogins(this.selectedTimeRange, webtool)),
        firstValueFrom(this.loginAnalyticsService.getLoginsByHour(webtool)),
        firstValueFrom(this.loginAnalyticsService.getLoginsByDayOfWeek(webtool))
      ]);
  
      console.log('Login metrics data received:', {
        summary,
        dailyLogins,
        loginsByHour,
        loginsByDay
      });
  
      this.loginMetrics = {
        ...summary,
        dailyLogins,
        loginsByHour,
        loginsByDay
      };
  
      this.calculatePeakHour();
    } catch (error) {
      console.error('Error loading login metrics:', error);
    } finally {
      this.loadingLoginMetrics = false;
      console.log('Login metrics loading completed');
    }
  }
  
  onTimeRangeChange() {
    this.loadLoginMetrics();
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
  async ngOnInit() {
    await this.loadData();
    this.loadLoginMetrics();
    this.filterByWebtool();
  }

  // async loadLoginMetrics() {
  //   this.loadingLoginMetrics = true;
  //   try {
  //     const [summary, dailyLogins, loginsByHour, loginsByDay] = await Promise.all([
  //       firstValueFrom(this.loginAnalyticsService.getSummary()),
  //       firstValueFrom(this.loginAnalyticsService.getDailyLogins()),
  //       firstValueFrom(this.loginAnalyticsService.getLoginsByHour()),
  //       firstValueFrom(this.loginAnalyticsService.getLoginsByDayOfWeek())
  //     ]);
  
  //     this.loginMetrics = {
  //       ...summary,
  //       dailyLogins,
  //       loginsByHour,
  //       loginsByDay
  //     };
  
  //     // Calculate peak hour after data loads
  //     this.calculatePeakHour();
  //   } catch (error) {
  //     console.error('Error loading login metrics:', error);
  //   } finally {
  //     this.loadingLoginMetrics = false;
  //   }
  // }
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
public initLoginCharts(): LoginCharts {
  console.log('Initializing login charts with data:', this.loginMetrics);
  
  const emptySeries = [{ name: 'Logins', data: [] }];
  const emptyChart: ApexChart = { 
    type: 'line', 
    height: 220, 
    toolbar: { show: false } 
  };
  const emptyXaxis: ApexXAxis = { 
    type: 'category', 
    categories: [], 
    labels: { style: { fontSize: '10px' } } 
  };

  return {
    dailyLoginsChart: {
      series: this.loginMetrics.dailyLogins?.length 
        ? [{
            name: 'Logins',
            data: this.loginMetrics.dailyLogins.map((day: any) => day.count)
          }]
        : emptySeries,
      chart: this.loginMetrics.dailyLogins?.length
        ? { type: 'line', height: 220, toolbar: { show: false } }
        : emptyChart,
      xaxis: this.loginMetrics.dailyLogins?.length
        ? {
            categories: this.loginMetrics.dailyLogins.map((day: any) => {
              const date = new Date(day.date);
              return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getFullYear()}`;
            }),
            labels: { 
              style: { fontSize: '10px' },
              formatter: function(value) {
                return value;
              }
            }
          }
        : emptyXaxis,
      colors: ['#0077B6']
    },

    hourlyLoginsChart: {
      series: this.loginMetrics.loginsByHour?.length
        ? [{
            name: 'Logins',
            data: this.loginMetrics.loginsByHour.map((hour: any) => hour.count)
          }]
        : emptySeries,
      chart: this.loginMetrics.loginsByHour?.length
        ? { type: 'bar', height: 220, toolbar: { show: false } }
        : emptyChart,
      xaxis: this.loginMetrics.loginsByHour?.length
        ? {
            categories: this.loginMetrics.loginsByHour.map((hour: any) => `${hour.hour}:00`),
            labels: { style: { fontSize: '10px' } }
          }
        : emptyXaxis,
      colors: ['#00B4D8']
    },

    dayOfWeekChart: {
      series: this.loginMetrics.loginsByDay?.length
        ? [{
            name: 'Logins',
            data: this.loginMetrics.loginsByDay.map((day: any) => day.count)
          }]
        : emptySeries,
      chart: this.loginMetrics.loginsByDay?.length
        ? { type: 'bar', height: 220, toolbar: { show: false } }
        : emptyChart,
      xaxis: this.loginMetrics.loginsByDay?.length
        ? {
            categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            labels: { style: { fontSize: '10px' } }
          }
        : emptyXaxis,
      colors: ['#90E0EF']
    }
  };
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
      this.initCharts();
      this.chartsInitialized = true;
      
    } catch (error) {
      console.error('Error loading data:', error);
      this.initEmptyCharts();
      this.chartsInitialized = true;
    }
  }
  

  private processUsers(userWebtools: UserWebtool[]): ProcessedUser[] {
    const userMap = new Map<string, ProcessedUser>();
    
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

  // private calculateMetrics() {
  //   // Basic counts
  //   this.metrics.totalUsers = this.users.length;
  //   this.metrics.totalWebtools = this.webtools.length;
  //   this.metrics.totalRoles = this.roles.length;
    
  //   // Average webtools per user
  //   const totalWebtoolAssignments = this.users.reduce((sum, user) => sum + user.webtools.size, 0);
  //   this.metrics.avgWebtoolsPerUser = this.metrics.totalUsers > 0 
  //     ? totalWebtoolAssignments / this.metrics.totalUsers 
  //     : 0;
    
  //   // Users by department
  //   this.metrics.usersByDepartment = this.users.reduce((acc, user) => {
  //     const dept = user.department || 'Unknown';
  //     acc[dept] = (acc[dept] || 0) + 1;
  //     return acc;
  //   }, {} as { [key: string]: number });

  //   // Top webtools by user count
  //   const webtoolUsage = new Map<number, number>();
  //   this.webtools.forEach(webtool => {
  //     const count = this.rawData.filter(r => r.webtoolId === webtool.id).length;
  //     webtoolUsage.set(webtool.id, count);
  //   });
    
  //   this.metrics.topWebtools = Array.from(webtoolUsage.entries())
  //     .map(([id, count]) => ({
  //       id,
  //       name: this.webtools.find(w => w.id === id)?.webtool || `Webtool ${id}`,
  //       count
  //     }))
  //     .sort((a, b) => b.count - a.count);

  //   // Roles per Webtool
  //   this.metrics.rolesPerWebtool = this.webtools.map(webtool => {
  //     const roleCounts = new Set<number>();
  //     this.users.forEach(user => {
  //       if (user.webtools.has(webtool.id)) {
  //         user.roles.forEach(roleId => roleCounts.add(roleId));
  //       }
  //     });
  //     this.metrics.loginStats = {
  //       totalLogins: this.loginMetrics.totalLogins,
  //       activeUsers: this.loginMetrics.activeUsers,
  //       avgDailyLogins: this.loginMetrics.totalLogins / 30,
  //       peakHour: this.loginMetrics.loginsByHour?.reduce((prev: any, current: any) => 
  //         (prev.count > current.count) ? prev : current, {hour: 0, count: 0}
  //       ).hour
  //     };
  //     return {
  //       id: webtool.id,
  //       name: webtool.webtool,
  //       count: roleCounts.size
  //     };
  //   }).sort((a, b) => b.count - a.count);

  //   // Department vs Webtool Usage
  //   const departmentMap = new Map<string, Map<string, number>>();
  //   this.users.forEach(user => {
  //     if (!departmentMap.has(user.department)) {
  //       departmentMap.set(user.department, new Map<string, number>());
  //     }
  //     const deptWebtools = departmentMap.get(user.department)!;
  //     user.webtools.forEach(webtoolId => {
  //       const webtoolName = this.webtools.find(w => w.id === webtoolId)?.webtool || '';
  //       deptWebtools.set(webtoolName, (deptWebtools.get(webtoolName) || 0) + 1);
  //     });
  //   });
    
  //   this.metrics.departmentWebtoolUsage = Array.from(departmentMap.entries())
  //     .map(([department, webtoolCounts]) => ({
  //       department,
  //       webtools: Array.from(webtoolCounts.entries())
  //         .map(([name, count]) => ({ name, count }))
  //         .sort((a, b) => b.count - a.count)
  //     }));

  //   // Top Users
  //   this.metrics.topUsers = this.users
  //     .map(user => ({
  //       name: user.name,
  //       email: user.email,
  //       count: user.webtools.size
  //     }))
  //     .sort((a, b) => b.count - a.count)
  //     .slice(0, 5);
  // }
  private calculateMetrics() {
    // Basic counts
    this.metrics.totalUsers = this.users.length;
    this.metrics.totalWebtools = this.webtools.length;
    this.metrics.totalRoles = this.roles.length;
    
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
  
    // Top webtools by user count
    const webtoolUsage = new Map<number, number>();
    this.webtools.forEach(webtool => {
      const count = this.rawData.filter(r => r.webtoolId === webtool.id).length;
      webtoolUsage.set(webtool.id, count);
    });
    
    this.metrics.topWebtools = Array.from(webtoolUsage.entries())
      .map(([id, count]) => ({
        id,
        name: this.webtools.find(w => w.id === id)?.webtool || `Webtool ${id}`,
        count
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
  }
  
  get peakHourNumber(): number {
    if (!this.loginMetrics.loginsByHour?.length) return 0;
    return this.loginMetrics.loginsByHour.reduce((prev: {hour: number, count: number}, current: {hour: number, count: number}) => 
      (prev.count > current.count) ? prev : current, 
      {hour: 0, count: 0}
    ).hour;
}
  getPeakHour(): string {
    if (!this.loginMetrics.loginsByHour?.length) return 'N/A';
    
    const peak = this.loginMetrics.loginsByHour.reduce(
      (prev: {hour: number, count: number}, current: {hour: number, count: number}) => 
        (prev.count > current.count) ? prev : current, 
      { hour: 0, count: 0 }
    );
    return `${peak.hour}:00`;
  }
  filterByWebtool() {
    if (this.selectedWebtool === 'all') {
      this.filteredWebtoolUsageChart = {
        ...this.webtoolUsageChart,
        series: [{
          name: 'Users',
          data: this.metrics.topWebtools.map(w => w.count)
        }]
      };
      
      this.filteredDepartmentDistributionChart = {
        ...this.departmentDistributionChart,
        series: Object.values(this.metrics.usersByDepartment),
        labels: Object.keys(this.metrics.usersByDepartment)
      };
      
      this.filteredDepartmentUsageChart = {
        ...this.departmentUsageChart,
        series: this.metrics.departmentWebtoolUsage.map(dept => ({
          name: dept.department,
          data: dept.webtools.map(w => w.count)
        }))
      };
      
      this.filteredTopUsersChart = {
        ...this.topUsersChart,
        series: [{
          name: 'Webtools',
          data: this.metrics.topUsers.map(u => u.count)
        }]
      };
      
      this.filteredUserWebtoolMatrix = {
        ...this.userWebtoolMatrix,
        series: this.webtools.map(webtool => ({
          name: webtool.webtool,
          data: this.users.map(user => ({
            x: user.name,
            y: user.webtools.has(webtool.id) ? 1 : 0
          }))
        })),  
        chart: {
          ...this.userWebtoolMatrix.chart,
          height: Math.max(230, this.users.length * 20)
        }
      };
    } else {
      const webtoolId = Number(this.selectedWebtool);
      const webtoolName = this.webtools.find(w => w.id === webtoolId)?.webtool || '';
      const usersWithAccess = this.users.filter(u => u.webtools.has(webtoolId));
      console.log('Selected webtool name:', webtoolName);

      this.filteredWebtoolUsageChart = {
        ...this.webtoolUsageChart,
        series: [{
          name: 'Users',
          data: [usersWithAccess.length]
        }],
        xaxis: {
          ...this.webtoolUsageChart.xaxis,
          categories: [webtoolName]
        }
      };
      
      const deptCounts = usersWithAccess.reduce((acc, user) => {
        const dept = user.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
      
      this.filteredDepartmentDistributionChart = {
        ...this.departmentDistributionChart,
        series: Object.values(deptCounts),
        labels: Object.keys(deptCounts),
        colors: this.generateColorPalette(Object.keys(deptCounts).length)
      };
      
      this.filteredUserWebtoolMatrix = {
        ...this.userWebtoolMatrix,
        series: [{
          name: webtoolName,
          data: this.users.map(user => ({
            x: user.name,
            y: user.webtools.has(webtoolId) ? 1 : 0
          }))
        }],
        yaxis: {
          categories: [webtoolName],
          labels: {
            style: {
              fontSize: '15px'
            }
          }
        },
        chart: {
          ...this.userWebtoolMatrix.chart,
          height: Math.max(180, this.users.length * 20)
        }
      };
  
      const selectedWebtoolData = this.metrics.departmentWebtoolUsage
        .map(dept => ({
          department: dept.department,
          count: dept.webtools.find(w => w.name === webtoolName)?.count || 0
        }))
        .filter(dept => dept.count > 0)
        .sort((a, b) => b.count - a.count);
      
      this.filteredDepartmentUsageChart = {
        ...this.departmentUsageChart,
        series: [{
          name: webtoolName,
          data: selectedWebtoolData.map(d => d.count)
        }],
        xaxis: {
          ...this.departmentUsageChart.xaxis,
          categories: selectedWebtoolData.map(d => d.department)
        },
        colors: this.generateColorPalette(selectedWebtoolData.length)
      };
      
      const topUsers = usersWithAccess
        .map(user => ({
          name: user.name,
          email: user.email,
          count: 1 
        }))
        .slice(0, 5);
      
      this.filteredTopUsersChart = {
        ...this.topUsersChart,
        series: [{
          name: 'Access Count',
          data: topUsers.map(u => u.count)
        }],
        xaxis: {
          ...this.topUsersChart.xaxis,
          categories: topUsers.map(u => u.name)
        }
      };
    }
  
    const webtoolFilter = this.selectedWebtool === 'all' ? undefined : 
    this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
  console.log('Loading login metrics with webtool filter:', webtoolFilter);
  
  this.loadLoginMetrics(webtoolFilter);
  }

  private generateColorPalette(count: number): string[] {
    const baseColors = ['#0077B6', '#556FB5', '#3B82F6', '#1D4ED8', '#1E40AF'];
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }
    return [...baseColors, ...Array(count - baseColors.length).fill('#0077B6')];
  }

  private initCharts() {
    const baseHeight = this.screenWidth < 768 ? 180 : 220;
    
    this.webtoolUsageChart = {
      series: [{
        name: 'Users',
        data: this.metrics.topWebtools.map(w => w.count)
      }],
      chart: {
        type: 'bar',
        height: baseHeight,
        toolbar: {
          show: false
        },
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
        labels: {
          style: {
            fontSize: '10px'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '10px'
          }
        }
      },
      colors: ['#3B82F6'],
      grid: {
        padding: {
          left: 5,
          right: 5
        }
      }
    };

    this.departmentDistributionChart = {
      series: Object.values(this.metrics.usersByDepartment),
      chart: {
        type: 'pie',
        height: baseHeight,
        fontFamily: 'inherit'
      },
      labels: Object.keys(this.metrics.usersByDepartment),
      legend: {
        position: 'bottom',
        fontSize: '10px',
        itemMargin: {
          horizontal: 5,
          vertical: 0
        }
      },
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      dataLabels: {
        enabled: false
      }
    };

    const matrixHeight = Math.min(baseHeight * 0.4, Math.max(80, this.users.length * 6)); // Reduced by ~60%
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
      style: {
        fontSize: '9px', // Reduced from 8px (25% smaller)
        cssClass: 'apexcharts-xaxis-label-small' // Added custom class
      },
      trim: true, // Added to prevent label overflow
      hideOverlappingLabels: true // Added to improve readability
    } 
  },
  yaxis: { 
    categories: this.webtools.map(w => w.webtool),
    labels: {
      style: {
        fontSize: '6px', // Reduced from 8px
        cssClass: 'apexcharts-yaxis-label-small'
      },
      trim: true
    }
  },
  tooltip: {
    custom: ({ seriesIndex, dataPointIndex }: any) => {
      const user = this.users[dataPointIndex];
      const webtool = this.webtools[seriesIndex];
      const access = user.webtools.has(webtool.id) ? 'Has access' : 'No access';
      return `
        <div class="p-1 text-2xs"> <!-- Changed to smaller text -->
          <div><strong>User:</strong> ${user.name}</div>
          <div><strong>Webtool:</strong> ${webtool.webtool}</div>
          <div><strong>Access:</strong> ${access}</div>
        </div>
      `;
    }
  }
};

    this.departmentUsageChart = {
      series: this.metrics.departmentWebtoolUsage.map(dept => ({
        name: dept.department,
        data: dept.webtools.map(w => w.count)
      })),
      chart: {
        type: 'bar',
        height: baseHeight,
        stacked: true,
        toolbar: {
          show: false
        },
        fontFamily: 'inherit'
      },
      xaxis: {
        categories: this.webtools.map(w => w.webtool),
        labels: {
          style: {
            fontSize: '10px'
          },
          rotate: -45
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '10px'
          }
        }
      },
      legend: {
        position: 'bottom',
        fontSize: '10px',
        itemMargin: {
          horizontal: 5,
          vertical: 0
        }
      },
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      grid: {
        padding: {
          left: 5,
          right: 5
        }
      }
    };

    this.topUsersChart = {
      series: [{
        name: 'Webtools',
        data: this.metrics.topUsers.map(u => u.count)
      }],
      chart: {
        type: 'bar',
        height: baseHeight,
        toolbar: {
          show: false
        },
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
        labels: {
          style: {
            fontSize: '10px'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '10px'
          }
        }
      },
      colors: ['#8B5CF6'],
      grid: {
        padding: {
          left: 5,
          right: 5
        }
      },
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

    // Update filtered charts
    this.filteredWebtoolUsageChart = { ...this.webtoolUsageChart };
    this.filteredDepartmentDistributionChart = { ...this.departmentDistributionChart };
    this.filteredUserWebtoolMatrix = { ...this.userWebtoolMatrix };
    this.filteredDepartmentUsageChart = { ...this.departmentUsageChart };
    this.filteredTopUsersChart = { ...this.topUsersChart };
  }

  private initEmptyCharts() {
    const emptySeries = [{ data: [] }];
    const emptyLabels: string[] = [];
    
    this.webtoolUsageChart = {
      series: emptySeries,
      chart: { type: 'bar', height: 350 }
    };
    
    this.roleDistributionChart = {
      series: [],
      chart: { type: 'donut', height: 350 },
      labels: emptyLabels
    };
    
    this.departmentDistributionChart = {
      series: [],
      chart: { type: 'pie', height: 350 },
      labels: emptyLabels
    };
    
    this.userWebtoolMatrix = {
      series: [],
      chart: { type: 'heatmap', height: 59 }
    };
  }
}