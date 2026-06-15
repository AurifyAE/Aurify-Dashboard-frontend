"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import LiveClock from "@/components/LiveClock";
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
  { id: "Layout A", label: "Standard" },
  { id: "Layout B", label: "Wide Ticker" },
  { id: "Layout C", label: "Split Screen" },
  { id: "Layout D", label: "Fullscreen" },
];

const SECTIONS = [
  { id: "header", label: "Header" },
  { id: "spotRates", label: "Spot Rates" },
  { id: "commodities", label: "Commodity Table" },
  { id: "news", label: "News Ticker" },
];

const STEPS = [
  { id: 1, label: "Screen Setup", icon: Settings2 },
  { id: 2, label: "Theme", icon: Palette },
  { id: 3, label: "Customize", icon: Tv },
  { id: 4, label: "Preview & Publish", icon: Monitor },
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
  colorOverride: { primary: string; secondary: string; accent: string };
  showLogo: boolean;
  showName: boolean;
};

const defaultDraft: DraftState = {
  layoutId: "",
  name: "Main Showroom Screen",
  screenSlug: "main",
  selectedLayout: "Layout A",
  themeId: "",
  widgets: ["Spot Rates", "Commodity Table", "News", "Clock"],
  sectionOrder: ["header", "spotRates", "commodities", "news"],
  assignedDevices: "TV 1, TV 2",
  colorOverride: { primary: "", secondary: "", accent: "" },
  showLogo: true,
  showName: true,
};

interface ScreenBuilderTabProps {
  editingLayoutId?: string;
  setEditingLayoutId: (id: string | undefined) => void;
  setActiveTab: (tab: string) => void;
  onSaveSuccess?: () => void;
}

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
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");
  const [previewSize, setPreviewSize] = useState<"1920x1080" | "3840x2160">("1920x1080");
  const [draft, setDraft] = useState<DraftState>(defaultDraft);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const showMessage = (text: string, type: "info" | "success" | "error" = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [m, installed, savedLayouts] = await Promise.all([
        marketplaceApi.myMerchant(),
        marketplaceApi.installedThemes(),
        marketplaceApi.layouts(),
      ]);
      setMerchant(m);
      setThemes(installed);
      setLayouts(savedLayouts);

      const currentThemeId = installed[0]?.themeId || "";

      if (editingLayoutId) {
        const target = savedLayouts.find((l) => l.layoutId === editingLayoutId);
        if (target) {
          setDraft({
            layoutId: target.layoutId,
            name: target.name,
            screenSlug: target.screenSlug,
            selectedLayout: (target.header as any)?.layout || "Layout A",
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
        // Clear/reset draft to defaults
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

  const effectivePrimary = draft.colorOverride.primary || themeColors?.colors?.primary || "#d4a017";
  const effectiveSecondary = draft.colorOverride.secondary || themeColors?.colors?.secondary || "#111827";
  const effectiveAccent = draft.colorOverride.accent || themeColors?.colors?.accent || "#38bdf8";

  const canGoLive = Boolean(merchant?.status === "Active" && draft.themeId && draft.name.trim());

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
    layoutId: draft.layoutId || undefined,
    name: draft.name.trim(),
    screenSlug: draft.screenSlug.trim(),
    themeId,
    header: { company: merchant?.companyName, layout: draft.selectedLayout },
    body: { previewSize, sectionOrder: draft.sectionOrder },
    sidebar: {},
    footer: { ticker: "enabled" },
    widgets: draft.widgets,
    styles: {
      ...((selectedTheme?.customizations as Record<string, unknown>) || {}),
      colorOverride: draft.colorOverride,
      showLogo: draft.showLogo,
      showName: draft.showName,
    },
  });

  const save = async () => {
    if (!draft.name.trim()) {
      showMessage("Give your screen a name first.", "error");
      setStep(1);
      return;
    }
    const themeId = draft.themeId || themes[0]?.themeId;
    if (!themeId) {
      showMessage("Install a theme from Theme Marketplace first.", "error");
      setStep(2);
      return;
    }
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
      {/* Header */}
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

      {/* Step Indicators */}
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

      {/* Message */}
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
        {/* Left Panel */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Screen Details</h3>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Screen Name</label>
                <input className={inputClass} placeholder="e.g. Main Showroom" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">URL Slug</label>
                <input className={inputClass} placeholder="main" value={draft.screenSlug} onChange={(e) => setDraft({ ...draft, screenSlug: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Layout Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {LAYOUTS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, selectedLayout: l.id })}
                      className={`rounded-xl border-2 p-3 text-left text-xs font-semibold transition-all ${
                        draft.selectedLayout === l.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Devices</label>
                <input className={inputClass} placeholder="TV 1, TV 2" value={draft.assignedDevices} onChange={(e) => setDraft({ ...draft, assignedDevices: e.target.value })} />
              </div>
              <button type="button" onClick={() => setStep(2)} className="btn-primary w-full">
                Next: Choose Theme <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Select Theme</h3>
              {themes.length === 0 ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-sm text-blue-900">
                  No themes installed.{" "}
                  <button onClick={() => setActiveTab("themes")} className="font-semibold underline">
                    Browse Theme Library →
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {themes.map((theme) => {
                    const colors = (theme.customizations as any)?.colors;
                    const isSelected = draft.themeId === theme.themeId;
                    return (
                      <button
                        key={theme._id}
                        type="button"
                        onClick={() => setDraft({ ...draft, themeId: theme.themeId })}
                        className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                          isSelected ? "border-blue-500 bg-blue-50/50" : "border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <div className="h-10 w-16 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: colors?.secondary || "#111827" }}>
                          <span className="text-[8px] font-bold" style={{ color: colors?.primary || "#d4a017" }}>
                            {theme.name.slice(0, 8)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{theme.name}</p>
                          <p className="text-xs text-slate-500 truncate">{theme.category}</p>
                          <div className="mt-1 flex gap-1">
                            {Object.values(colors || {}).slice(0, 3).map((c: any, i) => (
                              <div key={i} className="h-2.5 w-2.5 rounded-full border border-white/50" style={{ background: c }} />
                            ))}
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button type="button" onClick={() => setStep(3)} disabled={!draft.themeId && themes.length === 0} className="btn-primary flex-1">
                  Next: Customize <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-800 text-sm">Customize Layout</h3>

              {/* Sections Order */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Section Order</h4>
                <div className="space-y-1.5">
                  {draft.sectionOrder.map((sId, index) => {
                    const section = SECTIONS.find((s) => s.id === sId);
                    if (!section) return null;
                    return (
                      <div
                        key={section.id}
                        draggable
                        onDragStart={() => setDraggedSection(section.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => moveSection(section.id)}
                        onDragEnd={() => setDraggedSection(null)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all ${
                          draggedSection === section.id ? "border-blue-500 bg-blue-50 opacity-70" : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <GripVertical className="h-4 w-4 cursor-grab text-slate-300" />
                        <span className="flex-1">{section.label}</span>
                        <button type="button" onClick={() => shiftSection(section.id, -1)} disabled={index === 0} className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => shiftSection(section.id, 1)} disabled={index === draft.sectionOrder.length - 1} className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Widgets */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Active Widgets</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {WIDGETS.map((w) => {
                    const active = draft.widgets.includes(w);
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            widgets: active ? prev.widgets.filter((x) => x !== w) : [...prev.widgets, w],
                          }))
                        }
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                          active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${active ? "bg-blue-600" : "bg-slate-300"}`} />
                        {w}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Overrides */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Color Overrides</h4>
                <div className="space-y-2">
                  {[
                    { key: "primary", label: "Primary" },
                    { key: "secondary", label: "Background" },
                    { key: "accent", label: "Accent" },
                  ].map((c) => (
                    <div key={c.key} className="flex items-center gap-3">
                      <input
                        type="color"
                        value={(draft.colorOverride as any)[c.key] || (themeColors?.colors as any)?.[c.key] || "#ffffff"}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            colorOverride: { ...prev.colorOverride, [c.key]: e.target.value },
                          }))
                        }
                        className="h-8 w-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                      />
                      <span className="text-xs font-medium text-slate-600 flex-1">{c.label}</span>
                      {(draft.colorOverride as any)[c.key] && (
                        <button
                          type="button"
                          onClick={() => setDraft((prev) => ({ ...prev, colorOverride: { ...prev.colorOverride, [c.key]: "" } }))}
                          className="text-[10px] text-slate-400 hover:text-red-400"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Visibility</h4>
                <div className="space-y-2">
                  {[
                    { key: "showLogo", label: "Show Company Logo" },
                    { key: "showName", label: "Show Company Name" },
                  ].map((v) => (
                    <label key={v.key} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <span className="text-sm text-slate-700">{v.label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={(draft as any)[v.key]}
                        onClick={() => setDraft((prev) => ({ ...prev, [v.key]: !(prev as any)[v.key] }))}
                        className={`relative h-5 w-9 rounded-full transition-all ${(draft as any)[v.key] ? "bg-blue-600" : "bg-slate-300"}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${(draft as any)[v.key] ? "left-4" : "left-0.5"}`} />
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button type="button" onClick={() => setStep(4)} className="btn-primary flex-1">
                  Preview <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Preview & Publish</h3>

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
                  { label: "Theme selected", done: Boolean(draft.themeId) },
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
                <button type="button" onClick={() => setStep(3)} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button type="button" onClick={save} disabled={saving} className="btn-secondary flex-1">
                  <Save className="h-4 w-4" /> Save Draft
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Right: TV Preview */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
          <div
            className="aspect-video overflow-hidden rounded-2xl p-5 text-white shadow-inner"
            style={{ background: effectiveSecondary }}
          >
            <div className="flex h-full flex-col gap-3">
              {draft.sectionOrder.map((sectionId) => {
                if (sectionId === "header") {
                  return (
                    <div key={sectionId} className="flex items-start justify-between">
                      <div>
                        {draft.showName && (
                          <div className="text-2xl font-bold" style={{ color: effectivePrimary }}>
                            {merchant?.companyName || "Your Company"}
                          </div>
                        )}
                        <div className="text-sm opacity-60">
                          {draft.selectedLayout} · {selectedTheme?.name || "No theme"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {draft.widgets.includes("Clock") && (
                          <div className="rounded-lg px-3 py-1.5 text-sm" style={{ background: `${effectivePrimary}22` }}>
                            <LiveClock />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                if (sectionId === "spotRates" && draft.widgets.includes("Spot Rates")) {
                  return (
                    <div key={sectionId} className="grid grid-cols-2 gap-3">
                      {[
                        { label: "GOLD", bid: "2,345.60", ask: "2,346.10", color: effectivePrimary },
                        { label: "SILVER", bid: "28.40", ask: "28.45", color: effectiveAccent },
                      ].map((metal) => (
                        <div key={metal.label} className="rounded-xl p-4" style={{ background: `${metal.color}15`, borderLeft: `3px solid ${metal.color}` }}>
                          <div className="text-xs font-bold mb-1" style={{ color: metal.color }}>{metal.label}</div>
                          <div className="text-2xl font-bold">{metal.bid}</div>
                          <div className="text-xs opacity-50">ASK: {metal.ask}</div>
                        </div>
                      ))}
                    </div>
                  );
                }
                if (sectionId === "commodities" && draft.widgets.includes("Commodity Table")) {
                  return (
                    <div key={sectionId} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="text-xs font-bold mb-2 opacity-60">COMMODITIES</div>
                      <div className="space-y-1.5 text-sm">
                        {[
                          ["Gold Bar 999", "1g", "224.80", "225.20"],
                          ["Gold Coin", "8g", "182.40", "183.00"],
                        ].map(([name, wt, buy, sell]) => (
                          <div key={name} className="grid grid-cols-4 gap-2 py-1" style={{ borderTop: `1px solid ${effectivePrimary}20` }}>
                            <span className="col-span-1 opacity-80">{name}</span>
                            <span className="opacity-50">{wt}</span>
                            <span style={{ color: effectivePrimary }}>{buy}</span>
                            <span style={{ color: effectiveAccent }}>{sell}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (sectionId === "news" && draft.widgets.includes("News")) {
                  return (
                    <div key={sectionId} className="mt-auto rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: effectivePrimary, color: effectiveSecondary }}>
                      📢 Market update · Gold prices rally · Special offers available
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

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
