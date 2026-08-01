'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { BACKEND_URL } from '@/lib/env';
import { getToken } from '@/lib/auth';
import { notificationsApi, type Notification } from '@/lib/api/notifications';
import { marketplaceApi } from '@/lib/api/marketplace';

export type ToastVariant = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'LOADING';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  iconKey?: string;
  actions?: { label: string; url?: string; onClick?: () => void }[];
  duration?: number; // default: 5000ms
  silent?: boolean;
}

interface NotificationContextValue {
  latestNotifications: Notification[];
  unreadCount: number;
  toastQueue: ToastItem[];
  loading: boolean;
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  clearAllRead: () => Promise<void>;
  clearSelected: (ids: string[]) => Promise<void>;
  socket: Socket | null;
  merchant: any;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [merchant, setMerchant] = useState<any>(null);
  const [latestNotifications, setLatestNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);
  const [loading, setLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pathRef = useRef<string>('');

  // Keep track of current location path to suppress toast popups on the Notifications history page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      pathRef.current = window.location.pathname;
      const handlePathChange = () => {
        pathRef.current = window.location.pathname;
      };
      window.addEventListener('popstate', handlePathChange);
      return () => window.removeEventListener('popstate', handlePathChange);
    }
  }, []);

  // Fetch active merchant profile for user role
  useEffect(() => {
    if (user && user.role === 'user') {
      marketplaceApi
        .myMerchant()
        .then((m) => setMerchant(m))
        .catch((err) => console.error('[NotificationContext] Failed to load merchant info', err));
    } else {
      setMerchant(null);
      setLatestNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Load initial unread-count and latest notifications
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [notifsRes, countRes] = await Promise.all([
        notificationsApi.list({ page: 1, pageSize: 20 }),
        notificationsApi.unreadCount(),
      ]);
      setLatestNotifications(notifsRes.notifications || []);
      setUnreadCount(countRes.unread || 0);
    } catch (err) {
      console.error('[NotificationContext] Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (merchant) {
      loadInitialData();
    }
  }, [merchant, loadInitialData]);

  // Handle Toast Queue Management
  const addToast = useCallback((toast: Omit<ToastItem, 'id'>): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...toast, id };
    setToastQueue((prev) => {
      // Stack max queue size of 5 visible toasts
      if (prev.length >= 5) {
        return [...prev.slice(1), newToast];
      }
      return [...prev, newToast];
    });
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToastQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Establish single WebSocket connection safely
  useEffect(() => {
    if (!merchant) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = getToken();
    if (!token) return;

    // Reuse existing socket connection if available
    if (socketRef.current) {
      return;
    }

    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[NotificationContext] Socket connected successfully:', socket.id);
      socket.emit('join-merchant-notifications', { merchantId: merchant.merchantId });

      // Reconnection Data Synchronization: fetch missed alerts while disconnected
      loadInitialData();
    });

    socket.on('notification:new', (data: { notification: Notification; unreadCount: number }) => {
      console.log('[NotificationContext] Incoming WebSocket notification:', data.notification);

      // Prepend to list, keeping max 20 items
      setLatestNotifications((prev) => {
        const filtered = prev.filter((n) => n._id !== data.notification._id);
        return [data.notification, ...filtered].slice(0, 20);
      });

      setUnreadCount(data.unreadCount);
      // Popup notifications disabled per requirement
    });

    socket.on('notification:count', (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [merchant, addToast, loadInitialData]);

  // --- API ACTIONS WITH OPTIMISTIC UPDATES & ROLLBACK ---

  const markAsRead = useCallback(async (id: string) => {
    let prevNotifs: Notification[] = [];
    let prevCount = 0;

    setLatestNotifications((prev) => {
      prevNotifs = prev;
      return prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n));
    });
    setUnreadCount((c) => {
      prevCount = c;
      return Math.max(0, c - 1);
    });

    try {
      await notificationsApi.markAsRead(id);
    } catch (err) {
      console.error('[NotificationContext] Failed to mark read, rolling back...', err);
      setLatestNotifications(prevNotifs);
      setUnreadCount(prevCount);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    let prevNotifs: Notification[] = [];
    let prevCount = 0;

    setLatestNotifications((prev) => {
      prevNotifs = prev;
      return prev.map((n) => ({ ...n, readAt: new Date().toISOString() }));
    });
    setUnreadCount((c) => {
      prevCount = c;
      return 0;
    });

    try {
      await notificationsApi.readAll();
    } catch (err) {
      console.error('[NotificationContext] Failed to mark all read, rolling back...', err);
      setLatestNotifications(prevNotifs);
      setUnreadCount(prevCount);
    }
  }, []);

  const clearNotification = useCallback(async (id: string) => {
    let prevNotifs: Notification[] = [];
    let prevCount = 0;

    setLatestNotifications((prev) => {
      prevNotifs = prev;
      return prev.filter((n) => n._id !== id);
    });

    try {
      await notificationsApi.clear(id);
    } catch (err) {
      console.error('[NotificationContext] Failed to clear, rolling back...', err);
      setLatestNotifications(prevNotifs);
      setUnreadCount(prevCount);
    }
  }, []);

  const clearAll = useCallback(async () => {
    let prevNotifs: Notification[] = [];
    let prevCount = 0;

    setLatestNotifications((prev) => {
      prevNotifs = prev;
      return [];
    });
    setUnreadCount((c) => {
      prevCount = c;
      return 0;
    });

    try {
      await notificationsApi.clearAll();
    } catch (err) {
      console.error('[NotificationContext] Failed to clear all notifications, rolling back...', err);
      setLatestNotifications(prevNotifs);
      setUnreadCount(prevCount);
    }
  }, []);

  const clearAllRead = useCallback(async () => {
    let prevNotifs: Notification[] = [];

    setLatestNotifications((prev) => {
      prevNotifs = prev;
      return prev.filter((n) => !n.readAt);
    });

    try {
      await notificationsApi.clearAllRead();
    } catch (err) {
      console.error('[NotificationContext] Failed to clear all read, rolling back...', err);
      setLatestNotifications(prevNotifs);
    }
  }, []);

  const clearSelected = useCallback(async (ids: string[]) => {
    let prevNotifs: Notification[] = [];
    let prevCount = 0;

    setLatestNotifications((prev) => {
      prevNotifs = prev;
      return prev.filter((n) => !ids.includes(n._id));
    });

    try {
      await notificationsApi.clearSelected(ids);
    } catch (err) {
      console.error('[NotificationContext] Failed to clear selected, rolling back...', err);
      setLatestNotifications(prevNotifs);
      setUnreadCount(prevCount);
    }
  }, []);

  const value = useMemo(
    () => ({
      latestNotifications,
      unreadCount,
      toastQueue,
      loading,
      addToast,
      dismissToast,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAll,
      clearAllRead,
      clearSelected,
      socket: socketRef.current,
      merchant,
    }),
    [
      latestNotifications,
      unreadCount,
      toastQueue,
      loading,
      addToast,
      dismissToast,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAll,
      clearAllRead,
      clearSelected,
      merchant,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
