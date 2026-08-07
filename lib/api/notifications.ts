import { BACKEND_URL } from '@/lib/env';
import { getToken } from '@/lib/auth';

export interface NotificationAction {
  label: string;
  url: string;
}

export interface NotificationActor {
  id: string;
  name: string;
  type: 'admin' | 'system' | 'user';
}

export interface Notification {
  _id: string;
  recipientUserId: string;
  merchantId: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  category: 'APPROVAL' | 'ADMIN' | 'SYSTEM' | 'FEATURE' | 'SECURITY' | 'BILLING' | 'WARNING';
  sourceModule:
    | 'MARKETPLACE'
    | 'SCREEN_BUILDER'
    | 'THEME'
    | 'BILLING'
    | 'ADMIN'
    | 'AUTH'
    | 'ANALYTICS';
  version: number;
  silent: boolean;
  isPinned: boolean;
  iconKey?: string;
  actor: NotificationActor;
  actions: NotificationAction[];
  readAt: string | null;
  clearedAt: string | null;
  expiresAt?: string;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  page: number;
  pageSize: number;
  total: number;
  unread: number;
  hasMore: boolean;
}

export interface SyncNotificationsResult {
  deltaNotifications: Notification[];
  unread: number;
  activeReadIds: string[];
  syncedAt: string;
}

function headers(): HeadersInit {
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  const token = typeof window !== 'undefined' ? getToken() : null;
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return h;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}/api/notifications${path}`, {
    cache: 'no-store',
    ...init,
    headers: { ...headers(), ...(init?.headers || {}) },
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }

  return json.data as T;
}

export const notificationsApi = {
  list: (
    params: { page?: number; pageSize?: number; category?: string; unread?: boolean } = {}
  ) => {
    const q = new URLSearchParams();
    if (params.page) q.append('page', String(params.page));
    if (params.pageSize) q.append('pageSize', String(params.pageSize));
    if (params.category) q.append('category', params.category);
    if (params.unread) q.append('unread', 'true');
    return request<PaginatedNotifications>(`?${q.toString()}`);
  },
  sync: (cursor?: string) => {
    const q = new URLSearchParams();
    if (cursor) q.append('cursor', cursor);
    return request<SyncNotificationsResult>(`/sync?${q.toString()}`);
  },
  unreadCount: () => request<{ unread: number }>('/unread-count'),
  markAsRead: (id: string) =>
    request<{ notification: Notification; unread: number }>(`/${id}/read`, { method: 'PATCH' }),
  readAll: () => request<{ unread: number }>('/read-all', { method: 'PATCH' }),
  clear: (id: string) =>
    request<{ notification: Notification; unread: number }>(`/${id}/clear`, { method: 'PATCH' }),
  clearAll: () => request<{ success: boolean }>('/clear-all', { method: 'PATCH' }),
  clearAllRead: () => request<{ success: boolean }>(`/clear-all-read`, { method: 'PATCH' }),
  clearSelected: (ids: string[]) =>
    request<{ unread: number }>('/clear-selected', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),
  delete: (id: string) => request<{ unread: number }>(`/${id}`, { method: 'DELETE' }),
};
