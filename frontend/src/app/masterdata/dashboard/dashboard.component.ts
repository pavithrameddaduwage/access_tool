import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CustomTableComponent } from '../../components/custom-table/custom-table.component';
import { SelectWithSearchComponent } from '../../components/select_with_search/select_with_search.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardService } from '../../Services/dashboard.service';
import { TypeService } from '../../Services/type.service';
import { ValuetypeService } from '../../Services/valuetype.service';
import { WorkspaceService } from '../../Services/workspace.service';
import { GroupService } from '../../Services/group.service';
import { ToastService } from '../../Services/toast.service';


interface DashboardHeader {
  name: string;
  display_name: string;
  width: string;
  sticky?: boolean;
  type?: string;
  data?: Array<{
    id: number;
    value: string;
    label: string;
  }>;
}

interface CreateDashboardDto {
  dashboard: string;
  typeIds: number[];
  valueTypeIds: number[];
  workspaceIds: number[];
  groupId?: number;
}

interface GroupOption {
  id: number;
  value: string;
  label: string;
}

interface Dashboard {
  id?: number;
  dashboard: string;
  typeId: number;
  valueTypeId: number;
  workspaceId: number;
  groupId?: number;  
  type?: { id: number; type: string };
  valueType?: { id: number; valuetype: string };
  workspace?: { id: number; workspace: string };
  group?: { id: number; group: string };  }

interface Type {
  id: number;
  type: string;
}

interface Valuetype {
  id: number;
  valuetype: string;
}

interface Workspace {
  id: number;
  workspace: string;
}

interface DashboardType {
  type: Type;
}

interface DashboardValuetype {
  valuetype: Valuetype;
}

interface DashboardWorkspace {
  workspace: Workspace;
}

interface DashboardHeaderOption {
  value: string;
  label: string;
}

interface DashboardHeader {
  name: string;
  display_name: string;
  sticky?: boolean;
  width: string;
  type?: string;
  options?: DashboardHeaderOption[];
  filters?: {
    value: string;
  };
}


interface DashboardData {
  id: number;
  dashboard: string;
  dashboardTypes: DashboardType[];
  dashboardValuetypes: DashboardValuetype[];
  dashboardWorkspaces: DashboardWorkspace[];
  group?: {     
    id: number;
    group: string;
  };
}
interface Group {
  id: number;
  group: string;
}

interface TypeOption {
  id: number;
  value: string;
  label: string;
}

interface ValueTypeOption {
  id: number;
  value: string;
  label: string;
}

interface WorkspaceOption {
  id: number;
  value: string;
  label: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CustomTableComponent, SelectWithSearchComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  selectedTypes: string[] = [];
  selectedValueTypes: string[] = [];
  tableData: any[] = [];
  filteredTableData: any;

  selectedType: string = '';
  selectedValueType: string = '';
  selectedWorkspace: string = '';

  groupOptions: GroupOption[] = [];
selectedGroup: string = '';

searchTerm: string = '';

  typeOptions: TypeOption[] = [];
  valueTypeOptions: ValueTypeOption[] = [];
  workspaceOptions: WorkspaceOption[] = [];

  editForm = {
    dashboard: '',
    type: [] as string[],
    valueType: [] as string[],
    workspace: [] as string[],
    group: [] as string[],  
  };
  dashboardHeaders: DashboardHeader[] = [
    { 
      name: 'dashboard', 
      display_name: 'Dashboard', 
      sticky: true, 
      width: '30%' 
    },
    { 
      name: 'type', 
      display_name: 'Type', 
      type: 'combobox', 
      width: '20%',
      options: [],
      sticky: true ,

      filters: { value: '' }
    },
    { 
      name: 'valuetype', 
      display_name: 'Value Type', 
      type: 'combobox', 
      width: '20%',
      options: [],
      sticky: true ,

      filters: { value: '' }
    },
    { 
      name: 'workspace', 
      display_name: 'Workspace', 
      type: 'combobox', 
      width: '20%',
      options: [],
      sticky: true ,

      filters: { value: '' }
    },
    { 
      name: 'group', 
      display_name: 'Group', 
      type: 'select',
      data: [],
      sticky: true ,
      width: '30%'
    }
  ];


  selectedRowIndex: number | null = null;

  constructor(
    private dashboardService: DashboardService,
    private typeService: TypeService,
    private valueTypeService: ValuetypeService,
    private workspaceService: WorkspaceService,
    private groupService: GroupService,
    private toastService: ToastService

  ) {}

  ngOnInit(): void {
    this.loadOptions();
    this.loadGroups();


  }

  onGroupChange(event: string): void {
    this.selectedGroup = event;
    this.editForm.group = [event];
  }
  
  removeGroup(): void {
    this.selectedGroup = '';
    this.editForm.group = [];
  }

  private loadGroups(): void {
    this.groupService.getGroups().subscribe({
      next: (groups) => {
        const groupHeader = this.dashboardHeaders.find(h => h.name === 'group');
        if (groupHeader) {
          groupHeader.data = groups.map(group => ({
            id: group.id,
            value: group.group,
            label: group.group
          }));
        }
      },
      error: (error) => console.error('Error loading groups:', error)
    });
  }

  private loadOptions(): void {
    this.typeService.getTypes().subscribe({
      next: (types: Type[]) => {
        this.typeOptions = types.map(type => ({
          id: type.id,
          value: type.type,
          label: type.type
        }));
        this.dashboardHeaders[1].options = this.typeOptions.map(opt => ({
          value: opt.value,
          label: opt.label
        }));
        this.loadDashboards();
      },
      error: (error) => console.error('Error loading types:', error)
    });

    this.valueTypeService.getValueTypes().subscribe({
      next: (valueTypes: Valuetype[]) => {
        this.valueTypeOptions = valueTypes.map(vt => ({
          id: vt.id,
          value: vt.valuetype,
          label: vt.valuetype
        }));
        this.dashboardHeaders[2].options = this.valueTypeOptions.map(opt => ({
          value: opt.value,
          label: opt.label
        }));
      },
      error: (error) => console.error('Error loading value types:', error)
    });

    this.workspaceService.getWorkspaces().subscribe({
      next: (workspaces: Workspace[]) => {
        this.workspaceOptions = workspaces.map(ws => ({
          id: ws.id,
          value: ws.workspace,
          label: ws.workspace
        }));
        this.dashboardHeaders[3].options = this.workspaceOptions.map(opt => ({
          value: opt.value,
          label: opt.label
        }));
      },
      error: (error) => console.error('Error loading workspaces:', error)
    });

    this.groupService.getGroups().subscribe({
      next: (groups: Group[]) => {
        this.groupOptions = groups.map(group => ({
          id: group.id,
          value: group.group,
          label: group.group
        }));
        this.dashboardHeaders[4].options = this.groupOptions.map(opt => ({
          value: opt.value,
          label: opt.label
        }));
      },
      error: (error) => console.error('Error loading groups:', error)
    });
  }

  private getWorkspaceId(): number | null {
    if (!this.selectedWorkspace) return null;
    const workspace = this.workspaceOptions.find(opt => opt.value === this.selectedWorkspace);
    return workspace ? workspace.id : null;
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.filteredTableData = this.tableData.filter(row => 
      row.dashboard.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  loadDashboards() {
    this.dashboardService.getDashboards().subscribe({
      next: (data: DashboardData[]) => {
        this.tableData = data.map(dashboard => {
          const typeString = this.getJoinedString(dashboard.dashboardTypes, 'type', 'type');
          const valueTypeString = this.getJoinedString(dashboard.dashboardValuetypes, 'valuetype', 'valuetype');
          const workspaceString = this.getJoinedString(dashboard.dashboardWorkspaces, 'workspace', 'workspace');
          const groupString = dashboard.group?.group || '';
          
          return {
            id: dashboard.id,
            dashboard: dashboard.dashboard,
            type: typeString,
            valuetype: valueTypeString,
            workspace: workspaceString,
            group: groupString
          };
        });
        this.filteredTableData = [...this.tableData];
      },
      error: (error) => {
        console.error('Error loading dashboards:', error);
        this.toastService.show('Failed to load dashboards', 'error');
      }
    });
  }

  private getJoinedString(items: any[], entityKey: string, propertyKey: string): string {
    if (!items || !Array.isArray(items)) return '';
    return items
      .filter(item => item && item[entityKey])
      .map(item => item[entityKey][propertyKey])
      .filter(Boolean)
      .join(', ');
  }

  onDelete(row: any, index: number): void {
    const confirmation = confirm('Are you sure you want to delete this dashboard?');
    if (confirmation) {
      if (!row.id) {
        this.toastService.show('Invalid dashboard ID', 'error');
        return;
      }

      this.dashboardService.deleteDashboard(row.id).subscribe({
        next: () => {
          this.loadDashboards();
          this.toastService.show('Dashboard deleted successfully', 'success');
        },
        error: (error) => {
          console.error('Error deleting dashboard:', error);
          this.toastService.show('Failed to delete dashboard', 'error');
        }
      });
    }
  }

  onEdit(row: any, index: number): void {
    this.editForm = { ...row };
    this.selectedRowIndex = index;
    this.selectedTypes = row.type ? row.type.split(', ') : [];
    this.selectedValueTypes = row.valuetype ? row.valuetype.split(', ') : [];
    this.selectedWorkspace = row.workspace || '';
    this.selectedGroup = row.group || ''; 
    this.isFormOpen = true;
  }
  saveEditedRow(): void {
    if (this.selectedRowIndex !== null) {
      const typeIds = this.getSelectedIds(this.selectedTypes, this.typeOptions);
      const valueTypeIds = this.getSelectedIds(this.selectedValueTypes, this.valueTypeOptions);
      const workspaceId = this.getWorkspaceId();
      const groupId = this.getGroupId();

      if (!workspaceId) {
        this.toastService.show('Workspace is required', 'error');
        return;
      }

      const dashboardData = {
        dashboard: this.editForm.dashboard,
        typeIds,
        valueTypeIds,
        workspaceIds: [workspaceId],
        groupId
      };

      const id = this.tableData[this.selectedRowIndex].id;
      
      this.dashboardService.updateDashboard(id, dashboardData).subscribe({
        next: () => {
          this.loadDashboards();
          this.resetForm();
          this.toastService.show('Dashboard updated successfully', 'success');
        },
        error: (error) => {
          console.error('Error updating dashboard:', error);
          if (error.status === 409) {
            this.toastService.show(error.error.message || 'A dashboard with this name already exists', 'error');
          } else {
            this.toastService.show('Failed to update dashboard', 'error');
          }
        }
      });
    }
  }

  private getSelectedIds(selectedItems: string[], options: any[]): number[] {
    return selectedItems
      .map(item => {
        const option = options.find(opt => opt.value === item);
        return option ? option.id : null;
      })
      .filter((id): id is number => id !== null);
  }
  onAddNewDashboard() {
    if (!this.editForm.dashboard) {
      this.toastService.show('Dashboard name is required', 'error');
      return;
    }

    const typeIds = this.getSelectedIds(this.selectedTypes, this.typeOptions);
    const valueTypeIds = this.getSelectedIds(this.selectedValueTypes, this.valueTypeOptions);
    const workspaceId = this.getWorkspaceId();
    const groupId = this.getGroupId();

    if (!workspaceId) {
      this.toastService.show('Workspace is required', 'error');
      return;
    }

    const dashboardData: CreateDashboardDto = {
      dashboard: this.editForm.dashboard,
      typeIds,
      valueTypeIds,
      workspaceIds: [workspaceId],
      ...(groupId !== null && { groupId })
    };

    this.dashboardService.createDashboard(dashboardData).subscribe({
      next: () => {
        this.loadDashboards();
        this.resetForm();
        this.toastService.show('Dashboard created successfully', 'success');
      },
      error: (error) => {
        console.error('Error creating dashboard:', error);
        if (error.status === 409) {
          this.toastService.show(error.error.message || 'A dashboard with this name already exists', 'error');
        } else {
          this.toastService.show('Failed to create dashboard', 'error');
        }
      }
    });
  }

  onTypeChange(event: string): void {
    if (!this.selectedTypes.includes(event)) {
      this.selectedTypes.push(event);
      this.editForm.type = [...this.selectedTypes];
    }
  }

  onValueTypeChange(event: string): void {
    if (!this.selectedValueTypes.includes(event)) {
      this.selectedValueTypes.push(event);
      this.editForm.valueType = [...this.selectedValueTypes];
    }
  }


  onWorkspaceChange(event: string): void {
    this.selectedWorkspace = event;
    this.editForm.workspace = [event];
  }


  removeType(index: number): void {
    this.selectedTypes.splice(index, 1);
    this.editForm.type = [...this.selectedTypes];
  }

  removeValueType(index: number): void {
    this.selectedValueTypes.splice(index, 1);
    this.editForm.valueType = [...this.selectedValueTypes];
  }

  removeWorkspace(): void {
    this.selectedWorkspace = '';
    this.editForm.workspace = [];
  }
  

  updateColumnWidth(columnName: string, newWidth: string): void {
    const column = this.dashboardHeaders.find((header) => header.name === columnName);
    if (column) {
      column.width = newWidth;
    }
  }

  private resetForm() {
    this.editForm = {
      dashboard: '',
      type: [],
      valueType: [],
      workspace: [],
      group: []  
    };
    this.selectedTypes = [];
    this.selectedValueTypes = [];
    this.selectedWorkspace = '';
    this.selectedGroup = '';  
    this.selectedRowIndex = null;
    this.isFormOpen = false;
  }

  private getGroupId(): number | null {
    if (!this.selectedGroup) return null;
    const group = this.groupOptions.find(opt => opt.value === this.selectedGroup);
    return group ? group.id : null;
  }

  isFormOpen: boolean = false;

toggleForm(): void {
  this.isFormOpen = !this.isFormOpen;
  if (!this.isFormOpen) {
    this.resetForm();
  }
}



}