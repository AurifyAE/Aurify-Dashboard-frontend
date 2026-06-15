"use client";

import React, { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { marketplaceApi, type MarketplaceTheme } from "@/lib/api/marketplace";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Palette,
  Search,
  X,
} from "lucide-react";

function MiniTV({
  primary = "#d4a017",
  secondary = "#111827",
  accent = "#38bdf8",
  name = "Theme",
  compact = false,
}: {
  primary?: string;
  secondary?: string;
  accent?: string;
  name?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl ${compact ? "aspect-video" : "min-h-[220px]"}`}
      style={{ background: secondary }}
    >
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${primary}30` }}>
        <span className="text-[9px] font-bold" style={{ color: primary }}>AURIFY GOLD</span>
        <span className="rounded px-1.5 py-0.5 text-[7px] font-bold" style={{ background: accent, color: secondary }}>LIVE</span>
      </div>
      <div className="grid grid-cols-2 gap-1 px-2 py-1.5">
        {[{label:"GOLD",color:primary},{label:"SILVER",color:accent}].map((m) => (
          <div key={m.label} className="rounded px-2 py-1" style={{ background: `${m.color}18`, borderLeft: `2px solid ${m.color}` }}>
            <div className="text-[7px] font-bold" style={{ color: m.color }}>{m.label}</div>
            <div className="text-[10px] font-bold text-white">{m.label === "GOLD" ? "2,345.60" : "28.40"}</div>
          </div>
        ))}
      </div>
      <div className="px-2 pb-1">
        <div className="grid grid-cols-4 gap-0.5 text-[6px] font-semibold opacity-40 text-white mb-0.5"><span>ITEM</span><span>WT</span><span>BUY</span><span>SELL</span></div>
        {[["Gold Bar","1g","224","225"],["Gold Coin","8g","182","183"]].map((r) => (
          <div key={r[0]} className="grid grid-cols-4 gap-0.5 text-[6px] text-white/70 py-0.5" style={{ borderTop: `1px solid ${primary}12` }}>
            {r.map((c,i)=><span key={i}>{c}</span>)}
          </div>
        ))}
      </div>
      {!compact && (
        <div className="text-center py-2">
          <div className="text-[9px] font-bold" style={{ color: primary }}>{name.toUpperCase()}</div>
        </div>
      )}
      <div className="px-2 py-1 text-[5.5px] font-semibold" style={{ background: primary, color: secondary }}>
        📢 Market update: Gold prices remain strong
      </div>
    </div>
  );
}

export default function ConfigureScreensPage() {
  const [themes, setThemes] = useState<MarketplaceTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<MarketplaceTheme | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    marketplaceApi
      .themes()
      .then(setThemes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = themes.filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()),
  );

  const installAndEdit = async (theme: MarketplaceTheme) => {
    setInstalling(theme._id);
    try {
      await marketplaceApi.installTheme(theme._id);
    } catch {
      // ok if already installed
    } finally {
      setInstalling(null);
    }
    setDetailsOpen(false);
    router.push("/dashboard/screen-builder");
  };

  return (
    <>
      <DashboardShell>
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 mb-8">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: "radial-gradient(circle at 20% 80%, #ffffff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #3051bb 0%, transparent 50%)"
          }} />
          <div className="relative px-8 py-10 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              Choose a Template for Your Screen
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              Select a professional theme and customise it in the Screen Builder
            </p>
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 h-11 rounded-xl border-0 bg-white text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-4">
          All Templates
          <span className="ml-2 text-sm font-normal text-slate-400">({filtered.length})</span>
        </h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t) => (
              <div
                key={t._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="p-3 bg-slate-50">
                  <MiniTV
                    primary={t.colors?.primary}
                    secondary={t.colors?.secondary}
                    accent={t.colors?.accent}
                    name={t.name}
                    compact
                  />
                </div>
                <div className="px-4 pb-2 pt-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.category}</p>
                    </div>
                    <div className="flex gap-1 mt-0.5">
                      {Object.values(t.colors || {}).slice(0, 3).map((c: any, i) => (
                        <div key={i} className="h-3.5 w-3.5 rounded-full border border-white shadow" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.widgets?.slice(0, 3).map((w) => (
                      <span key={w} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{w}</span>
                    ))}
                  </div>
                </div>
                <div className="px-4 pb-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => { setSelected(t); setDetailsOpen(true); }}
                    className="btn-secondary w-full"
                  >
                    View Details
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardShell>

      {/* Details Sidebar */}
      {detailsOpen && selected && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDetailsOpen(false)} />
          <aside className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{selected.name}</h2>
              <button type="button" onClick={() => setDetailsOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <MiniTV
                primary={selected.colors?.primary}
                secondary={selected.colors?.secondary}
                accent={selected.colors?.accent}
                name={selected.name}
              />
              {/* Category & Colors */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Theme Details</p>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Category</span>
                    <span className="font-semibold">{selected.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fonts</span>
                    <span className="font-semibold">{selected.fonts?.join(", ")}</span>
                  </div>
                </div>
              </div>
              {/* Widgets */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Included Widgets</p>
                <div className="space-y-2">
                  {selected.widgets?.map((w) => (
                    <div key={w} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 text-blue-600 text-xs">✓</span>
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                disabled={!!installing}
                onClick={() => installAndEdit(selected)}
                className="btn-primary w-full"
              >
                {installing === selected._id ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Installing...</>
                ) : (
                  <><Download className="h-4 w-4" /> Install & Customize</>
                )}
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
