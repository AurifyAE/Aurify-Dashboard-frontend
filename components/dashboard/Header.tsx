"use client";

import React from "react";
import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const Header = () => {
  const { user } = useAuth();

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 w-full py-1.5 bg-[#F1F1F1] border-b border-slate-200">
      <div className="flex h-14 items-center justify-between px-6 gap-3">
        {/* Left — Welcome text */}
        {user && (
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-medium text-[#374151]">
              Welcome,{" "}
              <span className="text-[#4067B1] font-semibold">
                {user.companyName}
              </span>
            </p>
            <span
              className={cn(
                "text-[11px] font-medium px-2 py-0.5 rounded-full hidden sm:inline-block",
                user.role === "super_admin" && "bg-purple-100 text-purple-700",
                user.role === "admin" && "bg-blue-100 text-blue-700",
                user.role === "user" && "bg-slate-100 text-slate-600",
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

        {/* Right — Actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Notification */}
          <Button
            size="icon"
            className="bg-slate-300 cursor-pointer hover:bg-slate-200 rounded-xl"
          >
            <Bell className="h-5 w-5 text-slate-600" />
          </Button>

          <div className="flex items-center justify-end p-1 rounded-3xl gap-1 bg-white">
            {/* Avatar with initials */}
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarFallback className="bg-[#4067B1] text-white text-[13px] font-semibold">
                {user ? getInitials(user.companyName) : "U"}
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
