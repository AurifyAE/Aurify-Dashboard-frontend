'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { HugeiconsIcon } from '@hugeicons/react';
import { Logout01Icon } from '@hugeicons/core-free-icons';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/lib/auth';
import {
  ArrowRight,
  BarChart2,
  Bell,
  Building2,
  Crown,
  GemIcon,
  LayoutDashboard,
  Megaphone,
  Monitor,
  MonitorPlay,
  Newspaper,
  Palette,
  Rocket,
  Settings2,
  ShoppingBag,
  Store,
  Tv,
  Users,
} from 'lucide-react';

type LucideIcon = React.ComponentType<{ className?: string; size?: number }>;

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['user'],
  },

  {
    title: 'Spot Rate',
    href: '/dashboard/spotrate',
    icon: BarChart2,
    roles: ['user'],
  },
  {
    title: 'Screens & Marketplace',
    href: '/dashboard/screen-builder',
    icon: Tv,
    roles: ['user'],
  },
  {
    title: 'Profile',
    href: '/dashboard/merchant-profile',
    icon: Building2,
    roles: ['user'],
  },
  {
    title: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    roles: ['user'],
  },
  {
    title: 'Account Settings',
    href: '/dashboard/settings',
    icon: Settings2,
    roles: ['user', 'admin', 'super_admin'],
  },
  {
    title: 'Client Management',
    href: '/dashboard/admin/clients',
    icon: Users,
    roles: ['admin', 'super_admin'],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col z-40 text-white transition-all duration-300 ease-in-out overflow-hidden lg:translate-x-0 lg:w-60 w-64 translate-x-0'
        )}
        style={{ pointerEvents: 'auto', minWidth: '270px' }}
      >
        {/* Logo section */}
        <div className="p-6 min-h-10 border-b border-slate-700/60 flex justify-start items-center relative flex-shrink-0 overflow-hidden">
          <div className="flex items-center gap-2 transition-all duration-300 relative">
            <Image
              src="/images/aurify-logo1.svg"
              alt="Aurify"
              width={36}
              height={36}
              priority
              className="flex-shrink-0 relative z-10"
            />
            <div className={cn('transition-all duration-300 relative z-0 opacity-100 visible')}>
              <Image src="/images/aurify-logo2.svg" alt="Aurify" width={120} height={30} priority />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-1">
          {visibleNavItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            const IconComp = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`${'sidebarLink '} ${isActive ? 'active custom_b_border' : ''}`}
              >
                <IconComp className={'icon'} size={20} />
                <span className={'title'}>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom — User info + Logout */}
        <div className="flex-shrink-0">
          {/* Hairline separator */}
          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="p-4 space-y-2">
            {user && (
              <>
                {/* User card */}
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 backdrop-blur-md">
                  {/* Very subtle gold gradient top highlight line */}
                  <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[#E5C37A]/30 to-transparent" />

                  <div className="flex items-center gap-3">
                    {/* Initials Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5C37A]/25 bg-gradient-to-br from-[#1C1C1E] to-[#0E0E10] shadow-sm">
                        <span className="text-[12px] font-semibold tracking-wider text-[#E5C37A]">
                          {getInitials(user.companyName)}
                        </span>
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#0B0B0D]" />
                    </div>

                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-xs font-semibold tracking-wide text-white/95">
                        {user.companyName}
                      </h3>
                      <p className="truncate text-[10px] text-white/40 mt-0.5 leading-none">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Thin Divider */}
                  <div className="my-2.5 h-px bg-white/[0.05]" />

                  {/* Compact Meta Info */}
                  <div className="flex items-center justify-between text-[10px] text-white/40">
                    <div className="flex items-center gap-1">
                      <span>Role:</span>
                      <span className="font-medium text-white/70">
                        {user.role === 'super_admin'
                          ? 'Super Admin'
                          : user.role === 'admin'
                            ? 'Admin'
                            : 'User'}
                      </span>
                    </div>

                    {user.role === 'super_admin' && (
                      <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-[#E5C37A] bg-[#C9A14A]/10 px-1.5 py-0.5 rounded-md border border-[#C9A14A]/15">
                        <Crown className="h-2.5 w-2.5 text-[#E5C37A]" />
                        ADMIN
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Logout */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 bg-white/[0.02] hover:bg-red-500/[0.08] border border-white/[0.06] hover:border-red-500/20 rounded-xl px-3 py-2.5 transition-all duration-200 group/logout"
            >
              <div className="w-7 h-7 flex-shrink-0 rounded-[7px] bg-red-500/[0.08] border border-red-500/15 flex items-center justify-center">
                <HugeiconsIcon icon={Logout01Icon} size={14} color="#f87171" strokeWidth={1.5} />
              </div>
              <span className="text-[13px] font-medium text-white/50 flex-1 text-left">
                Sign out
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-red-400 opacity-0 -translate-x-1 group-hover/logout:opacity-100 group-hover/logout:translate-x-0 transition-all duration-200" />
            </button>
          </div>
          <span className="text-[12px] mb-2 font-medium text-white/50   flex justify-center">
            Version 1.0.0
          </span>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
