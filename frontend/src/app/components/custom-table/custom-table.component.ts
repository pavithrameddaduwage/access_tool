import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { SelectWithSearchComponent } from '../select_with_search/select_with_search.component';
import { SelectComponent } from '../select/select/select.component';

interface Row {
  [key: string]: any;
  editing: boolean;
}

@Component({
  selector: 'app-custom-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SelectWithSearchComponent, SelectComponent],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.css',
})
export class CustomTableComponent implements OnInit, OnChanges {
  @Input() headers: any[] = [];
  @Input() data: any[] = [];
  @Input() header: any;
  @Output() saveItem = new EventEmitter<any>();
  @Output() deleteItem = new EventEmitter<any>();
  @Output() filters = new EventEmitter<any>();
  @Input() showActionColumn: boolean = false;
  @Input() stickyActionColumn: boolean = false;
  @Input() showPaginationHeader: boolean = true;

  dropdownOptions: Record<string, any[]> = {}; // Holds dropdown options for each column

  
  rows: Row[] = [];
  filteredrows: Row[] = [];
  displaydata: any[] = [];
  displayData: any[] = [];
  filteredBrandData: any[] = [];
  columns: any[] = [];
  pagecount: any = [];
  defaultpagecount: any = [];
  selectedPage: number = 0;
  rowsperpage: number = 15;
  isModalOpen = false;
  sample = true;
  rowToDelete: number | null = null;
  pageSize: any = [
    { label: '10', value: '10' },
    { label: '15', value: '15' },
    { label: '20', value: '20' },
    { label: '50', value: '50' },
    { label: '100', value: '100' },
  ];
  newrow: any = {};
  isnewrow: boolean = false;
  searchtext: string = '';
  private latestStickyActionColumn: boolean = false;
  showFilterColumn: boolean = false;
  header_filters: any = {};
  sortColumn: string | null = null; // No column selected initially
sortDirection: 'asc' | 'desc' = 'asc'; // Default to ascending


  ngOnChanges(changes: SimpleChanges) {

    if (changes['data']) {
      console.log('Received data in CustomTableComponent:', this.data);
    }
    if (changes['showPaginationHeader']) {
      this.updateRowsPerPage();
    }
    if (changes['stickyActionColumn']) {
      this.latestStickyActionColumn =
        changes['stickyActionColumn'].currentValue;

      this.makeColumnSticky();
    }
    if (changes['headers'] || changes['data']) {
      this.columns = this.headers;
      console.log('headers', this.headers);
      console.log('data', this.data);

      const currentSelectedPage = this.selectedPage;

      if (this.searchtext === '') {
        this.rows = this.data.map((item) => ({ ...item, editing: false }));
        this.filteredrows = this.rows;
      }

      this.updateDisplayData();

      this.setPageCount();
    }

    console.log('Filtered Rows:', this.filteredrows);
console.log('Display Data:', this.displaydata);
console.log('Headers:', this.headers);
  console.log('Data:', this.data);

  }

  ngOnInit(): void {}


  // Save the table data to localStorage
  saveToLocalStorage(): void {
    const tableData = this.collectTableData();
    localStorage.setItem('tableData', JSON.stringify(tableData)); // Save data in JSON format
    console.log('Data saved to localStorage');
  }

  // Collect the table data (return the data to be saved)
  collectTableData(): any[] {
    return this.displaydata;  // You can modify this depending on how you structure your rows
  }

  // Load the table data from localStorage
  loadFromLocalStorage(): void {
    const savedData = localStorage.getItem('tableData');
    if (savedData) {
      this.displaydata = JSON.parse(savedData);  // Convert JSON back to object
      this.filteredrows = this.displaydata;      // Optionally set filtered rows if needed
      console.log('Data loaded from localStorage', this.displaydata);
    } else {
      console.log('No saved data found');
    }
  }



  updateRowsPerPage(): void {
    if (!this.showPaginationHeader) {
      console.log('1000 rows');
      this.rowsperpage = 1000;
    } else {
      console.log('15 rows');

      this.rowsperpage = 15;
    }
  }

  updateFilterColumn(): void {
    this.showFilterColumn = !this.showFilterColumn;
  }

  makeColumnSticky() {
    const table = document.getElementById('myTable') as HTMLTableElement;
    const headers = table.querySelectorAll('thead th');
    let leftOffset = 0;

    const updateStickyPositions = () => {
      leftOffset = 0;

      if (this.latestStickyActionColumn) {
        let actionColumnStyle = document.querySelector('#sticky-action-column');
        if (!actionColumnStyle) {
          actionColumnStyle = document.createElement('style');
          actionColumnStyle.id = 'sticky-action-column';
          document.head.appendChild(actionColumnStyle);
        }

        actionColumnStyle.innerHTML = `
          td:nth-child(1), th:nth-child(1) {
            position: sticky;
            left: ${leftOffset}px;
            z-index: 35; 
            background-color: #ffffff;
            min-width: 96px; 
            max-width: 96px;
            overflow: visible; 
          }
  
          
          
        `;

        leftOffset += 96;
      }

      headers.forEach((header, index) => {
        if (this.headers && this.headers[index]) {
          const parentHeader = this.headers[index];

          if (parentHeader.sticky) {
            const nextHeader = headers[index];
            const colWidth = nextHeader.getBoundingClientRect().width;

            console.log(
              `Column ${index + 2} (${
                parentHeader.display_name
              }): Width = ${colWidth}px`
            );

            let styleElement = document.querySelector(
              `#sticky-column-${index}`
            );
            if (!styleElement) {
              styleElement = document.createElement('style');
              styleElement.id = `sticky-column-${index}`;
              document.head.appendChild(styleElement);
            }

            styleElement.innerHTML = `
              td:nth-child(${index + 2}), th:nth-child(${index + 2}) {
                position: sticky;
                left: ${leftOffset}px;
                z-index: 20;
                background-color: #ffffff;
                min-width: ${colWidth + 2}px;
                max-width: ${colWidth + 2}px;
                overflow: hidden; 
              }
            `;

            leftOffset += colWidth;
          }
        }
      });
    };

    updateStickyPositions();

    table.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).tagName === 'TH') {
        setTimeout(() => updateStickyPositions(), 0);
      }
    });

    const observer = new ResizeObserver(updateStickyPositions);
    observer.observe(table);
  }

  setPageCount() {
    if (
      this.filteredrows.length > 0 &&
      this.filteredrows.length < this.rowsperpage
    ) {
      this.defaultpagecount = Array(1)
        .fill(0)
        .map((x, i) => i);
      console.log('pagecount: ', this.pagecount);
    } else {
      this.defaultpagecount = Array(
        Math.ceil(this.filteredrows.length / this.rowsperpage)
      )
        .fill(0)
        .map((x, i) => i);
      console.log(
        'page count',
        this.pagecount,
        this.filteredrows.length,
        this.rowsperpage
      );
    }

    this.pagecount = this.defaultpagecount.slice(0, this.rowsperpage);
  }

  setSelectedPage(index: number) {
    this.selectedPage = index;
    this.displaydata = this.filteredrows.slice(
      index * this.rowsperpage,
      index * this.rowsperpage + this.rowsperpage
    );

    console.log(index);
    this.pagecount = this.defaultpagecount.slice(
      index - 5 < 0 ? 0 : index - 5,
      index + 5 < 10 ? 10 : index + 5
    );
    console.log(this.pagecount);
  }

  addRow() {
    const newRow: Row = { editing: true };
    
    // Initialize the new row with each column name properly bound
    this.columns.forEach((column: any) => {
      newRow[column.name] = ''; // Empty string or a default value
    });
    
    this.filteredrows.push(newRow);
  }
  
  

  editRow(index: number) {
    this.displaydata[index].editing = true;
    console.log('Edit');
  }

  // Save an existing row (edit mode)
  saveRow(index: number) {
    this.displaydata[index].editing = false; // Turn off editing mode
    console.log('Saving existing row', this.displaydata[index]);

    // Emit the updated row data, marked as not new
    this.saveItem.emit({ data: this.displaydata[index], isNew: false });

    this.setSelectedPage(this.selectedPage); // Optional pagination handling
  }

  saveNewRow() {
    console.log('Saving new row:', this.newrow);
    
    // Ensure webtoolId is properly set
    if (this.newrow.webtool) {
      this.newrow.webtoolId = this.newrow.webtool.id;
    }
    
    this.saveItem.emit({ data: this.newrow, isNew: true });
    this.isnewrow = false;
    this.newrow = {};
  }
  
  handleSearch() {
    let dataheaders = Object.keys(this.rows[0]);

    this.filteredrows = [];

    if (this.searchtext != '') {
      this.filteredrows = this.rows.filter((f: any) => {
        let ismatching = false;
        dataheaders.forEach((header: any) => {
          if (
            header !== 'id' &&
            f[header]
              .toString()
              .toLowerCase()
              .includes(this.searchtext.toLowerCase())
          ) {
            ismatching = true;
          }
        });
        console.log(
          'testing values',
          this.searchtext.toLowerCase(),
          f.department,
          ismatching
        );
        return ismatching;
      });
      this.displaydata = this.filteredrows.slice(0, this.rowsperpage);
      this.setPageCount();
    } else {
      this.filteredrows = this.data.map((item) => ({
        ...item,
        editing: false,
      }));
      this.displaydata = this.filteredrows.slice(0, this.rowsperpage);
      this.setPageCount();
    }
  }

  closeNewRow() {
    this.newrow = {};
    this.isnewrow = false;
  }

  showNewRow() {
    this.newrow = {};
    this.isnewrow = true;
  }
  setSelectValue(data: any) {
    const rowsPerPage = parseInt(data.value);
    if (isNaN(rowsPerPage) || rowsPerPage <= 0) {
      console.error("Invalid page size:", rowsPerPage);
      return;
    }
    this.rowsperpage = rowsPerPage;
  
    const startIndex = this.selectedPage * this.rowsperpage;
    const endIndex = startIndex + this.rowsperpage;
  
    console.log(`Slice start: ${startIndex}, Slice end: ${endIndex}`);
  
    this.displaydata = this.filteredrows.slice(startIndex, endIndex);
  
    if (this.displaydata.length === 0) {
      console.warn("No data available in the selected range.");
    }
  }
  

  pageChangedCSS(index: number) {
    let bgcolor: string = '';
    if (this.selectedPage == index) {
      bgcolor = 'bg-green-300';
    }
    return ` ${bgcolor} `;
  }

  confirmDelete(index: number) {
    this.rowToDelete = index;
    this.isModalOpen = true;
  }

  deleteConfirmed() {
    if (this.rowToDelete !== null) {
      this.deleteItem.emit(this.displaydata[this.rowToDelete]);
      this.displaydata.splice(this.rowToDelete, 1);
    }
    this.closeModal();
  }

  closeModal() {
    this.isModalOpen = false;
    this.rowToDelete = null;
  }

  getCheckboxValue(row: any, columnName: string): boolean {
    return row[columnName] === 'true' || row[columnName] === true;
  }

  // ##################

  handleFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    const columnName = target.name;
    const filterValue = target.value.toLowerCase();
  
    // Reset to original data if filter is empty
    if (!filterValue) {
      this.filteredrows = [...this.data];
    } else {
      // Filter the data based on the column and value
      this.filteredrows = this.data.filter(row => {
        const cellValue = row[columnName];
        if (cellValue === null || cellValue === undefined) return false;
        return cellValue.toString().toLowerCase().includes(filterValue);
      });
    }
  
    // Update the display data and pagination
    this.selectedPage = 0;
    this.setPageCount();
    this.updateDisplayData();
  }

  filterDataset(dataset: any[], filterCriteria: any): any[] {
    return dataset.filter((item) => {
      return Object.keys(filterCriteria).every((key) => {
        const filterValue = filterCriteria[key]?.toString().toLowerCase();
        const itemValue = item[key];

        if (!filterValue) {
          return true;
        }

        if (typeof itemValue === 'string') {
          return itemValue.toLowerCase().includes(filterValue);
        } else if (typeof itemValue === 'number') {
          return itemValue.toString().includes(filterValue);
        } else if (itemValue instanceof Date) {
          return itemValue.toLocaleDateString().includes(filterValue);
        } else if (typeof itemValue === 'boolean') {
          if (filterValue === 'false') {
            return itemValue === false || itemValue === null;
          }
          return itemValue.toString() === filterValue;
        } else if (itemValue === null && filterValue === 'false') {
          return true;
        }

        return false;
      });
    });
  }

  sendFilteredData(filteredData: any[]) {}

  // ##############################

  sortDataset(column: string): void {
    // Check if the same column is clicked; toggle the sort direction
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // If a new column is clicked, set it as the sort column and default to 'asc'
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  
    // Log the current state for debugging
    console.log(`Sorting by ${this.sortColumn} in ${this.sortDirection} order`);
  
    // Separate rows into those with and without values for the column
    const rowsWithValues = this.filteredrows.filter(
      (row) => row[column] !== null && row[column] !== undefined && row[column] !== ''
    );
    const rowsWithoutValues = this.filteredrows.filter(
      (row) => row[column] === null || row[column] === undefined || row[column] === ''
    );
  
    // Perform the sorting
    rowsWithValues.sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];
  
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return this.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        return this.sortDirection === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
  
      return 0;
    });
  
    // Combine the sorted arrays back
    this.filteredrows = [...rowsWithValues, ...rowsWithoutValues];
  
    // Reset selected page to the first page
    this.selectedPage = 0;
  
    // Update the displayed data
    this.updateDisplayData();
  
    // Reapply sticky column logic
    this.makeColumnSticky();
  }
  
  
  updateDisplayData() {
    const currentPage = this.selectedPage || 0;
    this.displaydata = this.filteredrows.slice(
      currentPage * this.rowsperpage,
      (currentPage + 1) * this.rowsperpage
    );
  }

selectCategory(option: string, row: any) {
  row['category'] = option; // Update the category value
  this.showCategoryOptions = false; // Close the dropdown
}
onFilterChange(selectedValue: string, columnName: string): void {
  // Update the newrow dynamically when the value changes
  this.newrow[columnName] = selectedValue;  // Assign selected value to newrow[columnName]
  
  // Optionally, log the change for debugging
  console.log(`New value for ${columnName}:`, selectedValue);
}

onCategoryChange(selectedCategory: string) {
  // Handle category change if needed
  this.header_filters['category'] = selectedCategory;
  this.filteredrows = this.filterDataset(this.data, this.header_filters);
  this.selectedPage = 0;
  this.setPageCount();
  this.updateDisplayData();
}


showCategoryOptions: boolean = false; // Control visibility of category dropdown

filteredCategoryOptions: any[] = [
  { value: 'Grade A', label: 'Grade A' },
  { value: 'Grade B', label: 'Grade B' },
  { value: 'Grade C', label: 'Grade C' },
  { value: 'Ungraded', label: 'Ungraded' }
];
// This is triggered when the dropdown is focused
toggleCategoryOptions(show: boolean) {
  // Reset filtered options to the full list when the dropdown is opened
  if (show) {
    this.filteredCategoryOptions = [...this.filteredCategoryOptions]; // Reset to all options
  }

  // Show the dropdown with a slight delay to ensure events are handled
  setTimeout(() => {
    this.showCategoryOptions = show;
  }, 100);
}

// This handles typing in the input field for filtering the dropdown
handleCategoryKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    this.showCategoryOptions = false; // Close the dropdown when Enter is pressed
  }
}

// This handles the category filter change
handleCategoryFilterChange(selectedValue: string, row: any) {
  // Update the category value for the current row
  row['category'] = selectedValue;

  // Apply the category filter to the data (you may need to adjust this part based on your filtering logic)
  this.filteredrows = this.filteredrows.filter(item => item['category'] === selectedValue);

  // Reset pagination and update the displayed data
  this.selectedPage = 0;
  this.setPageCount();
  this.updateDisplayData();
}

// Function for filtering the categories as the user types
filterDropdown(event: any) {
  const searchText = event.target.value.toLowerCase();

  // Filter the options based on the search text
  this.filteredCategoryOptions = this.filteredCategoryOptions.filter(option =>
    option.label.toLowerCase().includes(searchText)
  );
}


// When a category is selected, pass both the selected value and the row data
onCategorySelect(selectedValue: string, row: any) {
  // Update the category value for the current row
  row['category'] = selectedValue;

  // Apply the category filter to the data
  this.filteredrows = this.filteredrows.filter(item => item['category'] === selectedValue);

  // Reset pagination and update the displayed data
  this.selectedPage = 0;
  this.setPageCount();
  this.updateDisplayData();

  // Optionally hide the dropdown after selection
  this.showCategoryOptions = false;

  // Reset the filtered options back to the full list
  this.filteredCategoryOptions = [...this.filteredCategoryOptions];
}

getTableMaxHeight(): string {
  const remainingHeight = 200; // Adjust this to suit your layout
  return `${window.innerHeight - remainingHeight}px`; // Example: Remaining height for other components
}



onDropdownChange(selectedValue: string, row: any, columnName: string) {
  row[columnName] = selectedValue;

  // If additional filtering or logic is needed, add it here
  this.selectedPage = 0;
  this.setPageCount();
  this.updateDisplayData();
}



handleDropdownChange(value: string, columnName: string, row: any) {
  row[columnName] = value; // Update the corresponding cell value
  this.filters.emit({ columnName, value });
}

initializeDropdownOptions(columnName: string, options: any[]) {
  this.dropdownOptions[columnName] = options;
}

onColumnChange(label: string, columnName: string): void {
  // Handle additional logic for label changes in any column
  console.log(`Label changed for ${columnName}:`, label);
}



@Input() webtools: any[] = []; // Add this to receive webtools data
  


getColumnData(column: any): any[] {
  return column.data || [];
}
  onWebtoolSelect(event: any, row: any) {
    console.log('Webtool selected:', event);
    row.webtool = event;
    row.webtoolId = event.id;
  }


}


