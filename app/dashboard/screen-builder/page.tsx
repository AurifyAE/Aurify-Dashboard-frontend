"use client";

import React, { useState, useEffect, Suspense } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import MyScreensTab from "./MyScreensTab";
import ScreenBuilderTab from "./ScreenBuilderTab";
import ThemeMarketplaceTab from "./ThemeMarketplaceTab";
import MerchantProfileTab from "./MerchantProfileTab";
import OthersScreensTab from "./OthersScreensTab";
import NewsManagementTab from "./NewsManagementTab";
import {
  Monitor,
  Tv,
  Palette,
  Settings2,
  Tv2,
  Newspaper,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

type TabId = "my-screens" | "builder" | "themes" | "profile" | "others" | "news";

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
    if (tabParam && ["my-screens", "builder", "themes", "profile", "others", "news"].includes(tabParam)) {
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
      id: "news" as TabId,
      label: "News Management",
      description: "Control tickers and announcements",
      icon: Newspaper,
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
        {/* Page Header Bar */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-blue-100">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_100%_0%,#3b82f6,transparent_30%),radial-gradient(circle_at_0%_100%,#60a5fa,transparent_30%)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between z-10">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <span className="text-blue-600">
                  Screens & Themes
                </span>
                <span className="text-slate-400 text-lg font-light">Console</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500 max-w-2xl">
                Unifying template builders, theme installations, live TV previews, and business brandings.
              </p>
            </div>
          </div>
        </div>

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
              onSaveSuccess={() => setActiveTab("my-screens")}
            />
          )}

          {activeTab === "news" && (
            <NewsManagementTab />
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
