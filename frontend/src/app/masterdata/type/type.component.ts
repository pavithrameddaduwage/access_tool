import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CustomTableComponent } from '../../components/custom-table/custom-table.component';
import { TypeService } from '../../Services/type.service';
import { ToastService } from '../../Services/toast.service';


interface Type {
  id: number;
  type: string;
}


@Component({
  selector: 'app-type',
  imports: [CommonModule, CustomTableComponent],
  templateUrl: './type.component.html',
  styleUrl: './type.component.css'
})
export class TypeComponent {


  filteredTableData: Type[] = [];  

  constructor(
    private typeService: TypeService,
    private toastService: ToastService
  ) {}
    ngOnInit() {
      this.fetchTypes();
    }

    fetchTypes() {
      this.typeService.getTypes().subscribe({
        next: (data) => {
          this.filteredTableData = data;
        },
        error: (error) => {
          console.error('Error fetching types:', error);
          this.toastService.show('Failed to load types', 'error');
        }
      });
    }
  

  typeHeaders = [
    { name: 'type', display_name: 'Type', width: '85%', sticky: true}
  ]


  


  onSave(event: { data: Type; isNew: boolean }) {
    const { data, isNew } = event;

    if (isNew) {
      this.addType(data);
    } else {
      this.updateType(data);
    }
  }

  addType(newType: Type) {
    this.typeService.createType(newType).subscribe({
      next: (createdType) => {
        this.filteredTableData = [...this.filteredTableData, createdType];
        this.toastService.show('Type created successfully', 'success');
      },
      error: (error) => {
        console.error('Error creating type:', error);
        if (error.status === 409) {
          this.toastService.show(error.error.message || 'A type with this name already exists', 'error');
        } else {
          this.toastService.show('Failed to create type', 'error');
        }
      }
    });
  }

  updateType(type: Type) {
    this.typeService.updateType(type.id, type).subscribe({
      next: (updatedType) => {
        const index = this.filteredTableData.findIndex(
          (row) => row.id === updatedType.id
        );
        if (index !== -1) {
          this.filteredTableData[index] = updatedType;
        }
        this.toastService.show('Type updated successfully', 'success');
      },
      error: (error) => {
        console.error('Error updating type:', error);
        if (error.status === 409) {
          this.toastService.show(error.error.message || 'A type with this name already exists', 'error');
        } else {
          this.toastService.show('Failed to update type', 'error');
        }
      }
    });
  }
  onDelete(deletedRow: any) {
    this.typeService.deleteType(deletedRow.id).subscribe({
      next: () => {
        this.filteredTableData = this.filteredTableData.filter(
          (row) => row.id !== deletedRow.id
        );
        this.toastService.show('Type deleted successfully', 'success');
      },
      error: (error) => {
        console.error('Error deleting type:', error);
        this.toastService.show('Failed to delete type', 'error');
      }
    });
  }

}
