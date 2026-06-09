// dashboard-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeService } from '../Services/home.service';
import { UserService } from '../Services/user.service';
import { DashboardService } from '../Services/dashboard.service';
import { PowerBIMetricsService } from '../Services/powerbi-metrics.service';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, Subject, switchMap, tap, timeout } from 'rxjs';
import { ToastService } from '../Services/toast.service';

interface UserRecord {
  userId: number;
  userName: string;
  email: string;
  department: string;
}

interface UserOption {
  id: number;
  value: string;
  label: string;
}

@Component({
  selector: 'app-dashboard-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './dashboard-detail.component.html'
})
export class DashboardDetailComponent implements OnInit {
  dashboardName: string = '';
  users: UserRecord[] = [];
  showForm: boolean = false;
  userOptions: UserOption[] = [];

  searchTerm$ = new Subject<string>();
  adUsers: any[] = [];
  isSearching = false;

  lastRefreshedAt: string = '';

  // Usage analytics
  activeTab: 'access' | 'usage' = 'access';
  usagePeriod = 30;
  usageLoading = false;
  usageData: {
    totalViews: number;
    uniqueViewers: number;
    viewers: { userId: string; views: number; lastSeen: string; reports: string[] }[];
    topReports: { reportId: string; reportName: string; views: number; uniqueViewers: number }[];
    pageTimeBreakdown: { tabName: string; totalSeconds: number; uniqueUsers: number }[];
  } | null = null;
  selectedViewerId: string | null = null;
  selectedViewerDisplayName = '';
  viewerTabUsage: { reportId: string; reportName: string; tabName: string; totalSeconds: number }[] = [];
  viewerTabUsageLoading = false;
  viewersChartOptions: any = null;
  pageTimeChartOptions: any = null;
  usagePeriods = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 },
  ];

  
  formData = {
    userId: null as number | null,
    userName: '',
    email: '',
    department: '',
    isActive: true // Add this with default value
  };

  tableHeaders = [
    { name: 'userName', display_name: 'User', width: '25%' },
    { name: 'email', display_name: 'Email', width: '25%' },
    { name: 'department', display_name: 'Department', width: '25%' },
    { name: 'actions', display_name: 'Actions', width: '25%' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private homeService: HomeService,
    private userService: UserService,
    private dashboardService: DashboardService,
    private toastService: ToastService,
    private powerBIMetricsService: PowerBIMetricsService
  ) {
    let currentSearchTerm = '';
  
    this.searchTerm$.pipe(
      tap(term => {
        // console.log('New search term:', term);
        currentSearchTerm = term;
      }),
      debounceTime(500), // Increased debounce time
      distinctUntilChanged(),
      tap(() => {
        // console.log('Starting search after debounce for:', currentSearchTerm);
        this.isSearching = true;
        this.adUsers = [];
      }),
      switchMap(term => {
        if (term !== currentSearchTerm) {
          // console.log('Search term changed, skipping old request');
          return of([]);
        }
        
        // console.log('Making AD search request for:', term);
        return this.homeService.searchADUsers(term).pipe(
          tap(results => console.log('Search results received for term:', term, results)),
          catchError(error => {
            console.error('Search error:', error);
            return of([]);
          })
        );
      })
    ).subscribe({
      next: (users) => {
        // console.log('Processing search results:', users);
        // Only update if we're still searching
        if (this.isSearching) {
          this.adUsers = users;
          this.isSearching = false;
          // console.log('Updated adUsers array:', this.adUsers);
        }
      },
      error: (err) => {
        console.error('Subscription error:', err);
        this.adUsers = [];
        this.isSearching = false;
      }
    });
  }

  onUserSearch(event: any): void {
    const term = event.target.value.trim();
    // console.log('Search input changed:', term);
    
    if (term.length >= 3) {
      // console.log('Term length >= 3, emitting search');
      this.isSearching = true;
      this.searchTerm$.next(term);
    } else {
      // console.log('Term too short, clearing results');
      this.isSearching = false;
      this.adUsers = [];
    }
  }

  // selectADUser(user: any): void {
  //   this.formData = {
  //     userId: null,
  //     userName: user.name,
  //     email: user.email,
  //     department: user.department,
  //     isActive: true
  //   };
  //   this.adUsers = [];
  // }
  selectADUser(user: any): void {
    this.formData = {
      ...this.formData, // Keep existing values
      userId: null,
      userName: user.name,
      email: user.email,
      department: this.formData.department || user.department // Use existing if set, otherwise AD value
    };
    this.adUsers = [];
  }

  ngOnInit() {
    this.dashboardName = this.route.snapshot.paramMap.get('name') || '';
    this.loadUsersForDashboard();
    this.loadAvailableUsers();
    this.loadUsageData();
    this.powerBIMetricsService.getLastRefresh().subscribe({
      next: (res) => { if (res?.lastRefreshedAt) this.lastRefreshedAt = res.lastRefreshedAt; },
      error: () => {}
    });
  }

  loadAvailableUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        const existingUserIds = new Set(this.users.map(u => u.userId));
        this.userOptions = users
          .filter(user => !existingUserIds.has(user.id))
          .map(user => ({
            id: user.id,
            value: user.name,
            label: user.name
          }));
      },
      error: (error) => console.error('Error loading users:', error)
    });
  }

  loadUsersForDashboard() {
    this.homeService.getRecords().subscribe({
      next: (records) => {
        this.users = records
          .filter(record => record.dashboards.includes(this.dashboardName) && 
          record.isActive)    //change here
          .map(record => ({
            userId: record.userId,
            userName: record.userName,
            email: record.email,
            department: record.department
          }));
        this.loadAvailableUsers();
      },
      error: (error) => console.error('Error loading users:', error)
    });
  }

  onUserChange(selectedUserName: string) {
    this.userService.getUsers().subscribe({
      next: (users) => {
        const selectedUser = users.find(user => user.name === selectedUserName);
        if (selectedUser) {
          this.formData = {
            userId: selectedUser.id,
            userName: selectedUser.name,
            email: selectedUser.email,
            department: selectedUser.department?.department || '',
            isActive: selectedUser.isActive // Add this parameter
          };
        }
      },
      error: (error) => console.error('Error finding user:', error)
    });
  }


  async addUserToDashboard() {
    if (!this.formData.email) {
      this.toastService.show('Please select a user');
      return;
    }
  
    this.dashboardService.getDashboards().subscribe({
      next: (dashboards) => {
        const dashboard = dashboards.find(d => d.dashboard === this.dashboardName);
        if (!dashboard) {
          this.toastService.show('Dashboard not found');
          return;
        }
  
        this.homeService.getRecords().subscribe({
          next: (records) => {
            const userRecord = records.find(record => record.email === this.formData.email);
            
            // Check if user already has access to this dashboard
            if (userRecord?.dashboards.includes(this.dashboardName)) {
              this.toastService.show('User already has access to this dashboard');
              return;
            }
  
            const existingDashboardIds = userRecord ? 
              dashboards
                .filter(d => userRecord.dashboards.includes(d.dashboard))
                .map(d => d.id) 
              : [];
  
            const allDashboardIds = [...existingDashboardIds, dashboard.id];
            
            this.homeService.updateRecord(
              this.formData.email, 
              this.formData.userName,
              this.formData.department,
              allDashboardIds,
              this.formData.isActive // Add this parameter
            ).subscribe({
              next: () => {
                this.loadUsersForDashboard();
                this.closeForm();
                this.toastService.show('User added successfully');
              },
              error: (error) => {
                console.error('Error updating user-dashboard:', error);
                this.toastService.show('Failed to add user');
              }
            });
          },
          error: (error) => {
            console.error('Error getting user records:', error);
            this.toastService.show('Failed to get user records');
          }
        });
      },
      error: (error) => {
        console.error('Error getting dashboard:', error);
        this.toastService.show('Failed to get dashboard details');
      }
    });
  }


  openForm() {
    this.showForm = true;
    this.formData = {
      userId: null,
      userName: '',
      email: '',
      department: '',
      isActive: true
    };
  }

 
deleteUser(email: string) {
  this.showConfirmDialog = true;
  this.userToDelete = email;
}
  closeForm() {
    this.showForm = false;
    this.formData = {
      userId: null,
      userName: '',
      email: '',
      department: '',
      isActive: true
    };
  }


  showConfirmDialog = false;
userToDelete: string | null = null;


cancelDelete() {
  this.showConfirmDialog = false;
  this.userToDelete = null;
}

confirmDelete() {
  if (this.userToDelete) {
    this.homeService.deleteRecord(this.userToDelete).subscribe({
      next: () => {
        this.loadUsersForDashboard();
        this.toastService.show('User removed successfully', 'success');
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.toastService.show('Failed to remove user', 'error');
      }
    });
    this.showConfirmDialog = false;
    this.userToDelete = null;
  }
}

switchTab(tab: 'access' | 'usage') {
  this.activeTab = tab;
  if (tab === 'usage' && !this.usageData) {
    this.loadUsageData();
  }
}

loadUsageData(days?: number) {
  if (days !== undefined) this.usagePeriod = days;
  this.usageLoading = true;
  this.usageData = null;
    this.selectedViewerId = null;
    this.selectedViewerDisplayName = '';
    this.viewerTabUsage = [];

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
        console.error('Failed to load dashboard usage data:', error);
        this.usageLoading = false;
      }
    });
  }

  openTabUsagePage() {
    this.router.navigate(['/dashboard-tab-usage', this.dashboardName]);
  }

  loadViewerTabUsage(userId: string) {
  this.selectedViewerId = userId;
  this.selectedViewerDisplayName = userId.split('@')[0] || userId;
  this.viewerTabUsage = [];
  this.viewerTabUsageLoading = true;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - this.usagePeriod);

  this.powerBIMetricsService.getUserTimeSpent(userId, startDate, endDate).subscribe({
    next: (data) => {
      const dashboardReportIds = new Set((this.usageData?.topReports || []).map(r => r.reportId));
      const filtered = dashboardReportIds.size > 0
        ? data.filter((row: any) => dashboardReportIds.has(row.reportId))
        : data;

      this.viewerTabUsage = filtered
        .sort((a: any, b: any) => (b.totalSeconds || 0) - (a.totalSeconds || 0))
        .map((r: any) => ({
          reportId: r.reportId,
          reportName: r.reportName || 'Unknown Report',
          tabName: r.tabName || 'Overview',
          totalSeconds: r.totalSeconds || 0
        }));
      this.viewerTabUsageLoading = false;
    },
    error: (error) => {
      console.error('Error loading viewer tab usage:', error);
      this.viewerTabUsage = [];
      this.viewerTabUsageLoading = false;
    }
  });
}

private prepareUsageCharts(data: typeof this.usageData) {
  if (!data) return;

  // Who Viewed — top 10 viewers by view count
  const topViewers = data.viewers.slice(0, 10);
  this.viewersChartOptions = {
    series: [{ name: 'Views', data: topViewers.map(v => v.views) }],
    chart: { type: 'bar', height: 280, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 4, borderRadiusApplication: 'end' } },
    xaxis: {
      categories: topViewers.map(v => { const n = v.userId.split('@')[0]; return n.length > 22 ? n.slice(0, 22) + '…' : n; }),
      labels: { style: { fontSize: '10px', colors: '#64748b' } }
    },
    yaxis: { labels: { style: { fontSize: '11px', colors: '#334155', fontWeight: 500 } } },
    dataLabels: { enabled: true, style: { fontSize: '10px', colors: ['#fff'], fontWeight: '600' }, offsetX: -6 },
    colors: ['#0077B6'],
    tooltip: { y: { formatter: (v: number) => `${v} views` } }
  };

  // Page-wise Time Spent chart
  const pages = (data.pageTimeBreakdown || []).slice(0, 10);
  if (pages.length > 0) {
    this.pageTimeChartOptions = {
      series: [{ name: 'Time Spent (h)', data: pages.map(p => parseFloat(((p.totalSeconds || 0) / 3600).toFixed(1))) }],
      chart: { type: 'bar', height: 280, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 4, borderRadiusApplication: 'end' } },
      xaxis: {
        categories: pages.map(p => { const n = p.tabName || 'Main'; return n.length > 22 ? n.slice(0, 22) + '…' : n; }),
        labels: { style: { fontSize: '10px', colors: '#64748b' } }
      },
      yaxis: { labels: { style: { fontSize: '11px', colors: '#334155', fontWeight: 500 } } },
      dataLabels: { enabled: true, style: { fontSize: '10px', colors: ['#fff'], fontWeight: '600' }, offsetX: -6,
        formatter: (v: number) => v > 0 ? `${v}h` : '' },
      colors: ['#ffb703'],
      tooltip: { y: { formatter: (v: number) => `${v}h` } }
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

}