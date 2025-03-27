import { Component, OnInit } from '@angular/core';
import { WebtoolService } from '../Services/webtool.service';
import { UserWebtoolService } from '../Services/user-webtool.service';
import { RolesService } from '../Services/roles.service';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';
import { Role, UserWebtool, Webtool, WebtoolUser } from '../../../interfaces/webtool.interfaces';


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
}


interface ExtendedDashboardMetrics extends DashboardMetrics {
  userActivityOverTime: { date: string; count: number }[];
  rolesPerWebtool: MetricItem[];
  privilegesDistribution: MetricItem[];
  departmentWebtoolUsage: {
    department: string;
    webtools: { name: string; count: number }[];
  }[];
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

  userActivityChart: any;
  rolesPerWebtoolChart: any;
  privilegesChart: any;
  departmentUsageChart: any;
  enhancedAccessMatrix: any;
  topUsersChart: any;

  
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

  
  chartsInitialized = false;
  webtoolUsageChart: any = null;
  roleDistributionChart: any = null;
  departmentDistributionChart: any = null;
  userWebtoolMatrix: any = null;

  constructor(
    private webtoolService: WebtoolService,
    private userWebtoolService: UserWebtoolService,
    private rolesService: RolesService
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const [webtools, userWebtools, roles] = await Promise.all([
        this.webtoolService.getWebtools().toPromise(),
        this.userWebtoolService.getConsolidatedUserData().toPromise(),
        this.rolesService.getRoles().toPromise()
      ]);

      this.webtools = webtools || [];
      this.roles = roles || [];
      this.users = this.processUsers(userWebtools || []);
      
      this.calculateMetrics();
      this.initCharts();
      this.chartsInitialized = true;
      
    } catch (error) {
      console.error('Error loading data:', error);
      this.initEmptyCharts();
      this.chartsInitialized = true;
    }
  }


  private processUsers(userWebtools: WebtoolUser[]): ProcessedUser[] {
    const userMap = new Map<string, ProcessedUser>();
    
    userWebtools.forEach(user => {
      if (!userMap.has(user.email)) {
        userMap.set(user.email, {
          email: user.email,
          name: user.userName,
          department: user.department,
          webtools: new Set<number>(),
          roles: new Set<number>()
        });
      }
      
      const processedUser = userMap.get(user.email)!;
      
      // Process webtools (matching names to IDs)
      user.webtools?.forEach(webtoolName => {
        const matchingWebtool = this.webtools.find(w => w.webtool === webtoolName);
        if (matchingWebtool) {
          processedUser.webtools.add(matchingWebtool.id);
        }
      });
      
      // Process roles from all webtools
      Object.values(user.roles || {}).forEach(roleArray => {
        roleArray.forEach(role => {
          processedUser.roles.add(role.id);
        });
      });
    });
    
    return Array.from(userMap.values());
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
    this.users.forEach(user => {
      user.webtools.forEach(webtoolId => {
        webtoolUsage.set(webtoolId, (webtoolUsage.get(webtoolId) || 0) + 1);
      });
    });
    
    this.metrics.topWebtools = Array.from(webtoolUsage.entries())
      .map(([id, count]) => ({
        id,
        name: this.webtools.find(w => w.id === id)?.webtool || `Webtool ${id}`,
        count
      }))
      .sort((a, b) => b.count - a.count);

  // Roles per Webtool (fixed)
  this.metrics.rolesPerWebtool = this.webtools.map(webtool => {
    // Count unique roles across all users for this webtool
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
      // 4. Department vs Webtool Usage
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
          // Top Users by Webtool count
  this.metrics.topUsers = this.users
  .map(user => ({
    name: user.name,
    email: user.email,
    count: user.webtools.size
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5); // Get top 5

  }

  private initCharts() {
    // Webtool Usage Chart
    this.webtoolUsageChart = {
      series: [{
        name: 'Users',
        data: this.metrics.topWebtools.map(w => w.count)
      }],
      chart: {
        type: 'bar',
        height: 350
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: true,
        }
      },
      xaxis: {
        categories: this.metrics.topWebtools.map(w => w.name),
        title: { text: 'Number of Users' }
      },
      colors: ['#3B82F6']
    };

    // Role Distribution Chart
    this.roleDistributionChart = {
      series: this.metrics.roleDistribution.map(r => r.count),
      chart: {
        type: 'donut',
        height: 350
      },
      labels: this.metrics.roleDistribution.map(r => r.name),
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    };

    // Department Distribution Chart
    const departments = Object.keys(this.metrics.usersByDepartment);
    this.departmentDistributionChart = {
      series: departments.map(dept => this.metrics.usersByDepartment[dept]),
      chart: {
        type: 'pie',
        height: 350
      },
      labels: departments,
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    };

    // User-Webtool Matrix
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
        height: Math.max(400, this.users.length * 20),
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      colors: ["#E5E7EB", "#3B82F6"],
      xaxis: { type: 'category', labels: { show: false } },
      yaxis: { categories: this.webtools.map(w => w.webtool) },
      tooltip: {
        custom: ({ seriesIndex, dataPointIndex }: any) => {
          const user = this.users[dataPointIndex];
          const webtool = this.webtools[seriesIndex];
          const access = user.webtools.has(webtool.id) ? 'Has access' : 'No access';
          return `
            <div class="p-2">
              <div><strong>User:</strong> ${user.name}</div>
              <div><strong>Webtool:</strong> ${webtool.webtool}</div>
              <div><strong>Access:</strong> ${access}</div>
            </div>
          `;
        }
      }
    };

    this.rolesPerWebtoolChart = {
      series: [{
        name: 'Roles',
        data: this.metrics.rolesPerWebtool.map(w => w.count)
      }],
      chart: {
        type: 'bar',
        height: 350
      },
      xaxis: {
        categories: this.metrics.rolesPerWebtool.map(w => w.name)
      },
      colors: ['#10B981']
    };


    // 4. Department vs Webtool Usage
    this.departmentUsageChart = {
      series: this.metrics.departmentWebtoolUsage.map(dept => ({
        name: dept.department,
        data: dept.webtools.map(w => w.count)
      })),
      chart: {
        type: 'bar',
        height: 350,
        stacked: true
      },
      xaxis: {
        categories: this.webtools.map(w => w.webtool)
      },
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    };

   
  // Top Users Chart
  this.topUsersChart = {
    series: [{
      name: 'Webtools',
      data: this.metrics.topUsers.map(u => u.count)
    }],
    chart: {
      type: 'bar',
      height: 350
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
      }
    },
    xaxis: {
      categories: this.metrics.topUsers.map(u => u.name),
      title: { text: 'Number of Webtools' }
    },
    colors: ['#8B5CF6'],
    tooltip: {
      custom: ({ dataPointIndex }: any) => {
        const user = this.metrics.topUsers[dataPointIndex];
        return `
          <div class="p-2">
            <div><strong>User:</strong> ${user.name}</div>
            <div><strong>Email:</strong> ${user.email}</div>
            <div><strong>Webtools:</strong> ${user.count}</div>
          </div>
        `;
      }
    }
  };
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
      chart: { type: 'heatmap', height: 400 }
    };
  }
}