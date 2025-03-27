// home.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectWithSearchComponent } from '../components/select_with_search/select_with_search.component';
import { UserService } from '../Services/user.service';
import { DashboardService } from '../Services/dashboard.service';
import { HomeService } from '../Services/home.service';
import { WorkspaceService } from '../Services/workspace.service';
import { ConfirmationService } from '../Services/confirmation.service';

interface User {
  id: number;
  name: string;
  email: string;
  department?: { id: number; department: string };
}

interface Dashboard {
  id: number;
  dashboard: string;
}

interface UserDashboardRecord {
  id?: number;
  userId: number;
  userName: string;
  email: string;
  department: string;
  dashboards: string[];
  isExpanded?: boolean;
  isActive: boolean; // Add this
  lastActiveAt?: string;

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

interface DashboardOption extends HeaderOption {
  workspaceIds: number[];
}

interface DashboardWithWorkspace extends Dashboard {
  workspaceIds: number[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectWithSearchComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  users: User[] = [];
  dashboards: Dashboard[] = [];
  records: UserDashboardRecord[] = [];
  selectedDashboards: string[] = [];
  showForm = false;
  isEditMode = false;
  selectedRowIndex: number | null = null;

  allDashboardOptions: DashboardOption[] = [];

  workspaceOptions: WorkspaceOption[] = [];
  selectedWorkspace: string = '';

  editForm = {
    userId: null as number | null,
    userName: '',
    email: '',
    department: '',
    workspace: '',  
    dashboards: [] as string[],
    isActive: true
  };

  tableHeaders = [
    { name: 'actions', display_name: 'Actions', width: '10%', class: 'bg-gray-100 text-gray-700' },
    { name: 'userName', display_name: 'User', width: '25%', class: 'bg-gray-100 text-gray-700' },
    { name: 'department', display_name: 'Department', width: '20%', class: 'bg-gray-100 text-gray-700' },
    { name: 'email', display_name: 'Email', width: '20%', class: 'bg-gray-100 text-gray-700' },
    { name: 'dashboards', display_name: 'Dashboards', width: '25%', class: 'bg-gray-100 text-gray-700' }
  ];

  userOptions: HeaderOption[] = [];
  dashboardOptions: HeaderOption[] = [];

  constructor(
    private userService: UserService,
    private dashboardService: DashboardService,
    private homeService: HomeService,
    private workspaceService: WorkspaceService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    //this.loadUsers();
    this.loadAllDashboards();
    this.loadRecords();
    this.loadWorkspaces();
  }

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

  // loadUsers() {
  //   this.userService.getUsers().subscribe({
  //     next: (users) => {
  //       this.users = users;
  //       this.userOptions = users.map(user => ({
  //         id: user.id,
  //         value: user.name,
  //         label: user.name
  //       }));
  //     },
  //     error: (error) => console.error('Error loading users:', error)
  //   });
  // }

  onWorkspaceChange(event: string) {
    this.selectedWorkspace = event;
    this.editForm.workspace = event;
    this.filterDashboardOptions();
  
  }

  loadDashboards() {
    this.dashboardService.getDashboards().subscribe({
      next: (dashboards) => {
        this.dashboards = dashboards;
        this.dashboardOptions = dashboards.map(dashboard => ({
          id: dashboard.id,
          value: dashboard.dashboard,
          label: dashboard.dashboard
        }));
      },
      error: (error) => console.error('Error loading dashboards:', error)
    });
  }

  toggleRowExpansion(index: number) {
    this.records[index].isExpanded = !this.records[index].isExpanded;
  }

  openForm(mode: 'add' | 'edit', record?: UserDashboardRecord, index?: number) {
    this.isEditMode = mode === 'edit';
    this.showForm = true;
    
    if (mode === 'edit' && record) {
      this.selectedRowIndex = index ?? null;
      const dashboard = this.allDashboardOptions.find(d => d.value === record.dashboards[0]);
      const workspaceId = dashboard?.workspaceIds?.[0];
      const workspace = this.workspaceOptions.find(w => w.id === workspaceId);
      
      this.editForm = {
        userId: record.userId,
        userName: record.userName,
        email: record.email,
        department: record.department,
        workspace: workspace?.value || '', 
        dashboards: [...record.dashboards],
        isActive: record.isActive // Add this
      };
      this.selectedWorkspace = workspace?.value || '';
      this.selectedDashboards = [...record.dashboards];
      this.filterDashboardOptions();  
    } else {
      this.resetForm();
    }
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
      .filter(dashboard => dashboard.workspaceIds.includes(selectedWorkspaceObj.id))
      .map(dashboard => ({
        id: dashboard.id,
        value: dashboard.value,
        label: dashboard.label
      }));
  }

  closeForm() {
    this.showForm = false;
    this.isEditMode = false;
    this.resetForm();
  }

  onUserChange(event: string) {
    const selectedUser = this.users.find(user => user.name === event);
    if (selectedUser) {
      this.editForm = {
        userId: selectedUser.id,
        userName: selectedUser.name,
        email: selectedUser.email,
        department: selectedUser.department?.department || '',
        workspace: this.selectedWorkspace, 
        dashboards: [...this.selectedDashboards],
        isActive: true // Default to true when selecting a new user
      };
    }
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



  private resetForm() {
    this.editForm = {
      userId: null,
      userName: '',
      email: '',
      department: '',
      workspace: '',
      dashboards: [],
      isActive: true
    };
    this.selectedDashboards = [];
    this.selectedWorkspace = '';
    this.selectedRowIndex = null;
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
        this.editForm.isActive  // Add this parameter
      ).subscribe({
        next: () => {
          this.loadRecords();
          this.closeForm();
        },
        error: (error) => {
          console.error('Error updating record:', error);
          alert('Failed to update record');
        }
      });
    } else {
      this.homeService.createRecord(
        this.editForm.email,
        this.editForm.userName,
        this.editForm.department,
        dashboardIds,
        this.editForm.isActive  // Add this parameter
      ).subscribe({
        next: () => {
          this.loadRecords();
          this.closeForm();
        },
        error: (error) => {
          console.error('Error creating record:', error);
          alert('Failed to create record');
        }
      });
    }
  }
  
  loadRecords() {
    this.homeService.getRecords().subscribe({
      next: (records) => {
        this.records = records.map(record => ({
          ...record,
          isExpanded: false
        }));
      },
      error: (error) => {
        console.error('Error loading records:', error);
        alert('Failed to load records');
      }
    });
  }
  deleteRecord(record: any) {
    if (confirm('Are you sure?')) {
      this.homeService.deleteRecord(record.email).subscribe({
        next: () => {
          this.loadRecords();
        },
        error: (error) => {
          console.error('Error deleting record:', error);
          alert('Failed to delete record');
        }
      });
    }
  }

}