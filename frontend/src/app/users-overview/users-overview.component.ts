import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { PowerBIMetricsService } from '../Services/powerbi-metrics.service';
import { UserService } from '../Services/user.service';
import { AvatarComponent } from '../components/avatar/avatar.component';

interface UserSummary {
  id: string;
  name: string;
  department: string;
  totalViews: number;
  hasAccess: boolean;
  isZeroView: boolean;
}

@Component({
  selector: 'app-users-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule, AvatarComponent],
  templateUrl: './users-overview.component.html',
  styleUrls: ['./users-overview.component.css']
})
export class UsersOverviewComponent implements OnInit {
  // State
  loading = true;
  detailLoading = false;
  insightsLoading = false;
  error = '';
  activeView: 'users' | 'insights' = 'users';

  // Time periods (weeks / months)
  selectedPeriod = 30;
  timePeriods = [
    { label: '1W',  days: 7   },
    { label: '2W',  days: 14  },
    { label: '1M',  days: 30  },
    { label: '3M',  days: 90  },
    { label: '6M',  days: 180 },
    { label: '1Y',  days: 365 }
  ];

  // Users
  allUsers: UserSummary[] = [];
  filteredUsers: UserSummary[] = [];
  selectedUserId: string | null = null;
  currentPage = 1;
  usersPerPage = 15;
  userSearchQuery = '';

  // Department filter
  selectedDept = 'All';
  availableDepts: string[] = [];

  // User detail
  userMetrics: any = {};
  userWorkspacePieChartOptions: any = null;
  userReportViewsChartOptions: any = null;
  userConsumptionMethods: { method: string; count: number }[] = [];
  userReportViews: { reportId: string; reportName: string; count: number }[] = [];
  userTabTimeSpent: any[] = [];
  lastRefreshedAt = '';

  // Insights
  topReports: { reportId: string; reportName: string; count: number }[] = [];
  unusedReports: { id: number; dashboard: string; groupId: number | null }[] = [];
  topReportsChartOptions: any = null;
  insightsLoaded = false;

  // Report viewer drill-down
  selectedReportId: string | null = null;
  reportViewers: { userId: string; name: string; department: string; count: number }[] = [];
  reportViewersLoading = false;

  private readonly blueGradientColors = [
    '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa',
    '#0d9488', '#06b6d4', '#4f46e5', '#64748b'
  ];

  constructor(
    private powerBIMetricsService: PowerBIMetricsService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.powerBIMetricsService.getLastRefresh().subscribe({
      next: (res) => { if (res?.lastRefreshedAt) this.lastRefreshedAt = res.lastRefreshedAt; },
      error: () => {}
    });
    this.loadAll(this.selectedPeriod);
  }

  private getDateRange(days: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    return { startDate, endDate };
  }

  async loadAll(days: number) {
    this.loading = true;
    this.error = '';
    this.selectedPeriod = days;
    this.insightsLoaded = false;

    const { startDate, endDate } = this.getDateRange(days);
    const prevSelectedId = this.selectedUserId;
    this.clearDetail();

    try {
      // Load all registered users and active users in parallel
      const [masterResult, topUsers] = await Promise.all([
        this.userService.getUsers().toPromise().catch(() => [] as any[]),
        this.powerBIMetricsService.getTopUsers(startDate, endDate, 500).toPromise().catch(() => [] as any[])
      ]);

      // Build activity map: lowercased email → view count
      const activityMap = new Map<string, number>();
      for (const u of (topUsers || [])) {
        activityMap.set((u.userId || '').toLowerCase(), u.count || 0);
      }

      // Fetch display names for active users from AD mapping
      const activeEmails: string[] = (topUsers || []).map((u: any) => u.userId).filter(Boolean);
      let names: Record<string, string> = {};
      let depts: Record<string, string> = {};
      if (activeEmails.length > 0) {
        const mapping = await this.powerBIMetricsService
          .getUserNameMappings(activeEmails).toPromise()
          .catch(() => ({ names: {}, departments: {} })) as any;
        names = mapping?.names || {};
        depts = mapping?.departments || {};
      }

      // Build combined user list: registered users first (they HAVE access)
      const seenEmails = new Set<string>();
      const userList: UserSummary[] = [];

      for (const mu of (masterResult || [])) {
        const email = (mu.email || '').toLowerCase();
        if (!email || seenEmails.has(email)) continue;
        seenEmails.add(email);
        const views = activityMap.get(email) || 0;
        userList.push({
          id: mu.email,
          name: mu.name || email.split('@')[0],
          department: mu.department?.department || mu.department || '—',
          totalViews: views,
          hasAccess: true,
          isZeroView: views === 0
        });
      }

      // Include active users not in masterdata (they appear in activity logs)
      for (const au of (topUsers || [])) {
        const email = (au.userId || '').toLowerCase();
        if (!email || seenEmails.has(email)) continue;
        seenEmails.add(email);
        userList.push({
          id: au.userId,
          name: names[au.userId] || au.userId.split('@')[0],
          department: depts[au.userId] || '—',
          totalViews: au.count || 0,
          hasAccess: true,
          isZeroView: false
        });
      }

      // Active users first (desc by views), then zero-view users (asc by name)
      this.allUsers = userList.sort((a, b) => {
        if (a.isZeroView !== b.isZeroView) return a.isZeroView ? 1 : -1;
        return b.totalViews - a.totalViews;
      });

      // Build department filter options from available data
      const deptSet = new Set<string>();
      this.allUsers.forEach(u => { if (u.department && u.department !== '—') deptSet.add(u.department); });
      this.availableDepts = deptSet.size > 0 ? ['All', ...Array.from(deptSet).sort()] : [];

      this.filterUsers();

      // Restore previous selection or auto-select first
      const stillExists = this.allUsers.find(u => u.id === prevSelectedId);
      if (stillExists && prevSelectedId) {
        await this.selectUser(prevSelectedId);
      } else if (this.allUsers.length > 0) {
        await this.selectUser(this.allUsers[0].id);
      }

      // Reload insights if that view is active
      if (this.activeView === 'insights') {
        await this.loadInsights();
      }
    } catch (err) {
      this.error = 'Failed to load data. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  async switchView(view: 'users' | 'insights') {
    this.activeView = view;
    if (view === 'insights' && !this.insightsLoaded && !this.insightsLoading) {
      await this.loadInsights();
    }
  }

  async loadInsights() {
    this.insightsLoading = true;
    const { startDate, endDate } = this.getDateRange(this.selectedPeriod);
    try {
      const [topReps, unused] = await Promise.all([
        this.powerBIMetricsService.getTopReports(startDate, endDate, 100).toPromise().catch(() => [] as any[]),
        this.powerBIMetricsService.getUnusedReports(startDate, endDate).toPromise().catch(() => [] as any[])
      ]);
      this.topReports = (topReps || []) as any[];
      this.unusedReports = (unused || []) as any[];
      this.prepareTopReportsInsightChart();
      this.insightsLoaded = true;
      this.cdr.detectChanges();
    } finally {
      this.insightsLoading = false;
    }
  }

  async selectUser(userId: string) {
    this.selectedUserId = userId;
    this.detailLoading = true;
    this.clearDetail();
    const { startDate, endDate } = this.getDateRange(this.selectedPeriod);
    try {
      const [metrics, consumptionMethods, reportViews, tabTimeSpent] = await Promise.all([
        this.powerBIMetricsService.getUserMetrics(userId, startDate, endDate).toPromise(),
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
        activityChartData: (metrics?.activityByDate || []).map((a: any) => ({ x: a.date, y: a.count }))
      };
      this.userReportViews = reportViews || [];
      this.userTabTimeSpent = tabTimeSpent || [];

      this.prepareWorkspacePieChart();
      this.prepareReportViewsChart();
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error loading user detail:', err);
    } finally {
      this.detailLoading = false;
    }
  }

  navigateToUser(userId: string) {
    this.activeView = 'users';
    this.selectUser(userId);
  }

  // ── Chart builders ───────────────────────────────────────────────
  private prepareWorkspacePieChart() {
    const data = this.groupedTabTimeSpent;
    if (!data.length) { this.userWorkspacePieChartOptions = null; return; }
    this.userWorkspacePieChartOptions = {
      series: data.map(w => w.totalSeconds),
      chart: { type: 'pie', height: 280, toolbar: { show: false } },
      labels: data.map(w => this.transformDisplayName(w.workspaceName)),
      colors: this.blueGradientColors,
      dataLabels: {
        enabled: true,
        formatter: (v: number) => `${v.toFixed(0)}%`,
        style: { fontSize: '10px', colors: ['#fff'] }
      },
      legend: {
        position: 'bottom', fontSize: '10px',
        formatter: (n: string) => {
          const w = data.find(d => this.transformDisplayName(d.workspaceName) === n);
          return `${n} (${this.formatTime(w?.totalSeconds || 0)})`;
        }
      },
      tooltip: { y: { formatter: (v: number) => this.formatTime(v) } }
    };
  }

  private prepareReportViewsChart() {
    if (!this.userReportViews.length) { this.userReportViewsChartOptions = null; return; }
    const top = this.userReportViews.slice(0, 8);
    const categories = top.map(r => {
      let name = r.reportName || `(${r.reportId?.slice(0, 6)}…)`;
      name = name.replace(/^HGU\s*-\s*/i, '').replace(/^HGU/i, '').replace(/\s*-\s*Dashboard$/i, '').trim();
      return name.length > 22 ? name.substring(0, 22) + '…' : name;
    });
    this.userReportViewsChartOptions = {
      series: [{ name: 'Views', data: top.map(r => r.count) }],
      chart: { type: 'bar', height: 280, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 4, borderRadiusApplication: 'end' } },
      xaxis: { categories, labels: { style: { fontSize: '10px', colors: '#64748b' } } },
      colors: ['#2563eb'],
      dataLabels: { enabled: true, style: { fontSize: '10px', colors: ['#fff'], fontWeight: '600' }, offsetX: -6 },
      tooltip: { y: { formatter: (v: number) => `${v} views` } }
    };
  }

  private prepareTopReportsInsightChart() {
    if (!this.topReports.length) { this.topReportsChartOptions = null; return; }
    const top = this.topReports.slice(0, 15);
    const categories = top.map(r => {
      let name = r.reportName || `(${r.reportId?.slice(0, 6)}…)`;
      name = name.replace(/^HGU\s*-\s*/i, '').replace(/^HGU/i, '').replace(/\s*-\s*Dashboard$/i, '').trim();
      return name.length > 35 ? name.substring(0, 35) + '…' : name;
    });
    this.topReportsChartOptions = {
      series: [{ name: 'Total Views', data: top.map(r => r.count) }],
      chart: { type: 'bar', height: 480, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, barHeight: '65%', borderRadius: 4, borderRadiusApplication: 'end', distributed: true } },
      xaxis: { categories, labels: { style: { fontSize: '10px', colors: '#64748b' } } },
      colors: this.blueGradientColors,
      dataLabels: { enabled: true, style: { fontSize: '10px', colors: ['#fff'], fontWeight: '600' }, offsetX: -6 },
      legend: { show: false },
      tooltip: { y: { formatter: (v: number) => `${v} views` } }
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────
  private clearDetail() {
    this.userMetrics = {};
    this.userWorkspacePieChartOptions = null;
    this.userReportViewsChartOptions = null;
    this.userReportViews = [];
    this.userConsumptionMethods = [];
    this.userTabTimeSpent = [];
  }

  filterUsers() {
    let list = [...this.allUsers];
    if (this.selectedDept !== 'All') {
      list = list.filter(u => u.department === this.selectedDept);
    }
    const q = this.userSearchQuery.toLowerCase();
    if (q) list = list.filter(u => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
    this.filteredUsers = list;
    this.currentPage = 1;
  }

  selectDept(dept: string) {
    this.selectedDept = dept;
    this.filterUsers();
  }

  getPaginatedUsers(): UserSummary[] {
    const start = (this.currentPage - 1) * this.usersPerPage;
    return this.filteredUsers.slice(start, start + this.usersPerPage);
  }

  getPageNumbers(): number[] {
    return Array.from(
      { length: Math.ceil(this.filteredUsers.length / this.usersPerPage) },
      (_, i) => i + 1
    );
  }

  changePage(page: number) { this.currentPage = page; }

  formatTime(seconds: number | undefined): string {
    if (!seconds || seconds <= 0) return '0m';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  }

  getPeriodLabel(): string {
    return this.timePeriods.find(t => t.days === this.selectedPeriod)?.label || `${this.selectedPeriod}D`;
  }

  get selectedUser(): UserSummary | undefined {
    return this.allUsers.find(u => u.id === this.selectedUserId);
  }

  get groupedTabTimeSpent(): { workspaceName: string; totalSeconds: number; items: any[] }[] {
    if (!this.userTabTimeSpent?.length) return [];
    const groups: Record<string, { workspaceName: string; totalSeconds: number; items: any[] }> = {};
    this.userTabTimeSpent.forEach(item => {
      const ws = item.workspaceName || 'Personal Workspace';
      if (!groups[ws]) groups[ws] = { workspaceName: ws, totalSeconds: 0, items: [] };
      groups[ws].totalSeconds += item.totalSeconds;
      groups[ws].items.push(item);
    });
    return Object.values(groups).sort((a, b) => b.totalSeconds - a.totalSeconds);
  }

  transformDisplayName(name: string | undefined): string {
    if (!name) return 'Unknown';
    return name
      .replace(/^HGU\s*-\s*/i, '').replace(/^HGU/i, '')
      .replace(/\s*-\s*Dashboard$/i, '').replace(/Dashboard$/i, '')
      .trim() || 'Unknown';
  }

  private normalizeDashName(s: string): string {
    return (s || '').toLowerCase().trim()
      .replace(/^hgu\s*[-–]\s*/i, '')
      .replace(/\s*[-–]\s*dashboard$/i, '')
      .replace(/dashboard$/i, '').trim();
  }

  get assignedVsUsed(): { name: string; displayName: string; timeSpent: number; views: number; isUsed: boolean }[] {
    const assigned: string[] = this.userMetrics?.assignedDashboards || [];
    if (!assigned.length) return [];
    return assigned.map(dashName => {
      const norm = this.normalizeDashName(dashName);
      const timeSpent = this.userTabTimeSpent
        .filter(t => { const tn = this.normalizeDashName(t.reportName || ''); return tn === norm || tn.includes(norm) || norm.includes(tn); })
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

  async selectReport(report: any) {
    const reportId = report.reportId;
    if (this.selectedReportId === reportId) {
      this.selectedReportId = null;
      this.reportViewers = [];
      return;
    }
    this.selectedReportId = reportId;
    this.reportViewers = [];
    this.reportViewersLoading = true;

    const { startDate, endDate } = this.getDateRange(this.selectedPeriod);
    try {
      const viewers = await this.powerBIMetricsService
        .getTopUsers(startDate, endDate, 50, undefined, reportId)
        .toPromise().catch(() => [] as any[]);

      const userIds: string[] = (viewers || []).map((v: any) => v.userId).filter(Boolean);
      let names: Record<string, string> = {};
      let depts: Record<string, string> = {};
      if (userIds.length > 0) {
        const mapping = await this.powerBIMetricsService
          .getUserNameMappings(userIds).toPromise()
          .catch(() => ({ names: {}, departments: {} })) as any;
        names = mapping?.names || {};
        depts = mapping?.departments || {};
      }
      this.reportViewers = (viewers || []).map((v: any) => ({
        userId: v.userId,
        name: names[v.userId] || v.userId.split('@')[0],
        department: depts[v.userId] || '—',
        count: v.count || 0
      }));
      this.cdr.detectChanges();
    } finally {
      this.reportViewersLoading = false;
    }
  }

  // ── Insights computed properties ─────────────────────────────────
  get insightsTopUsers(): UserSummary[] {
    return this.allUsers.filter(u => !u.isZeroView).slice(0, 10);
  }

  get insightsZeroViewUsers(): UserSummary[] {
    return this.allUsers.filter(u => u.isZeroView);
  }

  get insightsLowestActiveReports(): any[] {
    return [...this.topReports].reverse().slice(0, 10);
  }
}
