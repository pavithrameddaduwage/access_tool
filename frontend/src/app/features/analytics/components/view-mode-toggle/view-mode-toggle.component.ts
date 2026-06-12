import { Component, input, output } from '@angular/core';

export type ViewMode = 'user' | 'report';

/** Segmented control switching between User view and Report view. */
@Component({
  selector: 'app-view-mode-toggle',
  standalone: true,
  template: `
    <div class="toggle" role="group" aria-label="View mode">
      <button type="button" class="toggle-btn" [class.active]="mode() === 'user'" (click)="change.emit('user')">
        👤 User view
      </button>
      <button type="button" class="toggle-btn" [class.active]="mode() === 'report'" (click)="change.emit('report')">
        📊 Report view
      </button>
    </div>
  `,
  styles: [
    `
      .toggle { display: inline-flex; border: 1px solid #d0d5dd; border-radius: 10px; overflow: hidden; }
      .toggle-btn { padding: 8px 18px; background: #fff; border: none; cursor: pointer; font-size: 14px; color: #475467; }
      .toggle-btn + .toggle-btn { border-left: 1px solid #d0d5dd; }
      .toggle-btn.active { background: #111827; color: #fff; font-weight: 600; }
    `,
  ],
})
export class ViewModeToggleComponent {
  readonly mode = input<ViewMode>('user');
  readonly change = output<ViewMode>();
}
