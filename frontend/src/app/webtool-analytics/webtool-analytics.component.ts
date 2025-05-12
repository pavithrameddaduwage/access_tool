import { Component, OnInit } from '@angular/core';
import { WebtoolService } from '../Services/webtool.service';
import { UserWebtoolService } from '../Services/user-webtool.service';
import { RolesService } from '../Services/roles.service';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';
import { Role, UserWebtool, Webtool } from '../../../interfaces/webtool.interfaces';
import { forkJoin } from 'rxjs';
import { firstValueFrom } from 'rxjs';

import {EventEmitter, Input, Output } from '@angular/core';


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

  @Input() activeDashboard: 'powerbi' | 'webtool' = 'webtool';
  @Output() dashboardChange = new EventEmitter<'powerbi' | 'webtool'>();


  toggleDashboard(dashboard: 'powerbi' | 'webtool') {
    this.dashboardChange.emit(dashboard);
  }
  constructor(
    private webtoolService: WebtoolService,
    private userWebtoolService: UserWebtoolService,
    private rolesService: RolesService
  ) {}

  async ngOnInit() {
    await this.loadData();
    this.filterByWebtool();
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
          height: Math.max(400, this.users.length * 20)
        }
      };
    } else {
      const webtoolId = Number(this.selectedWebtool);
      const webtoolName = this.webtools.find(w => w.id === webtoolId)?.webtool || '';
      const usersWithAccess = this.users.filter(u => u.webtools.has(webtoolId));
      
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
              fontSize: '12px'
            }
          }
        },
        chart: {
          ...this.userWebtoolMatrix.chart,
          height: Math.max(400, this.users.length * 20)
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
  }

  private generateColorPalette(count: number): string[] {
    const baseColors = ['#0077B6', '#556FB5', '#3B82F6', '#1D4ED8', '#1E40AF'];
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }
    return [...baseColors, ...Array(count - baseColors.length).fill('#0077B6')];
  }

  private initCharts() {
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

    this.roleDistributionChart = {
      series: this.metrics.roleDistribution.map(r => r.count),
      chart: {
        type: 'donut',
        height: 350
      },
      labels: this.metrics.roleDistribution.map(r => r.name),
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    };

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

    this.userWebtoolMatrix = {
      series: this.webtools.map(webtool => ({
        name: webtool.webtool,
        data: this.users.map(user => ({ 
          x: user.name,
          y: user.webtools.has(webtool.id) ? 1 : 0
        }))
      })),  // Added closing parenthesis and bracket here
      chart: {
        type: 'heatmap',
        height: Math.max(400, this.users.length * 20), 
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      colors: ["#E5E7EB", "#0077B6"],
      xaxis: { 
        type: 'category', 
        labels: { 
          show: true,
          rotate: -45,
          style: {
            fontSize: '10px'
          }
        } 
      },
      yaxis: { 
        categories: this.webtools.map(w => w.webtool),
        labels: {
          style: {
            fontSize: '10px'
          }
        }
      },
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