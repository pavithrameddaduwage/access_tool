import { Component, EventEmitter, forwardRef, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-search-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './select_with_search.component.html',
  styleUrls: ['./select_with_search.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectWithSearchComponent),
      multi: true
    }
  ]
})
export class SelectWithSearchComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() label: string = '';
  @Input() textsize: string = 'text-xs';
  @Input() value: string = '';
  @Input() disabled: boolean = false;
  @Input() blankline: boolean = false;

  @Output() setSelectValue = new EventEmitter<any>();
  @Output() setfilterkey = new EventEmitter<any>();
  @Output() valueChange = new EventEmitter<string>();  // Two-way binding for value
  @Output() onCategoryChange = new EventEmitter<string>();  // Emit category changes

  items: any[] = [];
  filteredItems: any[] = [];
  selectedvalue: string = '';
  inputValue: string = ''; 
  dropdownVisible: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['value']) {
      this.updateItems();
    }
  }

  updateItems() {
    this.items = this.data;
    this.filteredItems = this.items; // Initially, no filtering
    this.selectedvalue = this.value;
  }

  showDropdown() {
    // Ensure when the dropdown is shown, it resets the filtered items to show all items
    this.filteredItems = [...this.items];
    this.dropdownVisible = true;
  }

  hideDropdown() {
    setTimeout(() => {
      this.dropdownVisible = false;
    }, 100);
  }

  filterDropdown(e: any) {
    const searchText = e.target.value.toLowerCase(); // Convert to lowercase for case-insensitive matching
    this.inputValue = e.target.value; // Bind to input field
  
    // Apply filtering only if the input value is not empty
    if (this.inputValue.trim() === '') {
      this.filteredItems = [...this.items]; // Reset to show all items when the input is empty
    } else {
      this.filteredItems = this.items.filter((option: any) =>
        option.label.toLowerCase().includes(searchText)
      );
    }
  
    // Emit the search term to the parent (optional)
    const input = { searchtext: this.inputValue, label: this.label };
    this.setfilterkey.emit(input);
  }
  
  selectOption(option: any) {
    if (option.value === '') {
      this.clearSelection(); // Handle clear selection
    } else {
      this.inputValue = option.label;
      this.selectedvalue = option.value;
  
      // Emit the selected value to the parent component
      this.valueChange.emit(this.selectedvalue);
      this.setSelectValue.emit(option.value);  // Emit the selected category value
      this.dropdownVisible = false;
  
      // Emit the category label to the parent component
      this.onCategoryChange.emit(option.label);  // Now this works since onCategoryChange is defined
    }
  }

  clearSelection() {
    // Clear the selected value and input field
    this.selectedvalue = '';
    this.inputValue = '';

    // Reset filtered items to show all options
    this.filteredItems = [...this.items];

    // Emit the cleared value to the parent component
    this.valueChange.emit(this.selectedvalue);
    this.setSelectValue.emit(this.selectedvalue);

    // Optionally, keep the dropdown open after clearing selection
    this.dropdownVisible = true;
  }

  textSizeClass() {
    return this.textsize;
  }
}
