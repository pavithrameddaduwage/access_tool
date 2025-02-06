// confirmation.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmationDialog {
  title: string;
  message: string;
  id: number;
  onConfirm: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private dialogs: ConfirmationDialog[] = [];
  private dialogsSubject = new BehaviorSubject<ConfirmationDialog[]>([]);
  dialogs$ = this.dialogsSubject.asObservable();

  show(title: string, message: string, onConfirm: () => void) {
    const dialog: ConfirmationDialog = {
      title,
      message,
      id: Date.now(),
      onConfirm
    };
    
    this.dialogs = [...this.dialogs, dialog];
    this.dialogsSubject.next(this.dialogs);
  }

  remove(id: number) {
    this.dialogs = this.dialogs.filter(d => d.id !== id);
    this.dialogsSubject.next(this.dialogs);
  }

  confirm(id: number) {
    const dialog = this.dialogs.find(d => d.id === id);
    if (dialog) {
      dialog.onConfirm();
      this.remove(id);
    }
  }
}