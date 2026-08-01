import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import {
  Bell,
  Settings,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  XCircle,
  CreditCard,
  Sliders,
  Tv,
  EyeOff,
  TrendingUp,
  Key,
  UserCheck,
  Trash2,
  Check,
  CheckCheck,
  HelpCircle,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { useNotificationData, useNotificationActions } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import axiosInstance from '@/app/axios/axiosInstance';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type Notification } from '@/lib/api/notifications';

// ── Pure helper — lives outside component, never recreated ───────────────────
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── Notification icon component — memoized ───────────────────────────────────
const NotificationIcon = memo(({ iconKey, type }: { iconKey?: string; type: string }) => {
  const colorClass = useMemo(() => {
    switch (type) {
      case 'SUCCESS': return 'bg-emerald-100 text-emerald-600';
      case 'WARNING': return 'bg-orange-100 text-orange-600';
      case 'ERROR':   return 'bg-red-100 text-red-600';
      default:        return 'bg-blue-100 text-blue-600';
    }
  }, [type]);

  const className = `w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`;

  switch (iconKey) {
    case 'check-circle':  return <div className={className}><CheckCircle2 className="w-4 h-4" /></div>;
    case 'x-circle':      return <div className={className}><XCircle className="w-4 h-4" /></div>;
    case 'credit-card':   return <div className={className}><CreditCard className="w-4 h-4" /></div>;
    case 'sliders':       return <div className={className}><Sliders className="w-4 h-4" /></div>;
    case 'tv':            return <div className={className}><Tv className="w-4 h-4" /></div>;
    case 'eye-off':       return <div className={className}><EyeOff className="w-4 h-4" /></div>;
    case 'trending-up':   return <div className={className}><TrendingUp className="w-4 h-4" /></div>;
    case 'key':           return <div className={className}><Key className="w-4 h-4" /></div>;
    case 'user-check':    return <div className={className}><UserCheck className="w-4 h-4" /></div>;
    default:              return <div className={className}><Bell className="w-4 h-4" /></div>;
  }
});
NotificationIcon.displayName = 'NotificationIcon';

// ─── Header — wrapped in React.memo ──────────────────────────────────────────
// It subscribes to:
//   - useAuth (user, hasHydrated) — stable after login
//   - useNotificationData (latestNotifications, unreadCount) — notification-only updates
//   - useNotificationActions (markAsRead, markAllAsRead) — stable actions
// It does NOT subscribe to SpotRateContext, so gold/silver price ticks
// will never cause Header to re-render.
const Header = memo(function Header() {
  const { user, hasHydrated } = useAuth();
  const router = useRouter();
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  // Subscribe to data and actions from the split contexts
  const { latestNotifications: notifications, unreadCount } = useNotificationData();
  const { markAsRead, clearNotification, clearSelected, markAllAsRead } = useNotificationActions();

  // Fetch pending users count for admins
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      const fetchPending = async () => {
        try {
          const res = await axiosInstance.get('/admin/users');
          const merchants = res.data.data || [];
          const pending = merchants.filter((m: any) => m.status?.toLowerCase() === 'pending');
          setPendingUsersCount(pending.length);
        } catch (error) {
          console.error('Failed to fetch pending users', error);
        }
      };
      fetchPending();

      const interval = setInterval(fetchPending, 60000); // refresh every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  // State to track notifications cleared locally from header panel view
  const [headerDismissedIds, setHeaderDismissedIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('aurify_header_dismissed_notifs');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const headerNotifications = useMemo(() => {
    return notifications.filter((n: Notification) => !headerDismissedIds.includes(n._id));
  }, [notifications, headerDismissedIds]);

  // ── Stable event handlers ────────────────────────────────────────────────
  const handleNotificationClick = useCallback(
    async (notif: Notification) => {
      if (!notif.readAt) {
        await markAsRead(notif._id);
      }
      router.push('/dashboard/notifications');
    },
    [markAsRead, router]
  );

  const handleMarkSingleAsRead = useCallback(
    async (e: React.MouseEvent, notif: Notification) => {
      e.stopPropagation();
      e.preventDefault();
      if (!notif.readAt) {
        await markAsRead(notif._id);
      }
    },
    [markAsRead]
  );

  const handleClearNotification = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      const updated = [...headerDismissedIds, id];
      setHeaderDismissedIds(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aurify_header_dismissed_notifs', JSON.stringify(updated));
        } catch (err) {
          console.error(err);
        }
      }
    },
    [headerDismissedIds]
  );

  const handleClearAllHeaderNotifs = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (headerNotifications.length > 0) {
        const allIds = headerNotifications.map((n: Notification) => n._id);
        const updated = Array.from(new Set([...headerDismissedIds, ...allIds]));
        setHeaderDismissedIds(updated);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('aurify_header_dismissed_notifs', JSON.stringify(updated));
          } catch (err) {
            console.error(err);
          }
        }
      }
    },
    [headerNotifications, headerDismissedIds]
  );

  const handleMarkAllRead = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      await markAllAsRead();
    },
    [markAllAsRead]
  );

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <header className="sticky top-0 z-30 w-full py-1.5 bg-[#F1F1F1] border-b border-slate-200">
      <div className="flex h-14 items-center justify-between px-6 gap-3">
        {/* Left — Welcome text */}
        {hasHydrated && user && (
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-medium text-[#374151]">
              Welcome, <span className="text-[#4067B1] font-semibold">{user.companyName}</span>
            </p>
            <span
              className={cn(
                'text-[11px] font-medium px-2 py-0.5 rounded-full hidden sm:inline-block',
                user.role === 'super_admin' && 'bg-purple-100 text-purple-700',
                user.role === 'admin' && 'bg-blue-100 text-blue-700',
                user.role === 'user' && 'bg-slate-100 text-slate-600'
              )}
            >
              {user.role === 'super_admin'
                ? 'Super Admin'
                : user.role === 'admin'
                  ? 'Admin'
                  : 'User'}
            </span>
          </div>
        )}

        {/* Right — Actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Notification */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                className="bg-white relative cursor-pointer hover:bg-slate-200 rounded-xl"
              >
                <Bell className="h-5 w-5 text-slate-600" />
                {hasHydrated && user && (
                  <>
                    {isAdmin && pendingUsersCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    )}
                    {!isAdmin && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-96 p-0 rounded-2xl shadow-xl border border-slate-200/60 bg-white overflow-hidden"
            >
              <div className="bg-slate-50/80 p-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">Notifications</p>
                  {!isAdmin && unreadCount > 0 && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                {isAdmin && pendingUsersCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pendingUsersCount} New
                  </span>
                )}
                {!isAdmin && headerNotifications.length > 0 && (
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleClearAllHeaderNotifs}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Clear all notifications from header panel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear all
                    </button>
                  </div>
                )}
              </div>
              <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
                {hasHydrated && user && isAdmin ? (
                  pendingUsersCount > 0 ? (
                    <div className="p-3 rounded-xl border flex gap-3 transition-colors bg-blue-50/50 border-blue-100/50 hover:bg-blue-50">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-100 text-blue-600">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">New Users Pending</p>
                        <p className="text-[12px] mt-0.5 leading-snug text-blue-700/80">
                          {pendingUsersCount}{' '}
                          {pendingUsersCount === 1 ? 'user is' : 'users are'} currently pending
                          approval to access the dashboard.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 font-medium">No new notifications</p>
                    </div>
                  )
                ) : !isAdmin && headerNotifications.length > 0 ? (
                  headerNotifications.map((notif: Notification) => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        'group p-2.5 rounded-xl border flex gap-3 items-center relative transition-colors cursor-pointer border-slate-100/50',
                        notif.readAt
                          ? 'bg-white hover:bg-slate-50'
                          : 'bg-blue-50/30 hover:bg-blue-50/60 border-blue-50'
                      )}
                    >
                      <NotificationIcon iconKey={notif.iconKey} type={notif.type} />
                      <div className="flex-1 min-w-0 pr-12">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              'text-xs font-semibold truncate text-slate-700',
                              !notif.readAt && 'text-slate-900 font-bold'
                            )}
                          >
                            {notif.title}
                          </p>
                          <span className="text-[10px] font-medium shrink-0 group-hover:opacity-0 transition-opacity text-slate-400">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] truncate mt-0.5 text-slate-500">
                          {notif.message}
                        </p>
                      </div>

                      {/* Inline action buttons */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm pl-1 py-0.5 rounded-lg">
                        {!notif.readAt && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkSingleAsRead(e, notif)}
                            title="Mark as read"
                            className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleClearNotification(e, notif._id)}
                          title="Clear from panel"
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">No new notifications</p>
                  </div>
                )}
              </div>
              {!isAdmin && notifications.length > 0 && (
                <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
                  <Link
                    href="/dashboard/notifications"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-block py-1 cursor-pointer"
                  >
                    View All Activity
                  </Link>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center justify-end p-1 rounded-3xl gap-1 bg-white">
            {/* Avatar with initials */}
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarFallback className="bg-[#4067B1] text-white text-[13px] font-semibold">
                {hasHydrated && user ? getInitials(user.companyName) : 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Settings */}
            <Button
              size="icon"
              className="cursor-pointer rounded-full bg-transparent hover:bg-transparent"
            >
              <Settings className="h-5 w-5 bg-slate-100 text-slate-600" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
});

export default Header;
