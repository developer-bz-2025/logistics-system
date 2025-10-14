import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private _toasts = new BehaviorSubject<Toast[]>([]);
  toasts$ = this._toasts.asObservable();
  private seq = 1;

  show(type: ToastType, message: string, title?: string, duration = 3500) {
    const id = this.seq++;
    const t: Toast = { id, type, title, message, duration };
    this._toasts.next([...this._toasts.value, t]);
    if (duration && duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }
  success(msg: string, title?: string, duration?: number) { this.show('success', msg, title, duration); }
  error(msg: string, title?: string, duration?: number) { this.show('error', msg, title, duration); }
  info(msg: string, title?: string, duration?: number) { this.show('info', msg, title, duration); }

  dismiss(id: number) {
    this._toasts.next(this._toasts.value.filter(t => t.id !== id));
  }
  clear() { this._toasts.next([]); }
}
