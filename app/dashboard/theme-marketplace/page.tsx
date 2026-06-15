"use client";

import React, { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  marketplaceApi,
  type MarketplaceTheme,
  type MerchantTheme,
} from "@/lib/api/marketplace";
import {
  Check,
  CheckCircle2,
  Download,
  Loader2,
  Palette,
  Sparkles,
  Star,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Luxury Gold",
  "Modern Dark",
  "Corporate",
  "Jewellery Premium",
  "Arabic Premium",
];

const CATEGORY_BADGES: Record<string, { bg: string; text: string }> = {
  "Luxury Gold": { bg: "bg-amber-100", text: "text-amber-700" },
  "Modern Dark": { bg: "bg-slate-100", text: "text-slate-700" },
  Corporate: { bg: "bg-blue-100", text: "text-blue-700" },
  "Jewellery Premium": { bg: "bg-pink-100", text: "text-pink-700" },
  "Arabic Premium": { bg: "bg-emerald-100", text: "text-emerald-700" },
};

function MiniTVPreview({ theme }: { theme: MarketplaceTheme }) {
  const primary = theme.colors?.primary || "#d4a017";
  const secondary = theme.colors?.secondary || "#111827";
  const accent = theme.colors?.accent || "#38bdf8";
  return (
    <div
      className="aspect-video w-full overflow-hidden rounded-xl"
      style={{ background: secondary }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: `1px solid ${primary}22` }}
      >
        <div>
          <div
            className="text-[9px] font-bold leading-tight"
            style={{ color: primary }}
          >
            AURIFY GOLD
          </div>
          <div className="text-[7px] opacity-40 text-white">LIVE RATES</div>
        </div>
        <div
          className="rounded px-1.5 py-0.5 text-[7px] font-bold"
          style={{ background: accent, color: secondary }}
        >
          LIVE
        </div>
      </div>

      {/* Spot Rates */}
      <div className="grid grid-cols-2 gap-1 px-2 py-1.5">
        {[
          { label: "GOLD", price: "2,345.60", color: primary },
          { label: "SILVER", price: "28.40", color: accent },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded px-2 py-1"
            style={{ background: `${item.color}15`, borderLeft: `2px solid ${item.color}` }}
          >
            <div className="text-[7px] font-bold" style={{ color: item.color }}>
              {item.label}
            </div>
            <div className="text-[10px] font-bold text-white">{item.price}</div>
          </div>
        ))}
      </div>

      {/* Commodity Table */}
      <div className="px-2 pb-1">
        <div className="grid grid-cols-4 gap-0.5 text-[6px] font-semibold opacity-50 text-white mb-0.5">
          <span>ITEM</span><span>WT</span><span>BUY</span><span>SELL</span>
        </div>
        {[
          ["Gold Bar 999", "1g", "224", "225"],
          ["Gold Coin", "8g", "182", "183"],
        ].map((row) => (
          <div key={row[0]} className="grid grid-cols-4 gap-0.5 text-[6px] text-white/80 py-0.5" style={{ borderTop: `1px solid ${primary}15` }}>
            {row.map((cell, i) => <span key={i}>{cell}</span>)}
          </div>
        ))}
      </div>

      {/* Ticker */}
      <div
        className="mt-auto px-2 py-1 text-[6px] font-semibold overflow-hidden"
        style={{ background: primary, color: secondary }}
      >
        📢 Market update: Gold prices remain strong amid global demand
      </div>
    </div>
  );
}

export default function ThemeMarketplacePage() {
  const [themes, setThemes] = useState<MarketplaceTheme[]>([]);
  const [installed, setInstalled] = useState<MerchantTheme[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [installing, setInstalling] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const load = async () => {
    const [all, mine] = await Promise.all([
      marketplaceApi.themes(),
      marketplaceApi.installedThemes(),
    ]);
    setThemes(all);
    setInstalled(mine);
  };

  useEffect(() => {
    load().catch((err) => {
      setMessage(err.message);
      setMessageType("error");
    });
  }, []);

  const install = async (themeId: string) => {
    setInstalling(themeId);
    setMessage("");
    try {
      await marketplaceApi.installTheme(themeId);
      await load();
      setMessage("Theme installed successfully into your merchant library.");
      setMessageType("success");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Install failed");
      setMessageType("error");
    } finally {
      setInstalling(null);
    }
  };

  const filtered = themes.filter(
    (t) => activeCategory === "All" || t.category === activeCategory,
  );

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1.5">
          <Palette className="h-3.5 w-3.5" />
          Theme Library
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Theme Marketplace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse professional TV screen themes. Install any theme to your library
          — your customizations are always preserved.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            messageType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {messageType === "success" ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : null}
          {message}
        </div>
      )}

      {/* Installed Banner */}
      {installed.length > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800">
            You have{" "}
            <strong>{installed.length} theme{installed.length > 1 ? "s" : ""}</strong>{" "}
            installed.{" "}
            <a
              href="/dashboard/screen-builder"
              className="font-semibold underline"
            >
              Open Screen Builder →
            </a>
          </p>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              activeCategory === cat
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/10"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
            {cat !== "All" && (
              <span className="ml-1.5 text-xs opacity-60">
                ({themes.filter((t) => t.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Theme Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Palette className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No themes found</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((theme) => {
            const isInstalled = installed.some((i) => i.themeId === theme._id);
            const isInstalling = installing === theme._id;
            const badge = CATEGORY_BADGES[theme.category] || {
              bg: "bg-slate-100",
              text: "text-slate-700",
            };
            return (
              <article
                key={theme._id}
                className={`group overflow-hidden rounded-2xl border transition-all hover:shadow-lg ${
                  isInstalled
                    ? "border-emerald-200 shadow-sm shadow-emerald-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Mini TV Preview */}
                <div className="p-3 bg-slate-900/5">
                  <MiniTVPreview theme={theme} />
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold text-slate-900">{theme.name}</h2>
                      <span
                        className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.bg} ${badge.text}`}
                      >
                        {theme.category}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Object.entries(theme.colors || {}).slice(0, 3).map(([key, val]) => (
                        <div
                          key={key}
                          className="h-4 w-4 rounded-full border border-white shadow-sm"
                          style={{ background: val as string }}
                          title={key}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Fonts */}
                  <div className="mb-3 flex flex-wrap gap-1">
                    {theme.fonts?.map((f) => (
                      <span
                        key={f}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        Aa {f}
                      </span>
                    ))}
                  </div>

                  {/* Widgets */}
                  <div className="mb-4 flex flex-wrap gap-1">
                    {theme.widgets?.slice(0, 4).map((w) => (
                      <span
                        key={w}
                        className="rounded-full border border-slate-100 bg-white px-2 py-0.5 text-[10px] text-slate-500"
                      >
                        {w}
                      </span>
                    ))}
                    {(theme.widgets?.length || 0) > 4 && (
                      <span className="rounded-full border border-slate-100 bg-white px-2 py-0.5 text-[10px] text-slate-400">
                        +{(theme.widgets?.length || 0) - 4} more
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => !isInstalled && install(theme._id)}
                    disabled={isInstalling || isInstalled}
                    className={
                      isInstalled
                        ? "flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-default text-sm font-semibold"
                        : "btn-primary w-full"
                    }
                  >
                    {isInstalling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Installing...
                      </>
                    ) : isInstalled ? (
                      <>
                        <Check className="h-4 w-4" />
                        Installed
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Install Theme
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
