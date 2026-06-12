import { Component, input, output } from '@angular/core';
import { Period } from '../../../features/analytics/models/analytics.models';

/** Segmented 7d / 30d / 90d period selector. */
@Component({
  selector: 'app-period-filter',
  standalone: true,
  template: `
    <div class="period-filter" role="group" aria-label="Period">
      @for (p of periods; track p) {
        <button
          type="button"
          class="period-btn"
          [class.active]="p === value()"
          (click)="select.emit(p)"
        >
          {{ p }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .period-filter { display: inline-flex; border: 1px solid #d0d5dd; border-radius: 8px; overflow: hidden; }
      .period-btn { padding: 6px 14px; background: #fff; border: none; cursor: pointer; font-size: 13px; color: #475467; }
      .period-btn + .period-btn { border-left: 1px solid #d0d5dd; }
      .period-btn.active { background: #2563eb; color: #fff; font-weight: 600; }
    `,
  ],
})
export class PeriodFilterComponent {
  readonly value = input<Period>('30d');
  readonly select = output<Period>();
  readonly periods: Period[] = ['7d', '30d', '90d'];
}
