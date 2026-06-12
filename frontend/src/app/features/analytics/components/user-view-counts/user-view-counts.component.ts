import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserViewRow } from '../../models/analytics.models';

/** Per-user list of components viewed + view counts. */
@Component({
  selector: 'app-user-view-counts',
  standalone: true,
  imports: [DatePipe],
  template: `
    <table class="tbl">
      <thead><tr><th>Component</th><th>Type</th><th>Views</th><th>Last viewed</th></tr></thead>
      <tbody>
        @for (v of views(); track v.componentId + v.componentType) {
          <tr>
            <td>{{ v.componentName ?? v.componentId }}</td>
            <td><span class="badge">{{ v.componentType }}</span></td>
            <td>{{ v.viewCount }}</td>
            <td>{{ v.lastViewedAt ? (v.lastViewedAt | date: 'short') : '—' }}</td>
          </tr>
        } @empty {
          <tr><td colspan="4" class="empty">No views recorded.</td></tr>
        }
      </tbody>
    </table>
  `,
  styles: [
    `
      .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eaecf0; }
      th { color: #667085; font-size: 11px; text-transform: uppercase; }
      .badge { background: #eff8ff; color: #175cd3; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
      .empty { text-align: center; color: #98a2b3; padding: 16px; }
    `,
  ],
})
export class UserViewCountsComponent {
  readonly views = input<UserViewRow[]>([]);
}
