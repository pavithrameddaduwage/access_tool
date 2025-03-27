// dashboard-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HomeService } from '../Services/home.service';
import { UserService } from '../Services/user.service';
import { DashboardService } from '../Services/dashboard.service';
import { SelectWithSearchComponent } from '../components/select_with_search/select_with_search.component';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, SelectWithSearchComponent, FormsModule],
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
    private homeService: HomeService,
    private userService: UserService,
    private dashboardService: DashboardService,
    private toastService: ToastService 
  ) {
    let currentSearchTerm = '';
  
    this.searchTerm$.pipe(
      tap(term => {
        console.log('New search term:', term);
        currentSearchTerm = term;
      }),
      debounceTime(500), // Increased debounce time
      distinctUntilChanged(),
      tap(() => {
        console.log('Starting search after debounce for:', currentSearchTerm);
        this.isSearching = true;
        this.adUsers = [];
      }),
      switchMap(term => {
        if (term !== currentSearchTerm) {
          console.log('Search term changed, skipping old request');
          return of([]);
        }
        
        console.log('Making AD search request for:', term);
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
        console.log('Processing search results:', users);
        // Only update if we're still searching
        if (this.isSearching) {
          this.adUsers = users;
          this.isSearching = false;
          console.log('Updated adUsers array:', this.adUsers);
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
    console.log('Search input changed:', term);
    
    if (term.length >= 3) {
      console.log('Term length >= 3, emitting search');
      this.isSearching = true;
      this.searchTerm$.next(term);
    } else {
      console.log('Term too short, clearing results');
      this.isSearching = false;
      this.adUsers = [];
    }
  }

  selectADUser(user: any): void {
    this.formData = {
      userId: null,
      userName: user.name,
      email: user.email,
      department: user.department,
      isActive: true
    };
    this.adUsers = [];
  }

  ngOnInit() {
    this.dashboardName = this.route.snapshot.paramMap.get('name') || '';
    this.loadUsersForDashboard();
    this.loadAvailableUsers();
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
          .filter(record => record.dashboards.includes(this.dashboardName))
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

}