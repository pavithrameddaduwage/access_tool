import { Component, HostListener, OnInit } from '@angular/core';
import { WebtoolService } from '../Services/webtool.service';
import { UserWebtoolService } from '../Services/user-webtool.service';
import { RolesService } from '../Services/roles.service';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';
import { Role, UserWebtool, Webtool } from '../../../interfaces/webtool.interfaces';
import { forkJoin, map, Subject } from 'rxjs';
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


     filteredWebtoolUsageChart: any = null;
     filteredDepartmentDistributionChart: any = null;
     filteredUserWebtoolMatrix: any = null;
     filteredDepartmentUsageChart: any = null;
     filteredTopUsersChart: any = null;
   
 
     // Login Analytics Variables
 
     loginMetrics: any = {
       totalLogins: 0,
       activeUsers: 0,
       dailyLogins: [],
       loginsByHour: [],
       loginsByDay: []
     };
     
     public filteredUserLoginData: any[] = [];
     userKPIs: any;
     public peakHour: string = 'N/A';
     public userLoginData: any[] = [];
     public departmentLoginStats: any[] = [];
     public departmentHourlyLogins: any[] = [];
     public departmentDailyLogins: any[] = [];
 
   
     // UI State
 
     public loadingDepartmentStats = false;
     public chartsNeedRedraw = false;
     chartsInitialized = false;
     public userDetailsLoading = false;
     public userWebtoolsData: any[] = [];
     public userLoginStats: any = null;
     loadingLoginMetrics = false;
     screenWidth: number;
 
   
     // Utility
 
     Math = Math;
     private log = {
       debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
       error: (...args: any[]) => console.error('[ERROR]', ...args)
     };
 
   
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
  console.log('Initializing login charts with time range:', this.selectedTimeRange);
  
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

  // Ensure we have at least empty arrays for each chart type
  const safeDailyData = Array.isArray(dailyData) ? dailyData : [];
  const safeHourlyData = Array.isArray(hourlyData) ? hourlyData : [];
  const safeDayOfWeekData = Array.isArray(dayOfWeekData) ? dayOfWeekData : [];

  console.log('Processed chart data:', {
    dailyData: safeDailyData,
    hourlyData: safeHourlyData,
    dayOfWeekData: safeDayOfWeekData
  });

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
        data: safeDayOfWeekData.map((day: any) => day.count || 0)
      }],
      chart: { 
        type: 'bar', 
        height: 220, 
        toolbar: { show: false } 
      },
      xaxis: {
        categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
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

      getDepartmentCharts() {
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

private updateFilteredCharts(): void {
  // Update Webtool Usage Chart
  if (this.selectedWebtool !== 'all') {
    const selected = this.webtools.find(w => w.id === Number(this.selectedWebtool));
    
    // Add null check
    if (!selected) {
      console.warn('Selected webtool not found');
      return;
    }
    
    this.filteredWebtoolUsageChart = {
      ...this.webtoolUsageChart,
      series: [{
        name: 'Users',
        data: [this.rawData.filter(r => r.webtoolId === selected.id).length]
      }],
      xaxis: {
        ...this.webtoolUsageChart.xaxis,
        categories: [selected.webtool]
      }
    };
  } else {
    this.filteredWebtoolUsageChart = { ...this.webtoolUsageChart };
  }

  // Update Department Distribution Chart
  if (this.selectedWebtool !== 'all') {
    const selectedId = Number(this.selectedWebtool);
    const departmentCounts = this.rawData
      .filter(r => r.webtoolId === selectedId)
      .reduce((acc, curr) => {
        acc[curr.department] = (acc[curr.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const departments = Object.keys(departmentCounts);
    const counts = departments.map(d => departmentCounts[d]);

    this.filteredDepartmentDistributionChart = {
      ...this.departmentDistributionChart,
      series: counts,
      labels: departments,
      chart: {
        ...this.departmentDistributionChart.chart,
        type: 'pie'
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${Math.round(val)}%`
      }
    };
  } else {
    this.filteredDepartmentDistributionChart = { ...this.departmentDistributionChart };
  }

  this.cdr.detectChanges();
}
async filterByWebtool(): Promise<void> {
  try {
    const webtoolFilter = this.selectedWebtool === 'all' 
      ? undefined 
      : this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
    
    if (this.selectedUser === 'All') {
      await this.loadLoginMetrics(webtoolFilter);
      await this.loadDepartmentStats();
      
      // Update the charts based on the webtool filter
      this.updateFilteredCharts();
    } else if (this.selectedUser) {
      this.onUserFilterChange({ target: { value: this.selectedUser } } as unknown as Event);
      await this.loadDepartmentStats();
          this.departmentChartOptions = this.getDepartmentCharts();

    }
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
//     const userStats = await firstValueFrom(
//       this.loginAnalyticsService.getUserStats(email, webtoolFilter, this.selectedTimeRange)
//     );
    
//     this.userKPIs = {
//       name: userStats.username,
//       email: email,
//       department: userStats.department,
//       lastLogin: userStats.lastLogin,
//       mostUsedWebtool: userStats.mostUsedWebtool,
//       totalLogins: userStats.totalLogins,
//       webtoolUsage: userStats.webtoolUsage,
//       peakHour: userStats.peakHour,
//       dailyLogins: userStats.dailyLogins,
//       loginsByHour: userStats.loginsByHour,
//       loginsByDay: userStats.loginsByDay
//     };
//   } catch (error) {
//     console.error('Error loading user data:', error);
//     this.userKPIs = null;
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
      )
    ]);
    
    this.filteredTotalLogins = userStats.totalLogins;
    
    this.userKPIs = {
      name: userStats.username,
      email: email,
      department: userStats.department,
      lastLogin: userStats.lastLogin,
      mostUsedWebtool: userStats.mostUsedWebtool,
      totalLogins: userStats.totalLogins,
      webtoolUsage: userStats.webtoolUsage,
      peakHour: userStats.peakHour,
      dailyLogins: userStats.dailyLogins,
      loginsByHour: userStats.loginsByHour,
      loginsByDay: userStats.loginsByDay
    };
    
    this.userWebtoolStats = webtoolStats;
  } catch (error) {
    console.error('Error loading user data:', error);
    this.userKPIs = null;
    this.userWebtoolStats = [];
    this.filteredTotalLogins = 0;
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

// async onTimeRangeChange() {
//   console.log('Time range changed to:', this.selectedTimeRange);
  
//   const webtoolFilter = this.selectedWebtool === 'all' ? undefined : 
//     this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
  
//   console.log('Reloading all data with time range:', this.selectedTimeRange);
  
//   // Show loading states
//   this.loadingLoginMetrics = true;
//   this.loadingDepartmentStats = true;
  
//   try {
//     // Reload ALL time-dependent data
//     await Promise.all([
//       this.loadLoginMetrics(webtoolFilter, this.selectedUser || undefined),
//       this.loadDepartmentStats(),
//       this.loadUserLoginData(), // This was missing!
//       this.selectedUser ? this.loadUserDetails() : Promise.resolve() // Reload user details if selected
//     ]);
    
//     // Regenerate charts after data is loaded
//     this.chartOptions = this.initLoginCharts();
//     this.departmentChartOptions = this.getDepartmentCharts();
    
//     // Trigger change detection
//     this.cdr.detectChanges();
    
//   } catch (error) {
//     console.error('Error reloading data for time range change:', error);
//   } finally {
//     this.loadingLoginMetrics = false;
//     this.loadingDepartmentStats = false;
//   }
// }
async onTimeRangeChange() {
  console.log('Time range changed to:', this.selectedTimeRange);
  
  const webtoolFilter = this.selectedWebtool === 'all' ? undefined : 
    this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
  
  console.log('Reloading all data with time range:', this.selectedTimeRange);
  
  // Show loading states
  this.loadingLoginMetrics = true;
  this.loadingDepartmentStats = true;
  
  try {
    const promises = [
      this.loadLoginMetrics(webtoolFilter, this.selectedUser || undefined),
      this.loadDepartmentStats(),
      this.loadUserLoginData()
    ];
    
    if (this.selectedUser && this.selectedUser !== 'All') {
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
    const webtoolFilter = this.selectedWebtool === 'all' ? undefined : 
      this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;
    
    const emailFilter = this.selectedUser === 'All' ? undefined : this.selectedUser;
       console.log('Actual filters being sent:', {
      days: this.selectedTimeRange,
      webtool: webtoolFilter,
      email: emailFilter
    });

    const [stats, hourly, daily] = await Promise.all([
      firstValueFrom(this.loginAnalyticsService.getDepartmentLoginStats(this.selectedTimeRange, webtoolFilter, emailFilter)),
      firstValueFrom(this.loginAnalyticsService.getDepartmentHourlyLogins(this.selectedTimeRange, webtoolFilter, emailFilter)),
      firstValueFrom(this.loginAnalyticsService.getDepartmentDailyLogins(this.selectedTimeRange, webtoolFilter, emailFilter))
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

async loadUserLoginData() {
  try {
    const webtoolFilter = this.selectedWebtool === 'all' 
      ? undefined 
      : this.webtools.find(w => w.id === Number(this.selectedWebtool))?.webtool;

    // Add time filtering to login events
    const [loginEvents, userWebtools] = await Promise.all([
      firstValueFrom(
        this.loginAnalyticsService.getLoginEvents()
      ).then(events => {
        // Filter by time range (selectedTimeRange days)
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
          // Include all webtools for this user if needed
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
      
      // Log success
      this.log.debug(`Loaded ${this.userLoginData.length} users with login data`, {
        webtoolFilter,
        totalLogins: loginEvents.length
      });
      
    } catch (error) {
      this.log.error('Error loading user login data:', error);
      this.userLoginData = [];
      this.filteredUserLoginData = [];
      
      // Optionally show a user-friendly error message
      // this.notificationService.showError('Failed to load user login data');
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
    getPeakHour(): string {
      if (!this.loginMetrics.loginsByHour?.length) return 'N/A';
      
      const peak = this.loginMetrics.loginsByHour.reduce(
        (prev: {hour: number, count: number}, current: {hour: number, count: number}) => 
          (prev.count > current.count) ? prev : current, 
        { hour: 0, count: 0 }
      );
      return `${peak.hour}:00`;
    }

    get paginatedUserData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUserLoginData.slice(startIndex, startIndex + this.itemsPerPage);
  }

    getUserListForFilter(): User[] {
      return this.userLoginData
        .filter(user => user.loginCount > 0)
        .map(user => ({
          email: user.email.toLowerCase(),
          username: user.username,  // Changed from 'name' to 'username'
          department: user.department,
          lastLogin: user.lastLogin,
          mostUsedWebtool: user.mostUsedWebtool,
          loginCount: user.loginCount
        }));
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