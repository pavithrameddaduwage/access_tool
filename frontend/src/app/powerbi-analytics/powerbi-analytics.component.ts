import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { PowerBIService } from '../Services/powerbi.service';

@Component({
  selector: 'app-powerbi-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-gray-700">Total Views</h3>
          <p class="text-3xl font-bold mt-2">{{metrics.totalViews || 0}}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-gray-700">Total Users</h3>
          <p class="text-3xl font-bold mt-2">{{metrics.totalUsers || 0}}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-gray-700">Reports</h3>
          <p class="text-3xl font-bold mt-2">{{metrics.reportCount || 0}}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-gray-700">Workspaces</h3>
          <p class="text-3xl font-bold mt-2">{{metrics.workspaceCount || 0}}</p>
        </div>
      </div>

      <!-- Usage Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-gray-700 mb-4">Workspace Usage</h3>
          <div class="h-96">
            <apx-chart
              [series]="workspaceChartOptions.series"
              [chart]="workspaceChartOptions.chart"
              [xaxis]="workspaceChartOptions.xaxis"
              [dataLabels]="workspaceChartOptions.dataLabels"
              [plotOptions]="workspaceChartOptions.plotOptions"
              [colors]="workspaceChartOptions.colors"
            ></apx-chart>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-gray-700 mb-4">Report Views Distribution</h3>
          <div class="h-96">
            <apx-chart
              [series]="reportChartOptions.series"
              [chart]="reportChartOptions.chart"
              [labels]="reportChartOptions.labels"
              [colors]="reportChartOptions.colors"
              [legend]="reportChartOptions.legend"
            ></apx-chart>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PowerBIAnalyticsComponent implements OnInit {
  metrics: any = {};
  workspaces: any[] = [];

  workspaceChartOptions: any = {
    series: [{
      name: 'Views',
      data: []
    }],
    chart: {
      type: 'bar',
      height: 350
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
      },
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: [],
    },
    colors: ['#4F46E5']
  };

  reportChartOptions: any = {
    series: [],
    chart: {
      type: 'donut',
      height: 350
    },
    labels: [],
    colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    legend: {
      position: 'bottom'
    }
  };

  constructor(private powerBIService: PowerBIService) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  private loadAnalytics() {
    // Load aggregate metrics
    this.powerBIService.getAggregateMetrics().subscribe({
      next: (data) => {
        this.metrics = data;
      },
      error: (error) => console.error('Error loading aggregate metrics:', error)
    });

    // Load workspace data
    this.powerBIService.getWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspaces = workspaces;
        this.loadWorkspaceMetrics();
      },
      error: (error) => console.error('Error loading workspaces:', error)
    });
  }

  private loadWorkspaceMetrics() {
    const metricsPromises = this.workspaces.map(workspace =>
      this.powerBIService.getWorkspaceMetrics(workspace.id)
    );

    // Load all workspace metrics
    Promise.all(metricsPromises).then(workspaceMetrics => {
      this.updateCharts(workspaceMetrics);
    }).catch(error => {
      console.error('Error loading workspace metrics:', error);
    });
  }

  private updateCharts(workspaceMetrics: any[]) {
    // Update workspace chart
    this.workspaceChartOptions.series = [{
      name: 'Views',
      data: workspaceMetrics.map(ws => 
        ws.reports.reduce((sum: number, report: any) => 
          sum + report.metrics.views, 0)
      )
    }];
    this.workspaceChartOptions.xaxis.categories = 
      this.workspaces.map(ws => ws.name);

    // Update report chart
    const reportData = workspaceMetrics.flatMap(ws => 
      ws.reports.map((report: any) => ({
        name: report.reportName,
        views: report.metrics.views
      }))
    ).sort((a, b) => b.views - a.views).slice(0, 5);

    this.reportChartOptions.series = reportData.map(r => r.views);
    this.reportChartOptions.labels = reportData.map(r => r.name);
  }
}