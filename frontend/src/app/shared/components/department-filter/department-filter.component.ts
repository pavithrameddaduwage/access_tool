import { Component, input, output } from '@angular/core';

/** Department dropdown. Empty value = "All departments". */
@Component({
  selector: 'app-department-filter',
  standalone: true,
  template: `
    <select
      class="dept-filter"
      [value]="value() ?? ''"
      (change)="onChange($event)"
      aria-label="Department"
    >
      <option value="">All departments</option>
      @for (d of departments(); track d) {
        <option [value]="d">{{ d }}</option>
      }
    </select>
  `,
  styles: [
    `
      .dept-filter { padding: 6px 12px; border: 1px solid #d0d5dd; border-radius: 8px; font-size: 13px; color: #475467; background: #fff; min-width: 160px; }
    `,
  ],
})
export class DepartmentFilterComponent {
  readonly departments = input<string[]>([]);
  readonly value = input<string | null>(null);
  readonly select = output<string | null>();

  onChange(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.select.emit(v === '' ? null : v);
  }
}
