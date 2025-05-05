import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomTableComponent } from '../custom-table/custom-table.component';
import { FormsModule } from '@angular/forms';
import { SelectComponent } from '../select/select/select.component';
import { SelectWithSearchComponent } from '../select_with_search/select_with_search.component';

@Component({
  selector: 'app-role-table',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent, SelectWithSearchComponent],
  styleUrls: ['./app-role-table.component.css'],
  templateUrl: './app-role-table.component.html'
})
export class RoleTableComponent extends CustomTableComponent {
  
  processHeaders(headers: any[]): any[] {
    return headers.map(header => {
      if (header.name === 'webtool') {
        return {
          ...header,
          isDisabled: (row: any) => row?.id != null
        };
      }
      return header;
    });
  }
  override ngOnInit() {
    super.ngOnInit();
    this.isModalOpen = false; // Reset modal state on init
  }

  override editRow(index: number) {
    const row = this.displaydata[index];
    if (row.id) {
      row._originalWebtool = { ...row.webtool };
    }
    row.editing = true;
  }
  
  override saveRow(index: number) {
    const row = this.displaydata[index];
    
    if (row.id && row._originalWebtool) {
      row.webtool = { ...row._originalWebtool };
      row.webtoolId = row._originalWebtool.id;
    }
    
    row.editing = false;
    this.saveItem.emit({
      data: row,
      isNew: false
    });
  }

  override onWebtoolSelect(event: any, row: any): void {
    if (row.id) {
      if (row._originalWebtool) {
        row.webtool = { ...row._originalWebtool };
      }
      return;
    }
    super.onWebtoolSelect(event, row);
  }

  cancelEdit(index: number) {
    const row = this.displaydata[index];
    if (row._originalWebtool) {
      row.webtool = { ...row._originalWebtool };
    }
    row.editing = false;
  }
  override handleSearch() {
    // Call the parent method first
    super.handleSearch();
    
    // Add any RoleTableComponent-specific search handling here if needed
    // console.log('Search executed in RoleTableComponent');
  }
}