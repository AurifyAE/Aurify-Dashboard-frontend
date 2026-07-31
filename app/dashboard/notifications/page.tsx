'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsApi, type Notification } from '@/lib/api/notifications';
import { marketplaceApi } from '@/lib/api/marketplace';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import DashboardShell from '@/components/dashboard/DashboardShell';

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

const NotificationIcon = ({ iconKey, type }: { iconKey?: string; type: string }) => {
  const getIconColor = () => {
    switch (type) {
      case 'SUCCESS':
        return 'bg-emerald-100 text-emerald-600';
      case 'WARNING':
        return 'bg-orange-100 text-orange-600';
      case 'ERROR':
        return 'bg-red-100 text-red-600';
      case 'INFO':
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  const className = `w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor()}`;

  switch (iconKey) {
    case 'check-circle':
      return (
        <div className={className}>
          <CheckCircle2 className="w-5 h-5" />
        </div>
      );
    case 'x-circle':
      return (
        <div className={className}>
          <XCircle className="w-5 h-5" />
        </div>
      );
    case 'credit-card':
      return (
        <div className={className}>
          <CreditCard className="w-5 h-5" />
        </div>
      );
    case 'sliders':
      return (
        <div className={className}>
          <Sliders className="w-5 h-5" />
        </div>
      );
    case 'tv':
      return (
        <div className={className}>
          <Tv className="w-5 h-5" />
        </div>
      );
    case 'eye-off':
      return (
        <div className={className}>
          <EyeOff className="w-5 h-5" />
        </div>
      );
    case 'trending-up':
      return (
        <div className={className}>
          <TrendingUp className="w-5 h-5" />
        </div>
      );
    case 'key':
      return (
        <div className={className}>
          <Key className="w-5 h-5" />
        </div>
      );
    case 'user-check':
      return (
        <div className={className}>
          <UserCheck className="w-5 h-5" />
        </div>
      );
    default:
      return (
        <div className={className}>
          <Bell className="w-5 h-5" />
        </div>
      );
  }
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [merchant, setMerchant] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const {
    socket,
    markAsRead,
    clearNotification,
    markAllAsRead,
    clearAllRead,
    clearSelected,
  } = useNotifications();

  // Category Filter Options
  const categories = [
    { label: 'All Activities', value: 'ALL' },
    { label: 'Approvals', value: 'APPROVAL' },
    { label: 'Admin Changes', value: 'ADMIN' },
    { label: 'System', value: 'SYSTEM' },
    { label: 'Billing', value: 'BILLING' },
    { label: 'Security', value: 'SECURITY' },
  ];

  // Load merchant info
  useEffect(() => {
    if (user && user.role === 'user') {
      marketplaceApi
        .myMerchant()
        .then((m) => setMerchant(m))
        .catch((err) => console.error('Failed to load merchant', err));
    }
  }, [user]);

  // Load page content
  const loadNotifications = async (targetPage: number, append = false) => {
    if (!merchant) return;
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const catParam = selectedCategory === 'ALL' ? undefined : selectedCategory;
      const res = await notificationsApi.list({
        page: targetPage,
        pageSize: 15,
        category: catParam,
        unread: unreadOnly,
      });

      if (append) {
        setNotifications((prev) => [...prev, ...(res.notifications || [])]);
      } else {
        setNotifications(res.notifications || []);
      }
      setUnreadCount(res.unread || 0);
      setHasMore(res.hasMore);
      setPage(targetPage);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (merchant) {
      loadNotifications(1, false);
    }
  }, [merchant, selectedCategory, unreadOnly]);

  // Listen for live incoming notifications to append dynamically to local list
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data: { notification: Notification; unreadCount: number }) => {
      const matchCategory =
        selectedCategory === 'ALL' || data.notification.category === selectedCategory;
      const matchUnread = !unreadOnly || !data.notification.readAt;

      if (matchCategory && matchUnread) {
        setNotifications((prev) => {
          const exists = prev.some((n) => n._id === data.notification._id);
          if (exists) return prev;
          return [data.notification, ...prev];
        });
        setUnreadCount(data.unreadCount);
      }
    };

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, selectedCategory, unreadOnly]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await markAsRead(id);
  };

  const handleClear = async (id: string) => {
    const notif = notifications.find((n) => n._id === id);
    const wasUnread = notif && !notif.readAt;

    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (wasUnread) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setSelectedIds((prev) => prev.filter((val) => val !== id));

    await clearNotification(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setUnreadCount(0);

    await markAllAsRead();
  };

  const handleClearAllRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.readAt));
    await clearAllRead();
  };

  const handleClearSelected = async () => {
    if (selectedIds.length === 0) return;

    let unreadClearedCount = 0;
    notifications.forEach((n) => {
      if (selectedIds.includes(n._id) && !n.readAt) {
        unreadClearedCount++;
      }
    });

    setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n._id)));
    setUnreadCount((c) => Math.max(0, c - unreadClearedCount));
    setSelectedIds([]);

    await clearSelected(selectedIds);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((val) => val !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n._id));
    }
  };

  // Group notifications into Today, Yesterday, and Earlier
  const { today, yesterday, earlier } = useMemo(() => {
    const todayGroup: Notification[] = [];
    const yesterdayGroup: Notification[] = [];
    const earlierGroup: Notification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    notifications.forEach((n) => {
      const time = new Date(n.createdAt).getTime();
      if (time >= todayStart) {
        todayGroup.push(n);
      } else if (time >= yesterdayStart) {
        yesterdayGroup.push(n);
      } else {
        earlierGroup.push(n);
      }
    });

    return { today: todayGroup, yesterday: yesterdayGroup, earlier: earlierGroup };
  }, [notifications]);

  const renderGroupList = (groupTitle: string, list: Notification[]) => {
    if (list.length === 0) return null;
    return (
      <div className="p-5 space-y-4">
        <h3 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase pl-1">
          {groupTitle}
        </h3>
        <div className="space-y-0 divide-y divide-slate-100/60">
          {list.map((notif) => (
            <div
              key={notif._id}
              className={cn(
                'py-3 flex items-center justify-between gap-4 relative group transition-colors',
                !notif.readAt && 'bg-blue-50/15 -mx-5 px-5 rounded-lg'
              )}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.includes(notif._id)}
                  onChange={() => handleToggleSelect(notif._id)}
                  className="rounded text-blue-600 border-slate-300 w-3.5 h-3.5 cursor-pointer focus:ring-blue-500 shrink-0"
                />

                {/* Left clean status dot */}
                <span
                  className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    notif.type === 'SUCCESS' && 'bg-emerald-500',
                    notif.type === 'WARNING' && 'bg-amber-500',
                    notif.type === 'ERROR' && 'bg-red-500',
                    notif.type === 'INFO' && 'bg-blue-500'
                  )}
                />

                {/* Text Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={cn(
                        'text-xs text-slate-700 font-semibold truncate max-w-[280px] md:max-w-[400px]',
                        !notif.readAt && 'text-slate-900 font-bold'
                      )}
                    >
                      {notif.title}
                    </p>
                    {notif.isPinned && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 leading-none shrink-0">
                        Pinned
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      • {notif.sourceModule.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Actions buttons */}
                  {notif.actions && notif.actions.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {notif.actions.map((act, i) => (
                        <Link
                          key={i}
                          href={act.url}
                          className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded px-2.5 py-1 transition-colors border border-blue-100/50 shrink-0"
                        >
                          {act.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: metadata and actions */}
              <div className="flex items-center gap-4 shrink-0">
                {/* Time / Actor info */}
                <div className="text-right flex flex-col items-end gap-0.5 hidden sm:flex">
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {formatTimeAgo(notif.createdAt)}
                  </span>
                  {notif.actor && (
                    <span className="text-[9px] text-slate-400 shrink-0 truncate max-w-[100px]">
                      by {notif.actor.name}
                    </span>
                  )}
                </div>

                {/* Actions: Mark read & Dismiss */}
                <div className="flex items-center gap-1.5">
                  {!notif.readAt && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif._id)}
                      className="p-1.5 hover:bg-slate-100 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleClear(notif._id)}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Dismiss"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DashboardShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Manage status alerts, layout changes, limits, and system configurations.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 text-xs font-bold bg-white text-blue-600 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 cursor-pointer shadow-xs transition-all"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            <button
              onClick={handleClearAllRead}
              className="flex items-center gap-1.5 text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 cursor-pointer shadow-xs transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear all read
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-100/50 p-1 rounded-xl border border-slate-200/30">
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  'text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                  selectedCategory === cat.value
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/30'
                    : 'text-slate-500 border border-slate-200/10 hover:text-slate-700 hover:bg-slate-200/30'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 px-2 shrink-0">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              Unread only
            </label>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 p-2.5 rounded-xl">
            <p className="text-xs font-bold text-blue-700">
              Selected {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClearSelected}
                className="text-xs font-bold text-red-600 bg-white hover:bg-red-50 border border-red-200/50 rounded-lg px-2.5 py-1 transition-colors cursor-pointer"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold text-slate-500 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Main Feed Card */}
        <div className="bg-white rounded-[15px] border border-slate-200/60 shadow-xs overflow-hidden">
          {loading && (
            <div className="p-20 text-center flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <p className="text-slate-400 text-xs">Loading activity feed...</p>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="p-20 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-3 border border-slate-100/50">
                <Bell className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-700">All caught up!</h2>
              <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                No notifications matching the selected filters found.
              </p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div>
              {/* Select All Row */}
              <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === notifications.length && notifications.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded text-blue-600 border-slate-300 w-3.5 h-3.5 cursor-pointer focus:ring-blue-500"
                  />
                  Select all visible
                </label>
              </div>

              {/* Group Rendering lists inside the same wrapper */}
              <div className="divide-y divide-slate-100">
                {renderGroupList('Today', today)}
                {renderGroupList('Yesterday', yesterday)}
                {renderGroupList('Earlier', earlier)}
              </div>
            </div>
          )}
        </div>

        {/* Load More */}
        {hasMore && !loading && (
          <div className="text-center pt-2">
            <button
              onClick={() => loadNotifications(page + 1, true)}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 cursor-pointer shadow-xs transition-all disabled:opacity-50"
            >
              {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Load More Activity
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
