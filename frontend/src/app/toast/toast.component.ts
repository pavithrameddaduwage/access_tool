import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../Services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      @for (toast of toastService.toasts$ | async; track toast.id) {
        <div 
          class="min-w-[400px] p-6 rounded-lg shadow-xl transform transition-all duration-300 ease-in-out pointer-events-auto"
          [ngClass]="{
            'bg-red-100 border-l-8 border-red-500 text-red-700': toast.type === 'error',
            'bg-green-100 border-l-8 border-green-500 text-green-700': toast.type === 'success',
            'bg-blue-100 border-l-8 border-blue-500 text-blue-700': toast.type === 'info',
            'bg-yellow-100 border-l-8 border-yellow-500 text-yellow-700': toast.type === 'warning'
          }"
        >
          <div class="flex justify-between items-center">
            <p class="text-lg font-medium">{{ toast.message }}</p>
            <button 
              (click)="toastService.remove(toast.id)"
              class="ml-4 text-xl font-bold hover:text-opacity-75 focus:outline-none"
            >
              ×
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}