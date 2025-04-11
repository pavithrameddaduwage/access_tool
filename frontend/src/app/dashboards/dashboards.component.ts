import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../Services/dashboard.service';
import { HomeService } from '../Services/home.service';
import { GroupService } from '../Services/group.service';
import { UserService } from '../Services/user.service';
import { WorkspaceService } from '../Services/workspace.service';
import { FormsModule } from '@angular/forms';
import { SelectWithSearchComponent } from '../components/select_with_search/select_with_search.component';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap, tap } from 'rxjs';
import { ToastService } from '../Services/toast.service';
import { ConfirmationService } from '../Services/confirmation.service';



interface Dashboard {
  id: number;
  dashboard: string;
  dashboardTypes: Array<{ type: { id: number; type: string } }>;
  dashboardValuetypes: Array<{ valuetype: { id: number; valuetype: string } }>;
  dashboardWorkspaces: Array<{ workspace: { id: number; workspace: string } }>;
  group?: {   
    id: number;
    group: string;
  };
  isExpanded?: boolean;
  users?: Array<{
    userId: number;
    userName: string;
    email: string;
    department: string;
  }>;
  totalUsers?: number;
}

interface DashboardOption extends HeaderOption {
  workspaceIds?: number[];
}

interface WorkspaceGroup {
  workspace: string;
  dashboards: Dashboard[];
}

interface DashboardGroup {
  id: number;
  name: string;  
  dashboards: Dashboard[];  
}

interface HeaderOption {
  id: number;
  value: string;
  label: string;
}

interface WorkspaceOption {
  id: number;
  value: string;
  label: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  department?: { id: number; department: string };
}

interface UserDashboardRecord {
  id?: number;
  userId: number;
  userName: string;
  email: string;
  department: string;
  dashboards: string[];
  isExpanded?: boolean;
  isActive: boolean;          // Add this
  lastActiveAt?: string;      // Add this
}

@Component({
  selector: 'app-dashboards',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectWithSearchComponent],
  templateUrl: './dashboards.component.html',
  styleUrls: ['./dashboards.component.css']
})
export class DashboardsComponent implements OnInit {
  // Dashboard View Properties
  dashboards: Dashboard[] = [];
  filteredDashboards: Dashboard[] = [];
  workspaceGroups: WorkspaceGroup[] = [];
  viewMode: 'users' | 'disk' | 'matrix' = 'disk';
  searchTerm: string = '';
  selectedGroup: string | null = null;
  dashboardGroups: DashboardGroup[] = [];

  isGroupDropdownOpen = false;
  isWorkspaceDropdownOpen = false;
  selectedWorkspace: string | null = null;
  uniqueWorkspaces: string[] = [];
  

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  // User Dashboard Properties
  records: UserDashboardRecord[] = [];
  showForm = false;
  isEditMode = false;
  selectedRowIndex: number | null = null;
  selectedDashboards: string[] = [];

  // Add this to your component properties

  userSearchTerm: string = '';
  filteredRecords: UserDashboardRecord[] = [];
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

toggleDropdown(event: Event) {
  event.stopPropagation(); // Prevent event bubbling
  this.isGroupDropdownOpen = !this.isGroupDropdownOpen;
  console.log('Dropdown state:', this.isGroupDropdownOpen); // Add this to debug
}
  // Options
  userOptions: HeaderOption[] = [];
  workspaceOptions: WorkspaceOption[] = [];
  dashboardOptions: HeaderOption[] = [];
  allDashboardOptions: DashboardOption[] = []; 
  // Edit Form
  editForm = {
    email: '',
    userName: '',
    department: '',
    workspace: '',
    dashboards: [] as string[],
    isActive: true        // Add this
  };

  // Headers
  matrixHeaders = [
    { name: 'actions', display_name: 'Actions', width: '8%' },
    { name: 'dashboard', display_name: 'Dashboard', width: '22%' },
    { name: 'workspace', display_name: 'Workspace', width: '20%' },
    { name: 'type', display_name: 'Type', width: '20%' },
    { name: 'valuetype', display_name: 'Type Value', width: '20%' },
    { name: 'totalUsers', display_name: 'Total Users', width: '10%' }
  ];

  userHeaders = [
    { name: 'userName', display_name: 'User', width: '33%' },
    { name: 'email', display_name: 'Email', width: '34%' },
    { name: 'department', display_name: 'Department', width: '33%' }
  ];

  userDashboardHeaders = [
    {
      name: 'actions',
      display_name: 'Actions',
      width: '10%',
      class: 'bg-gray-100 text-gray-700',
      sortable: false
    },
    {
      name: 'userName',
      display_name: 'User',
      width: '20%', // Reduced from 25%
      class: 'bg-gray-100 text-gray-700',
      sortable: true
    },
    {
      name: 'department',
      display_name: 'Department',
      width: '20%',
      class: 'bg-gray-100 text-gray-700',
      sortable: true
    },
    {
      name: 'email',
      display_name: 'Email',
      width: '20%',
      class: 'bg-gray-100 text-gray-700',
      sortable: true
    },
    {
      name: 'isActive',
      display_name: 'Status',
      width: '10%',
      class: 'bg-gray-100 text-gray-700',
      sortable: true
    },
    {
      name: 'dashboards',
      display_name: 'Dashboards',
      width: '20%', // Reduced from 25%
      class: 'bg-gray-100 text-gray-700',
      sortable: false
    }
  ];

  searchTerm$ = new Subject<string>();
adUsers: any[] = [];
isSearching = false;

searchUsers(event: Event) {
  const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
  this.userSearchTerm = searchTerm;
  this.filterRecords();
}

filterRecords() {
  this.filteredRecords = this.records.filter(record => {
    return (
      record.userName.toLowerCase().includes(this.userSearchTerm) ||
      record.email.toLowerCase().includes(this.userSearchTerm) ||
      record.department.toLowerCase().includes(this.userSearchTerm) ||
      record.dashboards.some(dashboard => 
        dashboard.toLowerCase().includes(this.userSearchTerm)
      )
    );
  });
  if (this.sortColumn) {
    this.sortRecords(this.sortColumn);
  }
}

sortRecords(column: string) {
  if (!column || !this.userDashboardHeaders.find(h => h.name === column)?.sortable) {
    return;
  }

  if (this.sortColumn === column) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }

  this.filteredRecords.sort((a: any, b: any) => {
    const valueA = a[column]?.toLowerCase() || '';
    const valueB = b[column]?.toLowerCase() || '';
    
    if (this.sortDirection === 'asc') {
      return valueA.localeCompare(valueB);
    } else {
      return valueB.localeCompare(valueA);
    }
  });
}

  constructor(
    private dashboardService: DashboardService,
    private homeService: HomeService,
    private router: Router,
    private groupService: GroupService,
    private userService: UserService,
    private workspaceService: WorkspaceService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {
    let currentSearchTerm = '';

    this.searchTerm$.pipe(
      tap(term => {
        console.log('New search term:', term);
        currentSearchTerm = term;
      }),
      debounceTime(500),  // Increased from 300 to 500
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
// selectADUser(user: any): void {
//   console.log('AD User:', user); // Check incoming user data structure

//   if (this.viewMode === 'matrix') {
//     this.formData = {
//       userId: null,
//       userName: user.name,
//       email: user.email,
//       department: user.department
//     };
//     console.log('Updated formData:', this.formData);
//   } else {
//     const prevForm = { ...this.editForm };
//     this.editForm = {
//       ...this.editForm,
//       userName: user.name,
//       email: user.email,
//       department: user.department,
//       isActive: true 
//     };
//     console.log('Previous form:', prevForm);
//     console.log('Updated editForm:', this.editForm);
//   }
  
//   this.adUsers = [];
// }
selectADUser(user: any): void {
  console.log('AD User:', user);
  
  if (this.viewMode === 'matrix') {
    // For matrix view, preserve any existing department value
    const currentDepartment = this.formData.department;
    this.formData = {
      userId: null,
      userName: user.name,
      email: user.email,
      department: currentDepartment || user.department // Use existing if set, otherwise AD value
    };
  } else {
    // For other views
    const currentDepartment = this.editForm.department;
    this.editForm = {
      ...this.editForm,
      userName: user.name,
      email: user.email,
      department: currentDepartment || user.department, // Use existing if set, otherwise AD value
      isActive: true 
    };
  }
  
  this.adUsers = [];
}

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const groupDropdownElement = document.querySelector('.group-dropdown');
    const workspaceDropdownElement = document.querySelector('.workspace-dropdown');
    
    if (groupDropdownElement && !groupDropdownElement.contains(event.target as Node)) {
      this.isGroupDropdownOpen = false;
    }
    
    if (workspaceDropdownElement && !workspaceDropdownElement.contains(event.target as Node)) {
      this.isWorkspaceDropdownOpen = false;
    }
  }

  toggleGroupDropdown(event: Event) {
    event.stopPropagation();
    this.isGroupDropdownOpen = !this.isGroupDropdownOpen;
    this.isWorkspaceDropdownOpen = false;
  }
  
  toggleWorkspaceDropdown(event: Event) {
    event.stopPropagation();
    this.isWorkspaceDropdownOpen = !this.isWorkspaceDropdownOpen;
    this.isGroupDropdownOpen = false;
  }
  
  setSelectedGroup(groupName: string | null) {
    this.selectedGroup = groupName;
    this.isGroupDropdownOpen = false;
    this.filterDashboards();
  }
  
  setSelectedWorkspace(workspace: string | null) {
    this.selectedWorkspace = workspace;
    this.isWorkspaceDropdownOpen = false;
    this.filterDashboards();
  }
  ngOnInit() {
    this.loadDashboards();
   // this.loadUsers();
    this.loadWorkspaces();
    this.loadRecords();
    this.loadAllDashboards();  
  }

  filterDashboards() {
    let filtered = [...this.dashboards];
  
    if (this.selectedGroup) {
      const group = this.dashboardGroups.find(g => g.name === this.selectedGroup);
      if (group) {
        filtered = filtered.filter(dashboard => 
          dashboard.group?.id === group.id
        );
      }
    }
  
    if (this.selectedWorkspace) {
      filtered = filtered.filter(dashboard =>
        dashboard.dashboardWorkspaces.some(ws => 
          ws.workspace.workspace === this.selectedWorkspace
        )
      );
    }
  
    this.filteredDashboards = filtered;
    this.groupDashboardsByWorkspace();
  }
  loadAllDashboards() {
    this.dashboardService.getDashboards().subscribe({
      next: (dashboards) => {
        this.allDashboardOptions = dashboards.map(dashboard => ({
          id: dashboard.id,
          value: dashboard.dashboard,
          label: dashboard.dashboard,
          workspaceIds: dashboard.dashboardWorkspaces.map(dw => dw.workspace.id)
        }));
        this.filterDashboardOptions();
      },
      error: (error) => console.error('Error loading dashboards:', error)
    });
  }
  private loadGroups() {
    this.groupService.getGroups().subscribe({
      next: (groups) => {
        this.dashboardGroups = groups.map(group => ({
          id: group.id,
          name: group.group,
          dashboards: this.dashboards.filter(dashboard => 
            dashboard.group?.id === group.id
          )
        }));
      },
      error: (error) => console.error('Error loading groups:', error)
    });
  }

  loadDashboards() {
    this.dashboardService.getDashboards().subscribe({
      next: (data) => {
        this.dashboards = data.map(dashboard => ({
          ...dashboard,
          isExpanded: false,
          users: [],
          totalUsers: 0
        }));
        this.filteredDashboards = [...this.dashboards];
        this.loadUserCounts();
        this.groupDashboardsByWorkspace();
        this.loadGroups();
        this.loadUniqueWorkspaces();
      },
      error: (error) => console.error('Error loading dashboards:', error)
    });
  }

  loadUniqueWorkspaces() {
    const workspaceSet = new Set<string>();
    this.dashboards.forEach(dashboard => {
      dashboard.dashboardWorkspaces.forEach(ws => {
        workspaceSet.add(ws.workspace.workspace);
      });
    });
    this.uniqueWorkspaces = Array.from(workspaceSet).sort();
  }

  // User Dashboard Methods
  // loadUsers() {
  //   this.userService.getUsers().subscribe({
  //     next: (users) => {
  //       this.userOptions = users.map(user => ({
  //         id: user.id,
  //         value: user.name,
  //         label: user.name
  //       }));
  //     },
  //     error: (error) => console.error('Error loading users:', error)
  //   });
  // }

  loadWorkspaces() {
    this.workspaceService.getWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspaceOptions = workspaces.map(workspace => ({
          id: workspace.id,
          value: workspace.workspace,
          label: workspace.workspace
        }));
      },
      error: (error) => console.error('Error loading workspaces:', error)
    });
  }

  // loadRecords() {
  //   this.homeService.getRecords().subscribe({
  //     next: (records) => {
  //       this.records = records.map(record => ({
  //         ...record,
  //         isExpanded: false
  //       }));
  //     },
  //     error: (error) => {
  //       console.error('Error loading records:', error);
  //       alert('Failed to load records');
  //     }
  //   });
  // }
// Update loadRecords() to handle new fields
loadRecords() {
  this.homeService.getRecords().subscribe({
    next: (records) => {
      this.records = records.map(record => ({
        ...record,
        isExpanded: false,
        // Remove the default value here since backend now provides it
        isActive: record.isActive 
      }));
      this.filteredRecords = [...this.records];
    },
    error: (error) => {
      console.error('Error loading records:', error);
      alert('Failed to load records');
    }
  });
}

  groupDashboardsByWorkspace() {
    const groupsMap = new Map<string, Dashboard[]>();
    groupsMap.set('No Workspace', []);

    this.filteredDashboards.forEach(dashboard => {
      const workspaces = dashboard.dashboardWorkspaces;
      if (!workspaces || workspaces.length === 0) {
        const noWorkspaceDashboards = groupsMap.get('No Workspace') || [];
        noWorkspaceDashboards.push(dashboard);
        groupsMap.set('No Workspace', noWorkspaceDashboards);
      } else {
        workspaces.forEach(ws => {
          const workspaceName = ws.workspace.workspace;
          const existingDashboards = groupsMap.get(workspaceName) || [];
          existingDashboards.push(dashboard);
          groupsMap.set(workspaceName, existingDashboards);
        });
      }
    });

    this.workspaceGroups = Array.from(groupsMap.entries())
      .map(([workspace, dashboards]) => ({
        workspace,
        dashboards: dashboards.sort((a, b) => a.dashboard.localeCompare(b.dashboard))
      }))
      .sort((a, b) => {
        if (a.workspace === 'No Workspace') return 1;
        if (b.workspace === 'No Workspace') return -1;
        return a.workspace.localeCompare(b.workspace);
      });
  }

  loadUserCounts() {
    this.homeService.getRecords().subscribe({
      next: (records) => {
        this.dashboards = this.dashboards.map(dashboard => {
          const users = records.filter(record => 
            record.dashboards.includes(dashboard.dashboard)
          );
          return {
            ...dashboard,
            users: users.map(user => ({
              userId: user.userId,
              userName: user.userName,
              email: user.email,
              department: user.department
            })),
            totalUsers: users.length
          };
        });
        this.filteredDashboards = [...this.dashboards];
        this.groupDashboardsByWorkspace();
      },
      error: (error) => console.error('Error loading user counts:', error)
    });
  }

// openForm(mode: 'add' | 'edit', record?: UserDashboardRecord, index?: number) {
//   this.isEditMode = mode === 'edit';
//   this.showForm = true;
  
//   if (mode === 'edit' && record) {
//     this.selectedRowIndex = index ?? null;
//     const dashboard = this.allDashboardOptions.find(d => d.value === record.dashboards[0]);
//     const workspaceId = dashboard?.workspaceIds?.[0];
//     const workspace = this.workspaceOptions.find(w => w.id === workspaceId);
    
//     this.editForm = {
//       userName: record.userName,
//       email: record.email,
//       department: record.department,
//       workspace: workspace?.value || '',
//       dashboards: [...record.dashboards],
//       isActive: record.isActive // Add this

//     };
//     this.selectedWorkspace = workspace?.value || '';
//     this.selectedDashboards = [...record.dashboards];
//     this.filterDashboardOptions();
//   } else {
//     this.resetForm();
//   }
// }
openForm(mode: 'add' | 'edit', record?: UserDashboardRecord, index?: number) {
  this.isEditMode = mode === 'edit';
  this.showForm = true;
  
  if (mode === 'edit' && record) {
    this.selectedRowIndex = index ?? null;
    const dashboard = this.allDashboardOptions.find(d => d.value === record.dashboards[0]);
    const workspaceId = dashboard?.workspaceIds?.[0];
    const workspace = this.workspaceOptions.find(w => w.id === workspaceId);
    
    this.editForm = {
      userName: record.userName,
      email: record.email,
      department: record.department, // Keep existing department
      workspace: workspace?.value || '',
      dashboards: [...record.dashboards],
      isActive: record.isActive
    };
    this.selectedWorkspace = workspace?.value || '';
    this.selectedDashboards = [...record.dashboards];
    this.filterDashboardOptions();
  } else {
    this.resetForm();
  }
}

  closeForm() {
    this.showForm = false;
    this.isEditMode = false;
    this.resetForm();
  }

  resetForm() {
    this.editForm = {
      userName: '',
      email: '',
      department: '',
      workspace: '',
      dashboards: [],
      isActive: true // Add this
      
    };
    this.selectedDashboards = [];
    this.selectedWorkspace = '';
    this.selectedRowIndex = null;
  }


  onDashboardChange(event: string) {
    if (!this.selectedWorkspace) {
      console.error('Please select a workspace first');
      return;
    }
    
    if (!this.selectedDashboards.includes(event)) {
      this.selectedDashboards.push(event);
      this.editForm.dashboards = [...this.selectedDashboards];
    }
  }

  removeDashboard(index: number) {
    this.selectedDashboards.splice(index, 1);
    this.editForm.dashboards = [...this.selectedDashboards];
  }

  onWorkspaceChange(event: string) {
    this.selectedWorkspace = event;
    this.editForm.workspace = event;
    this.filterDashboardOptions();
  }

  filterDashboardOptions() {
    if (!this.selectedWorkspace) {
      this.dashboardOptions = [];
      return;
    }

    const selectedWorkspaceObj = this.workspaceOptions.find(
      w => w.value === this.selectedWorkspace
    );

    if (!selectedWorkspaceObj) {
      this.dashboardOptions = [];
      return;
    }

    this.dashboardOptions = this.allDashboardOptions
      .filter(dashboard => dashboard.workspaceIds?.includes(selectedWorkspaceObj.id))
      .map(dashboard => ({
        id: dashboard.id,
        value: dashboard.value,
        label: dashboard.label
      }));
  }

  searchDashboards(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    let filtered = this.dashboards;
    
    if (this.selectedGroup) {
      const group = this.dashboardGroups.find(g => g.name === this.selectedGroup);
      if (group) {
        filtered = filtered.filter(dashboard => 
          dashboard.group?.id === group.id
        );
      }
    }
  
    this.filteredDashboards = filtered.filter(dashboard => {
      const dashboardName = dashboard.dashboard.toLowerCase();
      const types = dashboard.dashboardTypes.map(dt => dt.type.type.toLowerCase());
      const valueTypes = dashboard.dashboardValuetypes.map(dvt => dvt.valuetype.valuetype.toLowerCase());
      
      return dashboardName.includes(this.searchTerm) || 
             types.some(type => type.includes(this.searchTerm)) ||
             valueTypes.some(valueType => valueType.includes(this.searchTerm));
    });
    this.groupDashboardsByWorkspace();
  }

  scrollGroups(direction: 'left' | 'right') {
    const container = this.scrollContainer.nativeElement;
    const scrollAmount = 300;
    
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  }

  navigateToDashboard(dashboard: Dashboard) {
    this.router.navigate(['/dashboard-detail', dashboard.dashboard]);
  }

  getTypesString(dashboard: Dashboard): string {
    return dashboard.dashboardTypes
      .map(dt => dt.type.type)
      .join(', ');
  }

  getValueTypesString(dashboard: Dashboard): string {
    return dashboard.dashboardValuetypes
      .map(dvt => dvt.valuetype.valuetype)
      .join(', ');
  }

  toggleView(mode: 'users' | 'disk' | 'matrix') {
    this.viewMode = mode;
  }

  toggleRowExpansion(index: number) {
    if (this.viewMode === 'matrix') {
      this.filteredDashboards[index].isExpanded = !this.filteredDashboards[index].isExpanded;
    } else if (this.viewMode === 'users') {
      this.records[index].isExpanded = !this.records[index].isExpanded;
    }
  }

  getWorkspacesString(dashboard: Dashboard): string {
    return dashboard.dashboardWorkspaces
      ?.map(dw => dw.workspace.workspace)
      .join(', ') || 'No Workspace';
  }

  onSave() {
     const dashboardIds = this.editForm.dashboards
    .map(dashboardName => {
      const dashboard = this.allDashboardOptions.find(d => d.value === dashboardName);
      return dashboard ? dashboard.id : null;
    })
    .filter((id): id is number => id !== null);

  if (this.isEditMode) {
    this.homeService.updateRecord(
      this.editForm.email,
      this.editForm.userName,
      this.editForm.department,
      dashboardIds,
      this.editForm.isActive // Make sure this is included
    ).subscribe({
      next: () => {
        this.loadRecords();
        this.closeForm();
        this.toastService.show('Record updated successfully');
      },
      error: (error) => {
        console.error('Error updating record:', error);
        this.toastService.show(error.error?.message || 'Failed to update record');
      }
    });
  } else {
      this.homeService.createRecord(
        this.editForm.email,
        this.editForm.userName,
        this.editForm.department,
        dashboardIds,
        this.editForm.isActive // Make sure this is included
      ).subscribe({
        next: () => {
          this.loadRecords();
          this.closeForm();
          this.toastService.show('Record created successfully');
        },
        error: (error) => {
          console.error('Error creating record:', error);
          if (error.status === 409) {
            this.toastService.show('User already exists');
          } else {
            this.toastService.show(error.error?.message || 'Failed to create record');
          }
        }
      });
    }
  }
  
  // deleteRecord(record: any) {
  //   if (confirm('Are you sure you want to delete this record?')) {
  //     this.homeService.deleteRecord(record.email).subscribe({
  //       next: () => {
  //         this.loadRecords();
  //         this.loadUserCounts();
  //         this.toastService.show('Record deleted successfully');
  //       },
  //       error: (error) => {
  //         console.error('Error deleting record:', error);
  //         this.toastService.show('Failed to delete record');
  //       }
  //     });
  //   }
  // }

  deleteRecord(record: any) {
    this.confirmationService.show(
      'Delete Record',
      'Are you sure you want to delete this record?',
      () => {
        this.homeService.deleteRecord(record.email).subscribe({
          next: () => {
            this.loadRecords();
            this.toastService.show('Record deleted successfully', 'success');
          },
          error: (error) => {
            console.error('Error deleting record:', error);
            this.toastService.show('Failed to delete record', 'error');
          }
        });
      }
    );
  }
  
  selectedDashboard: Dashboard | null = null;
formData = {
  userId: null as number | null,
  userName: '',
  email: '',
  department: ''
};

openAddUserForm(dashboard: Dashboard) {
  this.selectedDashboard = dashboard;
  this.showForm = true;
  this.formData = {
    userId: null,
    userName: '',
    email: '',
    department: ''
  };
}

// async addUserToDashboard() {
//   if (!this.formData.email || !this.selectedDashboard) {
//     this.toastService.show('Please select a user');
//     return;
//   }

//   this.dashboardService.getDashboards().subscribe({
//     next: (dashboards) => {
//       this.homeService.getRecords().subscribe({
//         next: (records) => {
//           const userRecord = records.find(record => record.email === this.formData.email);
          
//           // Check if user already has access to this dashboard
//           if (userRecord?.dashboards.includes(this.selectedDashboard!.dashboard)) {
//             this.toastService.show('User already has access to this dashboard');
//             return;
//           }

//           const existingDashboardIds = userRecord ? 
//             dashboards
//               .filter(d => userRecord.dashboards.includes(d.dashboard))
//               .map(d => d.id) 
//             : [];

//           const allDashboardIds = [...existingDashboardIds, this.selectedDashboard!.id];
          
//           this.homeService.updateRecord(
//             this.formData.email, 
//             this.formData.userName,
//             this.formData.department,
//             allDashboardIds
//           ).subscribe({
//             next: () => {
//               this.loadUserCounts();
//               this.closeForm();
//               this.toastService.show('User added successfully');
//             },
//             error: (error) => {
//               console.error('Error updating user-dashboard:', error);
//               this.toastService.show(error.error?.message || 'Failed to add user');
//             }
//           });
//         },
//         error: (error) => {
//           console.error('Error getting user records:', error);
//           this.toastService.show('Failed to get user records');
//         }
//       });
//     },
//     error: (error) => {
//       console.error('Error getting dashboard:', error);
//       this.toastService.show('Failed to get dashboard details');
//     }
//   });
// }


// deleteUser(email: string) {
//   if (confirm('Are you sure you want to remove this user?')) {
//     this.homeService.deleteRecord(email).subscribe({
//       next: () => {
//         this.loadUserCounts();
//         this.loadRecords();
//         this.toastService.show('User removed successfully');
//       },
//       error: (error) => {
//         console.error('Error deleting user:', error);
//         this.toastService.show('Failed to remove user');
//       }
//     });
//   }
// }
async addUserToDashboard() {
  if (!this.formData.email || !this.selectedDashboard) {
    this.toastService.show('Please select a user');
    return;
  }

  this.dashboardService.getDashboards().subscribe({
    next: (dashboards) => {
      this.homeService.getRecords().subscribe({
        next: (records) => {
          const userRecord = records.find(record => record.email === this.formData.email);
          
          if (userRecord?.dashboards.includes(this.selectedDashboard!.dashboard)) {
            this.toastService.show('User already has access to this dashboard');
            return;
          }

          const existingDashboardIds = userRecord ? 
            dashboards
              .filter(d => userRecord.dashboards.includes(d.dashboard))
              .map(d => d.id) 
            : [];

          const allDashboardIds = [...existingDashboardIds, this.selectedDashboard!.id];
          
          this.homeService.updateRecord(
            this.formData.email, 
            this.formData.userName,
            this.formData.department,
            allDashboardIds,
            true // Default to active when adding a user
          ).subscribe({
            next: () => {
              this.loadUserCounts();
              this.closeForm();
              this.toastService.show('User added successfully');
            },
            error: (error) => {
              console.error('Error updating user-dashboard:', error);
              this.toastService.show(error.error?.message || 'Failed to add user');
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

deleteUser(email: string) {
  this.confirmationService.show(
    'Delete User',
    'Are you sure you want to remove this user?',
    () => {
      this.homeService.deleteRecord(email).subscribe({
        next: () => {
          this.loadUserCounts();
          this.loadRecords();
          this.toastService.show('User removed successfully', 'success');
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.toastService.show('Failed to remove user', 'error');
        }
      });
    }
  );
}
}