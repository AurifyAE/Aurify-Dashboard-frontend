"use client";

import React, { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { marketplaceApi, type MerchantCommodity } from "@/lib/api/marketplace";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

const METALS = [
  { key: "GOLD", label: "Gold", color: "#d4a017", bg: "bg-amber-50 border-amber-200 text-amber-700" },
  { key: "SILVER", label: "Silver", color: "#94a3b8", bg: "bg-slate-50 border-slate-200 text-slate-600" },
  { key: "PLATINUM", label: "Platinum", color: "#7c3aed", bg: "bg-violet-50 border-violet-200 text-violet-700" },
];

const UNITS = ["GM", "KG", "OZ", "TTB", "PC"];
const PURITIES = ["999", "995", "916", "750", "585", "375"];

const initial = {
  name: "Gold Bar 999",
  metal: "GOLD",
  purity: "999",
  weight: 1,
  unit: "GM",
  buyPremium: 0,
  sellPremium: 0,
  buyCharge: 0,
  sellCharge: 0,
  image: "",
  active: true,
};

function calculatePreview(spot: number, weight: number, premium: number, charge: number) {
  return ((spot / 31.1035) * 3.674 * weight * 0.999 + charge + premium).toFixed(2);
}

export default function MerchantCommoditiesPage() {
  const [items, setItems] = useState<MerchantCommodity[]>([]);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [showForm, setShowForm] = useState(false);
  const [activeMetal, setActiveMetal] = useState("ALL");

  const load = () =>
    marketplaceApi
      .commodities()
      .then(setItems)
      .catch((err) => { setMessage(err.message); setMessageType("error"); });

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) { setMessage("Name is required."); setMessageType("error"); return; }
    setSaving(true);
    try {
      await marketplaceApi.saveCommodity(form);
      setForm(initial);
      await load();
      setMessage("Commodity saved successfully.");
      setMessageType("success");
      setShowForm(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
      setMessageType("error");
    } finally { setSaving(false); }
  };

  const filtered = activeMetal === "ALL" ? items : items.filter((i) => i.metal === activeMetal);

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";
  const labelClass = "block mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500";

  const spotBid = 2300;
  const spotAsk = 2305;
  const previewBuy = calculatePreview(spotBid + form.buyPremium, form.weight, 0, form.buyCharge);
  const previewSell = calculatePreview(spotAsk + form.sellPremium, form.weight, 0, form.sellCharge);

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Commodity Builder
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Merchant Commodities</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Configure gold, silver, and precious metal products shown on your TV screens.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Commodity"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
          messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
        }`}>
          {messageType === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message}
          <button onClick={() => setMessage("")} className="ml-auto"><X className="h-3.5 w-3.5 opacity-50 hover:opacity-100" /></button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        {/* Form Panel */}
        {showForm && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 font-bold text-slate-900">
              <Plus className="h-4 w-4 text-blue-500" />
              Create Commodity
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Product Name *</label>
                <input className={inputClass} placeholder="e.g. Gold Bar 999" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              {/* Metal Selector */}
              <div>
                <label className={labelClass}>Metal</label>
                <div className="grid grid-cols-3 gap-2">
                  {METALS.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setForm({ ...form, metal: m.key })}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-all ${
                        form.metal === m.key
                          ? `border-2 ${m.bg}`
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Purity</label>
                  <select className={inputClass} value={form.purity} onChange={(e) => setForm({ ...form, purity: e.target.value })}>
                    {PURITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Unit</label>
                  <select className={inputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Weight</label>
                  <input type="number" min="0" step="0.01" className={inputClass} value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} />
                </div>
                <div>
                  <label className={labelClass}>Image URL</label>
                  <input className={inputClass} placeholder="https://..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                </div>
              </div>

              {/* Premium & Charge */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Pricing Adjustments</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "buyPremium", label: "Buy Premium" },
                    { key: "sellPremium", label: "Sell Premium" },
                    { key: "buyCharge", label: "Buy Charge" },
                    { key: "sellCharge", label: "Sell Charge" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className={labelClass}>{field.label}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputClass}
                        value={(form as any)[field.key]}
                        onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Price Preview */}
              <div className="rounded-xl bg-slate-900 p-4 text-white">
                <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-3">Live Price Preview</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase">Buy</span>
                    </div>
                    <p className="text-xl font-bold text-white">{previewBuy}</p>
                    <p className="text-[9px] opacity-40">Based on spot ~$2,300</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                      <TrendingDown className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase">Sell</span>
                    </div>
                    <p className="text-xl font-bold text-white">{previewSell}</p>
                    <p className="text-[9px] opacity-40">Based on spot ~$2,305</p>
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Active</p>
                  <p className="text-xs text-slate-400">Show on TV screens</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.active}
                  onClick={() => setForm((prev) => ({ ...prev, active: !prev.active }))}
                  className={`relative h-6 w-11 rounded-full transition-all ${form.active ? "bg-blue-600" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${form.active ? "left-6" : "left-1"}`} />
                </button>
              </div>

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn-primary w-full"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Commodity"}
              </button>
            </div>
          </div>
        )}

        {/* Commodity List */}
        <div>
          {/* Metal Filter */}
          <div className="mb-4 flex gap-2 flex-wrap">
            {["ALL", ...METALS.map((m) => m.key)].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setActiveMetal(m)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  activeMetal === m ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m === "ALL" ? `All (${items.length})` : `${m} (${items.filter((i) => i.metal === m).length})`}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-16 text-center">
              <Sparkles className="h-10 w-10 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-500">No commodities yet</p>
              <p className="mt-1 text-sm text-slate-400">Add your first commodity using the button above.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((item) => {
                const metal = METALS.find((m) => m.key === item.metal);
                return (
                  <article
                    key={item._id}
                    className={`overflow-hidden rounded-2xl border bg-white p-4 transition-all hover:shadow-sm ${
                      item.active ? "border-slate-200" : "border-slate-100 opacity-60"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: metal?.color || "#94a3b8" }}
                        >
                          {item.metal.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.metal} · {item.purity} · {item.weight} {item.unit}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        item.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {item.active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 text-center">
                        <p className="text-[9px] font-bold uppercase text-emerald-600 mb-0.5">Buy Charge</p>
                        <p className="text-base font-bold text-emerald-700">{item.buyCharge}</p>
                      </div>
                      <div className="rounded-lg bg-red-50 border border-red-100 p-2.5 text-center">
                        <p className="text-[9px] font-bold uppercase text-red-500 mb-0.5">Sell Charge</p>
                        <p className="text-base font-bold text-red-600">{item.sellCharge}</p>
                      </div>
                    </div>

                    {(item.buyPremium !== 0 || item.sellPremium !== 0) && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs text-slate-500">
                        <span>Buy Premium: +{item.buyPremium}</span>
                        <span>Sell Premium: +{item.sellPremium}</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
