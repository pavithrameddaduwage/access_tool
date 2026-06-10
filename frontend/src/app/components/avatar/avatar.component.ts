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
      font-weight: 500;
      text-transform: uppercase;
    }
  `]
})
export class AvatarComponent implements OnInit {
  @Input() name: string = '';

  private readonly pastelThemes = [
    { solid: '#1a73e8', bg: '#e8f0fe' }, // Soft Blue
    { solid: '#137333', bg: '#e6f4ea' }, // Soft Green
    { solid: '#9333ea', bg: '#f3e8fd' }, // Soft Lavender
    { solid: '#b06000', bg: '#fef7e0' }, // Soft Amber
    { solid: '#c5221f', bg: '#fce8e6' }, // Soft Rose
    { solid: '#007b83', bg: '#e4f7fb' }  // Soft Teal
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
    const index = Math.abs(hash) % this.pastelThemes.length;
    const colorTheme = this.pastelThemes[index];
    
    return {
      'background-color': colorTheme.bg,
      'color': colorTheme.solid
    };
  }
}
