import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from '../Services/confirmation.service';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      @for (dialog of confirmationService.dialogs$ | async; track dialog.id) {
        <div class="fixed inset-0 bg-black bg-opacity-50 pointer-events-auto">
          <div class="fixed inset-0 flex items-center justify-center">
            <div class="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
              <div class="mb-4">
                <h3 class="text-lg font-medium text-gray-900">{{ dialog.title }}</h3>
                <p class="mt-2 text-sm text-gray-500">{{ dialog.message }}</p>
              </div>
              <div class="mt-6 flex justify-end space-x-3">
                <button
                  (click)="confirmationService.remove(dialog.id)"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  (click)="confirmationService.confirm(dialog.id)"
                  class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ConfirmationComponent {
  constructor(public confirmationService: ConfirmationService) {}
}