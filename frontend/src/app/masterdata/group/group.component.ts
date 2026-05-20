// src/app/masterdata/group/group.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomTableComponent } from '../../components/custom-table/custom-table.component';
import { GroupService } from '../../Services/group.service';
import { ToastService } from '../../Services/toast.service';

interface Group {
  id: number;
  group: string;
}

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, CustomTableComponent],
  templateUrl: './group.component.html'
})
export class GroupComponent implements OnInit {
  groupHeaders = [
    { 
      name: 'group', 
      display_name: 'Group Name', 
      width: '85%',
      sticky: true 
    }
  ];

  filteredTableData: any[] = [];

  constructor(private groupService: GroupService,     private toastService: ToastService
  ) {}

  ngOnInit() {
    this.fetchGroups();
  }

  fetchGroups() {
    this.groupService.getGroups().subscribe({
      next: (data) => {
        this.filteredTableData = data;
      },
      error: (error) => {
        console.error('Error fetching groups:', error);
        this.toastService.show('Failed to load groups', 'error');
      }
    });
  }

  onSave(event: { data: any; isNew: boolean }) {
    if (event.isNew) {
      this.addGroup(event.data);
    } else {
      this.updateGroup(event.data);
    }
  }
  addGroup(newGroup: any) {
    this.groupService.createGroup(newGroup).subscribe({
      next: (createdGroup) => {
        this.filteredTableData = [...this.filteredTableData, createdGroup];
        this.toastService.show('Group created successfully', 'success');
      },
      error: (error) => {
        console.error('Error creating group:', error);
        if (error.status === 409) {
          this.toastService.show(error.error.message || 'A group with this name already exists', 'error');
        } else {
          this.toastService.show('Failed to create group', 'error');
        }
      }
    });
  }

  updateGroup(group: any) {
    this.groupService.updateGroup(group.id, group).subscribe({
      next: (updatedGroup) => {
        const index = this.filteredTableData.findIndex(row => row.id === updatedGroup.id);
        if (index !== -1) {
          this.filteredTableData[index] = updatedGroup;
        }
        this.toastService.show('Group updated successfully', 'success');
      },
      error: (error) => {
        console.error('Error updating group:', error);
        if (error.status === 409) {
          this.toastService.show(error.error.message || 'A group with this name already exists', 'error');
        } else {
          this.toastService.show('Failed to update group', 'error');
        }
      }
    });
  }
  onDelete(deletedRow: any) {
    this.groupService.deleteGroup(deletedRow.id).subscribe({
      next: () => {
        this.filteredTableData = this.filteredTableData.filter(
          row => row.id !== deletedRow.id
        );
        this.toastService.show('Group deleted successfully', 'success');
      },
      error: (error) => {
        console.error('Error deleting group:', error);
        this.toastService.show('Failed to delete group', 'error');
      }
    });
  }

}