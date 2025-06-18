import { Component, HostListener, OnInit } from '@angular/core';
import { WebtoolService } from '../Services/webtool.service';
import { UserWebtoolService } from '../Services/user-webtool.service';
import { RolesService } from '../Services/roles.service';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';
import { Role, UserWebtool, Webtool } from '../../../interfaces/webtool.interfaces';
import { forkJoin, map } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { LoginAnalyticsService } from '../Services/login-analytics.service';
import { ApexChart, ApexOptions } from 'ng-apexcharts';

import {EventEmitter, Input, Output } from '@angular/core';



//INTERFACES

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
  selector: 'app-w-analytics',
  imports: [ NgApexchartsModule, FormsModule, CommonModule ],
  templateUrl: './w-analytics.component.html',
  styleUrl: './w-analytics.component.css'
})
export class WAnalyticsComponent {

  // DATA Variables

    webtools: Webtool[] = [];
    users: ProcessedUser[] = [];
    roles: Role[] = [];
    rawData: UserWebtool[] = [];

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

    public isUserSelected = false;
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
    private loginAnalyticsService: LoginAnalyticsService
  ) {
    this.screenWidth = window.innerWidth;
  }

  //   async ngOnInit() {
  //   await this.loadData();
  //   this.loadLoginMetrics();
  //   this.filterByWebtool();
  //   this.loadUserLoginData();
  //   this.loadDepartmentStats();
  // }

  
  // async loadData() {
  //   try {
  //     const [webtools, userWebtools, roles] = await Promise.all([
  //       firstValueFrom(this.webtoolService.getWebtools()),
  //       firstValueFrom(this.userWebtoolService.getAllActiveUserWebtools()),
  //       firstValueFrom(this.rolesService.getRoles())
  //     ]);
  
 
  
  //     this.webtools = webtools || [];
  //     this.roles = roles || [];
  //     this.rawData = userWebtools || [];
  //     this.users = this.processUsers(this.rawData);
  
  //     this.calculateMetrics();
  //           this.chartsNeedRedraw = true;

  //     this.initCharts();
  //     this.chartsInitialized = true;
      
  //   } catch (error) {
  //     console.error('Error loading data:', error);
  //     this.initEmptyCharts();
  //     this.chartsInitialized = true;
  //   }
  // }
  



}
