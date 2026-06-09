import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { PowerBIMetricsService } from '../Services/powerbi-metrics.service';
import { DashboardService } from '../Services/dashboard.service';
import { ToastService } from '../Services/toast.service';

@Component({
  selector: 'app-dashboard-tab-usage',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './dashboard-tab-usage.component.html',
  styleUrls: ['./dashboard-tab-usage.component.css']
})
export class DashboardTabUsageComponent implements OnInit {
  dashboardName = '';
  dashboards: any[] = [];
  filteredDashboards: any[] = [];
  dashboardSearch = '';
  dashboardListLoading = false;
  usagePeriod = 30;
  usageLoading = false;
  usageData: {
    totalViews: number;
    uniqueViewers: number;
    viewers: { userId: string; views: number; lastSeen: string; reports: string[] }[];
    topReports: { reportId: string; reportName: string; views: number; uniqueViewers: number }[];
    pageTimeBreakdown: { tabName: string; totalSeconds: number; uniqueUsers: number }[];
  } | null = null;
  pageTimeChartOptions: any = null;
  viewersChartOptions: any = null;

  usagePeriods = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private powerBIMetricsService: PowerBIMetricsService,
    private dashboardService: DashboardService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.dashboardName = this.route.snapshot.paramMap.get('name') || '';
    if (this.dashboardName) {
      this.loadUsageData();
    } else {
      this.loadDashboardList();
    }
  }

  loadDashboardList() {
    this.dashboardListLoading = true;
    this.dashboardService.getDashboards().subscribe({
      next: (dashboards) => {
        this.dashboards = dashboards || [];
        this.filteredDashboards = [...this.dashboards];
        this.dashboardListLoading = false;
      },
      error: (error) => {
        console.error('Failed to load dashboards:', error);
        this.dashboardListLoading = false;
        this.toastService.show('Unable to load dashboards for tab usage selection', 'error');
      }
    });
  }

  navigateToDashboardUsage(dashboardName: string) {
    this.router.navigate(['/dashboard-tab-usage', dashboardName]);
  }

  onDashboardSearch(searchValue: string) {
    this.dashboardSearch = searchValue;
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      this.filteredDashboards = [...this.dashboards];
      return;
    }
    this.filteredDashboards = this.dashboards.filter(dashboard => {
      const title = (dashboard.dashboard || dashboard.name || '').toString().toLowerCase();
      return title.includes(query);
    });
  }

  loadUsageData(days?: number) {
    if (days !== undefined) this.usagePeriod = days;
    this.usageLoading = true;
    this.usageData = null;
    this.pageTimeChartOptions = null;
    this.viewersChartOptions = null;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - this.usagePeriod);

    this.powerBIMetricsService.getDashboardUsage(this.dashboardName, startDate, endDate).subscribe({
      next: (data) => {
        this.usageData = data;
        this.prepareUsageCharts(data);
        this.usageLoading = false;
      },
      error: (error) => {
        console.error('Failed to load dashboard tab usage:', error);
        this.toastService.show('Unable to load tab usage data', 'error');
        this.usageLoading = false;
      }
    });
  }

  prepareUsageCharts(data: typeof this.usageData) {
    if (!data) return;

    const pages = (data.pageTimeBreakdown || []).slice(0, 10);
    if (pages.length > 0) {
      this.pageTimeChartOptions = {
        series: [{ name: 'Time Spent (h)', data: pages.map(p => parseFloat(((p.totalSeconds || 0) / 3600).toFixed(1))) }],
        chart: { type: 'bar', height: 320, toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 4, borderRadiusApplication: 'end' } },
        xaxis: {
          categories: pages.map(p => p.tabName || 'Main Page'),
          labels: { style: { fontSize: '11px', colors: '#475569' } }
        },
        yaxis: { labels: { style: { fontSize: '11px', colors: '#334155', fontWeight: 500 } } },
        dataLabels: { enabled: true, style: { fontSize: '10px', colors: ['#fff'] }, offsetX: -6, formatter: (v: number) => v > 0 ? `${v}h` : '' },
        tooltip: { y: { formatter: (v: number) => `${v}h` } },
        colors: ['#f59e0b']
      };
    }

    const topViewers = (data.viewers || []).slice(0, 10);
    if (topViewers.length > 0) {
      this.viewersChartOptions = {
        series: [{ name: 'Views', data: topViewers.map(v => v.views) }],
        chart: { type: 'bar', height: 320, toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 4, borderRadiusApplication: 'end' } },
        xaxis: {
          categories: topViewers.map(v => v.userId.split('@')[0] || v.userId),
          labels: { style: { fontSize: '11px', colors: '#475569' } }
        },
        yaxis: { labels: { style: { fontSize: '11px', colors: '#334155', fontWeight: 500 } } },
        dataLabels: { enabled: false },
        tooltip: { y: { formatter: (v: number) => `${v} views` } },
        colors: ['#2563eb']
      };
    }
  }

  formatSeconds(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '<1m';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  goBack() {
    this.router.navigate(['/dashboard-detail', this.dashboardName]);
  }
}
