import { Component, OnInit } from '@angular/core';
import { DepartmentService } from '../../Services/department.service';
import { CommonModule } from '@angular/common';
import { CustomTableComponent } from '../../components/custom-table/custom-table.component';

interface Department {
  id: number;
  department: string;
}

@Component({
  selector: 'app-department',
  imports: [CommonModule, CustomTableComponent],
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.css']
})
export class DepartmentComponent implements OnInit {

  departmentHeaders = [
    { name: 'department', display_name: 'Department', sticky: true }
  ];

  filteredTableData: Department[] = [];  

  constructor(private departmentService: DepartmentService) {}

  ngOnInit() {
    this.fetchDepartments();
  }

  fetchDepartments() {
    this.departmentService.getDepartments().subscribe(
      (data) => {
        this.filteredTableData = data; 
      },
      (error) => {
        console.error('Error fetching departments:', error);
      }
    );
  }

  onSave(event: { data: Department; isNew: boolean }) {
    const { data, isNew } = event;

    if (isNew) {
      // Create a new department
      this.addDepartment(data);
    } else {
      // Update an existing department
      this.departmentService.updateDepartment(data.id, data).subscribe(
        (updatedDepartment) => {
          const index = this.filteredTableData.findIndex(
            (row) => row.id === updatedDepartment.id
          );
          if (index !== -1) {
            this.filteredTableData[index] = updatedDepartment;
          }
        },
        (error) => {
          console.error('Error updating department:', error);
        }
      );
    }
  }

  addDepartment(newDepartment: Department) {
    this.departmentService.createDepartment(newDepartment).subscribe(
      (createdDepartment) => {
        // Push the newly created department into the table data
        this.filteredTableData = [...this.filteredTableData, createdDepartment];
        // console.log('New department added:', createdDepartment);
      },
      (error) => {
        console.error('Error creating department:', error);
      }
    );
  }


  onDelete(deletedRow: any) {
    this.departmentService.deleteDepartment(deletedRow.id).subscribe(
      () => {
        this.filteredTableData = this.filteredTableData.filter(
          (row) => row.id !== deletedRow.id
        );
      },
      (error) => {
        console.error('Error deleting department:', error);
      }
    );
  }


}
