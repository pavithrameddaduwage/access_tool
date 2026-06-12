import { Component, computed, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserRow } from '../../models/analytics.models';

type SortKey = 'totalEngagedSeconds' | 'lastSeen' | 'totalViews';

/** All-users table: engaged time, last seen, sessions, views. Sortable + clickable. */
@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [DatePipe],
  template: `
    <table class="tbl">
      <thead>
        <tr>
          <th>User</th>
          <th>Department</th>
          <th class="sortable" (click)="sortBy('totalEngagedSeconds')">Engaged {{ arrow('totalEngagedSeconds') }}</th>
          <th class="sortable" (click)="sortBy('lastSeen')">Last seen {{ arrow('lastSeen') }}</th>
          <th>Sessions</th>
          <th class="sortable" (click)="sortBy('totalViews')">Views {{ arrow('totalViews') }}</th>
        </tr>
      </thead>
      <tbody>
        @for (u of sorted(); track u.userId) {
          <tr class="row" (click)="selectUser.emit(u.userId)">
            <td>{{ u.userEmail ?? u.userId }}</td>
            <td>{{ u.department ?? '—' }}</td>
            <td>{{ fmt(u.totalEngagedSeconds) }}</td>
            <td>{{ u.lastSeen ? (u.lastSeen | date: 'short') : '—' }}</td>
            <td>{{ u.sessionCount }}</td>
            <td>{{ u.totalViews }}</td>
          </tr>
        } @empty {
          <tr><td colspan="6" class="empty">No users in this period.</td></tr>
        }
      </tbody>
    </table>
  `,
  styles: [
    `
      .tbl { width: 100%; border-collapse: collapse; background: #fff; font-size: 13px; }
      th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eaecf0; }
      th { color: #667085; font-weight: 600; font-size: 12px; text-transform: uppercase; }
      .sortable { cursor: pointer; user-select: none; }
      .row { cursor: pointer; }
      .row:hover { background: #f9fafb; }
      .empty { text-align: center; color: #98a2b3; padding: 24px; }
    `,
  ],
})
export class UserTableComponent {
  readonly users = input<UserRow[]>([]);
  readonly selectUser = output<string>();

  private sortKey = signal<SortKey>('totalEngagedSeconds');
  private sortDir = signal<'asc' | 'desc'>('desc');

  readonly sorted = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...this.users()].sort((a, b) => {
      const av = this.sortValue(a, key);
      const bv = this.sortValue(b, key);
      return av < bv ? -1 * dir : av > bv ? 1 * dir : 0;
    });
  });

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('desc');
    }
  }

  arrow(key: SortKey): string {
    if (this.sortKey() !== key) return '';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  fmt(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  private sortValue(u: UserRow, key: SortKey): number {
    if (key === 'lastSeen') return u.lastSeen ? new Date(u.lastSeen).getTime() : 0;
    return u[key];
  }
}
