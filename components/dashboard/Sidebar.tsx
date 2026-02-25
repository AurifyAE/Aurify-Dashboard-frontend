"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare02Icon,
  Chart01Icon,
  Settings01Icon,
  Logout01Icon,
  GoldIngotsIcon,
  Computer,
  ComputerSettingsIcon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/lib/auth";

interface NavItem {
  title: string;
  href: string;
  icon: typeof DashboardSquare02Icon;
  badge?: string;
  roles?: UserRole[]; // undefined = visible to all
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: DashboardSquare02Icon,
  },
  {
    title: "Spot Rate",
    href: "/dashboard/spotrate",
    icon: Chart01Icon,
  },
  {
    title: "Commodity",
    href: "/dashboard/commodity",
    icon: GoldIngotsIcon,
  },
  {
    title: "Configure Screens",
    href: "/dashboard/configure-screens",
    icon: ComputerSettingsIcon,
    roles: ["super_admin", "admin",'user'], // hidden for plain 'user'
  },
  {
    title: "My Screens",
    href: "/dashboard/my-screens",
    icon: Computer,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) => {
    if (!item.roles) return true; // visible to all
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  // Get initials for avatar fallback
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
          "flex flex-col z-40 text-white transition-all duration-300 ease-in-out overflow-hidden lg:translate-x-0 lg:w-80 w-64 translate-x-0",
        )}
        style={{ pointerEvents: "auto", minWidth: "270px" }}
      >
        {/* Logo section */}
        <div className="p-6 min-h-10 border-b border-slate-700/60 flex justify-center items-center relative flex-shrink-0 overflow-hidden">
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
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`${"sidebarLink "} ${isActive ? "active custom_b_border" : ""}`}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={20}
                  color="currentColor"
                  strokeWidth={1.5}
                  className={"icon"}
                />
                <span className={"title"}>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom — User info + Logout */}
        <div className="p-4 border-t border-slate-700/60 flex-shrink-0">
          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarFallback className="bg-blue-600 text-white text-[13px] font-semibold">
                  {getInitials(user.companyName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-medium truncate">
                  {user.companyName}
                </p>
                <p className="text-slate-400 text-[11px] truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {/* Role badge */}
          {user && (
            <div className="px-2 mb-3">
              <span
                className={cn(
                  "text-[11px] font-medium px-2 py-0.5 rounded-full",
                  user.role === "super_admin" &&
                    "bg-purple-500/20 text-purple-300",
                  user.role === "admin" && "bg-blue-500/20 text-blue-300",
                  user.role === "user" && "bg-slate-500/20 text-slate-300",
                )}
              >
                {user.role === "super_admin"
                  ? "Super Admin"
                  : user.role === "admin"
                    ? "Admin"
                    : "User"}
              </span>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
          >
            <HugeiconsIcon
              icon={Logout01Icon}
              size={20}
              color="currentColor"
              strokeWidth={1.5}
              className="flex-shrink-0"
            />
            <span className="text-[14px] font-medium">Logout</span>
          </button>
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
