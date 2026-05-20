import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CustomTableComponent } from '../../components/custom-table/custom-table.component';
import { ValuetypeService } from '../../Services/valuetype.service';
import { ToastService } from '../../Services/toast.service';


interface ValueType {
  id: number;
  valuetype: string;
}


@Component({
  selector: 'app-valuetype',
  imports: [CommonModule, CustomTableComponent],
  templateUrl: './valuetype.component.html',
  styleUrl: './valuetype.component.css'
})
export class ValuetypeComponent {


  filteredTableData: ValueType[] = []; 

  constructor(
    private valuetypeService: ValuetypeService,
    private toastService: ToastService
  ) {}
  


 
  ngOnInit() {
    this.fetchValueTypes();
  }

  fetchValueTypes() {
    this.valuetypeService.getValueTypes().subscribe({
      next: (data) => {
        this.filteredTableData = data;
      },
      error: (error) => {
        console.error('Error fetching Value Types:', error);
        this.toastService.show('Failed to load Value Types', 'error');
      }
    });
  }

  valueTypeHeaders = [
    { name: 'valuetype', display_name: 'Value Type', width: '85%', sticky: true}
  ]


  onSave(event: { data: ValueType; isNew: boolean }) {
    const { data, isNew } = event;

    if (isNew) {
      this.addValueType(data);
    } else {
      this.updateValueType(data);
    }
  }

 
  addValueType(newValueType: ValueType) {
    this.valuetypeService.creatValueType(newValueType).subscribe({
      next: (createdValueType) => {
        this.filteredTableData = [...this.filteredTableData, createdValueType];
        this.toastService.show('Value Type created successfully', 'success');
      },
      error: (error) => {
        console.error('Error creating Value Type:', error);
        if (error.status === 409) {
          this.toastService.show(error.error.message || 'A Value Type with this name already exists', 'error');
        } else {
          this.toastService.show('Failed to create Value Type', 'error');
        }
      }
    });
  }

  updateValueType(valueType: ValueType) {
    this.valuetypeService.updateValueType(valueType.id, valueType).subscribe({
      next: (updatedValueType) => {
        const index = this.filteredTableData.findIndex(
          (row) => row.id === updatedValueType.id
        );
        if (index !== -1) {
          this.filteredTableData[index] = updatedValueType;
        }
        this.toastService.show('Value Type updated successfully', 'success');
      },
      error: (error) => {
        console.error('Error updating Value Type:', error);
        if (error.status === 409) {
          this.toastService.show(error.error.message || 'A Value Type with this name already exists', 'error');
        } else {
          this.toastService.show('Failed to update Value Type', 'error');
        }
      }
    });
  }

  onDelete(deletedRow: any) {
    this.valuetypeService.deleteValueType(deletedRow.id).subscribe({
      next: () => {
        this.filteredTableData = this.filteredTableData.filter(
          (row) => row.id !== deletedRow.id
        );
        this.toastService.show('Value Type deleted successfully', 'success');
      },
      error: (error) => {
        console.error('Error deleting Value Type:', error);
        this.toastService.show('Failed to delete Value Type', 'error');
      }
    });
  }
}
