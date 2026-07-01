'use client';

import React from 'react';
import { Bell, Settings, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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

const Header = () => {
  const { user, hasHydrated } = useAuth();

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
              <Button size="icon" className="bg-white relative cursor-pointer hover:bg-slate-200 rounded-xl">
                <Bell className="h-5 w-5 text-slate-600" />
                {hasHydrated && user && user.status === 'Pending' && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl shadow-xl border-slate-100 overflow-hidden">
              <div className="bg-slate-50/50 p-3.5 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">Notifications</p>
                {hasHydrated && user && user.status === 'Pending' && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    1 New
                  </span>
                )}
              </div>
              <div className="p-2">
                {hasHydrated && user ? (
                  <div
                    className={cn(
                      'p-3 rounded-xl border flex gap-3 transition-colors',
                      user.status === 'Active'
                        ? 'bg-emerald-50/50 border-emerald-100/50 hover:bg-emerald-50'
                        : user.status === 'Pending'
                          ? 'bg-amber-50/50 border-amber-100/50 hover:bg-amber-50'
                          : 'bg-rose-50/50 border-rose-100/50 hover:bg-rose-50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                        user.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-600'
                          : user.status === 'Pending'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-rose-100 text-rose-600'
                      )}
                    >
                      {user.status === 'Active' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : user.status === 'Pending' ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p
                        className={cn(
                          'text-sm font-bold',
                          user.status === 'Active'
                            ? 'text-emerald-900'
                            : user.status === 'Pending'
                              ? 'text-amber-900'
                              : 'text-rose-900'
                        )}
                      >
                        Account {user.status}
                      </p>
                      <p
                        className={cn(
                          'text-[12px] mt-0.5 leading-snug',
                          user.status === 'Active'
                            ? 'text-emerald-700/80'
                            : user.status === 'Pending'
                              ? 'text-amber-700/80'
                              : 'text-rose-700/80'
                        )}
                      >
                        {user.status === 'Active'
                          ? 'Your account has been approved by the admin. You have full access.'
                          : user.status === 'Pending'
                            ? 'Your account is pending approval from the admin.'
                            : 'Your account is currently suspended or inactive.'}
                      </p>
                      <span
                        className={cn(
                          'text-[10px] mt-2 block font-semibold',
                          user.status === 'Active'
                            ? 'text-emerald-600/60'
                            : user.status === 'Pending'
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
