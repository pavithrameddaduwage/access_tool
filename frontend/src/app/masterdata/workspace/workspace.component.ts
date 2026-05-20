import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CustomTableComponent } from '../../components/custom-table/custom-table.component';
import { WorkspaceService } from '../../Services/workspace.service';
import { ToastService } from '../../Services/toast.service';

interface Workspace {
  id: number;
  workspace: string;
}


@Component({
  selector: 'app-workspace',
  imports: [CommonModule, CustomTableComponent],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.css'
})
export class WorkspaceComponent {
  
   filteredTableData: Workspace[] = [];  
  
   constructor(
    private workspaceService: WorkspaceService,
    private toastService: ToastService
  ) {}

      ngOnInit() {
        this.fetchWorkspaces();
      }
  
      fetchWorkspaces() {
        this.workspaceService.getWorkspaces().subscribe({
          next: (data) => {
            this.filteredTableData = data;
          },
          error: (error) => {
            console.error('Error fetching workspaces:', error);
            this.toastService.show('Failed to load workspaces', 'error');
          }
        });
      }
    
      
  workspaceHeaders = [
    { name: 'workspace', display_name: 'Workspace', width: '65%',  sticky: true}
  ]




  onSave(event: { data: Workspace; isNew: boolean }) {
    const { data, isNew } = event;

    if (!data.workspace?.trim()) {
      this.toastService.show('Workspace name is required', 'error');
      return;
    }

    if (isNew) {
      this.addWorkspace(data);
    } else {
      this.updateWorkspace(data);
    }
  }

  addWorkspace(newWorkspace: Workspace) {
    this.workspaceService.createWorkspace(newWorkspace).subscribe({
      next: (createdWorkspace) => {
        this.filteredTableData = [...this.filteredTableData, createdWorkspace];
        this.toastService.show('Workspace created successfully', 'success');
      },
      error: (error) => {
        console.error('Error creating workspace:', error);
        if (error.status === 409) {
          this.toastService.show(error.error.message || 'A workspace with this name already exists', 'error');
        } else {
          this.toastService.show('Failed to create workspace', 'error');
        }
      }
    });
  }

  updateWorkspace(workspace: Workspace) {
    this.workspaceService.updateWorkspace(workspace.id, workspace).subscribe({
      next: (updatedWorkspace) => {
        const index = this.filteredTableData.findIndex(
          (row) => row.id === updatedWorkspace.id
        );
        if (index !== -1) {
          this.filteredTableData[index] = updatedWorkspace;
        }
        this.toastService.show('Workspace updated successfully', 'success');
      },
      error: (error) => {
        console.error('Error updating workspace:', error);
        if (error.status === 409) {
          this.toastService.show(error.error.message || 'A workspace with this name already exists', 'error');
        } else {
          this.toastService.show('Failed to update workspace', 'error');
        }
      }
    });
  }

  onDelete(deletedRow: Workspace) {
    const confirmation = confirm('Are you sure you want to delete this workspace?');
    if (!confirmation) return;

    this.workspaceService.deleteWorkspace(deletedRow.id).subscribe({
      next: () => {
        this.filteredTableData = this.filteredTableData.filter(
          (row) => row.id !== deletedRow.id
        );
        this.toastService.show('Workspace deleted successfully', 'success');
      },
      error: (error) => {
        console.error('Error deleting workspace:', error);
        if (error.status === 409) {
          this.toastService.show('Cannot delete workspace as it is being used by dashboards', 'error');
        } else {
          this.toastService.show('Failed to delete workspace', 'error');
        }
      }
    });
  }

}
