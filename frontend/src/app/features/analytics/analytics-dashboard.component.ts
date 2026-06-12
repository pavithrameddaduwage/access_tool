import { Component, computed, effect, inject, signal } from '@angular/core';
import { AnalyticsApiService } from './services/analytics-api.service';
import {
  AnalyticsQuery,
  DashboardRow,
  Overview,
  Period,
  TopViewRow,
  UserRow,
} from './models/analytics.models';
import { PeriodFilterComponent } from '../../shared/components/period-filter/period-filter.component';
import { DepartmentFilterComponent } from '../../shared/components/department-filter/department-filter.component';
import { ViewModeToggleComponent, ViewMode } from './components/view-mode-toggle/view-mode-toggle.component';
import { OverviewCardsComponent } from './components/overview-cards/overview-cards.component';
import { UserTableComponent } from './components/user-table/user-table.component';
import { ComponentTableComponent } from './components/component-table/component-table.component';
import { UserDrillDownComponent } from './components/user-drill-down/user-drill-down.component';
import { ComponentDrillDownComponent } from './components/component-drill-down/component-drill-down.component';

/**
 * Engagement analytics dashboard shell.
 * Hosts the User-view ↔ Report-view toggle, period/department filters, KPI cards,
 * the two main tables, and routes into the drill-downs — all driven by signals.
 */
@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    PeriodFilterComponent,
    DepartmentFilterComponent,
    ViewModeToggleComponent,
    OverviewCardsComponent,
    UserTableComponent,
    ComponentTableComponent,
    UserDrillDownComponent,
    ComponentDrillDownComponent,
  ],
  template: `
    <div class="page">
      <header class="bar">
        <h1>Engagement Analytics</h1>
        <div class="controls">
          <app-view-mode-toggle [mode]="viewMode()" (change)="onViewMode($event)" />
          <app-period-filter [value]="period()" (select)="onPeriod($event)" />
          <app-department-filter [departments]="departments()" [value]="department()" (select)="onDepartment($event)" />
        </div>
      </header>

      <app-overview-cards [overview]="overview()" />

      <section class="content">
        @let uid = selectedUserId();
        @let comp = selectedComponent();
        @if (uid) {
          <app-user-drill-down [userId]="uid" [query]="query()" (back)="selectedUserId.set(null)" />
        } @else if (comp) {
          <app-component-drill-down [type]="comp.type" [id]="comp.id" (back)="selectedComponent.set(null)" />
        } @else if (viewMode() === 'user') {
          <app-user-table [users]="users()" (selectUser)="selectedUserId.set($event)" />
        } @else {
          <app-component-table
            [rows]="components()"
            [activeType]="activeType()"
            (typeChange)="onTypeChange($event)"
            (selectComponent)="selectedComponent.set($event)"
          />
        }
      </section>
    </div>
  `,
  styles: [
    `
      .page { padding: 24px; max-width: 1200px; margin: 0 auto; }
      .bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
      h1 { font-size: 22px; margin: 0; color: #101828; }
      .controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
      .content { margin-top: 20px; background: transparent; }
    `,
  ],
})
export class AnalyticsDashboardComponent {
  private api = inject(AnalyticsApiService);

  readonly period = signal<Period>('30d');
  readonly department = signal<string | null>(null);
  readonly viewMode = signal<ViewMode>('user');
  readonly activeType = signal<string | null>(null);

  readonly selectedUserId = signal<string | null>(null);
  readonly selectedComponent = signal<{ type: string; id: string } | null>(null);

  readonly overview = signal<Overview | null>(null);
  readonly users = signal<UserRow[]>([]);
  readonly components = signal<TopViewRow[]>([]);
  readonly dashboards = signal<DashboardRow[]>([]);

  /** Distinct departments derived from the loaded users. */
  readonly departments = computed(() =>
    Array.from(new Set(this.users().map((u) => u.department).filter((d): d is string => !!d))).sort(),
  );

  readonly query = computed<AnalyticsQuery>(() => ({
    period: this.period(),
    department: this.department() ?? undefined,
  }));

  constructor() {
    // Reload overview + active table whenever query / view mode / type changes.
    effect(() => {
      const q = this.query();
      this.api.getOverview(q).subscribe({ next: (o) => this.overview.set(o), error: () => this.overview.set(null) });

      if (this.viewMode() === 'user') {
        this.api.getUsers(q).subscribe({ next: (r) => this.users.set(r), error: () => this.users.set([]) });
      } else {
        const type = this.activeType() ?? undefined;
        this.api.getTopViews(q, type, 50).subscribe({
          next: (r) => this.components.set(r),
          error: () => this.components.set([]),
        });
      }
    });
  }

  onViewMode(mode: ViewMode): void {
    this.selectedUserId.set(null);
    this.selectedComponent.set(null);
    this.viewMode.set(mode);
  }

  onPeriod(p: Period): void {
    this.period.set(p);
  }

  onDepartment(d: string | null): void {
    this.department.set(d);
  }

  onTypeChange(type: string | null): void {
    this.activeType.set(type);
  }
}
