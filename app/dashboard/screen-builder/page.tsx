"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import LiveClock from "@/components/LiveClock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  marketplaceApi,
  type Merchant,
  type MerchantTheme,
  type ScreenLayout,
} from "@/lib/api/marketplace";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GripVertical,
  Loader2,
  Monitor,
  Rocket,
  Save,
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

const LAYOUTS = ["Layout A", "Layout B", "Layout C", "Layout D"];

const SECTIONS = [
  { id: "header", label: "Header" },
  { id: "spotRates", label: "Spot Rates" },
  { id: "commodities", label: "Commodity Table" },
  { id: "news", label: "News Ticker" },
];

const STEPS = [
  { id: 1, label: "Screen setup" },
  { id: 2, label: "Theme" },
  { id: 3, label: "Sections" },
  { id: 4, label: "Preview & publish" },
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
};

export default function ScreenBuilderPage() {
  const [step, setStep] = useState(1);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [themes, setThemes] = useState<MerchantTheme[]>([]);
  const [layouts, setLayouts] = useState<ScreenLayout[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">(
    "info",
  );
  const [previewSize, setPreviewSize] = useState<"1920x1080" | "3840x2160">(
    "1920x1080",
  );
  const [draft, setDraft] = useState<DraftState>(defaultDraft);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const showMessage = (
    text: string,
    type: "info" | "success" | "error" = "info",
  ) => {
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
      if (installed[0]) {
        setDraft((prev) => ({
          ...prev,
          themeId: prev.themeId || installed[0].themeId,
        }));
      }
      if (savedLayouts[0] && !draft.layoutId) {
        const latest = savedLayouts[0];
        setDraft((prev) => ({
          ...prev,
          layoutId: latest.layoutId,
          name: latest.name,
          screenSlug: latest.screenSlug,
          themeId: latest.themeId || prev.themeId,
          widgets: latest.widgets?.length ? latest.widgets : prev.widgets,
          sectionOrder:
            (latest.body as { sectionOrder?: string[] })?.sectionOrder ||
            prev.sectionOrder,
        }));
      }
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "Failed to load builder",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedTheme = themes.find((theme) => theme.themeId === draft.themeId);
  const canGoLive = Boolean(
    merchant?.status === "Active" && draft.themeId && draft.name.trim(),
  );
  const primaryColor = String(
    (
      selectedTheme?.customizations as
        | { colors?: { primary?: string } }
        | undefined
    )?.colors?.primary || "#d4a017",
  );

  const moveSection = (targetSection: string) => {
    if (!draggedSection || draggedSection === targetSection) return;
    setDraft((prev) => {
      const next = prev.sectionOrder.filter(
        (section) => section !== draggedSection,
      );
      const targetIndex = next.indexOf(targetSection);
      next.splice(targetIndex, 0, draggedSection);
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

  const buildLayoutPayload = (themeId: string) => ({
    layoutId: draft.layoutId || undefined,
    name: draft.name.trim(),
    screenSlug: draft.screenSlug.trim(),
    themeId,
    header: { company: merchant?.companyName, layout: draft.selectedLayout },
    body: { previewSize, sectionOrder: draft.sectionOrder },
    sidebar: {},
    footer: { ticker: "enabled" },
    widgets: draft.widgets,
    styles: selectedTheme?.customizations || {},
  });

  const save = async () => {
    if (!draft.name.trim()) {
      showMessage("Give your screen a name before saving.", "error");
      setStep(1);
      return;
    }
    const themeId = draft.themeId || themes[0]?.themeId;
    if (!themeId) {
      showMessage("Install a theme first from Theme Marketplace.", "error");
      setStep(2);
      return;
    }

    setSaving(true);
    try {
      const saved = await marketplaceApi.saveLayout(
        buildLayoutPayload(themeId),
      );
      setDraft((prev) => ({ ...prev, layoutId: saved.layoutId, themeId }));
      await load();
      showMessage(
        "Draft saved. You can keep editing or go live when approved.",
        "success",
      );
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
        "error",
      );
      return;
    }

    setSaving(true);
    try {
      let layoutId = draft.layoutId;
      if (!layoutId) {
        const saved = await marketplaceApi.saveLayout(
          buildLayoutPayload(draft.themeId),
        );
        layoutId = saved.layoutId;
      }
      const assignedDevices = draft.assignedDevices
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const result = await marketplaceApi.publishLayout(layoutId, {
        assignedDevices,
      });
      setDraft((prev) => ({ ...prev, layoutId }));
      showMessage(`Screen is live: ${result.liveUrl}`, "success");
      await load();
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "Publish failed",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const previewScale = useMemo(
    () => (previewSize === "3840x2160" ? "4K UHD" : "Full HD"),
    [previewSize],
  );

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Screen Builder
          </h1>
          <p className="text-sm text-slate-600">
            Set up your screen in four simple steps — save a draft anytime, go
            live when ready.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Draft
          </Button>
          <Button
            onClick={publish}
            disabled={!canGoLive || saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Go Live
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStep(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              step === item.id
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item.id}. {item.label}
          </button>
        ))}
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg border p-3 text-sm ${
            messageType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : messageType === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {message}
        </div>
      )}

      {loading ? (
        <Loader />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <aside className="rounded-lg border border-slate-200 p-5">
            {step === 1 && (
              <div className="grid gap-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Screen details
                </h2>
                <Input
                  placeholder="Screen name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
                <Input
                  placeholder="URL slug (e.g. main)"
                  value={draft.screenSlug}
                  onChange={(e) =>
                    setDraft({ ...draft, screenSlug: e.target.value })
                  }
                />
                <select
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                  value={draft.selectedLayout}
                  onChange={(e) =>
                    setDraft({ ...draft, selectedLayout: e.target.value })
                  }
                >
                  {LAYOUTS.map((layout) => (
                    <option key={layout}>{layout}</option>
                  ))}
                </select>
                <Input
                  placeholder="Devices to assign (comma separated)"
                  value={draft.assignedDevices}
                  onChange={(e) =>
                    setDraft({ ...draft, assignedDevices: e.target.value })
                  }
                />
                <Button type="button" onClick={() => setStep(2)}>
                  Next: Choose theme
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Installed theme
                </h2>
                {themes.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    No theme installed yet.{" "}
                    <Link
                      href="/dashboard/theme-marketplace"
                      className="font-medium underline"
                    >
                      Pick one from Theme Marketplace
                    </Link>
                  </div>
                ) : (
                  <select
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                    value={draft.themeId}
                    onChange={(e) =>
                      setDraft({ ...draft, themeId: e.target.value })
                    }
                  >
                    {themes.map((theme) => (
                      <option key={theme._id} value={theme.themeId}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!draft.themeId && themes.length === 0}
                  >
                    Next: Arrange sections
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-slate-800">
                  Drag to reorder sections
                </h2>
                <p className="mb-4 text-xs text-slate-500">
                  Drag rows or use arrows. Order updates the TV preview
                  instantly.
                </p>
                <div className="mb-5 grid gap-2">
                  {draft.sectionOrder.map((sectionId, index) => {
                    const section = SECTIONS.find(
                      (item) => item.id === sectionId,
                    );
                    if (!section) return null;
                    const isDragging = draggedSection === section.id;
                    return (
                      <div
                        key={section.id}
                        draggable
                        onDragStart={() => setDraggedSection(section.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => moveSection(section.id)}
                        onDragEnd={() => setDraggedSection(null)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                          isDragging
                            ? "border-blue-400 bg-blue-50 opacity-70"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-400" />
                        <span className="flex-1">{section.label}</span>
                        <button
                          type="button"
                          className="rounded p-1 hover:bg-slate-100"
                          onClick={() => shiftSection(section.id, -1)}
                          disabled={index === 0}
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 hover:bg-slate-100"
                          onClick={() => shiftSection(section.id, 1)}
                          disabled={index === draft.sectionOrder.length - 1}
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <h2 className="mb-3 text-sm font-semibold text-slate-800">
                  Widgets on screen
                </h2>
                <div className="mb-4 grid gap-2">
                  {WIDGETS.map((widget) => (
                    <label
                      key={widget}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <Checkbox
                        checked={draft.widgets.includes(widget)}
                        onCheckedChange={(checked) =>
                          setDraft((prev) => ({
                            ...prev,
                            widgets: checked
                              ? [...prev.widgets, widget]
                              : prev.widgets.filter((item) => item !== widget),
                          }))
                        }
                      />
                      {widget}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(4)}>
                    Next: Preview
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Preview resolution
                </h2>
                <div className="flex gap-2">
                  {(["1920x1080", "3840x2160"] as const).map((size) => (
                    <Button
                      key={size}
                      type="button"
                      variant={previewSize === size ? "default" : "outline"}
                      onClick={() => setPreviewSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">
                    Ready to publish?
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`h-4 w-4 ${draft.name ? "text-emerald-500" : "text-slate-300"}`}
                      />
                      Screen name set
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`h-4 w-4 ${draft.themeId ? "text-emerald-500" : "text-slate-300"}`}
                      />
                      Theme selected
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`h-4 w-4 ${merchant?.status === "Active" ? "text-emerald-500" : "text-slate-300"}`}
                      />
                      Merchant approved (required for Go Live)
                    </li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(3)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={save}
                    disabled={saving}
                  >
                    Save Draft
                  </Button>
                </div>
              </div>
            )}
          </aside>

          <section className="rounded-lg border border-slate-200 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Monitor className="h-5 w-5" />
                TV Preview
              </div>
              <div className="text-sm text-slate-500">{previewScale}</div>
            </div>
            <div className="aspect-video overflow-hidden rounded-lg bg-slate-950 p-6 text-white">
              <div className="flex h-full flex-col">
                {draft.sectionOrder.map((sectionId) => {
                  if (sectionId === "header") {
                    return (
                      <div
                        key={sectionId}
                        className="flex items-start justify-between"
                      >
                        <div>
                          <div
                            className="text-2xl font-bold"
                            style={{ color: primaryColor }}
                          >
                            {merchant?.companyName || "Your Company"}
                          </div>
                          <div className="text-sm text-slate-300">
                            {draft.selectedLayout} ·{" "}
                            {selectedTheme?.name || "No theme"}
                          </div>
                        </div>
                        {draft.widgets.includes("Clock") && (
                          <div className="rounded bg-white/10 px-3 py-2 text-sm">
                            <LiveClock />
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (
                    sectionId === "spotRates" &&
                    draft.widgets.includes("Spot Rates")
                  ) {
                    return (
                      <div
                        key={sectionId}
                        className="my-4 rounded-lg border border-white/10 bg-white/5 p-4"
                      >
                        <div className="text-sm text-slate-300">
                          GOLD BID / ASK
                        </div>
                        <div className="mt-2 text-3xl font-bold">1,234.00</div>
                      </div>
                    );
                  }
                  if (
                    sectionId === "commodities" &&
                    draft.widgets.includes("Commodity Table")
                  ) {
                    return (
                      <div
                        key={sectionId}
                        className="my-4 rounded-lg border border-white/10 bg-white/5 p-4"
                      >
                        <div className="text-sm text-slate-300">
                          COMMODITIES
                        </div>
                        <div className="mt-2 space-y-2 text-sm">
                          <div>Gold Bar 999 · BUY 54671 · SELL 54691</div>
                          <div>Silver Bar 999 · BUY 3420 · SELL 3440</div>
                        </div>
                      </div>
                    );
                  }
                  if (sectionId === "news" && draft.widgets.includes("News")) {
                    return (
                      <div
                        key={sectionId}
                        className="mt-auto rounded bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950"
                      >
                        Market updates and merchant announcements scroll here
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {layouts.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 font-semibold text-slate-900">
                  Saved drafts
                </h2>
                <div className="grid gap-3">
                  {layouts.map((layout) => (
                    <button
                      key={layout.layoutId}
                      type="button"
                      className="rounded-lg border border-slate-200 p-3 text-left text-sm hover:bg-slate-50"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          layoutId: layout.layoutId,
                          name: layout.name,
                          screenSlug: layout.screenSlug,
                          themeId: layout.themeId || prev.themeId,
                          widgets: layout.widgets?.length
                            ? layout.widgets
                            : prev.widgets,
                          sectionOrder:
                            (layout.body as { sectionOrder?: string[] })
                              ?.sectionOrder || prev.sectionOrder,
                        }))
                      }
                    >
                      <span className="font-semibold">{layout.name}</span>
                      <span className="ml-2 text-slate-500">
                        {layout.status} · /{layout.screenSlug}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
