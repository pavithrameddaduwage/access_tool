import { Component, effect, inject, input, output, signal } from '@angular/core';
import { AnalyticsApiService } from '../../services/analytics-api.service';
import { ComponentViewerRow } from '../../models/analytics.models';
import { ComponentViewerListComponent } from '../component-viewer-list/component-viewer-list.component';

/** Single-component detail: who viewed it + their engaged time. */
@Component({
  selector: 'app-component-drill-down',
  standalone: true,
  imports: [ComponentViewerListComponent],
  template: `
    <button type="button" class="back" (click)="back.emit()">← Back to components</button>
    <h2>{{ type() }} · {{ id() }}</h2>
    <div class="meta">{{ viewers().length }} viewer(s)</div>
    <h3>Viewers</h3>
    <app-component-viewer-list [viewers]="viewers()" />
  `,
  styles: [
    `
      .back { background: none; border: none; color: #2563eb; cursor: pointer; font-size: 13px; padding: 0; margin-bottom: 12px; }
      h2 { margin: 0 0 4px; font-size: 18px; }
      h3 { margin: 20px 0 8px; font-size: 14px; color: #344054; }
      .meta { font-size: 13px; color: #667085; }
    `,
  ],
})
export class ComponentDrillDownComponent {
  private api = inject(AnalyticsApiService);
  readonly type = input.required<string>();
  readonly id = input.required<string>();
  readonly back = output<void>();

  readonly viewers = signal<ComponentViewerRow[]>([]);

  constructor() {
    effect(() => {
      const t = this.type();
      const cid = this.id();
      this.viewers.set([]);
      this.api.getViewsByComponent(t, cid).subscribe({
        next: (rows) => this.viewers.set(rows),
        error: () => this.viewers.set([]),
      });
    });
  }
}
