import { Component, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AnalyticsApiService } from '../../services/analytics-api.service';
import { AnalyticsQuery, UserDetail } from '../../models/analytics.models';
import { UserViewCountsComponent } from '../user-view-counts/user-view-counts.component';

/** Single-user detail: summary, session timeline, view counts, audit events. */
@Component({
  selector: 'app-user-drill-down',
  standalone: true,
  imports: [DatePipe, UserViewCountsComponent],
  template: `
    <button type="button" class="back" (click)="back.emit()">← Back to users</button>
    @if (detail(); as d) {
      <h2>{{ d.user.userEmail ?? d.user.userId }}</h2>
      <div class="summary">
        <span><b>Department:</b> {{ d.user.department ?? '—' }}</span>
        <span><b>Engaged:</b> {{ fmt(d.user.totalEngagedSeconds) }}</span>
        <span><b>Total views:</b> {{ d.user.totalViews }}</span>
      </div>

      <h3>Sessions</h3>
      <table class="tbl">
        <thead><tr><th>Dashboard</th><th>Tab</th><th>Started</th><th>Engaged</th><th>Clicks</th><th>Scrolls</th><th>Copies</th></tr></thead>
        <tbody>
          @for (s of d.sessions; track s.id) {
            <tr>
              <td>{{ s.dashboardId }}</td>
              <td>{{ s.tabName ?? '—' }}</td>
              <td>{{ s.startedAt | date: 'short' }}</td>
              <td>{{ fmt(s.engagedSeconds) }}</td>
              <td>{{ s.clickCount }}</td>
              <td>{{ s.scrollCount }}</td>
              <td>{{ s.copyCount }}</td>
            </tr>
          } @empty { <tr><td colspan="7" class="empty">No sessions.</td></tr> }
        </tbody>
      </table>

      <h3>Components viewed</h3>
      <app-user-view-counts [views]="d.views" />

      <h3>Audit events</h3>
      <table class="tbl">
        <thead><tr><th>Activity</th><th>Report</th><th>When</th></tr></thead>
        <tbody>
          @for (a of d.audit; track $index) {
            <tr><td>{{ a.activityType }}</td><td>{{ a.reportName ?? '—' }}</td><td>{{ a.activityAt | date: 'short' }}</td></tr>
          } @empty { <tr><td colspan="3" class="empty">No audit events.</td></tr> }
        </tbody>
      </table>
    } @else {
      <p class="loading">Loading…</p>
    }
  `,
  styles: [
    `
      .back { background: none; border: none; color: #2563eb; cursor: pointer; font-size: 13px; padding: 0; margin-bottom: 12px; }
      h2 { margin: 0 0 8px; }
      h3 { margin: 20px 0 8px; font-size: 14px; color: #344054; }
      .summary { display: flex; gap: 20px; font-size: 13px; color: #475467; margin-bottom: 8px; }
      .tbl { width: 100%; border-collapse: collapse; background: #fff; font-size: 13px; }
      th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eaecf0; }
      th { color: #667085; font-size: 11px; text-transform: uppercase; }
      .empty { text-align: center; color: #98a2b3; padding: 16px; }
      .loading { color: #98a2b3; }
    `,
  ],
})
export class UserDrillDownComponent {
  private api = inject(AnalyticsApiService);
  readonly userId = input.required<string>();
  readonly query = input<AnalyticsQuery>({});
  readonly back = output<void>();

  readonly detail = signal<UserDetail | null>(null);

  constructor() {
    effect(() => {
      const id = this.userId();
      const q = this.query();
      this.detail.set(null);
      this.api.getUserDetail(id, q).subscribe({
        next: (d) => this.detail.set(d),
        error: () => this.detail.set(null),
      });
    });
  }

  fmt(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
}
