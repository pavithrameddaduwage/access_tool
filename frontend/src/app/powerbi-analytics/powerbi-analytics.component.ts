import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { PowerBIService } from '../Services/powerbi.service';

interface Workspace {
  id: string;
  name: string;
}

interface Report {
  id: string;
  name: string;
}

interface PowerBIReport {
  id: string;
  name: string;
  datasetId: string;
  reportType: string;
  workspaceId: string;
}

@Component({
  selector: 'app-powerbi-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Power BI Analytics</h1>
      
      <!-- Debug Panel -->
      <div class="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 class="text-lg font-semibold mb-2">Debug Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p><span class="font-medium">Loading:</span> {{loading}}</p>
            <p><span class="font-medium">Workspace ID:</span> {{workspaceId || 'Not set'}}</p>
            <p><span class="font-medium">Report ID:</span> {{reportId || 'Not set'}}</p>
            <p><span class="font-medium">Error:</span> {{error || 'None'}}</p>
          </div>
          <div>
            <p><span class="font-medium">Workspaces found:</span> {{workspaces ? workspaces.length : 0}}</p>
            <p><span class="font-medium">Reports found:</span> {{reports ? reports.length : 0}}</p>
            <p><span class="font-medium">Data loaded:</span> {{dataLoaded ? 'Yes' : 'No'}}</p>
          </div>
        </div>
        <div class="mt-4">
          <button (click)="loadWorkspaces()" class="bg-blue-500 text-white px-4 py-2 rounded mr-2">
            Load Workspaces
          </button>
          <button *ngIf="workspaceId" (click)="loadReports()" class="bg-green-500 text-white px-4 py-2 rounded mr-2">
            Load Reports
          </button>
          <button *ngIf="workspaceId && reportId" (click)="loadMetrics()" class="bg-purple-500 text-white px-4 py-2 rounded">
            Load Metrics
          </button>
        </div>
      </div>
      
      <!-- Workspaces -->
      <div *ngIf="workspaces && workspaces.length > 0" class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Available Workspaces</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let workspace of workspaces" 
               class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
               [class.bg-blue-50]="workspace.id === workspaceId"
               (click)="selectWorkspace(workspace)">
            <h3 class="font-medium">{{workspace.name}}</h3>
            <p class="text-sm text-gray-600 mt-1">ID: {{workspace.id}}</p>
          </div>
        </div>
      </div>
      
      <!-- Reports -->
      <div *ngIf="reports && reports.length > 0" class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Reports in Selected Workspace</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let report of reports" 
               class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
               [class.bg-green-50]="report.id === reportId"
               (click)="selectReport(report)">
            <h3 class="font-medium">{{report.name}}</h3>
            <p class="text-sm text-gray-600 mt-1">ID: {{report.id}}</p>
          </div>
        </div>
      </div>
      
      <!-- Metrics Data -->
      <div *ngIf="dataLoaded" class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Metrics Data</h2>
        <pre class="bg-gray-100 p-4 rounded-lg overflow-auto text-xs">{{metricsData | json}}</pre>
      </div>
    </div>
  `
})
export class PowerBIAnalyticsComponent implements OnInit {
  loading = false;
  error = '';
  workspaces: Workspace[] = [];
  reports: Report[] = [];
  workspaceId = '';
  reportId = '';
  dataLoaded = false;
  metricsData: any = null;
  selectedReport: PowerBIReport | null = null;

  constructor(private powerBIService: PowerBIService) {}

  ngOnInit() {
    this.loadWorkspaces();
  }

  loadWorkspaces() {
    this.loading = true;
    this.error = '';
    this.workspaces = [];
    
    this.powerBIService.getWorkspaces().subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          this.workspaces = data;
          if (data.length > 0) {
            this.selectWorkspace(data[0]);
          }
        } else {
          this.error = 'Invalid workspace data format';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load workspaces: ${err.message}`;
        this.loading = false;
      }
    });
  }

  selectWorkspace(workspace: Workspace) {
    this.workspaceId = workspace.id;
    this.loadReports();
  }

  loadReports() {
    if (!this.workspaceId) return;
    
    this.loading = true;
    this.error = '';
    this.reports = [];
    
    this.powerBIService.getReports(this.workspaceId).subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          this.reports = data;
          if (data.length > 0) {
            // Try to find a report that might be a usage metrics report
            const usageReport = data.find(r => 
              r.name.toLowerCase().includes('usage') || 
              r.name.toLowerCase().includes('metrics'));
            
            if (usageReport) {
              this.selectReport(usageReport);
            } else if (data.length > 0) {
              this.selectReport(data[0]);
            }
          }
        } else {
          this.error = 'Invalid report data format';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load reports: ${err.message}`;
        this.loading = false;
      }
    });
  }

  selectReport(report: Report) {
    this.reportId = report.id;
    this.loadMetrics();
    this.loadReportData(); // Call this after selecting a report
  }

  loadMetrics() {
    if (!this.workspaceId || !this.reportId) return;
    
    this.loading = true;
    this.error = '';
    this.dataLoaded = false;
    
    this.powerBIService.getReportUsageMetrics(this.workspaceId, this.reportId).subscribe({
      next: (data) => {
        this.metricsData = data;
        this.dataLoaded = true;
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load metrics: ${err.message}`;
        this.loading = false;
      }
    });
  }

  //dataset stuff
  loadReportData() {
    if (!this.selectedReport || !this.workspaceId) {
      // console.log('No report or workspace selected');
      return;
    }

    // console.log('Loading data for:', {
    //   workspaceId: this.workspaceId,
    //   datasetId: this.selectedReport.datasetId,
    //   reportName: this.selectedReport.name
    // });

    // First get tables
    this.powerBIService.getTables(this.workspaceId, this.selectedReport.datasetId)
      .subscribe({
        next: (tables) => {
          // console.log('Available tables:', tables);
          if (tables && tables.length > 0) {
            // Then get data
            this.powerBIService.getReportData(this.workspaceId, this.selectedReport!.datasetId)
              .subscribe({
                next: (data) => {
                  console.log('Report data:', data);
                  // Process data for charts here
                },
                error: (error) => {
                  console.error('Error loading report data:', error);
                  this.error = `Failed to load report data: ${error.message}`;
                }
              });
          }
        },
        error: (error) => {
          console.error('Error loading tables:', error);
          this.error = `Failed to load tables: ${error.message}`;
        }
      });
  }
}