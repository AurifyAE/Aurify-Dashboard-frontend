'use client';

import React, { useState, useEffect, Suspense } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import MyScreensTab from './MyScreensTab';
import ScreenBuilderTab from './ScreenBuilderTab';
import ThemeMarketplaceTab from './ThemeMarketplaceTab';
import MerchantProfileTab from './MerchantProfileTab';
import OthersScreensTab from './OthersScreensTab';
import NewsManagementTab from './NewsManagementTab';
import { Monitor, Tv, Palette, Settings2, Tv2, Newspaper } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { marketplaceApi, type Merchant } from '@/lib/api/marketplace';

type TabId = 'my-screens' | 'builder' | 'themes' | 'profile' | 'others' | 'news';

function ScreenConsoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('my-screens');
  // Loaded layout ID state for ScreenBuilderTab
  const [editingLayoutId, setEditingLayoutId] = useState<string | undefined>(undefined);
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    marketplaceApi
      .myMerchant()
      .then((m) => setMerchant(m))
      .catch((err) => console.error('Failed to fetch merchant details:', err));
  }, []);

  // Sync tab from query parameter if provided (e.g. /dashboard/screen-builder?tab=themes)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam &&
      ['my-screens', 'builder', 'themes', 'profile', 'others', 'news'].includes(tabParam)
    ) {
      setActiveTab(tabParam as TabId);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`);
  };

  const handleEditLayout = (layoutId: string) => {
    setEditingLayoutId(layoutId);
    handleTabChange('builder');
  };

  const handleCreateNew = () => {
    setEditingLayoutId(undefined);
    handleTabChange('builder');
  };

  const tabsConfig = [
    {
      id: 'my-screens' as TabId,
      label: 'My Screens',
      description: 'Manage your active TV displays',
      icon: Monitor,
    },
    {
      id: 'news' as TabId,
      label: 'News Management',
      description: 'Control tickers and announcements',
      icon: Newspaper,
    },
    {
      id: 'others' as TabId,
      label: 'Showroom Screens',
      description: 'Live showroom TV broadcasts',
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
                <span className="text-blue-600">Screens & Themes</span>
                <span className="text-slate-400 text-lg font-light">Console</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500 max-w-2xl">
                Unifying template builders, theme installations, live TV previews, and business
                brandings.
              </p>
            </div>
            {merchant && (
              <div className="flex flex-col gap-1 items-start md:items-end text-xs font-semibold">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Plan Limits</span>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 border border-blue-100/50 text-blue-700 px-3 py-1.5 shadow-sm">
                    <Monitor className="w-3.5 h-3.5 text-blue-500" />
                    <span>Max Screens: {merchant.maxScreens || 1}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-indigo-50/70 border border-indigo-100/50 text-indigo-700 px-3 py-1.5 shadow-sm">
                    <Tv className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Max Devices: {merchant.maxDevices || 1}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[500px]">
          {activeTab === 'my-screens' && (
            <MyScreensTab onEditLayout={handleEditLayout} onCreateNew={handleCreateNew} />
          )}

          {activeTab === 'builder' && (
            <ScreenBuilderTab
              editingLayoutId={editingLayoutId}
              setEditingLayoutId={setEditingLayoutId}
              setActiveTab={(tab) => handleTabChange(tab as TabId)}
              onSaveSuccess={() => handleTabChange('my-screens')}
            />
          )}

          {activeTab === 'news' && <NewsManagementTab />}

          {activeTab === 'profile' && <MerchantProfileTab />}

          {activeTab === 'others' && <OthersScreensTab />}
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
