import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ComponentViewerRow } from '../../models/analytics.models';

/** Per-component list of users who viewed it + their engaged time. */
@Component({
  selector: 'app-component-viewer-list',
  standalone: true,
  imports: [DatePipe],
  template: `
    <table class="tbl">
      <thead><tr><th>User</th><th>Views</th><th>Engaged</th><th>Last viewed</th></tr></thead>
      <tbody>
        @for (v of viewers(); track v.userId) {
          <tr>
            <td>{{ v.userEmail ?? v.userId }}</td>
            <td>{{ v.viewCount }}</td>
            <td>{{ fmt(v.totalEngagedSeconds) }}</td>
            <td>{{ v.lastViewedAt ? (v.lastViewedAt | date: 'short') : '—' }}</td>
          </tr>
        } @empty {
          <tr><td colspan="4" class="empty">No viewers recorded.</td></tr>
        }
      </tbody>
    </table>
  `,
  styles: [
    `
      .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eaecf0; }
      th { color: #667085; font-size: 11px; text-transform: uppercase; }
      .empty { text-align: center; color: #98a2b3; padding: 16px; }
    `,
  ],
})
export class ComponentViewerListComponent {
  readonly viewers = input<ComponentViewerRow[]>([]);

  fmt(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
}
