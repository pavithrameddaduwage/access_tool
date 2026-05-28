import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DropdownModule } from 'primeng/dropdown';
import { PowerBIMetricsService } from '../Services/powerbi-metrics.service';
import { AvatarComponent } from '../components/avatar/avatar.component';

interface UserSummary {
  id: string;
  name: string;
  department: string;
  totalViews: number;
  lastActivity: string;
}

@Component({
  selector: 'app-users-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule, DropdownModule, AvatarComponent],
  templateUrl: './users-overview.component.html',
  styleUrls: ['./users-overview.component.css']
})
export class UsersOverviewComponent implements OnInit {
  // --- State ---
  loading = true;
  detailLoading = false;
  error = '';

  // --- Filters ---
  selectedPeriod = 30;
  timePeriods = [
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 }
  ];
  userSearchQuery = '';

  // --- User list ---
  allUsers: UserSummary[] = [];
  filteredUsers: UserSummary[] = [];
  selectedUserId: string | null = null;
  currentPage = 1;
  usersPerPage = 15;

  // --- User detail ---
  userMetrics: any = {};
  userWorkspacePieChartOptions: any = null;
  userConsumptionChartOptions: any = null;
  userReportViewsChartOptions: any = null;
  activityTimelineChartOptions: any = null;
  userConsumptionMethods: { method: string; count: number }[] = [];
  userReportViews: { reportId: string; reportName: string; count: number }[] = [];
  userTabTimeSpent: any[] = [];
  lastRefreshedAt: string = '';

  private readonly blueGradientColors = [
    '#1e3a8a', // Deep corporate navy
    '#2563eb', // Indigo-blue
    '#3b82f6', // Mid blue
    '#60a5fa', // Sky blue
    '#0d9488', // Teal
    '#06b6d4', // Cyan
    '#4f46e5', // Royal indigo
    '#64748b'  // Slate grey
  ];

  constructor(
    private powerBIMetricsService: PowerBIMetricsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.powerBIMetricsService.getLastRefresh().subscribe({
      next: (res) => { if (res && res.lastRefreshedAt) this.lastRefreshedAt = res.lastRefreshedAt; },
      error: (err) => console.error('Failed to load last refresh time:', err)
    });
    this.loadUsers(this.selectedPeriod);
  }

  // ── Data Loading ────────────────────────────────────────────────
  async loadUsers(days: number) {
    this.loading = true;
    this.error = '';
    this.selectedPeriod = days;
    
    // Save current active user ID to preserve selection
    const activeUserIdBefore = this.selectedUserId;
    this.clearDetail();
 
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
 
    try {
      const topUsers = await this.powerBIMetricsService
        .getTopUsers(startDate, endDate, 200)
        .toPromise()
        .catch(() => [] as any[]);
 
      if (!topUsers || topUsers.length === 0) {
        this.allUsers = [];
        this.filteredUsers = [];
        this.selectedUserId = null;
        this.loading = false;
        return;
      }
 
      const nameDept = await this.powerBIMetricsService
        .getUserNameMappings(topUsers.map((u: any) => u.userId))
        .toPromise()
        .catch(() => ({ names: {}, departments: {} })) as any;
 
      const names: Record<string, string> = nameDept?.names || {};
      const depts: Record<string, string> = nameDept?.departments || {};
 
      this.allUsers = topUsers.map((u: any) => ({
        id: u.userId,
        name: names[u.userId] || u.userId.split('@')[0],
        department: depts[u.userId] || '—',
        totalViews: u.count,
        lastActivity: u.lastActivity || ''
      }));
 
      this.filterUsers();
 
      // Preserve selection if possible, otherwise select the first user
      const stillExists = this.allUsers.find(u => u.id === activeUserIdBefore);
      if (stillExists && activeUserIdBefore) {
        await this.selectUser(activeUserIdBefore);
      } else if (this.allUsers.length > 0) {
        await this.selectUser(this.allUsers[0].id);
      } else {
        this.selectedUserId = null;
      }
    } catch (err) {
      console.error('Error loading users:', err);
      this.error = 'Failed to load user data. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  async selectUser(userId: string) {
    this.selectedUserId = userId;
    this.detailLoading = true;
    this.clearDetail();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - this.selectedPeriod);

    try {
      const [metrics, workspaceDist, consumptionMethods, reportViews, tabTimeSpent] = await Promise.all([
        this.powerBIMetricsService.getUserMetrics(userId, startDate, endDate).toPromise(),
        this.powerBIMetricsService.getWorkspaceViewsDistribution(userId, startDate, endDate).toPromise(),
        this.powerBIMetricsService.getUserConsumptionMethods(userId, startDate, endDate).toPromise(),
        this.powerBIMetricsService.getUserReportViewsDistribution(userId, startDate, endDate).toPromise(),
        this.powerBIMetricsService.getUserTimeSpent(userId, startDate, endDate).toPromise()
      ]);

      this.userConsumptionMethods = (consumptionMethods || []).map((m: any) => ({
        method: m.method === null ? 'Microsoft Teams' : m.method,
        count: m.count
      }));

      this.userMetrics = {
        ...(metrics || {}),
        workspaceDistribution: workspaceDist || [],
        consumptionMethods: this.userConsumptionMethods,
        activityChartData: (metrics?.activityByDate || []).map((a: any) => ({
          x: a.date,
          y: a.count
        }))
      };

      this.userReportViews = reportViews || [];
      this.userTabTimeSpent = tabTimeSpent || [];

      this.prepareWorkspacePieChart();
      this.prepareConsumptionChart();
      this.prepareReportViewsChart();
      this.prepareActivityTimeline();
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error loading user detail:', err);
    } finally {
      this.detailLoading = false;
    }
  }

  // ── Chart Builders ───────────────────────────────────────────────
  private prepareWorkspacePieChart() {
    const timeSpentData = this.groupedTabTimeSpent;
    if (!timeSpentData || timeSpentData.length === 0) {
      this.userWorkspacePieChartOptions = null;
      return;
    }

    this.userWorkspacePieChartOptions = {
      series: timeSpentData.map(w => w.totalSeconds),
      chart: { type: 'pie', height: 400 },
      labels: timeSpentData.map(w => this.transformDisplayName(w.workspaceName)),
      colors: this.blueGradientColors,
      dataLabels: { enabled: true, formatter: (v: number) => `${v.toFixed(1)}%`, style: { fontSize: '11px', colors: ['#fff'] } },
      legend: { 
        position: 'bottom', 
        fontSize: '11px',
        formatter: (legendName: string) => {
          const workspaceData = timeSpentData.find(w => 
            this.transformDisplayName(w.workspaceName) === legendName
          );
          return `${legendName} (${this.formatTime(workspaceData?.totalSeconds || 0)})`;
        }
      },
      tooltip: { y: { formatter: (v: number) => this.formatTime(v) } }
    };
  }

  private prepareConsumptionChart() {
    if (!this.userConsumptionMethods || this.userConsumptionMethods.length === 0) {
      this.userConsumptionChartOptions = null;
      return;
    }
    const labels = this.userConsumptionMethods.map(m => this.getMethodDisplayName(m.method));
    this.userConsumptionChartOptions = {
      series: this.userConsumptionMethods.map(m => m.count),
      chart: { type: 'donut', height: 340 },
      labels,
      colors: this.blueGradientColors,
      dataLabels: { enabled: true, formatter: (v: number) => `${v.toFixed(1)}%`, style: { fontSize: '11px', colors: ['#fff'] } },
      legend: { position: 'bottom', fontSize: '11px' },
      tooltip: { y: { formatter: (v: number) => `${v} views` } }
    };
  }

  private prepareReportViewsChart() {
    if (!this.userReportViews || this.userReportViews.length === 0) {
      this.userReportViewsChartOptions = null;
      return;
    }
    const top = this.userReportViews.slice(0, 10);
    const categories = top.map(r => {
      let name = r.reportName || `Report (${r.reportId.slice(0, 6)}…)`;
      name = name.replace(/^HGU\s*-\s*/i, '').replace(/^HGU/i, '');
      name = name.replace(/\s*-\s*Dashboard$/i, '').replace(/Dashboard$/i, '');
      name = name.trim();
      return name.length > 25 ? name.substring(0, 25) + '...' : name;
    });

    this.userReportViewsChartOptions = {
      series: [{ name: 'Views', data: top.map(r => r.count) }],
      chart: { type: 'bar', height: 280, toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '55%',
          borderRadius: 4,
          borderRadiusApplication: 'end'
        }
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            fontSize: '10px',
            colors: '#64748b' // slate-500
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '11px',
            colors: '#334155', // slate-700
            fontWeight: 500
          }
        }
      },
      colors: this.blueGradientColors,
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '10px',
          colors: ['#ffffff'],
          fontWeight: '600'
        },
        offsetX: -6
      },
      tooltip: { y: { formatter: (v: number) => `${v} views` } }
    };
  }

  private prepareActivityTimeline() {
    const data: { x: string; y: number }[] = this.userMetrics?.activityChartData || [];
    if (!data.length) { this.activityTimelineChartOptions = null; return; }
    this.activityTimelineChartOptions = {
      series: [{ name: 'Views', data }],
      chart: { type: 'bar', height: 220, toolbar: { show: false } },
      xaxis: { type: 'datetime', labels: { format: 'dd MMM', style: { fontSize: '10px' } } },
      colors: ['#6366f1'],
      dataLabels: { enabled: false },
      tooltip: { x: { format: 'dd MMM yyyy' }, y: { formatter: (v: number) => `${v} views` } }
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────
  private clearDetail() {
    this.userMetrics = {};
    this.userWorkspacePieChartOptions = null;
    this.userConsumptionChartOptions = null;
    this.userReportViewsChartOptions = null;
    this.activityTimelineChartOptions = null;
    this.userReportViews = [];
    this.userConsumptionMethods = [];
    this.userTabTimeSpent = [];
  }

  filterUsers() {
    const q = this.userSearchQuery.toLowerCase();
    this.filteredUsers = q
      ? this.allUsers.filter(u => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q))
      : [...this.allUsers];
    this.currentPage = 1;
  }

  getPaginatedUsers(): UserSummary[] {
    const start = (this.currentPage - 1) * this.usersPerPage;
    return this.filteredUsers.slice(start, start + this.usersPerPage);
  }

  getPageNumbers(): number[] {
    return Array.from({ length: Math.ceil(this.filteredUsers.length / this.usersPerPage) }, (_, i) => i + 1);
  }

  changePage(page: number) { this.currentPage = page; }

  formatTime(seconds: number | undefined): string {
    if (!seconds || seconds <= 0) return '0m';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  }

  getMethodDisplayName(method: string): string {
    const map: Record<string, string> = {
      'Microsoft Teams': 'Teams',
      'EmbeddingForYourOrganization': 'Embedded',
      'PowerPointAddIn': 'PowerPoint',
      'Web': 'Web Browser',
      'Mobile': 'Mobile',
      'Desktop': 'Desktop'
    };
    return map[method] || method;
  }

  get selectedUser(): UserSummary | undefined {
    return this.allUsers.find(u => u.id === this.selectedUserId);
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

  private normalizeDashName(s: string): string {
    return (s || '')
      .toLowerCase().trim()
      .replace(/^hgu\s*[-–]\s*/i, '')
      .replace(/\s*[-–]\s*dashboard$/i, '')
      .replace(/dashboard$/i, '')
      .trim();
  }

  get assignedVsUsed(): { name: string; displayName: string; timeSpent: number; views: number; isUsed: boolean }[] {
    const assigned: string[] = this.userMetrics?.assignedDashboards || [];
    if (!assigned.length) return [];

    return assigned.map(dashName => {
      const norm = this.normalizeDashName(dashName);

      const timeSpent = this.userTabTimeSpent
        .filter(t => {
          const tn = this.normalizeDashName(t.reportName || '');
          return tn === norm || tn.includes(norm) || norm.includes(tn);
        })
        .reduce((s, t) => s + (t.totalSeconds || 0), 0);

      const matchedView = this.userReportViews.find(r => {
        const rn = this.normalizeDashName(r.reportName || '');
        return rn === norm || rn.includes(norm) || norm.includes(rn);
      });

      return {
        name: dashName,
        displayName: this.transformDisplayName(dashName),
        timeSpent,
        views: matchedView?.count || 0,
        isUsed: timeSpent > 0 || (matchedView?.count || 0) > 0
      };
    });
  }

  get utilizationRate(): number {
    const data = this.assignedVsUsed;
    if (!data.length) return 0;
    return Math.round(data.filter(d => d.isUsed).length / data.length * 100);
  }
}
