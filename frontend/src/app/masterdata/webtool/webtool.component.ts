import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CustomTableComponent } from '../../components/custom-table/custom-table.component';
import { WebtoolService } from '../../Services/webtool.service';
import { ToastService } from '../../Services/toast.service';


interface Webtool {
  id: number;
  webtool: string;
}



@Component({
  selector: 'app-webtool',
  imports: [CommonModule, CustomTableComponent],
  templateUrl: './webtool.component.html',
  styleUrl: './webtool.component.css'
})
export class WebtoolComponent {

   filteredTableData: Webtool[] = [];  
  
      constructor(private webtoolService: WebtoolService,
        private toastService: ToastService

      ) {}
  
      ngOnInit() {
        this.fetchWebtools();
      }
  
      fetchWebtools() {
        this.webtoolService.getWebtools().subscribe({
          next: (data) => {
            this.filteredTableData = data;
          },
          error: (error) => {
            console.error('Error fetching webtools:', error);
            this.toastService.show('Failed to load Web Tools', 'error');
          }
        });
      }
    


      toolHeaders = [
        { name: 'webtool', display_name: 'Web Tool', width: '300px', sticky: true },
        { name: 'description', display_name: 'Description', width: '800px', sticky: true }
      ]

  




      onSave(event: { data: Webtool; isNew: boolean }) {
        const { data, isNew } = event;
    
        if (isNew) {
          this.addWebtool(data);
        } else {
          this.updateWebtool(data);
        }
      }
    

  addWebtool(newWebtool: Webtool) {
    if (!newWebtool.webtool?.trim()) {
      this.toastService.show('Web Tool name is required', 'error');
      return;
    }

    this.webtoolService.createWebtool(newWebtool).subscribe({
      next: (createdWebtool) => {
        this.filteredTableData = [...this.filteredTableData, createdWebtool];
        this.toastService.show('Web Tool created successfully', 'success');
      },
      error: (error) => {
        console.error('Error creating Web Tool:', error);
        if (error.status === 409) {
          this.toastService.show(error.error.message || 'A Web Tool with this name already exists', 'error');
        } else {
          this.toastService.show('Failed to create Web Tool', 'error');
        }
      }
    });
  }

  updateWebtool(webtool: Webtool) {
    if (!webtool.webtool?.trim()) {
      this.toastService.show('Web Tool name is required', 'error');
      return;
    }

    this.webtoolService.updateWebtool(webtool.id, webtool).subscribe({
      next: (updatedWebtool) => {
        const index = this.filteredTableData.findIndex(
          (row) => row.id === updatedWebtool.id
        );
        if (index !== -1) {
          this.filteredTableData[index] = updatedWebtool;
        }
        this.toastService.show('Web Tool updated successfully', 'success');
      },
      error: (error) => {
        console.error('Error updating Web Tool:', error);
        if (error.status === 409) {
          this.toastService.show(error.error.message || 'A Web Tool with this name already exists', 'error');
        } else {
          this.toastService.show('Failed to update Web Tool', 'error');
        }
      }
    });
  }


  onDelete(deletedRow: Webtool) {
    const confirmation = confirm('Are you sure you want to delete this Web Tool?');
    if (!confirmation) return;

    this.webtoolService.deleteWebtool(deletedRow.id).subscribe({
      next: () => {
        this.filteredTableData = this.filteredTableData.filter(
          (row) => row.id !== deletedRow.id
        );
        this.toastService.show('Web Tool deleted successfully', 'success');
      },
      error: (error) => {
        console.error('Error deleting Web Tool:', error);
        if (error.status === 409) {
          this.toastService.show('Cannot delete Web Tool as it is being used by roles', 'error');
        } else {
          this.toastService.show('Failed to delete Web Tool', 'error');
        }
      }
    });
  }
}
