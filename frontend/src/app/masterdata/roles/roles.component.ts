import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CustomTableComponent } from '../../components/custom-table/custom-table.component';
import { RolesService } from '../../Services/roles.service';
import { WebtoolService } from '../../Services/webtool.service';
import { ToastService } from '../../Services/toast.service';
import { RoleTableComponent } from '../../components/app-role-table/app-role-table.component';


interface Webtool {
  id: number;
  webtool: string;
}

interface Role {
  id?: number;
  roles: string;
  privileges: string;
  webtoolId?: number;
  webtool?: Webtool;
}

interface RoleData {
  id?: number;
  roles: string;
  privileges: string;
  webtoolId: number;
}


@Component({
  selector: 'app-roles',
  imports: [CommonModule, CustomTableComponent, RoleTableComponent],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RolesComponent implements OnInit {

  filteredTableData: Role[] = [];
  webtools: Webtool[] = [];  // Use proper typing

  roleHeaders = [
    { 
      name: 'webtool', 
      display_name: 'Web Tool', 
      width: '30%', 
      sticky: true,
      type: 'webtool',
      data: this.webtools,
      // Add these properties for better control
      readOnly: true, // Base readonly state
      isDisabled: (row: any) => row?.id != null, // Disable for existing records
      disabledStyle: 'webtool-disabled' // CSS class to apply when disabled
    },
    { name: 'roles', display_name: 'Role', width: '20%', sticky: true },
    { name: 'privileges', display_name: 'Privileges', width: '20%', sticky: true },
  ];


  constructor(
    private rolesService: RolesService,
    private webtoolService: WebtoolService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchRoles();
    this.fetchWebtools();
  }
  

  fetchRoles() {
    this.rolesService.getRoles().subscribe({
      next: (data) => {
        this.filteredTableData = data;
      },
      error: (error) => {
        console.error('Error fetching roles:', error);
        this.toastService.show('Failed to load roles', 'error');
      }
    });
  }

  fetchWebtools() {
    this.webtoolService.getWebtools().subscribe({
      next: (data) => {
        this.webtools = data;
        this.roleHeaders[0].data = this.webtools;
      },
      error: (error) => {
        console.error('Error fetching webtools:', error);
        this.toastService.show('Failed to load Web Tools', 'error');
      }
    });
  }
  
  onSave(event: { data: any; isNew: boolean }) {
    const roleData: RoleData = {
      roles: event.data.roles,
      privileges: event.data.privileges,
      webtoolId: event.data.webtool?.id || event.data.webtoolId
    };

    if (!roleData.roles?.trim() || !roleData.privileges?.trim() || !roleData.webtoolId) {
      this.toastService.show('All fields are required', 'error');
      return;
    }

    if (event.isNew) {
      this.addRole(roleData);
    } else {
      roleData.id = event.data.id;
      this.updateRole(roleData);
    }
  }

  
  private addRole(roleData: RoleData) {
    this.rolesService.createRole(roleData).subscribe({
      next: (createdRole) => {
        const webtool = this.webtools.find(w => w.id === roleData.webtoolId);
        if (!webtool) {
          this.toastService.show('Error: Web Tool not found', 'error');
          return;
        }
        
        const roleWithWebtool = {
          ...createdRole,
          webtool: webtool
        };
        this.filteredTableData = [...this.filteredTableData, roleWithWebtool];
        this.toastService.show('Role created successfully', 'success');
      },
      error: (error) => {
        console.error('Error creating role:', error);
        if (error.status === 409) {
          this.toastService.show(error.error.message || 'A role with this name already exists for this Web Tool', 'error');
        } else if (error.status === 404) {
          this.toastService.show('Web Tool not found', 'error');
        } else {
          this.toastService.show('Failed to create role', 'error');
        }
      }
    });
  }

  private updateRole(roleData: RoleData) {
    const id = roleData.id;
    const { id: _, ...updateData } = roleData;
    
    this.rolesService.updateRole(id!, updateData).subscribe({
      next: (updatedRole) => {
        const index = this.filteredTableData.findIndex(row => row.id === id);
        if (index !== -1) {
          const webtool = this.webtools.find(w => w.id === roleData.webtoolId);
          this.filteredTableData[index] = {
            ...updatedRole,
            webtool: webtool
          };
        }
        this.toastService.show('Role updated successfully', 'success');
      },
      error: (error) => {
        console.error('Error updating role:', error);
        if (error.status === 409) {
          this.toastService.show(error.error.message || 'A role with this name already exists for this Web Tool', 'error');
        } else if (error.status === 404) {
          this.toastService.show('Role or Web Tool not found', 'error');
        } else {
          this.toastService.show('Failed to update role', 'error');
        }
      }
    });
  }

  onDelete(deletedRow: Role) {
    const confirmation = confirm('Are you sure you want to delete this role?');
    if (!confirmation) return;

    if (!deletedRow.id) {
      this.toastService.show('Cannot delete role: ID is missing', 'error');
      return;
    }

    this.rolesService.deleteRole(deletedRow.id).subscribe({
      next: () => {
        this.filteredTableData = this.filteredTableData.filter(
          (row) => row.id !== deletedRow.id
        );
        this.toastService.show('Role deleted successfully', 'success');
      },
      error: (error) => {
        console.error('Error deleting role:', error);
        if (error.status === 409) {
          this.toastService.show('Cannot delete role as it is being used by users', 'error');
        } else {
          this.toastService.show('Failed to delete role', 'error');
        }
      }
    });
  }

}
