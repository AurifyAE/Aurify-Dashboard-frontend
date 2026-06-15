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
  primaryColor = "#d4a017",
  secondaryColor = "#111827",
  accentColor = "#38bdf8",
  companyName = "Company",
}: {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  companyName?: string;
}) {
  return (
    <div
      className="aspect-video w-full overflow-hidden rounded-xl"
      style={{ background: secondaryColor }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: `1px solid ${primaryColor}30` }}
      >
        <span className="text-[9px] font-bold" style={{ color: primaryColor }}>
          {companyName.toUpperCase()}
        </span>
        <span
          className="rounded px-1.5 py-0.5 text-[7px] font-bold"
          style={{ background: accentColor, color: secondaryColor }}
        >
          LIVE
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1 px-2 py-1.5">
        {["GOLD", "SILVER"].map((m, i) => (
          <div
            key={m}
            className="rounded px-2 py-1"
            style={{
              background: `${i === 0 ? primaryColor : accentColor}18`,
              borderLeft: `2px solid ${i === 0 ? primaryColor : accentColor}`,
            }}
          >
            <div
              className="text-[7px] font-bold"
              style={{ color: i === 0 ? primaryColor : accentColor }}
            >
              {m}
            </div>
            <div className="text-[10px] font-bold text-white">
              {i === 0 ? "2,345" : "28.4"}
            </div>
          </div>
        ))}
      </div>
      <div className="px-2">
        <div className="text-[6px] font-semibold opacity-40 text-white grid grid-cols-4 gap-0.5 mb-0.5">
          <span>ITEM</span><span>WT</span><span>BUY</span><span>SELL</span>
        </div>
        {["Gold Bar", "Gold Coin"].map((item) => (
          <div key={item} className="grid grid-cols-4 gap-0.5 text-[5.5px] text-white/70 py-0.5" style={{ borderTop: `1px solid ${primaryColor}12` }}>
            <span>{item}</span><span>1g</span><span>224</span><span>225</span>
          </div>
        ))}
      </div>
      <div className="mt-1 px-2 py-1 text-[5.5px] font-semibold" style={{ background: primaryColor, color: secondaryColor }}>
        📢 Market update: Gold prices remain strong
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
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer"
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
            className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-all cursor-pointer"
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
                        className="text-slate-400 hover:text-amber-500 transition-colors flex-shrink-0 cursor-pointer"
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
                        className="text-slate-400 hover:text-amber-500 transition-colors flex-shrink-0"
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
