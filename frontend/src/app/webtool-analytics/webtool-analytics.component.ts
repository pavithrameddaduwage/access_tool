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
  username: string;  // Changed from 'name' to 'username' to match your data structure
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
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 }
  ];
  selectedTimeRange = 30; 

  public departmentLoginStats: any[] = [];
public departmentHourlyLogins: any[] = [];
public departmentDailyLogins: any[] = [];
public loadingDepartmentStats = false;

public selectedUser: string | null = null;
public selectedUserData: User | null = null;

public userKPIs: {
  name: string;
  department: string;
  webtools: any[];
  loginStats: any;
} | null = null;

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

  public activeView: 'webtool' | 'user' = 'webtool';
public userLoginData: any[] = [];
public currentPage = 1;
public itemsPerPage = 5;

public userDetailsLoading = false;
public userWebtoolsData: any[] = [];
public userLoginStats: any = null;



  userStatusData: { active: number, inactive: number } = { active: 0, inactive: 0 };
  screenWidth: number;

  loginMetrics: any = {
    totalLogins: 0,
    activeUsers: 0,
    dailyLogins: [],
    loginsByHour: [],
    loginsByDay: []
  };
  
  public searchQuery: string = '';
public filteredUserLoginData: any[] = [];


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

async onSelectUser(user: User) {
  if (this.selectedUser === user.email) {
    this.selectedUser = null;
    this.selectedUserData = null;
  } else {
    this.selectedUser = user.email;
    this.selectedUserData = user;
    await this.loadUserDetails();
  }
}



async loadDepartmentStats() {
  console.log('Loading department stats for time range:', this.selectedTimeRange);
  
  this.loadingDepartmentStats = true;
  try {
    const webtoolFilter = this.selectedWebtool === 'all' ? undefined : 
      this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
    
    const [stats, hourly, daily] = await Promise.all([
      firstValueFrom(this.loginAnalyticsService.getDepartmentLoginStats(this.selectedTimeRange, webtoolFilter)),
      firstValueFrom(this.loginAnalyticsService.getDepartmentHourlyLogins(this.selectedTimeRange, webtoolFilter)),
      firstValueFrom(this.loginAnalyticsService.getDepartmentDailyLogins(this.selectedTimeRange, webtoolFilter))
    ]);

    console.log('Received department stats:', { stats, hourly, daily });

    this.departmentLoginStats = stats;
    this.departmentHourlyLogins = hourly;
    this.departmentDailyLogins = daily;
  } catch (error) {
    console.error('Error loading department stats:', error);
  } finally {
    this.loadingDepartmentStats = false;
  }
}

getDepartmentCharts() {
  console.log('Generating department charts for time range:', this.selectedTimeRange);
  
  // Department Login Distribution (Pie Chart)
  const departmentDistribution = {
    series: this.departmentLoginStats.map(d => d.logins),
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
      enabled: false
    }
  };

  // Department Hourly Logins (Heatmap)
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

  // Department Daily Logins (Line Chart)
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


async loadUserDetails() {
  if (!this.selectedUser) return;

  this.userDetailsLoading = true;
  
  try {
    const [webtools, loginStats] = await Promise.all([
      firstValueFrom(this.userWebtoolService.getUserWebtoolsByUser(this.selectedUser)),
      firstValueFrom(this.loginAnalyticsService.getUserStats(this.selectedUser))
    ]);

    this.userWebtoolsData = webtools;
    this.userLoginStats = loginStats;
    
  } catch (error) {
    console.error('Error loading user details:', error);
  } finally {
    this.userDetailsLoading = false;
  }
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

async loadUserLoginData() {
  try {
    // Get all login events and user webtools in parallel
    const [loginEvents, userWebtools] = await Promise.all([
      firstValueFrom(this.loginAnalyticsService.getLoginEvents()),
      firstValueFrom(this.userWebtoolService.getAllActiveUserWebtools())
    ]);

    // Create a map of email to user info (take the first record for each email)
    // Normalize emails to lowercase to avoid case sensitivity issues
    const userMap = new Map<string, {username: string, department: string}>();
    userWebtools.forEach(user => {
      const normalizedEmail = user.email.toLowerCase().trim();
      if (!userMap.has(normalizedEmail)) {
        userMap.set(normalizedEmail, {
          username: user.userName || user.email.split('@')[0], // Fallback to email prefix if no username
          department: user.department || 'Unknown'
        });
      }
    });

    // Create maps to count logins per user and track most recent login
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

    // Process all users from userWebtools (including those with 0 logins)
    const allUsers = Array.from(userMap.entries()).map(([email, userInfo]) => {
      const loginCount = loginCountMap.get(email) || 0;
      const lastLogin = lastLoginMap.get(email);
      
      // Find most used webtool
      let mostUsedWebtool = 'N/A';
      if (webtoolUsageMap.has(email)) {
        const webtools = webtoolUsageMap.get(email)!;
        mostUsedWebtool = Object.entries(webtools)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
      }

      return {
        username: userInfo.username,
        email: email, // This will be the normalized lowercase email
        department: userInfo.department,
        lastLogin: lastLogin,
        mostUsedWebtool: mostUsedWebtool,
        loginCount: loginCount
      };
    });

    // Sort by login count descending, then by last login date
    this.userLoginData = allUsers.sort((a, b) => {
      if (b.loginCount !== a.loginCount) {
        return b.loginCount - a.loginCount;
      }
      const aTime = a.lastLogin?.getTime() || 0;
      const bTime = b.lastLogin?.getTime() || 0;
      return bTime - aTime;
    });

    // Initialize filtered data
    this.filteredUserLoginData = [...this.userLoginData];
    
    console.log('Processed user login data:', this.userLoginData);
    
  } catch (error) {
    console.error('Error loading user login data:', error);
    this.userLoginData = [];
    this.filteredUserLoginData = [];
  }
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

// Update paginatedUserData getter to use filtered data
get paginatedUserData() {
  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  return this.filteredUserLoginData.slice(startIndex, startIndex + this.itemsPerPage);
}

async loadLoginMetrics(webtool?: string, userEmail?: string): Promise<void> {
  console.log('Loading login metrics with params:', { 
    days: this.selectedTimeRange, 
    webtool, 
    userEmail 
  });
  
  this.loadingLoginMetrics = true;
  
  try {
    let params: any = { days: this.selectedTimeRange.toString() }; // Convert to string
    if (webtool) params.webtool = webtool;
    if (userEmail) params.email = userEmail;
    
    const [summary, dailyLogins, loginsByHour, loginsByDay, departmentStats] = await Promise.all([
      firstValueFrom(this.loginAnalyticsService.getSummary(params.days, params.webtool, params.email)),
      firstValueFrom(this.loginAnalyticsService.getDailyLogins(params.days, params.webtool, params.email)),
      firstValueFrom(this.loginAnalyticsService.getLoginsByHour(params.days, params.webtool, params.email)), // Add days here
      firstValueFrom(this.loginAnalyticsService.getLoginsByDayOfWeek(params.days, params.webtool, params.email)), // Add days here
      firstValueFrom(this.loginAnalyticsService.getDepartmentLoginStats(params.days, params.webtool))
    ]);

    console.log('Received data:', {
      summary,
      dailyLogins,
      loginsByHour,
      loginsByDay,
      departmentStats
    });

    this.loginMetrics = {
      ...summary,
      dailyLogins,
      loginsByHour,
      loginsByDay
    };

    this.departmentLoginStats = departmentStats;
    this.calculatePeakHour();
  } catch (error) {
    console.error('Error loading login metrics:', error);
  } finally {
    this.loadingLoginMetrics = false;
  }
}
onTimeRangeChange() {
  console.log('Time range changed to:', this.selectedTimeRange);
  
  const webtoolFilter = this.selectedWebtool === 'all' ? undefined : 
    this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
  
  console.log('Reloading data with webtool filter:', webtoolFilter);
  
  this.loadLoginMetrics(webtoolFilter, this.selectedUser || undefined);
  this.loadDepartmentStats();
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
    this.loadUserLoginData();
      this.loadDepartmentStats();


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

getUserListForFilter(): User[] {
  return this.userLoginData
    .filter(user => user.loginCount > 0)
    .map(user => ({
      email: user.email,
      username: user.username,  // Changed from 'name' to 'username'
      department: user.department,
      lastLogin: user.lastLogin,
      mostUsedWebtool: user.mostUsedWebtool,
      loginCount: user.loginCount
    }));
}


async onUserFilterChange(email: string | null) {
  this.selectedUser = email;
  
  if (email) {
    // Find the full user object
    const user = this.getUserListForFilter().find(u => u.email === email);
    
    if (user) {
      // Load user-specific data
      const [webtools, loginStats] = await Promise.all([
        firstValueFrom(this.userWebtoolService.getUserWebtoolsByUser(email)),
        firstValueFrom(this.loginAnalyticsService.getUserStats(email))
      ]);
      
      // Process webtool usage data
      const webtoolUsage = await this.getWebtoolUsageForUser(email);
      
      this.userKPIs = {
        name: user.username,
        department: user.department || 'Unknown',
        webtools: webtools,
        loginStats: {
          ...loginStats,
          webtoolUsage: webtoolUsage
        }
      };
      
      // Filter login metrics for this user
      this.loadLoginMetrics(
        this.selectedWebtool === 'all' ? undefined : 
          this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool, 
        email
      );
    }
  } else {
    this.userKPIs = null;
    this.loadLoginMetrics(
      this.selectedWebtool === 'all' ? undefined : 
        this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool
    );
  }
}

async getWebtoolUsageForUser(email: string): Promise<{ webtool: string; count: number }[]> {
  try {
    const loginEvents = await firstValueFrom(
      this.loginAnalyticsService.getLoginEvents()
    );
    
    // Filter events for this user
    const userEvents = loginEvents.filter(event => event.email === email);
    
    // Count webtool usage with proper typing
    const webtoolCounts = userEvents.reduce((acc: Record<string, number>, event) => {
      acc[event.webtool] = (acc[event.webtool] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Convert to array and sort by count descending
    return Object.entries(webtoolCounts)
      .map(([webtool, count]) => ({ webtool, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error getting webtool usage:', error);
    return [];
  }
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
      stroke: {
        width: 1.5,  // Makes the line thinner (default is usually 2-3)
        curve: 'straight'  // Optional: makes the line smooth
      },
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
      colors: ['#FFA500'],
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

  onViewChange(view: 'webtool' | 'user') {
    this.activeView = view;
    if (view === 'user') {
      this.loadUserLoginData();
    }
  }
  
  // get paginatedUserData() {
  //   const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  //   return this.userLoginData.slice(startIndex, startIndex + this.itemsPerPage);
  // }
  Math = Math;

  onPageChange(page: number) {
    this.currentPage = page;
  }


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
  console.log('Filtering by webtool:', this.selectedWebtool);
  
  const webtoolFilter = this.selectedWebtool === 'all' ? undefined : 
    this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
  
  console.log('Loading login metrics with webtool filter:', webtoolFilter);
  
  this.loadLoginMetrics(webtoolFilter, this.selectedUser || undefined);
  this.loadDepartmentStats();
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