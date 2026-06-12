import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TopViewRow } from '../../models/analytics.models';

interface TypeChip {
  label: string;
  value: string | null;
}

/** Report view: all components with view stats + a component-type filter. */
@Component({
  selector: 'app-component-table',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="chips">
      @for (c of chips; track c.label) {
        <button type="button" class="chip" [class.active]="c.value === activeType()" (click)="typeChange.emit(c.value)">
          {{ c.label }}
        </button>
      }
    </div>
    <table class="tbl">
      <thead>
        <tr><th>Name</th><th>Type</th><th>Total views</th><th>Unique viewers</th><th>Last viewed</th></tr>
      </thead>
      <tbody>
        @for (r of rows(); track r.componentId + r.componentType) {
          <tr class="row" (click)="selectComponent.emit({ type: r.componentType, id: r.componentId })">
            <td>{{ r.componentName ?? r.componentId }}</td>
            <td><span class="badge">{{ r.componentType }}</span></td>
            <td>{{ r.totalViews }}</td>
            <td>{{ r.uniqueViewers }}</td>
            <td>{{ r.lastViewedAt ? (r.lastViewedAt | date: 'short') : '—' }}</td>
          </tr>
        } @empty {
          <tr><td colspan="5" class="empty">No components in this period.</td></tr>
        }
      </tbody>
    </table>
  `,
  styles: [
    `
      .chips { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
      .chip { padding: 5px 12px; border: 1px solid #d0d5dd; border-radius: 16px; background: #fff; cursor: pointer; font-size: 12px; color: #475467; }
      .chip.active { background: #2563eb; color: #fff; border-color: #2563eb; }
      .tbl { width: 100%; border-collapse: collapse; background: #fff; font-size: 13px; }
      th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eaecf0; }
      th { color: #667085; font-weight: 600; font-size: 12px; text-transform: uppercase; }
      .row { cursor: pointer; }
      .row:hover { background: #f9fafb; }
      .badge { background: #eff8ff; color: #175cd3; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
      .empty { text-align: center; color: #98a2b3; padding: 24px; }
    `,
  ],
})
export class ComponentTableComponent {
  readonly rows = input<TopViewRow[]>([]);
  readonly activeType = input<string | null>(null);
  readonly typeChange = output<string | null>();
  readonly selectComponent = output<{ type: string; id: string }>();

  readonly chips: TypeChip[] = [
    { label: 'All', value: null },
    { label: 'Reports', value: 'report' },
    { label: 'Dashboards', value: 'dashboard' },
    { label: 'Pages', value: 'dashboard_page' },
    { label: 'Datasets', value: 'dataset' },
  ];
}
