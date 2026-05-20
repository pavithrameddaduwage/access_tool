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

  private readonly blueGradientColors = [
    '#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'
  ];

  constructor(
    private powerBIMetricsService: PowerBIMetricsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers(this.selectedPeriod);
  }

  // ── Data Loading ────────────────────────────────────────────────
  async loadUsers(days: number) {
    this.loading = true;
    this.error = '';
    this.selectedPeriod = days;
    this.selectedUserId = null;
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

      // Auto-select the first user to show detail immediately
      if (this.allUsers.length > 0) {
        await this.selectUser(this.allUsers[0].id);
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
      const [metrics, workspaceDist, consumptionMethods, reportViews] = await Promise.all([
        this.powerBIMetricsService.getUserMetrics(userId, startDate, endDate).toPromise(),
        this.powerBIMetricsService.getWorkspaceViewsDistribution(userId, startDate, endDate).toPromise(),
        this.powerBIMetricsService.getUserConsumptionMethods(userId, startDate, endDate).toPromise(),
        this.powerBIMetricsService.getUserReportViewsDistribution(userId, startDate, endDate).toPromise()
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

      this.prepareWorkspacePieChart(workspaceDist || []);
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
  private prepareWorkspacePieChart(distribution: any[]) {
    if (!distribution || distribution.length === 0) {
      this.userWorkspacePieChartOptions = null;
      return;
    }
    // Merge personal workspace entries
    let data = [...distribution];
    let personalCount = 0;
    data = data.filter(d => {
      if (d.workspaceName === 'PersonalWorkspace') { personalCount += d.count; return false; }
      return true;
    });
    if (personalCount > 0) data.push({ workspaceName: 'Personal Workspace', count: personalCount });

    this.userWorkspacePieChartOptions = {
      series: data.map(d => d.count),
      chart: { type: 'pie', height: 280 },
      labels: data.map(d => d.workspaceName),
      colors: this.blueGradientColors,
      dataLabels: { enabled: true, formatter: (v: number) => `${v.toFixed(1)}%`, style: { fontSize: '11px', colors: ['#fff'] } },
      legend: { position: 'bottom', fontSize: '11px' },
      tooltip: { y: { formatter: (v: number) => `${v} views` } }
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
      chart: { type: 'donut', height: 280 },
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
    this.userReportViewsChartOptions = {
      series: [{ name: 'Views', data: top.map(r => r.count) }],
      chart: { type: 'bar', height: 280, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true } },
      xaxis: { categories: top.map(r => r.reportName || `Report (${r.reportId.slice(0, 6)}…)`), labels: { style: { fontSize: '11px' } } },
      colors: ['#2563eb'],
      dataLabels: { enabled: false },
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
      colors: ['#1d4ed8'],
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
}
