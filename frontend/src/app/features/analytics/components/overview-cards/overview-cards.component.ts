import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Overview } from '../../models/analytics.models';

/** KPI cards: active users, engaged hours, averages, top dashboard, top report. */
@Component({
  selector: 'app-overview-cards',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    @if (overview(); as o) {
      <div class="cards">
        <div class="card"><div class="label">Active users</div><div class="value">{{ o.activeUsers }}</div></div>
        <div class="card"><div class="label">Engaged hours</div><div class="value">{{ o.totalEngagedHours }}</div></div>
        <div class="card"><div class="label">Avg min / user</div><div class="value">{{ o.avgEngagedMinPerUser }}</div></div>
        <div class="card">
          <div class="label">Top dashboard</div>
          <div class="value sm">{{ o.topDashboard?.name ?? '—' }}</div>
          <div class="sub">{{ o.topDashboard ? (o.topDashboard.engagedSeconds / 3600 | number: '1.1-1') + ' h' : '' }}</div>
        </div>
        <div class="card">
          <div class="label">Most-viewed report</div>
          <div class="value sm">{{ o.mostViewedReport?.name ?? '—' }}</div>
          <div class="sub">{{ o.mostViewedReport ? o.mostViewedReport.viewCount + ' views' : '' }}</div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
      .card { background: #fff; border: 1px solid #eaecf0; border-radius: 12px; padding: 16px; }
      .label { font-size: 12px; color: #667085; text-transform: uppercase; letter-spacing: .03em; }
      .value { font-size: 28px; font-weight: 700; color: #101828; margin-top: 6px; }
      .value.sm { font-size: 16px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .sub { font-size: 12px; color: #667085; margin-top: 4px; }
    `,
  ],
})
export class OverviewCardsComponent {
  readonly overview = input<Overview | null>(null);
}
