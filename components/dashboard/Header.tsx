'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Settings, CheckCircle2, Clock, AlertCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import axiosInstance from '@/app/axios/axiosInstance';

const Header = () => {
  const { user, hasHydrated } = useAuth();
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      const fetchPending = async () => {
        try {
          const res = await axiosInstance.get('/api/admin/users');
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

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
                    {(user.role === 'admin' || user.role === 'super_admin') &&
                      pendingUsersCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                      )}
                    {!(user.role === 'admin' || user.role === 'super_admin') &&
                      user.status?.toLowerCase() === 'pending' && (
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      )}
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 p-0 rounded-2xl shadow-xl border-slate-100 overflow-hidden"
            >
              <div className="bg-slate-50/50 p-3.5 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">Notifications</p>
                {hasHydrated &&
                  user &&
                  (user.role === 'admin' || user.role === 'super_admin') &&
                  pendingUsersCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {pendingUsersCount} New
                    </span>
                  )}
                {hasHydrated &&
                  user &&
                  !(user.role === 'admin' || user.role === 'super_admin') &&
                  user.status?.toLowerCase() === 'pending' && (
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      1 New
                    </span>
                  )}
              </div>
              <div className="p-2">
                {hasHydrated && user && (user.role === 'admin' || user.role === 'super_admin') ? (
                  pendingUsersCount > 0 ? (
                    <div className="p-3 rounded-xl border flex gap-3 transition-colors bg-blue-50/50 border-blue-100/50 hover:bg-blue-50">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-100 text-blue-600">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">New Users Pending</p>
                        <p className="text-[12px] mt-0.5 leading-snug text-blue-700/80">
                          {pendingUsersCount} {pendingUsersCount === 1 ? 'user is' : 'users are'}{' '}
                          currently pending approval to access the dashboard.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No new notifications</p>
                    </div>
                  )
                ) : hasHydrated && user && user.status?.toLowerCase() !== 'active' ? (
                  <div
                    className={cn(
                      'p-3 rounded-xl border flex gap-3 transition-colors',
                      user.status?.toLowerCase() === 'active'
                        ? 'bg-emerald-50/50 border-emerald-100/50 hover:bg-emerald-50'
                        : user.status?.toLowerCase() === 'pending'
                          ? 'bg-amber-50/50 border-amber-100/50 hover:bg-amber-50'
                          : 'bg-rose-50/50 border-rose-100/50 hover:bg-rose-50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                        user.status?.toLowerCase() === 'active'
                          ? 'bg-emerald-100 text-emerald-600'
                          : user.status?.toLowerCase() === 'pending'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-rose-100 text-rose-600'
                      )}
                    >
                      {user.status?.toLowerCase() === 'active' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : user.status?.toLowerCase() === 'pending' ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p
                        className={cn(
                          'text-sm font-bold capitalize',
                          user.status?.toLowerCase() === 'active'
                            ? 'text-emerald-900'
                            : user.status?.toLowerCase() === 'pending'
                              ? 'text-amber-900'
                              : 'text-rose-900'
                        )}
                      >
                        Account {user.status?.toLowerCase()}
                      </p>
                      <p
                        className={cn(
                          'text-[12px] mt-0.5 leading-snug',
                          user.status?.toLowerCase() === 'active'
                            ? 'text-emerald-700/80'
                            : user.status?.toLowerCase() === 'pending'
                              ? 'text-amber-700/80'
                              : 'text-rose-700/80'
                        )}
                      >
                        {user.status?.toLowerCase() === 'pending'
                          ? user.role === 'admin'
                            ? 'Your account is pending approval from the superadmin.'
                            : 'Your account is pending approval from the admin.'
                          : 'Your account is currently suspended or inactive.'}
                      </p>
                      <span
                        className={cn(
                          'text-[10px] mt-2 block font-semibold',
                          user.status?.toLowerCase() === 'active'
                            ? 'text-emerald-600/60'
                            : user.status?.toLowerCase() === 'pending'
                              ? 'text-amber-600/60'
                              : 'text-rose-600/60'
                        )}
                      >
                        Just now
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No new notifications</p>
                  </div>
                )}
              </div>
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
};

export default Header;
