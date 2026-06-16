"use client";

import React, { useEffect, useState } from "react";
import { marketplaceApi, type ScreenLayout } from "@/lib/api/marketplace";
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Monitor,
  Pencil,
  Plus,
  Rocket,
} from "lucide-react";

interface MyScreensTabProps {
  onEditLayout: (layoutId: string) => void;
  onCreateNew: () => void;
}

function MiniScreenPreview({
  companyName = "Company",
}: {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  companyName?: string;
}) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-[#c58434] relative border border-slate-300 flex flex-col justify-between">
      {/* Background styling to mimic bright gold gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8d082] via-[#e59d45] to-[#8c4c1a] pointer-events-none opacity-90" />
      
      {/* Top Main Section */}
      <div className="flex flex-1 p-2 gap-2 relative z-10 h-[calc(100%-12px)]">
        {/* Left Side: Logo & Commodity Table */}
        <div className="w-1/2 flex flex-col gap-1">
          <div className="text-[7px] font-bold text-white mb-1 drop-shadow-md text-center bg-white/20 rounded p-0.5 backdrop-blur-sm">{companyName.toUpperCase()}</div>
          
          <div className="rounded-[4px] border border-white/40 bg-white/10 backdrop-blur-md p-1 flex-1 flex flex-col shadow-inner">
            <div className="grid grid-cols-4 text-[4px] font-bold text-white mb-1 border-b border-white/40 pb-0.5">
              <span>COMMODITY</span><span className="text-center">UNIT</span><span className="text-center">BUY</span><span className="text-center">SELL</span>
            </div>
            {["Gold 24K", "Gold Kilobar", "Silver"].map((item, i) => (
              <div key={i} className="grid grid-cols-4 text-[4px] font-bold text-white py-0.5 border-b border-white/20 last:border-0 drop-shadow-sm">
                <span className="truncate">{item}</span><span className="text-center">1 GM</span><span className="text-center">509.4</span><span className="text-center">509.5</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Clocks & Metal Panels */}
        <div className="w-1/2 flex flex-col gap-1">
           {/* Mini Clocks */}
           <div className="flex justify-around items-center h-2 mt-1">
             {["INDIA", "UAE", "USA"].map(c => <span key={c} className="text-[3px] text-white font-bold drop-shadow-md">{c} --:--</span>)}
           </div>

           {/* Gold Panel */}
           <div className="rounded-[6px] border border-white/50 bg-gradient-to-r from-[#faefb5] to-[#e4bc75] p-1.5 flex items-center justify-between shadow-lg">
             <div className="text-[5px] font-extrabold text-[#966116]">GOLD</div>
             <div className="flex gap-1">
                <div className="text-[4px] font-bold text-white bg-[#33cc33] px-1 py-0.5 rounded shadow">BID 4317</div>
                <div className="text-[4px] font-bold text-white bg-[#33cc33] px-1 py-0.5 rounded shadow">ASK 4318</div>
             </div>
           </div>

           {/* Silver Panel */}
           <div className="rounded-[6px] border border-white/50 bg-gradient-to-r from-[#f0f0f0] to-[#b0b0b0] p-1.5 flex items-center justify-between shadow-lg">
             <div className="text-[5px] font-extrabold text-[#555]">SILVER</div>
             <div className="flex gap-1">
                <div className="text-[4px] font-bold text-white border border-white/80 px-1 py-0.5 rounded">BID 69.2</div>
                <div className="text-[4px] font-bold text-white border border-white/80 px-1 py-0.5 rounded">ASK 69.4</div>
             </div>
           </div>
        </div>
      </div>

      {/* Bottom News Ticker */}
      <div className="h-[10px] bg-white border-t border-white flex items-center px-1 relative z-10 overflow-hidden">
        <div className="text-[4px] font-bold text-slate-800 whitespace-nowrap">
          {companyName} updates • Live Market Prices • Welcome to our showroom
        </div>
      </div>
    </div>
  );
}

export default function MyScreensTab({ onEditLayout, onCreateNew }: MyScreensTabProps) {
  const [layouts, setLayouts] = useState<ScreenLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    marketplaceApi
      .layouts()
      .then(setLayouts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const copyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  };

  const liveUrl = (layout: ScreenLayout) =>
    `https://screen.aurify.ae/${layout.screenSlug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Screens</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage your published and draft TV screens.
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Screen
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">Loading screens...</p>
        </div>
      ) : layouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-20 text-center">
          <Monitor className="h-12 w-12 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No screens yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Create your first TV screen in the Screen Builder.
          </p>
          <button
            onClick={onCreateNew}
            className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-all cursor-pointer"
          >
            <Rocket className="h-4 w-4" />
            Open Screen Builder
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {layouts.map((layout) => {
            const url = liveUrl(layout);
            const isPublished = layout.status === "published";
            const styles = layout.styles as any;
            return (
              <div
                key={layout.layoutId}
                className={`overflow-hidden rounded-2xl border transition-all hover:shadow-md bg-white ${
                  isPublished
                    ? "border-emerald-200 shadow-sm"
                    : "border-slate-200"
                }`}
              >
                {/* Preview */}
                <div className="p-3 bg-slate-50">
                  <MiniScreenPreview
                    primaryColor={styles?.colorOverride?.primary || styles?.colors?.primary || "#d4a017"}
                    secondaryColor={styles?.colorOverride?.secondary || styles?.colors?.secondary || "#111827"}
                    accentColor={styles?.colorOverride?.accent || styles?.colors?.accent || "#38bdf8"}
                    companyName={(layout as any).header?.company || "Company"}
                  />
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{layout.name}</p>
                      <p className="text-xs text-slate-400">/{layout.screenSlug}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        isPublished
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {layout.status}
                    </span>
                  </div>

                  {/* URL */}
                  {isPublished && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400">URL</span>
                      <span className="flex-1 truncate text-xs text-slate-600 font-mono">{url}</span>
                      <button
                        onClick={() => copyUrl(url, layout.layoutId)}
                        className="text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0 cursor-pointer"
                      >
                        {copiedId === layout.layoutId ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditLayout(layout.layoutId)}
                      className="btn-secondary flex-1 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    {!isPublished && (
                      <button
                        onClick={() => onEditLayout(layout.layoutId)}
                        className="btn-primary flex-1 cursor-pointer"
                      >
                        <Rocket className="h-3.5 w-3.5" />
                        Publish
                      </button>
                    )}
                    {isPublished && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Live
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
