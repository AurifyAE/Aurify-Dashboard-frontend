"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/lib/auth";
import {
  ArrowRight,
  BarChart2,
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
} from "lucide-react";

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
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["user"],
  },
  {
    title: "Spot Rate",
    href: "/dashboard/spotrate",
    icon: BarChart2,
    roles: ["user"],
  },
  {
    title: "Screens & Marketplace",
    href: "/dashboard/screen-builder",
    icon: Tv,
    roles: ["user"],
  },
  {
    title: "Profile",
    href: "/dashboard/merchant-profile",
    icon: Building2,
    roles: ["user"],
  },
  {
    title: "Account Settings",
    href: "/dashboard/settings",
    icon: Settings2,
    roles: ["user", "admin", "super_admin"],
  },
  {
    title: "Client Management",
    href: "/dashboard/admin/clients",
    icon: Users,
    roles: ["admin", "super_admin"],
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
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col z-40 text-white transition-all duration-300 ease-in-out overflow-hidden lg:translate-x-0 lg:w-60 w-64 translate-x-0",
        )}
        style={{ pointerEvents: "auto", minWidth: "270px" }}
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
            <div
              className={cn(
                "transition-all duration-300 relative z-0 opacity-100 visible",
              )}
            >
              <Image
                src="/images/aurify-logo2.svg"
                alt="Aurify"
                width={120}
                height={30}
                priority
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-1">
          {visibleNavItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const IconComp = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`${"sidebarLink "} ${isActive ? "active custom_b_border" : ""}`}
              >
                <IconComp className={"icon"} size={20} />
                <span className={"title"}>{item.title}</span>
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
                <div className="relative rounded-xl bg-white/[0.03] border border-white/[0.07] p-3 overflow-hidden">
                  {/* Ambient top-right glow */}
                  <div className="pointer-events-none absolute top-0 right-0 w-20 h-20 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.06),transparent_70%)]" />

                  {/* Avatar row */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 border border-amber-400/35 flex items-center justify-center">
                        <span className="text-[12px] font-semibold text-amber-400 tracking-wide">
                          {getInitials(user.companyName)}
                        </span>
                      </div>
                      <span className="absolute bottom-px right-px w-1.5 h-1.5 rounded-full bg-emerald-400 ring-[1.5px] ring-[#0f1117]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white/90 truncate leading-tight">
                        {user.companyName}
                      </p>
                      <p className="text-[11px] font-mono text-white/35 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/[0.06] mb-3" />

                  {/* Role row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-400" />
                      <span className="text-[11px] text-white/40 tracking-widest uppercase">
                        {user.role === "super_admin"
                          ? "Super Admin"
                          : user.role === "admin"
                            ? "Admin"
                            : "User"}
                      </span>
                    </div>
                    {user.role === "super_admin" && (
                      <div className="flex items-center gap-1 bg-amber-400/[0.08] border border-amber-400/20 rounded-full px-2 py-0.5">
                        <Crown className="w-2.5 h-2.5 text-amber-400" />
                        <span className="text-[10px] font-medium text-amber-400 tracking-wide">
                          Premium
                        </span>
                      </div>
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
                <HugeiconsIcon
                  icon={Logout01Icon}
                  size={14}
                  color="#f87171"
                  strokeWidth={1.5}
                />
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
