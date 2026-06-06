"use client";

import React, { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { marketplaceApi, type MarketplaceTheme, type MerchantTheme } from "@/lib/api/marketplace";
import { Download, Palette } from "lucide-react";

export default function ThemeMarketplacePage() {
  const [themes, setThemes] = useState<MarketplaceTheme[]>([]);
  const [installed, setInstalled] = useState<MerchantTheme[]>([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    const [all, mine] = await Promise.all([marketplaceApi.themes(), marketplaceApi.installedThemes()]);
    setThemes(all);
    setInstalled(mine);
  };

  useEffect(() => {
    load().catch((err) => setMessage(err.message));
  }, []);

  const install = async (themeId: string) => {
    try {
      await marketplaceApi.installTheme(themeId);
      await load();
      setMessage("Theme installed as a merchant copy.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Install failed");
    }
  };

  return (
    <DashboardShell>
            <h1 className="text-2xl font-semibold text-slate-900">Theme Marketplace</h1>
            <p className="mt-1 text-sm text-slate-600">Install master themes into isolated merchant copies. Master themes are never edited directly.</p>
            {message && <div className="my-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">{message}</div>}
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {themes.map((theme) => {
                const isInstalled = installed.some((item) => item.themeId === theme._id);
                return (
                  <article key={theme._id} className="rounded-lg border border-slate-200 p-5">
                    <div className="mb-4 flex aspect-video items-center justify-center rounded-md bg-slate-950" style={{ color: theme.colors?.primary || "#d4a017" }}>
                      <Palette className="h-10 w-10" />
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-slate-900">{theme.name}</h2>
                        <p className="text-sm text-slate-500">{theme.category}</p>
                      </div>
                      <Button size="sm" variant={isInstalled ? "outline" : "default"} onClick={() => install(theme._id)}>
                        <Download className="mr-2 h-4 w-4" />
                        {isInstalled ? "Installed" : "Install"}
                      </Button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {theme.widgets.map((widget) => (
                        <span key={widget} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{widget}</span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
    </DashboardShell>
  );
}
