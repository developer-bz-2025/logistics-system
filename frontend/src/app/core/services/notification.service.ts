import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface NotificationSender {
  id: number;
  name: string;
  email: string;
}

export interface Notification {
  id: number;
  notification_id: number;
  title: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender: NotificationSender;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  unread_count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiBaseUrl}/notifications`;

  constructor(private http: HttpClient) {}

  /**
   * Get all notifications with pagination and filters
   */
  getNotifications(options: {
    page?: number;
    per_page?: number;
    is_read?: boolean;
  } = {}): Observable<NotificationsResponse> {
    let params = new HttpParams();
    
    if (options.page) {
      params = params.set('page', String(options.page));
    }
    if (options.per_page) {
      params = params.set('per_page', String(options.per_page));
    }
    if (options.is_read !== undefined) {
      params = params.set('is_read', String(options.is_read));
    }

    return this.http.get<NotificationsResponse>(this.apiUrl, { params });
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`).pipe(
      map(res => res.unread_count || 0)
    );
  }

  /**
   * Get specific notification (automatically marks as read)
   */
  getNotification(id: number): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/${id}`);
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: number): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/${id}/read`, {});
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<{ count: number }> {
    return this.http.put<{ count: number }>(`${this.apiUrl}/mark-all-read`, {});
  }

  /**
   * Delete notification
   */
  deleteNotification(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
