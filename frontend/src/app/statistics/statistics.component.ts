import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../Services/dashboard.service';
import { HomeService } from '../Services/home.service';
import { WebtoolService } from '../Services/webtool.service';
import { WebtoolUserService } from '../Services/webtool-user.service';
import { UserWebtoolService } from '../Services/user-webtool.service';
import { GroupService } from '../Services/group.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexNonAxisChartSeries,
  ApexLegend,
  ApexResponsive,
  ApexPlotOptions,
  NgApexchartsModule,
  ApexTooltip,
  ApexYAxis,
  ApexTheme,
  ApexFill
} from "ng-apexcharts";


interface TypeValueData {
  name: string;
  data: number[];
}

interface TypeValueChartData {
  series: TypeValueData[];
  categories: string[];
}

export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  xaxis?: ApexXAxis;
  yaxis?: ApexYAxis | ApexYAxis[];
  dataLabels?: ApexDataLabels;
  grid?: ApexGrid;
  stroke?: ApexStroke;
  title?: ApexTitleSubtitle;
  plotOptions?: ApexPlotOptions;
  tooltip?: ApexTooltip;
  legend?: ApexLegend;
  colors?: string[];
  labels?: string[];
  responsive?: ApexResponsive[];
  theme?: ApexTheme;
  fill?: ApexFill;  // Add this

};

// Add these new interfaces
export interface UserAccessPattern {
  category: string;
  dashboardOnly: number;
  webtoolOnly: number;
  bothAccess: number;
}

export interface RoleAccessMetrics {
  role: string;
  averageTools: number;
  userCount: number;
}

export interface AccessTrend {
  timestamp: string;
  activeUsers: number;
  totalAccesses: number;
  uniqueTools: number;
}


@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {
  @ViewChild("valueTypeChart") valueTypeChart!: any;
  @ViewChild("workspaceChart") workspaceChart!: any;
  @ViewChild("groupDistributionChart") groupDistributionChart!: any;
  @ViewChild("departmentChart") departmentChart!: any;
  @ViewChild("typeValueComboChart") typeValueComboChart!: any;
  @ViewChild("multiWorkspaceChart") multiWorkspaceChart!: any;
  @ViewChild("deptAccessChart") deptAccessChart!: any;

  @ViewChild("userAccessPatternChart") userAccessPatternChart!: any;
@ViewChild("roleMetricsChart") roleMetricsChart!: any;
@ViewChild("accessTrendChart") accessTrendChart!: any;

  private records: any[] = []; 


  statistics = {
    totalDashboards: 0,
    totalUsers: 0,
    totalGroups: 0,
    totalWebtools: 0,
    averageUsersPerDashboard: 0,
    averageUsersPerWebtool: 0,
    mostUsedDashboard: { name: '', users: 0 },
    mostUsedWebtool: { name: '', users: 0 },
    mostActiveGroup: { name: '', dashboards: 0 },
    mostCommonRole: { name: '', count: 0 },
    summaryMetrics: {
      mostActiveTime: { start: '', end: '', count: 0 },
      crossToolUsage: 0,
      toolUtilization: 0
    }
  };

  public defaultConfig = {
    chart: {
      background: '#fff',
      animations: { enabled: false },
      toolbar: { show: false }
    },
    dataLabels: {
      enabled: true,
      style: { fontSize: '12px' }
    },
    xaxis: {
      labels: {
        trim: false,
        style: { fontSize: '12px' }
      }
    },
    yaxis: {
      labels: {
        style: { fontSize: '12px' }
      }
    },
    tooltip: {
      enabled: true,
      theme: 'light',
      style: { fontSize: '12px' }
    }
  };

  public valueTypeChartOptions: Partial<ChartOptions> = {
    ...this.defaultConfig,
    series: [] as number[],
    chart: {
      ...this.defaultConfig.chart,
      type: 'pie',
      height: 350
    },
    labels: [] as string[],
    colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    legend: {
      position: 'bottom',
      formatter: function(val: string, opts) {
        return val + " - " + opts.w.globals.series[opts.seriesIndex];
      }
    }
  };

  public workspaceChartOptions: Partial<ChartOptions> = {
    ...this.defaultConfig,
    series: [{
      name: "Dashboards",
      data: [] as number[]
    }] as ApexAxisChartSeries,
    chart: {
      ...this.defaultConfig.chart,
      type: "bar",
      height: 350
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '70%',
        distributed: true
      }
    },
    xaxis: {
      type: 'category',
      categories: [] as string[],
      labels: {
        rotate: -45,
        style: { fontSize: '12px' }
      }
    },
    colors: ['#10B981']
  };

  public groupChartOptions: Partial<ChartOptions> = {
    ...this.defaultConfig,
    series: [] as number[],
    chart: {
      ...this.defaultConfig.chart,
      type: "donut",
      height: 350
    },
    labels: [] as string[],
    colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    legend: {
      position: 'bottom',
      formatter: function(val: string, opts) {
        return val + " - " + opts.w.globals.series[opts.seriesIndex];
      }
    }
  };

  public departmentChartOptions: Partial<ChartOptions> = {
    ...this.defaultConfig,
    series: [{
      name: "Users",
      data: [] as number[]
    }] as ApexAxisChartSeries,
    chart: {
      ...this.defaultConfig.chart,
      type: "bar",
      height: 350
    },
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true
      }
    },
    xaxis: {
      type: 'category',
      categories: [] as string[],
      labels: {
        trim: false
      }
    },
    colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
  };

  public typeValueComboOptions: Partial<ChartOptions> = {
    ...this.defaultConfig,
    series: [] as ApexAxisChartSeries,
    chart: {
      ...this.defaultConfig.chart,
      type: "heatmap",
      height: 350,
      animations: {
        enabled: false
      }
    },
    xaxis: {
      type: 'category',
      categories: [] as string[],
      labels: {
        rotate: -45,
        trim: false
      }
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        distributed: true,
        enableShades: true
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px'
      }
    }
  };

  
  private updateTypeValueComboChart(data: TypeValueChartData) {
    // console.log('Type Value Data:', data);
  
    this.typeValueComboOptions = {
      ...this.defaultConfig,
      chart: {
        type: 'heatmap',
        height: 350,
        animations: { enabled: false }
      },
      series: data.series,
      xaxis: {
        type: 'category',
        categories: data.categories
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.5
        }
      }
    };
  }
  public multiWorkspaceChartOptions: Partial<ChartOptions> = {
    ...this.defaultConfig,
    series: [{
      name: "Dashboards",
      data: [] as number[]
    }] as ApexAxisChartSeries,
    chart: {
      ...this.defaultConfig.chart,
      type: "bar",
      height: 350
    },
    plotOptions: {
      bar: {
        distributed: true,
        borderRadius: 5
      }
    },
    xaxis: {
      type: 'category',
      categories: [] as string[]
    },
    colors: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA']
  };

  public deptAccessChartOptions: Partial<ChartOptions> = {
    ...this.defaultConfig,
    series: [{
      name: "Dashboards Accessed",
      data: [] as number[]
    }] as ApexAxisChartSeries,
    chart: {
      ...this.defaultConfig.chart,
      type: "radar",
      height: 350
    },
    xaxis: {
      type: 'category',
      categories: [] as string[]
    },
    plotOptions: {
      radar: {
        size: undefined,
        offsetX: 0,
        offsetY: 0
      }
    },
    stroke: {
      width: 2,
      show: true
    }
  };

  constructor(
    private dashboardService: DashboardService,
    private homeService: HomeService,
    private groupService: GroupService,
    private webtoolService: WebtoolService,
    private webtoolUserService: WebtoolUserService,
    private userWebtoolService: UserWebtoolService
  ) {}

  ngOnInit() {
    this.loadStatistics();
    this.loadWebtoolStatistics();
    
    // Process advanced analytics with dummy data
    this.processUserAccessPatterns([]);
    this.processRoleMetrics();
    this.processAccessTrends();
    
    // Add dummy summary metrics
    this.statistics.summaryMetrics = {
      mostActiveTime: {
        start: '10 AM',
        end: '2 PM',
        count: 450
      },
      crossToolUsage: 65,
      toolUtilization: 78
    };
  }

  private loadStatistics() {
    this.dashboardService.getDashboards().subscribe({
      next: (dashboards: any[]) => {
        if (!dashboards?.length) return;
        
        this.statistics.totalDashboards = dashboards.length;
        
        const workspaceData = this.processWorkspaceData(dashboards);
        const valueTypeData = this.processValueTypeData(dashboards);
        const groupData = this.processGroupData(dashboards);
        const typeValueData = this.processTypeValueCombinations(dashboards);
        const multiWorkspaceData = this.processMultiWorkspaceDashboards(dashboards);

        this.updateWorkspaceChart(workspaceData);
        this.updateValueTypeChart(valueTypeData);
        this.updateGroupChart(groupData);
        this.updateTypeValueComboChart(typeValueData);
        this.updateMultiWorkspaceChart(multiWorkspaceData);
      },
      error: (error) => console.error('Error loading dashboards:', error)
    });

    this.homeService.getRecords().subscribe({
      next: (records: any[]) => {
        if (!records?.length) return;
        
        this.statistics.totalUsers = records.length;
        
        const departmentData = this.processDepartmentData(records);
        const deptAccessData = this.processDepartmentAccess(records);
        
        this.updateDepartmentChart(departmentData);
        this.updateDepartmentAccessChart(deptAccessData);
        this.calculateAggregateMetrics(records);
      },
      error: (error) => console.error('Error loading records:', error)
    });

    this.groupService.getGroups().subscribe({
      next: (groups) => {
        if (!groups?.length) return;
        this.statistics.totalGroups = groups.length;
      },
      error: (error) => console.error('Error loading groups:', error)
    });
  }

  private processWorkspaceData(dashboards: any[]) {
    const map = new Map<string, number>();
    dashboards.forEach(dashboard => {
      dashboard.dashboardWorkspaces.forEach((ws: any) => {
        const name = String(ws.workspace.workspace);
        map.set(name, (map.get(name) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  private processValueTypeData(dashboards: any[]) {
    const map = new Map<string, number>();
    dashboards.forEach(dashboard => {
      dashboard.dashboardValuetypes.forEach((vt: any) => {
        const name = String(vt.valuetype.valuetype);
        map.set(name, (map.get(name) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  private processGroupData(dashboards: any[]) {
    const map = new Map<string, number>();
    dashboards.forEach(dashboard => {
      const name = dashboard.group ? String(dashboard.group.group) : 'No Group';
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  private processDepartmentData(records: any[]) {
    const map = new Map<string, number>();
    records.forEach(record => {
      const name = String(record.department);
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  private processTypeValueCombinations(dashboards: any[]) {
    if (!dashboards?.length) return { series: [], categories: [] };
  
    const map = new Map<string, Map<string, number>>();
    const valueTypes = new Set<string>();
    
    dashboards.forEach(dashboard => {
      dashboard.dashboardTypes.forEach((dt: any) => {
        const type = String(dt.type.type);
        if (!map.has(type)) {
          map.set(type, new Map<string, number>());
        }
        
        dashboard.dashboardValuetypes.forEach((vt: any) => {
          const valueType = String(vt.valuetype.valuetype);
          valueTypes.add(valueType);
          const typeMap = map.get(type)!;
          typeMap.set(valueType, (typeMap.get(valueType) || 0) + 1);
        });
      });
    });

    const valueTypeArray = Array.from(valueTypes);
    const result = {
      categories: valueTypeArray,
      series: Array.from(map.entries()).map(([type, values]) => ({
        name: type,
        data: valueTypeArray.map(vt => values.get(vt) || 0)
      }))
    };
    // console.log('Processed type-value data:', result);
    return result;
}

  private processMultiWorkspaceDashboards(dashboards: any[]) {
    const workspaceCount = new Map<number, number>();
    dashboards.forEach(dashboard => {
      const count = dashboard.dashboardWorkspaces.length;
      workspaceCount.set(count, (workspaceCount.get(count) || 0) + 1);
    });
  
    return Array.from(workspaceCount.entries())
      .map(([count, dashboardCount]) => ({
        workspaceCount: count,
        dashboards: dashboardCount,
        label: `${count} ${count === 1 ? 'Workspace' : 'Workspaces'}`
      }))
      .sort((a, b) => a.workspaceCount - b.workspaceCount);
  }
  
  private updateMultiWorkspaceChart(data: any[]) {
    if (!data?.length) return;
  
    this.multiWorkspaceChartOptions = {
      ...this.multiWorkspaceChartOptions,
      series: [{
        name: "Dashboards",
        data: data.map(item => Number(item.dashboards))
      }] as ApexAxisChartSeries,
      xaxis: {
        type: 'category',
        categories: data.map(item => String(item.label)),
        labels: {
          rotate: -45,
          formatter: (val: string) => String(val)
        }
      }
    };
  }
  private processDepartmentAccess(records: any[]) {
    const map = new Map<string, Set<string>>();
    
    records.forEach(record => {
      const dept = String(record.department);
      if (!map.has(dept)) {
        map.set(dept, new Set());
      }
      record.dashboards.forEach((dashboard: string) => {
        map.get(dept)!.add(dashboard);
      });
    });

    return Array.from(map.entries())
      .map(([dept, dashboards]) => ({
        department: dept,
        accessCount: dashboards.size
      }))
      .sort((a, b) => b.accessCount - a.accessCount);
  }

  private updateWorkspaceChart(data: any[]) {
    this.workspaceChartOptions.series = [{
      name: "Dashboards",
      data: data.map(item => Number(item.count))
    }] as ApexAxisChartSeries;
    
    if (this.workspaceChartOptions.xaxis) {
      this.workspaceChartOptions.xaxis = {
        ...this.workspaceChartOptions.xaxis,
        type: 'category',
        categories: data.map(item => String(item.name)),
        labels: {
          rotate: -45,
          formatter: function(value: any) {
            return String(value);
          }
        }
      };
    }
  }

  private updateValueTypeChart(data: any[]) {
    this.valueTypeChartOptions.series = data.map(item => item.count);
    this.valueTypeChartOptions.labels = data.map(item => item.name);
  }

  private updateGroupChart(data: any[]) {
    this.groupChartOptions.series = data.map(item => item.count);
    this.groupChartOptions.labels = data.map(item => item.name);
  }

  private updateDepartmentChart(data: any[]) {
    this.departmentChartOptions.series = [{
      name: "Users",
      data: data.map(item => Number(item.count))
    }] as ApexAxisChartSeries;
    
    if (this.departmentChartOptions.xaxis) {
      this.departmentChartOptions.xaxis = {
        type: 'category',
        categories: data.map(item => String(item.name)),
        labels: {
          formatter: function(value: any) {
            return String(value);
          }
        }
      };
    }
  }

  

  private updateDepartmentAccessChart(data: any[]) {
    this.deptAccessChartOptions.series = [{
      name: "Dashboards Accessed",
      data: data.map(item => Number(item.accessCount))
    }] as ApexAxisChartSeries;
    
    if (this.deptAccessChartOptions.xaxis) {
      this.deptAccessChartOptions.xaxis = {
        type: 'category',
        categories: data.map(item => String(item.department)),
        labels: {
          formatter: function(value: any) {
            return String(value);
          }
        }
      };
    }
  }

  private calculateAggregateMetrics(records: any[]) {
    if (this.statistics.totalDashboards > 0) {
      this.statistics.averageUsersPerDashboard = 
        this.statistics.totalUsers / this.statistics.totalDashboards;
    }

    const dashboardUsers = new Map<string, number>();
    records.forEach(record => {
      record.dashboards.forEach((dashboard: string) => {
        dashboardUsers.set(
          dashboard,
          (dashboardUsers.get(dashboard) || 0) + 1
        );
      });
    });

    let maxUsers = 0;
    let mostUsedDashboard = '';
    dashboardUsers.forEach((users, dashboard) => {
      if (users > maxUsers) {
        maxUsers = users;
        mostUsedDashboard = dashboard;
      }
    });

    this.statistics.mostUsedDashboard = {
      name: mostUsedDashboard,
      users: maxUsers
    };
  }



//WEBTOOL PART
public webtoolUserChartOptions: Partial<ChartOptions> = {
  ...this.defaultConfig,
  series: [{
    name: "Users",
    data: [] as number[]
  }] as ApexAxisChartSeries,
  chart: {
    ...this.defaultConfig.chart,
    type: "bar",
    height: 350
  },
  plotOptions: {
    bar: {
      horizontal: true,
      distributed: true
    }
  },
  xaxis: {
    type: 'category',
    categories: [] as string[]
  },
  colors: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA']
};

public roleDistributionChartOptions: Partial<ChartOptions> = {
  ...this.defaultConfig,
  series: [] as number[],
  chart: {
    ...this.defaultConfig.chart,
    type: "donut",
    height: 350
  },
  labels: [] as string[],
  colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
};

public accessComparisonChartOptions: Partial<ChartOptions> = {
  ...this.defaultConfig,
  series: [
    { name: 'Dashboard Access', data: [] },
    { name: 'Webtool Access', data: [] }
  ] as ApexAxisChartSeries,
  chart: {
    ...this.defaultConfig.chart,
    type: 'radar',
    height: 350
  },
  xaxis: {
    categories: [] as string[]
  }
};

private loadWebtoolStatistics() {
  // Load webtool data
  this.webtoolService.getWebtools().subscribe({
    next: (webtools) => {
      this.statistics.totalWebtools = webtools.length;
      this.loadWebtoolUserData(webtools);
    },
    error: (error) => console.error('Error loading webtools:', error)
  });
}
private processWebtoolUserData(userData: any[]) {
  const webtoolUsers = new Map<string, number>();
  const roleCount = new Map<string, number>();
  const departmentAccess = new Map<string, Set<string>>();

  userData.forEach(user => {
    // Count users per webtool
    user.webtools?.forEach((webtool: string) => {
      webtoolUsers.set(webtool, (webtoolUsers.get(webtool) || 0) + 1);
    });

    // Count role occurrences
    Object.values(user.roles).flat().forEach((role: any) => {
      roleCount.set(role.name, (roleCount.get(role.name) || 0) + 1);
    });

    // Track department access
    if (!departmentAccess.has(user.department)) {
      departmentAccess.set(user.department, new Set());
    }
    user.webtools?.forEach((webtool: string) => {
      departmentAccess.get(user.department)?.add(webtool);
    });
  });

  this.updateWebtoolCharts(webtoolUsers, roleCount, departmentAccess);
  this.calculateWebtoolMetrics(webtoolUsers, roleCount);
}

private updateWebtoolCharts(
  webtoolUsers: Map<string, number>,
  roleCount: Map<string, number>,
  departmentAccess: Map<string, Set<string>>
) {
  // Update webtool users chart
  const webtoolData = Array.from(webtoolUsers.entries())
    .sort((a, b) => b[1] - a[1]);

  this.webtoolUserChartOptions.series = [{
    name: "Users",
    data: webtoolData.map(([_, count]) => count)
  }] as ApexAxisChartSeries;

  if (this.webtoolUserChartOptions.xaxis) {
    this.webtoolUserChartOptions.xaxis.categories = 
      webtoolData.map(([name]) => name);
  }

  // Update role distribution chart
  const roleData = Array.from(roleCount.entries())
    .sort((a, b) => b[1] - a[1]);

  this.roleDistributionChartOptions.series = 
    roleData.map(([_, count]) => count);
  this.roleDistributionChartOptions.labels = 
    roleData.map(([name]) => name);

  // Update access comparison chart
  this.updateAccessComparisonChart(departmentAccess);
}

private updateAccessComparisonChart(departmentAccess: Map<string, Set<string>>) {
  const departments = Array.from(departmentAccess.keys());
  const webtoolAccess = departments.map(dept => 
    departmentAccess.get(dept)?.size || 0
  );

  const dashboardAccess = departments.map(dept => {
    const records = this.getRecordsByDepartment(dept);
    return new Set(records.flatMap(r => r.dashboards)).size;
  });

  this.accessComparisonChartOptions.series = [
    { name: 'Dashboard Access', data: dashboardAccess },
    { name: 'Webtool Access', data: webtoolAccess }
  ];
  this.accessComparisonChartOptions.xaxis = {
    categories: departments
  };
}
private calculateWebtoolMetrics(
  webtoolUsers: Map<string, number>,
  roleCount: Map<string, number>
) {
  // Calculate average users per webtool
  const totalUsers = Array.from(webtoolUsers.values())
    .reduce((sum, count) => sum + count, 0);
  this.statistics.averageUsersPerWebtool = 
    totalUsers / this.statistics.totalWebtools;

  // Find most used webtool
  let maxUsers = 0;
  let mostUsedWebtool = '';
  webtoolUsers.forEach((count, webtool) => {
    if (count > maxUsers) {
      maxUsers = count;
      mostUsedWebtool = webtool;
    }
  });
  this.statistics.mostUsedWebtool = {
    name: mostUsedWebtool,
    users: maxUsers
  };

  // Find most common role
  let maxRoleCount = 0;
  let mostCommonRole = '';
  roleCount.forEach((count, role) => {
    if (count > maxRoleCount) {
      maxRoleCount = count;
      mostCommonRole = role;
    }
  });
  this.statistics.mostCommonRole = {
    name: mostCommonRole,
    count: maxRoleCount
  };
}



 // Add the missing loadWebtoolUserData method
 private loadWebtoolUserData(webtools: any[]) {
  this.userWebtoolService.getConsolidatedUserData().subscribe({
    next: (userData) => {
      const usersByWebtool = new Map<string, number>();
      const roleCount = new Map<string, number>();
      const webtoolNames = new Map<string, string>(); // Map to store webtool names
      
      // First, create a map of webtool IDs to names
      webtools.forEach(webtool => {
        webtoolNames.set(webtool.id.toString(), webtool.webtool);
      });

      // Count users per webtool
      webtools.forEach(webtool => {
        const usersForWebtool = userData.filter(user => 
          user.webtools?.some(wt => wt === webtool.webtool)
        ).length;
        usersByWebtool.set(webtool.webtool, usersForWebtool);
      });

      // Count roles
      userData.forEach(user => {
        if (user.roles) {
          Object.values(user.roles).flat().forEach((role: any) => {
            if (role && role.name) {
              roleCount.set(role.name, (roleCount.get(role.name) || 0) + 1);
            }
          });
        }
      });

      // Process department access
      const departmentAccess = new Map<string, Set<string>>();
      userData.forEach(user => {
        if (!departmentAccess.has(user.department)) {
          departmentAccess.set(user.department, new Set());
        }
        user.webtools?.forEach(webtool => {
          departmentAccess.get(user.department)?.add(webtool);
        });
      });

      this.updateWebtoolCharts(usersByWebtool, roleCount, departmentAccess);
      this.calculateWebtoolMetrics(usersByWebtool, roleCount);
    },
    error: (error) => console.error('Error loading webtool user data:', error)
  });
}
// Add method to handle records by department
private getRecordsByDepartment(department: string): any[] {
  return this.records.filter((record: any) => record.department === department);
}


// Add method to update webtool user chart
private updateWebtoolUserChart(usersByWebtool: Map<string, number>) {
  const sortedData = Array.from(usersByWebtool.entries())
    .sort((a, b) => b[1] - a[1]);

  this.webtoolUserChartOptions.series = [{
    name: "Users",
    data: sortedData.map(([_, count]) => count)
  }] as ApexAxisChartSeries;

  if (this.webtoolUserChartOptions.xaxis) {
    this.webtoolUserChartOptions.xaxis.categories = 
      sortedData.map(([name]) => name);
  }
}




public userAccessPatternOptions: Partial<ChartOptions> = {
  ...this.defaultConfig,
  series: [{
    name: 'Dashboard Only',
    data: []
  }, {
    name: 'Webtool Only',
    data: []
  }, {
    name: 'Both Access',
    data: []
  }] as ApexAxisChartSeries,
  chart: {
    ...this.defaultConfig.chart,
    type: 'bar',
    height: 350,
    stacked: true
  },
  plotOptions: {
    bar: {
      horizontal: false,
      borderRadius: 4,
      columnWidth: '70%'
    }
  },
  xaxis: {
    ...this.defaultConfig.xaxis,
    categories: []
  },
  colors: ['#4F46E5', '#10B981', '#F59E0B'],
  title: {
    text: 'User Access Patterns by Department',
    align: 'center'
  }
};

public roleMetricsOptions: Partial<ChartOptions> = {
  ...this.defaultConfig,
  series: [{
    name: 'Average Tools',
    type: 'column',
    data: []
  }, {
    name: 'User Count',
    type: 'line',
    data: []
  }] as ApexAxisChartSeries,
  chart: {
    ...this.defaultConfig.chart,
    type: 'line',
    height: 350
  },
  stroke: {
    width: [0, 4],
    curve: 'smooth'
  },
  xaxis: {
    ...this.defaultConfig.xaxis,
    categories: []
  },
  yaxis: [{
    title: {
      text: 'Average Tools'
    }
  }, {
    opposite: true,
    title: {
      text: 'User Count'
    }
  }],
  colors: ['#4F46E5', '#10B981']
};

public accessTrendOptions: Partial<ChartOptions> = {
  ...this.defaultConfig,
  series: [{
    name: 'Active Users',
    data: []
  }, {
    name: 'Total Accesses',
    data: []
  }, {
    name: 'Unique Tools',
    data: []
  }] as ApexAxisChartSeries,
  chart: {
    ...this.defaultConfig.chart,
    type: 'area',
    height: 350,
    stacked: false
  },
  stroke: {
    curve: 'smooth',
    width: 2
  },
  fill: {
    type: 'gradient',
    gradient: {
      opacityFrom: 0.6,
      opacityTo: 0.1
    }
  },
  xaxis: {
    ...this.defaultConfig.xaxis,
    type: 'datetime'
  },
  colors: ['#4F46E5', '#10B981', '#F59E0B']
};



private updateUserAccessPatternChart(patterns: UserAccessPattern[]) {
  const categories = patterns.map(p => p.category);
  const dashboardOnly = patterns.map(p => p.dashboardOnly);
  const webtoolOnly = patterns.map(p => p.webtoolOnly);
  const bothAccess = patterns.map(p => p.bothAccess);

  this.userAccessPatternOptions.series = [{
    name: 'Dashboard Only',
    data: dashboardOnly
  }, {
    name: 'Webtool Only',
    data: webtoolOnly
  }, {
    name: 'Both Access',
    data: bothAccess
  }];
  
  if (this.userAccessPatternOptions.xaxis) {
    this.userAccessPatternOptions.xaxis.categories = categories;
  }
}


private updateRoleMetricsChart(metrics: RoleAccessMetrics[]) {
  const categories = metrics.map(m => m.role);
  const averageTools = metrics.map(m => parseFloat(m.averageTools.toFixed(2)));
  const userCounts = metrics.map(m => m.userCount);

  this.roleMetricsOptions.series = [{
    name: 'Average Tools',
    type: 'column',
    data: averageTools
  }, {
    name: 'User Count',
    type: 'line',
    data: userCounts
  }];

  if (this.roleMetricsOptions.xaxis) {
    this.roleMetricsOptions.xaxis.categories = categories;
  }
}



private updateAccessTrendChart(trends: AccessTrend[]) {
  const timestamps = trends.map(t => new Date(t.timestamp).getTime());
  const activeUsers = trends.map(t => t.activeUsers);
  const totalAccesses = trends.map(t => t.totalAccesses);
  const uniqueTools = trends.map(t => t.uniqueTools);

  this.accessTrendOptions.series = [{
    name: 'Active Users',
    data: activeUsers
  }, {
    name: 'Total Accesses',
    data: totalAccesses
  }, {
    name: 'Unique Tools',
    data: uniqueTools
  }];
  
  if (this.accessTrendOptions.xaxis) {
    this.accessTrendOptions.xaxis.categories = timestamps;
  }
}



private calculateSummaryMetrics(records: any[]) {
  // Calculate cross-tool usage percentage
  const totalUsers = records.length;
  const usersWithBoth = records.filter(record => 
    (record.dashboards?.length || 0) > 0 && 
    (record.webtools?.length || 0) > 0
  ).length;
  
  this.statistics.summaryMetrics.crossToolUsage = 
    Math.round((usersWithBoth / totalUsers) * 100);

  // Calculate tool utilization
  const totalTools = this.statistics.totalDashboards + this.statistics.totalWebtools;
  const usedTools = new Set();
  records.forEach(record => {
    record.dashboards?.forEach((d: string) => usedTools.add(`d_${d}`));
    record.webtools?.forEach((w: string) => usedTools.add(`w_${w}`));
  });
  
  this.statistics.summaryMetrics.toolUtilization = 
    Math.round((usedTools.size / totalTools) * 100);

  // This would require timestamp data in your records
  // If you have access timestamps, you can calculate the most active time period
  // For now, we'll leave it as "Not Available"
  this.statistics.summaryMetrics.mostActiveTime = {
    start: 'N/A',
    end: 'N/A',
    count: 0
  };
}




private processUserAccessPatterns(records: any[]) {
  // Since we don't have real data, we'll create dummy data
  const dummyPatterns: UserAccessPattern[] = [
    {
      category: 'Engineering',
      dashboardOnly: 45,
      webtoolOnly: 30,
      bothAccess: 25
    },
    {
      category: 'Sales',
      dashboardOnly: 35,
      webtoolOnly: 40,
      bothAccess: 20
    },
    {
      category: 'Marketing',
      dashboardOnly: 25,
      webtoolOnly: 35,
      bothAccess: 30
    },
    {
      category: 'Finance',
      dashboardOnly: 30,
      webtoolOnly: 25,
      bothAccess: 35
    },
    {
      category: 'HR',
      dashboardOnly: 20,
      webtoolOnly: 30,
      bothAccess: 15
    }
  ];

  this.updateUserAccessPatternChart(dummyPatterns);
}

private processRoleMetrics() {
  // Dummy role metrics data
  const dummyRoleMetrics: RoleAccessMetrics[] = [
    {
      role: 'Admin',
      averageTools: 8.5,
      userCount: 25
    },
    {
      role: 'Manager',
      averageTools: 6.2,
      userCount: 45
    },
    {
      role: 'Analyst',
      averageTools: 5.8,
      userCount: 60
    },
    {
      role: 'Developer',
      averageTools: 4.9,
      userCount: 80
    },
    {
      role: 'Viewer',
      averageTools: 3.2,
      userCount: 120
    }
  ];

  this.updateRoleMetricsChart(dummyRoleMetrics);
}

private processAccessTrends() {
  // Dummy access trend data for the last 7 days
  const today = new Date();
  const dummyTrends: AccessTrend[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dummyTrends.push({
      timestamp: date.toISOString(),
      activeUsers: Math.floor(180 + Math.random() * 100),
      totalAccesses: Math.floor(450 + Math.random() * 200),
      uniqueTools: Math.floor(35 + Math.random() * 15)
    });
  }

  this.updateAccessTrendChart(dummyTrends);
}

}