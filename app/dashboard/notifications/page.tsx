'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Bell,
  Trash2,
  Check,
  CheckCheck,
  Sliders,
  Tv,
  EyeOff,
  TrendingUp,
  Key,
  UserCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Clock,
  Filter,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ShieldCheck,
  Receipt,
  Settings,
  Calendar,
  ListFilter,
} from 'lucide-react';
import { notificationsApi, type Notification } from '@/lib/api/notifications';
import { marketplaceApi } from '@/lib/api/marketplace';
import { useAuth } from '@/context/AuthContext';
import { useNotificationActions } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import DashboardShell from '@/components/dashboard/DashboardShell';

// --- STATIC CONSTANTS ---
const CATEGORIES = [
  { label: 'All Activities', value: 'ALL', icon: LayoutGrid, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Approvals', value: 'APPROVAL', icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Admin Changes', value: 'ADMIN', icon: Sliders, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'System', value: 'SYSTEM', icon: Settings, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Billing', value: 'BILLING', icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Security', value: 'SECURITY', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]['value'];
type StatusFilter = 'all' | 'unread' | 'read';

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  APPROVAL: 'text-purple-600 bg-purple-50 border border-purple-100',
  ADMIN: 'text-orange-600 bg-orange-50 border border-orange-100',
  SYSTEM: 'text-blue-600 bg-blue-50 border border-blue-100',
  BILLING: 'text-amber-600 bg-amber-50 border border-amber-100',
  SECURITY: 'text-green-600 bg-green-50 border border-green-100',
  FEATURE: 'text-indigo-600 bg-indigo-50 border border-indigo-100',
  WARNING: 'text-red-600 bg-red-50 border border-red-100',
  ALL: 'text-blue-600 bg-blue-50 border border-blue-100',
};

const CATEGORY_ICON_STYLES: Record<string, { bg: string; text: string }> = {
  APPROVAL: { bg: 'bg-purple-100', text: 'text-purple-600' },
  ADMIN: { bg: 'bg-orange-100', text: 'text-orange-600' },
  SYSTEM: { bg: 'bg-blue-100', text: 'text-blue-600' },
  BILLING: { bg: 'bg-amber-100', text: 'text-amber-600' },
  SECURITY: { bg: 'bg-green-100', text: 'text-green-600' },
  FEATURE: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  WARNING: { bg: 'bg-red-100', text: 'text-red-600' },
};

const getCategoryLabel = (value: string) => {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
};

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
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

// --- MEMOIZED CATEGORY ICON ---
const CategoryIcon = React.memo(({ category }: { category: string }) => {
  const styles = CATEGORY_ICON_STYLES[category] ?? { bg: 'bg-slate-100', text: 'text-slate-500' };
  const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    APPROVAL: CheckCircle2,
    ADMIN: Sliders,
    SYSTEM: Settings,
    BILLING: Receipt,
    SECURITY: ShieldCheck,
    FEATURE: TrendingUp,
    WARNING: AlertCircle,
  };
  const Icon = IconMap[category] ?? Bell;
  return (
    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', styles.bg)}>
      <Icon className={cn('w-5 h-5', styles.text)} />
    </div>
  );
});
CategoryIcon.displayName = 'CategoryIcon';

// --- MEMOIZED NOTIFICATION ROW ---
interface NotificationRowProps {
  notif: Notification;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onClear: (id: string) => void;
  openMenuId: string | null;
  onToggleMenu: (id: string) => void;
}

const NotificationRow = React.memo(
  ({ notif, isSelected, onToggleSelect, onMarkAsRead, onClear, openMenuId, onToggleMenu }: NotificationRowProps) => {
    const isUnread = !notif.readAt;

    return (
      <div
        className={cn(
          'flex items-start gap-3 px-5 py-4 border-b border-slate-100 last:border-b-0 transition-colors group relative',
          isUnread ? 'bg-blue-50/20 hover:bg-blue-50/30' : 'bg-white hover:bg-slate-50/60'
        )}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(notif._id)}
          className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer shrink-0"
        />

        {/* Category Icon */}
        <CategoryIcon category={notif.category} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category Badge */}
          <span
            className={cn(
              'inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1',
              CATEGORY_BADGE_STYLES[notif.category] ?? CATEGORY_BADGE_STYLES.ALL
            )}
          >
            {getCategoryLabel(notif.category)}
          </span>

          {/* Title */}
          <p className={cn('text-sm font-bold text-slate-800', isUnread && 'text-slate-900')}>
            {notif.title}
          </p>

          {/* Message */}
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>

          {/* Action Buttons */}
          {notif.actions && notif.actions.length > 0 && (
            <div className="flex gap-2 mt-2">
              {notif.actions.map((act, i) => (
                <Link
                  key={i}
                  href={act.url}
                  className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-lg px-3 py-1 transition-colors"
                >
                  {act.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[11px] text-slate-400 font-medium">{formatTimeAgo(notif.createdAt)}</p>
              {notif.actor && (
                <p className="text-[10px] text-slate-400 mt-0.5">by {notif.actor.name}</p>
              )}
            </div>

            {/* Read indicator */}
            <div className="flex items-center">
              {isUnread ? (
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              ) : (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              )}
            </div>

            {/* 3-dot menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => onToggleMenu(notif._id)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {openMenuId === notif._id && (
                <div className="absolute right-0 top-7 z-20 bg-white rounded-xl shadow-xl border border-slate-200/60 py-1 w-40 text-sm">
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => onMarkAsRead(notif._id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Mark as read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onClear(notif._id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
NotificationRow.displayName = 'NotificationRow';

// Pagination component
const Pagination = React.memo(({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  totalItems: number;
  pageSize: number;
}) => {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/40">
      <p className="text-xs text-slate-500 font-medium">
        Showing {start} to {end} of {totalItems} notifications
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer',
                page === p
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
              )}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});
Pagination.displayName = 'Pagination';

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  
  // Use actions-only hook — this page manages its own local notification state.
  const {
    socket,
    merchant,
    markAsRead,
    clearNotification,
    markAllAsRead,
    clearAllRead,
    clearSelected,
  } = useNotificationActions();

  // Close menu when clicking outside
  useEffect(() => {
    if (!openMenuId) return;
    const handle = () => setOpenMenuId(null);
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [openMenuId]);

  const loadNotifications = useCallback(
    async (targetPage: number) => {
      if (!merchant) return;
      setLoading(true);
      try {
        const catParam = selectedCategory === 'ALL' ? undefined : selectedCategory;
        const unreadParam = statusFilter === 'unread' ? true : undefined;

        const res = await notificationsApi.list({
          page: targetPage,
          pageSize: PAGE_SIZE,
          category: catParam,
          unread: unreadParam,
        });

        let items = res.notifications || [];

        // Apply read/unread filter client-side if "read" selected (API only has unread filter)
        if (statusFilter === 'read') {
          items = items.filter((n) => !!n.readAt);
        }

        setNotifications(items);
        setTotal(res.total || 0);
        setUnreadCount(res.unread || 0);
        setPage(targetPage);

        // Calculate today/month counts
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const allItems = res.notifications || [];
        setTodayCount(allItems.filter((n) => new Date(n.createdAt).getTime() >= todayStart).length);
        setMonthCount(allItems.filter((n) => new Date(n.createdAt).getTime() >= monthStart).length);

        // Compute per-category counts from current data
        const counts: Record<string, number> = {};
        (res.notifications || []).forEach((n) => {
          counts[n.category] = (counts[n.category] ?? 0) + 1;
        });
        setCategoryCounts(counts);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    },
    [merchant, selectedCategory, statusFilter]
  );

  useEffect(() => {
    if (merchant) {
      loadNotifications(1);
    }
  }, [merchant, selectedCategory, statusFilter, loadNotifications]);

  // Socket filter ref
  const filterRef = useRef({ selectedCategory, statusFilter });
  useEffect(() => {
    filterRef.current = { selectedCategory, statusFilter };
  }, [selectedCategory, statusFilter]);

  useEffect(() => {
    if (!socket) return;
    const handleNew = (data: { notification: Notification; unreadCount: number }) => {
      const { selectedCategory: cat } = filterRef.current;
      if (cat === 'ALL' || data.notification.category === cat) {
        setNotifications((prev) => {
          if (prev.some((n) => n._id === data.notification._id)) return prev;
          return [data.notification, ...prev].slice(0, PAGE_SIZE);
        });
        setTotal((t) => t + 1);
      }
      setUnreadCount(data.unreadCount);
    };
    socket.on('notification:new', handleNew);
    return () => { socket.off('notification:new', handleNew); };
  }, [socket]);

  // Handlers
  const handleMarkAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    setOpenMenuId(null);
    await markAsRead(id);
  }, [markAsRead]);

  const handleClear = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const notif = prev.find((n) => n._id === id);
      if (notif && !notif.readAt) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.filter((n) => n._id !== id);
    });
    setSelectedIds((prev) => prev.filter((v) => v !== id));
    setTotal((t) => Math.max(0, t - 1));
    setOpenMenuId(null);
    await clearNotification(id);
  }, [clearNotification]);

  const handleMarkAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setUnreadCount(0);
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleClearAllRead = useCallback(async () => {
    setNotifications((prev) => prev.filter((n) => !n.readAt));
    await clearAllRead();
  }, [clearAllRead]);

  const handleClearSelected = useCallback(async () => {
    if (!selectedIds.length) return;
    setNotifications((prev) => {
      let count = 0;
      prev.forEach((n) => { if (selectedIds.includes(n._id) && !n.readAt) count++; });
      if (count > 0) setUnreadCount((c) => Math.max(0, c - count));
      setTotal((t) => Math.max(0, t - selectedIds.length));
      return prev.filter((n) => !selectedIds.includes(n._id));
    });
    const ids = [...selectedIds];
    setSelectedIds([]);
    await clearSelected(ids);
  }, [selectedIds, clearSelected]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.length === notifications.length ? [] : notifications.map((n) => n._id)
    );
  }, [notifications]);

  const handleToggleMenu = useCallback((id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }, []);

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
    loadNotifications(p);
  }, [loadNotifications]);

  // Search filter (client-side)
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    const q = searchQuery.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q)
    );
  }, [notifications, searchQuery]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const categoryWithCounts = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      ...cat,
      count: cat.value === 'ALL' ? total : (categoryCounts[cat.value] ?? 0),
    }));
  }, [categoryCounts, total]);

  const statCards = useMemo(() => [
    {
      label: 'All Notifications',
      sub: 'Total notifications',
      value: total,
      icon: ListFilter,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Unread',
      sub: 'Pending to read',
      value: unreadCount,
      icon: CheckCircle2,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Today',
      sub: "Today's activity",
      value: todayCount,
      icon: Clock,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      label: 'This Month',
      sub: 'Total this month',
      value: monthCount,
      icon: Calendar,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ], [total, unreadCount, todayCount, monthCount]);

  return (
    <DashboardShell>
      <div className="p-6 max-w-[4200px] mx-auto space-y-5">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-slate-900">Notifications</h1>
              <p className="text-slate-400 text-xs">Stay updated with all important activities and system alerts.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            )}
            <button
              onClick={handleClearAllRead}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all read
            </button>
          </div>
        </div>

        {/* Auto-delete notice */}
        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100/80 border border-slate-200/70 px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>Read notifications are automatically deleted 90 days after being read.</span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-2xl border border-slate-200/70 p-4 flex items-center gap-3.5 shadow-xs">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', stat.iconBg)}>
                  <Icon className={cn('w-5 h-5', stat.iconColor)} />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-xs font-bold text-slate-700 leading-tight">{stat.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Body: Sidebar + Content */}
        <div className="flex gap-5 items-start">
          {/* Left Sidebar */}
          <div className="w-52 shrink-0 space-y-5">
            {/* Filter by Category */}
            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-xs">
              <p className="text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-3">Filter by Category</p>
              <div className="space-y-0.5">
                {categoryWithCounts.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setSelectedCategory(cat.value)}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-white' : cat.color)} />
                        <span>{cat.label}</span>
                      </div>
                      <span className={cn(
                        'text-[10px] font-black px-1.5 py-0.5 rounded-full',
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      )}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter by Status */}
            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-xs">
              <p className="text-xs font-extrabold text-slate-700 tracking-wider uppercase mb-3">Filter by Status</p>
              <div className="space-y-2">
                {(['all', 'unread', 'read'] as StatusFilter[]).map((s) => (
                  <label key={s} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={statusFilter === s}
                      onChange={() => setStatusFilter(s)}
                      className="text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700 capitalize">{s === 'all' ? 'All' : s === 'unread' ? 'Unread' : 'Read'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Apply Filters */}
            <button
              type="button"
              onClick={() => loadNotifications(1)}
              className="w-full py-2 text-sm font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer bg-white"
            >
              Apply Filters
            </button>
          </div>

          {/* Right Content */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
            {/* Content Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-sm font-bold text-slate-800">
                  {CATEGORIES.find((c) => c.value === selectedCategory)?.label ?? 'All Activities'}
                </span>
              </div>

              {/* Search */}
              <div className="relative w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/60"
                />
              </div>

              {/* Unread only toggle */}
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <span className="text-xs font-semibold text-slate-500">Unread only</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'unread' ? 'all' : 'unread')}
                  className={cn(
                    'relative inline-flex w-9 h-5 items-center rounded-full transition-all',
                    statusFilter === 'unread' ? 'bg-blue-600' : 'bg-slate-200'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform',
                      statusFilter === 'unread' ? 'translate-x-4' : 'translate-x-1'
                    )}
                  />
                </button>
              </label>
            </div>

            {/* Combined Selection & Bulk Action Row */}
            {!loading && filtered.length > 0 && (
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/40">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === notifications.length && notifications.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600">Select all visible</span>
                  {selectedIds.length > 0 && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
                      {selectedIds.length} selected
                    </span>
                  )}
                </div>

                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearSelected}
                      className="text-xs font-bold text-red-600 bg-white hover:bg-red-50 border border-red-200/60 rounded-lg px-3 py-1 transition-colors cursor-pointer shadow-xs"
                    >
                      Delete Selected
                    </button>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="text-xs font-semibold text-slate-500 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 transition-colors cursor-pointer shadow-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <p className="text-xs text-slate-400">Loading notifications...</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-600">All caught up!</p>
                <p className="text-xs text-slate-400">No notifications match your current filters.</p>
              </div>
            )}

            {/* Notification list */}
            {!loading && filtered.length > 0 && (
              <div>
                {filtered.map((notif) => (
                  <NotificationRow
                    key={notif._id}
                    notif={notif}
                    isSelected={selectedSet.has(notif._id)}
                    onToggleSelect={handleToggleSelect}
                    onMarkAsRead={handleMarkAsRead}
                    onClear={handleClear}
                    openMenuId={openMenuId}
                    onToggleMenu={handleToggleMenu}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && total > PAGE_SIZE && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={total}
                pageSize={PAGE_SIZE}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
