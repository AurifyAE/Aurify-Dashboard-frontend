"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import LiveClock from "@/components/LiveClock";
import Theme1Layout from "@/components/live-screen/theme1/Theme1Layout";
import Theme2Layout from "@/components/live-screen/theme2/Theme2Layout";
import {
  marketplaceApi,
  type Merchant,
  type MerchantTheme,
  type ScreenLayout,
} from "@/lib/api/marketplace";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  GripVertical,
  Loader2,
  Monitor,
  Palette,
  Rocket,
  Save,
  Settings2,
  Tv,
  XCircle,
} from "lucide-react";
import Loader from "@/components/loader/loader";

const WIDGETS = [
  "Spot Rates",
  "Commodity Table",
  "News",
  "Clock",
  "Date",
  "London Fix",
];

const LAYOUTS = [
  { 
    id: "theme1", 
    label: "Theme 1 (Classic)",
    colors: [
      { key: "primary", label: "Primary", default: "#d4a017" },
      { key: "secondary", label: "Secondary", default: "#111827" },
      { key: "accent", label: "Accent", default: "#38bdf8" },
      { key: "backgroundColor", label: "Background", default: "#140b10" },
      { key: "tableHeaderBg", label: "Table Header Bg", default: "#280f05" },
      { key: "tableRowBg", label: "Table Row Bg", default: "#140802" },
      { key: "tableText", label: "Table Text", default: "#ffffff" },
      { key: "buyBg", label: "Buy Box Bg", default: "#280f05" },
      { key: "buyText", label: "Buy Text", default: "#20c997" },
      { key: "sellBg", label: "Sell Box Bg", default: "#280f05" },
      { key: "sellText", label: "Sell Text", default: "#ff4d4d" },
      { key: "clockText", label: "Clock Text", default: "#ffffff" },
      { key: "newsBg", label: "News Bg", default: "#111827" },
      { key: "newsText", label: "News Text", default: "#ffffff" },
    ]
  },
  { 
    id: "theme2", 
    label: "Theme 2 (Modern)",
    colors: [
      { key: "primary", label: "Primary", default: "#d4a017" },
      { key: "secondary", label: "Secondary", default: "#111827" },
      { key: "accent", label: "Accent", default: "#38bdf8" },
    ]
  },
];

const SECTIONS = [
  { id: "header", label: "Header" },
  { id: "spotRates", label: "Spot Rates" },
  { id: "commodities", label: "Commodity Table" },
  { id: "news", label: "News Ticker" },
];

const STEPS = [
  { id: 1, label: "Setup & Theme", icon: Settings2 },
  { id: 2, label: "Customize", icon: Palette },
  { id: 3, label: "Go Live", icon: Monitor },
];

type DraftState = {
  layoutId: string;
  name: string;
  screenSlug: string;
  selectedLayout: string;
  themeId: string;
  widgets: string[];
  sectionOrder: string[];
  assignedDevices: string;
  colorOverride: Record<string, string>;
  showLogo: boolean;
  showName: boolean;
  logoUrl?: string;
  backgroundUrl?: string;
  newsHeading?: string;
};

const defaultDraft: DraftState = {
  layoutId: "",
  name: "Main Showroom Screen",
  screenSlug: "main",
  selectedLayout: "theme1",
  themeId: "",
  widgets: ["Spot Rates", "Commodity Table", "News", "Clock"],
  sectionOrder: ["header", "spotRates", "commodities", "news"],
  assignedDevices: "TV 1, TV 2",
  colorOverride: { primary: "#d4a017", secondary: "#111827", accent: "#38bdf8", backgroundColor: "#140b10", tableHeaderBg: "#280f05", tableRowBg: "#140802", tableText: "#ffffff", buyBg: "#280f05", buyText: "#20c997", sellBg: "#280f05", sellText: "#ff4d4d", clockText: "#ffffff", newsBg: "#111827", newsText: "#ffffff" },
  showLogo: true,
  showName: true,
  logoUrl: "",
  backgroundUrl: "",
};

interface ScreenBuilderTabProps {
  editingLayoutId?: string;
  setEditingLayoutId: (id: string | undefined) => void;
  setActiveTab: (tab: string) => void;
  onSaveSuccess?: () => void;
}

const TVPreviewRenderer = ({ data }: { data: any }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Parent container width divided by 1920 to find the scale
        setScale(entry.contentRect.width / 1920);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const enhancedData = {
    ...data,
    layout: {
      ...data.layout,
      styles: {
        ...(data.layout?.styles || {}),
        colorOverride: data.layout?.colorOverride || data.layout?.styles?.colorOverride,
        showLogo: data.layout?.showLogo,
        showName: data.layout?.showName,
      }
    },
    merchant: {
      ...data.merchant,
      logo: data.layout?.logoUrl || data.merchant?.logo,
      companyName: data.layout?.newsHeading || data.merchant?.companyName,
    },
    theme: {
      ...data.theme,
      customizations: {
        ...data.theme?.customizations,
        backgroundUrl: data.layout?.backgroundUrl || data.theme?.customizations?.backgroundUrl,
      },
    },
  };

  return (
    <div ref={containerRef} className="w-full relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: "1920px",
          height: "1080px",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {enhancedData?.layout?.selectedLayout === "theme2" ? (
          <Theme2Layout data={enhancedData} isPreview={true} />
        ) : (
          <Theme1Layout data={enhancedData} isPreview={true} />
        )}
      </div>
    </div>
  );
};

export default function ScreenBuilderTab({
  editingLayoutId,
  setEditingLayoutId,
  setActiveTab,
  onSaveSuccess,
}: ScreenBuilderTabProps) {
  const [step, setStep] = useState(1);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [themes, setThemes] = useState<MerchantTheme[]>([]);
  const [layouts, setLayouts] = useState<ScreenLayout[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");
  const [previewSize, setPreviewSize] = useState<"1920x1080" | "3840x2160">("1920x1080");
  const [draft, setDraft] = useState<DraftState>(defaultDraft);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "logoUrl" | "backgroundUrl") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraft(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const showMessage = (text: string, type: "info" | "success" | "error" = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [m, installed, savedLayouts, newsItems] = await Promise.all([
        marketplaceApi.myMerchant(),
        marketplaceApi.installedThemes(),
        marketplaceApi.layouts(),
        marketplaceApi.news().catch(() => []),
      ]);
      setMerchant(m);
      setThemes(installed);
      setLayouts(savedLayouts);
      setNews(newsItems);

      const currentThemeId = installed[0]?.themeId || "";

      if (editingLayoutId) {
        const target = savedLayouts.find((l) => l.layoutId === editingLayoutId);
        if (target) {
          setDraft({
            layoutId: target.layoutId,
            name: target.name,
            screenSlug: target.screenSlug,
            selectedLayout: (target.header as any)?.layout || "theme1",
            newsHeading: (target.header as any)?.newsHeading || "",
            themeId: target.themeId || currentThemeId,
            widgets: target.widgets?.length ? target.widgets : defaultDraft.widgets,
            sectionOrder: (target.body as any)?.sectionOrder || defaultDraft.sectionOrder,
            assignedDevices: Array.isArray(target.assignedDevices)
              ? target.assignedDevices.join(", ")
              : (target.assignedDevices || ""),
            colorOverride: (target.styles as any)?.colorOverride || defaultDraft.colorOverride,
            showLogo: (target.styles as any)?.showLogo ?? true,
            showName: (target.styles as any)?.showName ?? true,
          });
        }
      } else {
        setDraft({
          ...defaultDraft,
          themeId: currentThemeId,
        });
      }
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to load builder", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [editingLayoutId]);

  const selectedTheme = themes.find((t) => t.themeId === draft.themeId);
  const themeColors = selectedTheme?.customizations as
    | { colors?: { primary?: string; secondary?: string; accent?: string } }
    | undefined;

  const canGoLive = Boolean(merchant?.status === "Active" && draft.selectedLayout && draft.name.trim());

  const moveSection = (targetSection: string) => {
    if (!draggedSection || draggedSection === targetSection) return;
    setDraft((prev) => {
      const next = prev.sectionOrder.filter((s) => s !== draggedSection);
      const idx = next.indexOf(targetSection);
      next.splice(idx, 0, draggedSection);
      return { ...prev, sectionOrder: next };
    });
    setDraggedSection(null);
  };

  const shiftSection = (sectionId: string, direction: -1 | 1) => {
    setDraft((prev) => {
      const order = [...prev.sectionOrder];
      const index = order.indexOf(sectionId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return prev;
      [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
      return { ...prev, sectionOrder: order };
    });
  };

  const buildPayload = (themeId: string) => ({
    layoutId: draft.layoutId,
    name: draft.name,
    screenSlug: draft.screenSlug,
    themeId,
    header: { company: merchant?.companyName, layout: draft.selectedLayout, newsHeading: draft.newsHeading },
    body: { previewSize, sectionOrder: draft.sectionOrder },
    sidebar: {},
    footer: { ticker: "enabled" },
    widgets: draft.widgets,
    styles: {
      ...((selectedTheme?.customizations as Record<string, unknown>) || {}),
      colorOverride: draft.colorOverride,
      showLogo: draft.showLogo,
      showName: draft.showName,
      logoUrl: draft.logoUrl,
      backgroundUrl: draft.backgroundUrl
    },
  });

  const save = async () => {
    if (!draft.name.trim()) {
      showMessage("Give your screen a name first.", "error");
      setStep(1);
      return;
    }
    const themeId = draft.themeId || themes[0]?.themeId || "default";
    setSaving(true);
    try {
      const saved = await marketplaceApi.saveLayout(buildPayload(themeId));
      setDraft((prev) => ({ ...prev, layoutId: saved.layoutId, themeId }));
      setEditingLayoutId(saved.layoutId);
      await load();
      showMessage("Draft saved successfully.", "success");
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!canGoLive) {
      showMessage(
        merchant?.status !== "Active"
          ? "Your account must be approved before going live."
          : "Select a theme and screen name first.",
        "error"
      );
      return;
    }
    setSaving(true);
    try {
      let layoutId = draft.layoutId;
      if (!layoutId) {
        const saved = await marketplaceApi.saveLayout(buildPayload(draft.themeId));
        layoutId = saved.layoutId;
        setEditingLayoutId(layoutId);
      }
      const result = await marketplaceApi.publishLayout(layoutId, {
        assignedDevices: draft.assignedDevices.split(",").map((d) => d.trim()).filter(Boolean),
      });
      setDraft((prev) => ({ ...prev, layoutId }));
      showMessage(`🎉 Screen is live: ${result.liveUrl}`, "success");
      await load();
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Publish failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingLayoutId(undefined);
    setDraft(defaultDraft);
    setStep(1);
    showMessage("Form reset. Creating a new screen config.", "info");
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";

  if (loading) return <div className="py-20"><Loader /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {draft.layoutId ? `Edit Screen: ${draft.name}` : "Create New Screen"}
          </h2>
          <p className="text-sm text-slate-500">
            Customize and publish your live showroom TV rate boards.
          </p>
        </div>
        <div className="flex gap-2">
          {draft.layoutId && (
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary"
            >
              Start New Screen
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-secondary"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={!canGoLive || saving}
            className="btn-primary"
          >
            <Rocket className="h-4 w-4" />
            Go Live
          </button>
        </div>
      </div>

      <div className="flex items-center gap-0 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-1">
        {STEPS.map((s) => (
          <React.Fragment key={s.id}>
            <button
              type="button"
              onClick={() => setStep(s.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all whitespace-nowrap ${
                step === s.id
                  ? "bg-white text-blue-700 shadow-sm"
                  : step > s.id
                    ? "text-emerald-600"
                    : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === s.id ? "bg-blue-600 text-white" : step > s.id ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {step > s.id ? <Check className="h-3 w-3" /> : s.id}
              </span>
              <span className="hidden sm:block">{s.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {message && (
        <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
          messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : messageType === "error" ? "border-red-200 bg-red-50 text-red-800"
          : "border-slate-200 bg-slate-50 text-slate-700"
        }`}>
          {messageType === "success" ? <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          : messageType === "error" ? <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> : null}
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sticky top-6 h-fit max-h-[70dvh] overflow-y-auto">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Screen Details</h3>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Screen Name</label>
                <input className={inputClass} placeholder="e.g. Main Showroom" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">News Heading</label>
                <input className={inputClass} placeholder="e.g. Live Updates" value={draft.newsHeading || ""} onChange={(e) => setDraft({ ...draft, newsHeading: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">URL Slug</label>
                <input className={inputClass} placeholder="main" value={draft.screenSlug} onChange={(e) => setDraft({ ...draft, screenSlug: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Devices</label>
                <div className="flex gap-2 flex-wrap">
                  {["TV 1", "TV 2", "TV 3", "TV 4", "TV 5", "Lobby Display", "Window Display"].map((device) => {
                    const devicesArray = draft.assignedDevices.split(",").map(d => d.trim()).filter(Boolean);
                    const isSelected = devicesArray.includes(device);
                    return (
                      <label key={device} className={`flex items-center gap-2 p-2 rounded-xl border text-sm cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isSelected}
                          onChange={(e) => {
                            let newDevices = [...devicesArray];
                            if (e.target.checked) newDevices.push(device);
                            else newDevices = newDevices.filter(d => d !== device);
                            setDraft({ ...draft, assignedDevices: newDevices.join(", ") });
                          }}
                        />
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        {device}
                      </label>
                    );
                  })}
                </div>
              </div>
              {/* Theme Selection */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm mb-3">Select Layout Theme</h3>
                <div className="space-y-3">
                  {LAYOUTS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, selectedLayout: l.id })}
                      className={`w-full flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all ${
                        draft.selectedLayout === l.id
                          ? "border-blue-500 bg-blue-50/50"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-slate-800 block text-sm">{l.label}</span>
                        <span className="text-xs text-slate-500">
                          {l.id === "theme1" ? "Classic Dipanjali layout with gradients" : "Modern Zivora layout with glassmorphism"}
                        </span>
                      </div>
                      {draft.selectedLayout === l.id && (
                        <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={() => setStep(2)} className="btn-primary w-full mt-4">
                Next: Customize Screen <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Customize Details</h3>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wide">Branding & Assets</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Upload Logo</label>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "logoUrl")} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Background Image</label>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "backgroundUrl")} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                  </div>
                </div>
                
                <div className="pt-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Advanced Colors</label>
                  <div className="flex gap-3 flex-wrap">
                    {(LAYOUTS.find(l => l.id === (draft.selectedLayout === "Layout A" ? "theme1" : draft.selectedLayout))?.colors || []).map(color => (
                      <div key={color.key} className="bg-slate-50 rounded-xl p-1.5 border border-slate-100 flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{color.label}</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            className="h-8 w-8 cursor-pointer rounded bg-transparent border-0 p-0" 
                            value={draft.colorOverride[color.key] || color.default} 
                            onChange={(e) => setDraft({ ...draft, colorOverride: { ...draft.colorOverride, [color.key]: e.target.value } })} 
                          />
                          <span className="text-xs font-mono text-slate-600">{draft.colorOverride[color.key] || color.default}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Elements Section */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm mb-3">Visible Elements</h3>
                <div className="grid grid-cols-2 gap-3">
                  {WIDGETS.map((widget) => (
                    <label key={widget} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.widgets.includes(widget)}
                        onChange={(e) => {
                          if (e.target.checked) setDraft({ ...draft, widgets: [...draft.widgets, widget] });
                          else setDraft({ ...draft, widgets: draft.widgets.filter(w => w !== widget) });
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 h-4 w-4 cursor-pointer"
                      />
                      {widget}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">
                  Next: Preview & Go Live <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Go Live</h3>

              {/* Resolution Toggle */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Resolution</h4>
                <div className="flex gap-2">
                  {(["1920x1080", "3840x2160"] as const).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setPreviewSize(res)}
                      className={`flex-1 rounded-xl border-2 py-2 text-xs font-bold transition-all ${
                        previewSize === res ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {res === "1920x1080" ? "Full HD" : "4K UHD"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Publish Checklist */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-800 mb-3">Publish Checklist</p>
                {[
                  { label: "Screen name set", done: Boolean(draft.name.trim()) },
                  { label: "Theme selected", done: Boolean(draft.selectedLayout) },
                  { label: "Merchant approved", done: merchant?.status === "Active" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={item.done ? "text-slate-700" : "text-slate-400"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button type="button" onClick={publish} disabled={saving || !canGoLive} className="btn-primary flex-1">
                  <Rocket className="h-4 w-4" /> Go Live
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Right: TV Preview */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm  h-fit">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Monitor className="h-5 w-5 text-blue-600" />
              Live TV Preview
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {previewSize === "1920x1080" ? "Full HD · 1080p" : "4K UHD · 2160p"}
            </div>
          </div>

          {/* TV Screen */}
          {/* @ts-ignore */}
          <TVPreviewRenderer data={{ merchant, theme: selectedTheme, layout: draft, commodities: (merchant as any)?.commodities || [], news: news }} />

          {/* Saved Drafts */}
          {layouts.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-3 text-sm font-bold text-slate-800">Saved Screen Configs</h4>
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto">
                {layouts.map((layout) => (
                  <button
                    key={layout.layoutId}
                    type="button"
                    onClick={() => setEditingLayoutId(layout.layoutId)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left hover:border-blue-200 hover:bg-blue-50/30 transition-all ${
                      editingLayoutId === layout.layoutId ? "border-blue-500 bg-blue-50/30" : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-800 truncate block">{layout.name}</span>
                      <span className="text-[10px] text-slate-400">/{layout.screenSlug}</span>
                    </div>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase flex-shrink-0 ${
                      layout.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {layout.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
