import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../Services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack">
      @for (toast of toastService.toasts$ | async; track toast.id) {
        <div class="toast-item" [ngClass]="'toast-' + toast.type">
          <div class="toast-icon">
            <i [class]="getIcon(toast.type)"></i>
          </div>
          <p class="toast-msg">{{ toast.message }}</p>
          <button class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Dismiss">
            <i class="pi pi-times"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      bottom: 1.25rem;
      right: 1.25rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 320px;
      min-width: 260px;
      pointer-events: none;
    }

    .toast-item {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      background: #ffffff;
      border: 1px solid #e8eaed;
      border-radius: 7px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.10);
      padding: 0.75rem 0.875rem;
      pointer-events: auto;
      border-left-width: 3px;
      border-left-style: solid;
      animation: slide-in 0.2s ease;
    }

    @keyframes slide-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Variants */
    .toast-success { border-left-color: #22c55e; }
    .toast-error   { border-left-color: #ef4444; }
    .toast-warning { border-left-color: #f59e0b; }
    .toast-info    { border-left-color: #3b82f6; }

    .toast-icon {
      font-size: 0.875rem;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .toast-success .toast-icon { color: #22c55e; }
    .toast-error   .toast-icon { color: #ef4444; }
    .toast-warning .toast-icon { color: #f59e0b; }
    .toast-info    .toast-icon { color: #3b82f6; }

    .toast-msg {
      flex: 1;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.8125rem;
      font-weight: 400;
      color: #374151;
      line-height: 1.5;
    }

    .toast-close {
      background: none;
      border: none;
      padding: 0;
      color: #9ca3af;
      cursor: pointer;
      font-size: 0.7rem;
      flex-shrink: 0;
      margin-top: 2px;
      display: flex;
      align-items: center;
    }

    .toast-close:hover {
      color: #374151;
      background: none;
      border: none;
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'pi pi-check-circle';
      case 'error':   return 'pi pi-times-circle';
      case 'warning': return 'pi pi-exclamation-triangle';
      case 'info':    return 'pi pi-info-circle';
      default:        return 'pi pi-info-circle';
    }
  }
}