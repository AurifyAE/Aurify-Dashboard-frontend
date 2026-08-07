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
import { SocketRegistry } from '@/lib/SocketRegistry';
import { LogoutManager } from '@/services/auth/logoutManager';

// ─── Toast Types ─────────────────────────────────────────────────────────────
export type ToastVariant = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'LOADING';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  iconKey?: string;
  actions?: { label: string; url?: string; onClick?: () => void }[];
  duration?: number;
  silent?: boolean;
}

// ─── Context Shapes ───────────────────────────────────────────────────────────

/** Frequently-changing data: notifications list, unread count, loading flag.
 *  Subscribers re-render when these values change (e.g. on socket events). */
interface NotificationDataContextValue {
  latestNotifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

/** Stable actions + socket + merchant.
 *  All action functions are useCallback-stabilised and do NOT change after login.
 *  Subscribers only re-render when merchant changes (once) or actions are recreated (never). */
interface NotificationActionsContextValue {
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  clearAllRead: () => Promise<void>;
  clearSelected: (ids: string[]) => Promise<void>;
  socket: Socket | null;
  merchant: any;
}

/** Toast-only context — completely isolated so toast changes never
 *  re-render notification pages or the header notification panel. */
interface ToastContextValue {
  toastQueue: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
}

// ─── Internal Contexts ────────────────────────────────────────────────────────
const NotificationDataContext = createContext<NotificationDataContextValue | null>(null);
const NotificationActionsContext = createContext<NotificationActionsContextValue | null>(null);
const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [merchant, setMerchant] = useState<any>(null);
  const [latestNotifications, setLatestNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);
  const [loading, setLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const isInitialConnectRef = useRef(true);
  const pathRef = useRef<string>('');

  // Register reset hook with LogoutManager
  useEffect(() => {
    const unregister = LogoutManager.onReset(() => {
      setMerchant(null);
      setLatestNotifications([]);
      setUnreadCount(0);
      setToastQueue([]);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketInstance(null);
      }
    });
    return unregister;
  }, []);

  // Keep track of current location path to suppress toast popups on Notifications page
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

  // Fetch active merchant profile for logged-in user or admin
  useEffect(() => {
    if (user) {
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

  // ── Toast queue management (isolated — does NOT affect notification contexts) ──
  const addToast = useCallback((toast: Omit<ToastItem, 'id'>): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...toast, id };
    setToastQueue((prev) => {
      if (prev.length >= 5) return [...prev.slice(1), newToast];
      return [...prev, newToast];
    });
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToastQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const lastCursorRef = useRef<string | undefined>(undefined);

  // Establish single WebSocket connection safely
  useEffect(() => {
    if (!merchant && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketInstance(null);
      }
      return;
    }

    const token = getToken();
    if (!token) return;

    if (socketRef.current) return;

    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    socketRef.current = socket;
    setSocketInstance(socket);

    const unregisterSocket = SocketRegistry.registerSocket('notification', socket);

    socket.on('connect', () => {
      console.log('[NotificationContext] Socket connected successfully:', socket.id);
      socket.emit('join-user-notifications');
      if (merchant?.merchantId) {
        socket.emit('join-merchant-notifications', { merchantId: merchant.merchantId });
      }

      // On reconnect, execute cursor-based sync to recover missed notifications and state changes
      if (isInitialConnectRef.current) {
        isInitialConnectRef.current = false;
      } else {
        notificationsApi
          .sync(lastCursorRef.current)
          .then((res) => {
            if (res.deltaNotifications && res.deltaNotifications.length > 0) {
              setLatestNotifications((prev) => {
                const map = new Map<string, Notification>();
                res.deltaNotifications.forEach((n) => map.set(n._id, n));
                prev.forEach((n) => {
                  if (!map.has(n._id)) map.set(n._id, n);
                });
                const merged = Array.from(map.values()).sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                return merged.slice(0, 20);
              });
            }
            if (res.unread !== undefined) setUnreadCount(res.unread);
          })
          .catch((err) => {
            console.error('[NotificationContext] Reconnect sync error:', err);
            loadInitialData();
          });
      }
    });

    socket.on('notification:new', (data: { notification: Notification; unreadCount: number }) => {
      console.log('[NotificationContext] Incoming WebSocket notification:', data.notification);
      setLatestNotifications((prev) => {
        const filtered = prev.filter((n) => n._id !== data.notification._id);
        const updated = [data.notification, ...filtered].slice(0, 20);
        if (updated.length > 0) {
          lastCursorRef.current = `${updated[0].createdAt}_${updated[0]._id}`;
        }
        return updated;
      });
      setUnreadCount(data.unreadCount);
    });

    socket.on('notification:count', (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
    });

    // Multi-tab state synchronization
    socket.on(
      'notification:state-change',
      (data: {
        type: 'read' | 'all-read' | 'cleared' | 'cleared-read' | 'all-cleared' | 'cleared-selected' | 'deleted';
        notificationId?: string;
        notificationIds?: string[];
        unreadCount?: number;
      }) => {
        console.log('[NotificationContext] Multi-tab state-change event received:', data.type);
        if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);

        if (data.type === 'read' && data.notificationId) {
          setLatestNotifications((prev) =>
            prev.map((n) => (n._id === data.notificationId ? { ...n, readAt: new Date().toISOString() } : n))
          );
        } else if (data.type === 'all-read') {
          setLatestNotifications((prev) =>
            prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
          );
        } else if (data.type === 'cleared' && data.notificationId) {
          setLatestNotifications((prev) => prev.filter((n) => n._id !== data.notificationId));
        } else if (data.type === 'deleted' && data.notificationId) {
          setLatestNotifications((prev) => prev.filter((n) => n._id !== data.notificationId));
        } else if (data.type === 'cleared-read') {
          setLatestNotifications((prev) => prev.filter((n) => !n.readAt));
        } else if (data.type === 'all-cleared') {
          setLatestNotifications([]);
        } else if (data.type === 'cleared-selected' && data.notificationIds) {
          setLatestNotifications((prev) => prev.filter((n) => !data.notificationIds?.includes(n._id)));
        }
      }
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketInstance(null);
      }
    };
  }, [merchant, user, loadInitialData]);

  // ── API Actions (all stable useCallback — never recreated after mount) ────

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
    setLatestNotifications((prev) => {
      prevNotifs = prev;
      return prev.filter((n) => n._id !== id);
    });
    try {
      await notificationsApi.clear(id);
    } catch (err) {
      console.error('[NotificationContext] Failed to clear, rolling back...', err);
      setLatestNotifications(prevNotifs);
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
      console.error('[NotificationContext] Failed to clear all, rolling back...', err);
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
    setLatestNotifications((prev) => {
      prevNotifs = prev;
      return prev.filter((n) => !ids.includes(n._id));
    });
    try {
      await notificationsApi.clearSelected(ids);
    } catch (err) {
      console.error('[NotificationContext] Failed to clear selected, rolling back...', err);
      setLatestNotifications(prevNotifs);
    }
  }, []);

  // ── Split memoized context values ─────────────────────────────────────────

  // Re-renders all data subscribers only when notification data changes
  const dataValue = useMemo<NotificationDataContextValue>(
    () => ({ latestNotifications, unreadCount, loading }),
    [latestNotifications, unreadCount, loading]
  );

  // All action fns are stable useCallbacks. Only re-evaluates when merchant or socketInstance changes.
  const actionsValue = useMemo<NotificationActionsContextValue>(
    () => ({
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAll,
      clearAllRead,
      clearSelected,
      socket: socketInstance,
      merchant,
    }),
    [
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAll,
      clearAllRead,
      clearSelected,
      socketInstance,
      merchant,
    ]
  );

  // Toast value re-renders only toast consumers (e.g. overlay component)
  const toastValue = useMemo<ToastContextValue>(
    () => ({ toastQueue, addToast, dismissToast }),
    [toastQueue, addToast, dismissToast]
  );

  return (
    <NotificationDataContext.Provider value={dataValue}>
      <NotificationActionsContext.Provider value={actionsValue}>
        <ToastContext.Provider value={toastValue}>{children}</ToastContext.Provider>
      </NotificationActionsContext.Provider>
    </NotificationDataContext.Provider>
  );
}

// ─── Granular Hooks ───────────────────────────────────────────────────────────

/**
 * Subscribe only to frequently-changing notification data.
 * Re-renders when notifications list / unread count / loading changes.
 */
export function useNotificationData(): NotificationDataContextValue {
  const context = useContext(NotificationDataContext);
  if (!context) throw new Error('useNotificationData must be used within a NotificationProvider');
  return context;
}

/**
 * Subscribe only to stable notification actions + socket.
 * After initial merchant load, this context NEVER changes — zero re-renders from it.
 */
export function useNotificationActions(): NotificationActionsContextValue {
  const context = useContext(NotificationActionsContext);
  if (!context)
    throw new Error('useNotificationActions must be used within a NotificationProvider');
  return context;
}

/**
 * Subscribe only to toast queue.
 * Toast changes do NOT re-render notification pages or the header notification panel.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a NotificationProvider');
  return context;
}

/**
 * Backwards-compatible merged hook.
 * Prefer useNotificationData / useNotificationActions / useToast for optimal performance.
 */
export function useNotifications() {
  const data = useNotificationData();
  const actions = useNotificationActions();
  const toast = useToast();
  return useMemo(() => ({ ...data, ...actions, ...toast }), [data, actions, toast]);
}
