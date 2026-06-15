"use client";

import React, { useState, useEffect, Suspense } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import MyScreensTab from "./MyScreensTab";
import ScreenBuilderTab from "./ScreenBuilderTab";
import ThemeMarketplaceTab from "./ThemeMarketplaceTab";
import MerchantProfileTab from "./MerchantProfileTab";
import OthersScreensTab from "./OthersScreensTab";
import {
  Monitor,
  Tv,
  Palette,
  Settings2,
  Tv2,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

type TabId = "my-screens" | "builder" | "themes" | "profile" | "others";

function ScreenConsoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>("my-screens");
  // Loaded layout ID state for ScreenBuilderTab
  const [editingLayoutId, setEditingLayoutId] = useState<string | undefined>(undefined);

  // Sync tab from query parameter if provided (e.g. /dashboard/screen-builder?tab=themes)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["my-screens", "builder", "themes", "profile", "others"].includes(tabParam)) {
      setActiveTab(tabParam as TabId);
    }
  }, [searchParams]);

  const handleEditLayout = (layoutId: string) => {
    setEditingLayoutId(layoutId);
    setActiveTab("builder");
  };

  const handleCreateNew = () => {
    setEditingLayoutId(undefined);
    setActiveTab("builder");
  };

  const tabsConfig = [
    {
      id: "my-screens" as TabId,
      label: "My Screens",
      description: "Manage your active TV displays",
      icon: Monitor,
    },
    {
      id: "builder" as TabId,
      label: "Interactive Builder",
      description: "Customize layouts & widgets",
      icon: Tv,
    },
    {
      id: "themes" as TabId,
      label: "Theme Marketplace",
      description: "Browse premium display themes",
      icon: Palette,
    },
    {
      id: "profile" as TabId,
      label: "Branding Settings",
      description: "Business profile & colors",
      icon: Settings2,
    },
    {
      id: "others" as TabId,
      label: "Showroom Screens",
      description: "Live showroom TV broadcasts",
      icon: Tv2,
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Banner with Gradient & Glassmorphism */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-6 shadow-lg border border-slate-800">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,#d4a017,transparent_45%),radial-gradient(circle_at_70%_50%,#3051bb,transparent_45%)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between z-10">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                  Screens & Themes
                </span>
                <span className="text-slate-400 text-lg font-light">Console</span>
              </h1>
              <p className="mt-1 text-sm text-slate-400 max-w-2xl">
                Unifying template builders, theme installations, live TV previews, and business brandings.
              </p>
            </div>
            {activeTab !== "builder" && (
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <Tv className="h-4 w-4" />
                Launch Builder
              </button>
            )}
          </div>
        </div>

        {/* Premium Tab Bar Menu */}
        <div className="flex border border-slate-200 bg-slate-50/50 rounded-2xl p-1 overflow-x-auto scrollbar-none gap-1">
          {tabsConfig.map((tab) => {
            const IconComp = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "builder") {
                    setEditingLayoutId(undefined); // Clear editing if leaving builder
                  }
                }}
                className={`flex flex-col md:flex-row items-center md:items-start gap-2.5 rounded-xl px-4 py-3 text-left transition-all min-w-[120px] md:min-w-[180px] flex-1 cursor-pointer select-none ${
                  isSelected
                    ? "bg-white text-blue-700 shadow-sm border border-slate-100"
                    : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-800"
                }`}
              >
                <div className={`p-1.5 rounded-lg flex items-center justify-center ${
                  isSelected ? "bg-blue-50 text-blue-700" : "bg-slate-200/50 text-slate-500"
                }`}>
                  <IconComp className="h-4 w-4" />
                </div>
                <div className="hidden md:block min-w-0">
                  <span className={`text-xs font-bold block leading-tight ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                    {tab.label}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                    {tab.description}
                  </span>
                </div>
                <span className="md:hidden text-[10px] font-bold mt-1 text-center truncate w-full">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[500px]">
          {activeTab === "my-screens" && (
            <MyScreensTab
              onEditLayout={handleEditLayout}
              onCreateNew={handleCreateNew}
            />
          )}

          {activeTab === "builder" && (
            <ScreenBuilderTab
              editingLayoutId={editingLayoutId}
              setEditingLayoutId={setEditingLayoutId}
              setActiveTab={(tab) => setActiveTab(tab as TabId)}
              onSaveSuccess={() => {}}
            />
          )}

          {activeTab === "themes" && (
            <ThemeMarketplaceTab
              onThemeInstalled={() => setActiveTab("builder")}
            />
          )}

          {activeTab === "profile" && (
            <MerchantProfileTab />
          )}

          {activeTab === "others" && (
            <OthersScreensTab />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

export default function ScreenConsolePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Loading console...</div>}>
      <ScreenConsoleContent />
    </Suspense>
  );
}
