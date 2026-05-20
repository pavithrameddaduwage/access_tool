import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-avatar mr-2" [ngStyle]="getStyles()">
      {{ getInitials() }}
    </div>
  `,
  styles: [`
    .user-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
  `]
})
export class AvatarComponent implements OnInit {
  @Input() name: string = '';

  private readonly blueShades = [
    { solid: '#1e3a8a', bg: 'rgba(30, 58, 138, 0.12)' },
    { solid: '#1d4ed8', bg: 'rgba(29, 78, 216, 0.12)' },
    { solid: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
    { solid: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
    { solid: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' }
  ];

  constructor() {}
  ngOnInit(): void {}

  getInitials(): string {
    if (!this.name) return '??';
    const parts = this.name.trim().split(/[\s.]+/);
    if (parts.length === 1) return this.name.substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getStyles(): any {
    let hash = 0;
    const str = this.name || 'default';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.blueShades.length;
    const colorTheme = this.blueShades[index];
    
    return {
      'background-color': colorTheme.bg,
      'color': colorTheme.solid
    };
  }
}
