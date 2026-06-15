"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Image from "next/image";
import {
  Edit2,
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
  Edit,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  useSpotRate,
  MetalLiveData,
  SpreadSettings,
} from "@/context/SpotRateContext";
import { marketplaceApi, type MerchantCommodity } from "@/lib/api/marketplace";
import Swal from "sweetalert2";

const METALS = [
  {
    key: "GOLD",
    label: "Gold",
    color: "#d4a017",
    bg: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    key: "SILVER",
    label: "Silver",
    color: "#94a3b8",
    bg: "bg-slate-50 border-slate-200 text-slate-600",
  },
  {
    key: "PLATINUM",
    label: "Platinum",
    color: "#7c3aed",
    bg: "bg-indigo-50 border-indigo-200 text-indigo-700",
  },
];

const UNITS = ["GM", "KG", "OZ", "TTB", "PC"];
const PURITIES = ["999", "995", "916", "750", "585", "375"];

const initialForm = {
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

function SpotRateContent() {
  const {
    goldData,
    silverData,
    isConnected,
    spreadSettings,
    updateSpreadSettings,
  } = useSpotRate();

  const [isEditMode, setIsEditMode] = useState(false);

  // Commodities states
  const [items, setItems] = useState<MerchantCommodity[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingCommodity, setSavingCommodity] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [showForm, setShowForm] = useState(false);
  const [activeMetal, setActiveMetal] = useState("ALL");

  // Load commodities
  const loadCommodities = () =>
    marketplaceApi
      .commodities()
      .then(setItems)
      .catch((err) => {
        setMessage(err.message);
        setMessageType("error");
      });

  useEffect(() => {
    loadCommodities();
  }, []);

  // Handle spread updates
  const handleSpreadChange = (
    metal: "gold" | "silver",
    type: "bid" | "ask",
    value: number,
  ) => {
    const key =
      `${metal}${type === "bid" ? "Bid" : "Ask"}Spread` as keyof SpreadSettings;
    updateSpreadSettings({ [key]: value });
  };

  // Save commodity (Create or Edit)
  const saveCommodity = async () => {
    if (!form.name.trim()) {
      setMessage("Product name is required.");
      setMessageType("error");
      return;
    }
    setSavingCommodity(true);
    try {
      if (editingId) {
        await marketplaceApi.saveCommodity(form, editingId);
        Swal.fire({
          icon: "success",
          title: "Commodity Updated",
          text: "The commodity was updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await marketplaceApi.saveCommodity(form);
        Swal.fire({
          icon: "success",
          title: "Commodity Added",
          text: "The commodity was added successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setForm(initialForm);
      setEditingId(null);
      await loadCommodities();
      setShowForm(false);
      setMessage("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
      setMessageType("error");
    } finally {
      setSavingCommodity(false);
    }
  };

  // Edit action
  const handleEditClick = (item: MerchantCommodity) => {
    setForm({
      name: item.name,
      metal: item.metal,
      purity: item.purity,
      weight: item.weight,
      unit: item.unit,
      buyPremium: item.buyPremium,
      sellPremium: item.sellPremium,
      buyCharge: item.buyCharge,
      sellCharge: item.sellCharge,
      image: (item as any).image || "",
      active: item.active,
    });
    setEditingId(item._id);
    setShowForm(true);
    // Scroll dynamically to make form visible
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  // Delete action
  const handleDeleteClick = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete Commodity?",
      text: "Are you sure you want to delete this commodity? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (result.isConfirmed) {
      try {
        await marketplaceApi.deleteCommodity(id);
        Swal.fire({
          icon: "success",
          title: "Deleted",
          text: "Commodity deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        await loadCommodities();
      } catch (err) {
        Swal.fire(
          "Error",
          err instanceof Error ? err.message : "Deletion failed",
          "error",
        );
      }
    }
  };

  // Toggle active directly on the card
  const handleToggleActive = async (item: MerchantCommodity) => {
    try {
      const updated = { ...item, active: !item.active };
      const { _id, ...body } = updated;
      await marketplaceApi.saveCommodity(body, item._id);
      await loadCommodities();
    } catch (err) {
      Swal.fire("Error", "Failed to update commodity status", "error");
    }
  };

  // Real-time preview calculators using live WebSocket feeds
  const calculatePreviewPrice = (
    item: {
      metal: string;
      weight: number;
      purity: string;
      buyPremium: number;
      buyCharge: number;
      sellPremium: number;
      sellCharge: number;
    },
    type: "buy" | "sell",
  ) => {
    let baseSpot = 0;
    const metal = item.metal.toUpperCase();
    if (metal === "GOLD") {
      baseSpot = goldData ? Number(goldData.displayBid) : 2300;
    } else if (metal === "SILVER") {
      baseSpot = silverData ? Number(silverData.displayBid) : 30;
    } else {
      baseSpot = 1000;
    }

    const premium = type === "buy" ? item.buyPremium : item.sellPremium;
    const charge = type === "buy" ? item.buyCharge : item.sellCharge;
    const purityFactor = Number(item.purity) / 1000;

    // Convert base spot and apply premium in AED
    const price =
      ((baseSpot + premium) / 31.1035) * 3.674 * item.weight * purityFactor +
      charge;
    return price.toFixed(2);
  };

  const previewBuy = calculatePreviewPrice(form as any, "buy");
  const previewSell = calculatePreviewPrice(form as any, "sell");

  const placeholder = (v: string | number | undefined, fallback = "—") =>
    v !== undefined && v !== null && v !== 0 ? String(v) : fallback;

  const filteredItems =
    activeMetal === "ALL"
      ? items
      : items.filter((i) => i.metal === activeMetal);
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";
  const labelClass =
    "block mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500";

  // TradingCard component
  const TradingCard = ({
    name,
    data,
    bidSpread,
    askSpread,
    onSpreadChange,
  }: {
    name: "GOLD" | "SILVER";
    data: MetalLiveData | null;
    bidSpread: number;
    askSpread: number;
    onSpreadChange: (type: "bid" | "ask", value: number) => void;
  }) => {
    const metalKey = name === "GOLD" ? "gold" : "silver";
    const type =
      name === "GOLD" ? "CFDs on Gold (US$ / OZ)" : "CFDs on Silver (US$ / OZ)";

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {/* Header */}
        <div className="p-5 border border-slate-100 mb-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 flex items-center justify-center">
                <Image
                  src={
                    name === "GOLD"
                      ? "/images/gold-bar.png"
                      : "/images/silver-bar.png"
                  }
                  height={300}
                  width={300}
                  alt=""
                />
              </div>
              <span className="text-lg font-bold text-slate-700">{name}</span>
            </div>
            {/* Connection badge */}
            <span
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
                isConnected
                  ? "text-emerald-500 bg-emerald-100"
                  : "text-slate-400 bg-slate-100"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              {isConnected ? "LIVE" : "CONNECTING…"}
            </span>
          </div>

          {/* Price Info */}
          <div>
            <p className="text-[20px] font-bold text-slate-800 mb-1">{type}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-800">
                {placeholder(data?.displayBid, "—")}
              </span>
              <span className="text-sm text-slate-600">USD</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[16px] font-medium text-slate-500">
                Low: {placeholder(data?.displayLow)}
              </span>
              <span className="text-[16px] font-medium text-slate-500">
                High: {placeholder(data?.displayHigh)}
              </span>
            </div>
          </div>
        </div>

        {/* Edit mode toolbar */}
        {isEditMode && (
          <div className="flex justify-end gap-2 mb-3">
            <button
              onClick={() => setIsEditMode(false)}
              className="btn-primary"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditMode(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        )}

        {/* BID Section */}
        <div className="rounded-lg mb-3 border border-slate-200 overflow-hidden">
          <div className="flex bg-slate-50 p-2.5 items-center justify-center relative border-b border-slate-200">
            <span className="text-[22px] font-bold text-slate-700">BID</span>
            {!isEditMode && (
              <Edit2
                onClick={() => setIsEditMode(true)}
                className="w-4 h-4 absolute right-2.5 top-2.5 text-blue-500 cursor-pointer"
              />
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="border-r border-slate-200 p-4">
              <p className="text-sm text-slate-500 font-bold mb-1">BID</p>
              <p className="text-xl font-bold text-slate-900">
                {placeholder(data?.displayBid)}
              </p>
            </div>
            <div className="border-r border-slate-200 p-4 text-center">
              <p className="text-sm text-slate-500 mb-1">SPREAD</p>
              {isEditMode ? (
                <Input
                  type="number"
                  step="0.01"
                  value={bidSpread}
                  onChange={(e) =>
                    onSpreadChange("bid", parseFloat(e.target.value) || 0)
                  }
                  className="text-lg font-bold text-slate-900 w-full"
                />
              ) : (
                <p className="text-lg font-bold text-slate-900">{bidSpread}</p>
              )}
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-500 mb-1">BIDDING PRICE</p>
              <p className="text-xl font-bold text-slate-900">
                {data
                  ? (Number(data.displayBid) + bidSpread).toFixed(
                      name === "SILVER" ? 3 : 2,
                    )
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ASK Section */}
        <div className="rounded-lg mb-3 border border-slate-200 overflow-hidden">
          <div className="flex bg-slate-50 p-2.5 items-center justify-center relative border-b border-slate-200">
            <span className="text-[22px] font-bold text-slate-700">ASK</span>
            {!isEditMode && (
              <Edit2
                onClick={() => setIsEditMode(true)}
                className="w-4 h-4 absolute right-2.5 top-2.5 text-blue-500 cursor-pointer"
              />
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="border-r border-slate-200 p-4">
              <p className="text-sm text-slate-500 font-bold mb-1">ASK</p>
              <p className="text-xl font-bold text-slate-900">
                {placeholder(data?.displayAsk)}
              </p>
            </div>
            <div className="border-r border-slate-200 p-4 text-center">
              <p className="text-sm text-slate-500 mb-1">SPREAD</p>
              {isEditMode ? (
                <Input
                  type="number"
                  step="0.01"
                  value={askSpread}
                  onChange={(e) =>
                    onSpreadChange("ask", parseFloat(e.target.value) || 0)
                  }
                  className="text-lg font-bold text-slate-900 w-full"
                />
              ) : (
                <p className="text-lg font-bold text-slate-900">{askSpread}</p>
              )}
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-500 mb-1">ASKING PRICE</p>
              <p className="text-xl font-bold text-slate-900">
                {data
                  ? (Number(data.displayAsk) + askSpread).toFixed(
                      name === "SILVER" ? 3 : 2,
                    )
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* LOW & HIGH VALUE Section */}
        <div className="rounded-lg mb-3 border border-slate-200 overflow-hidden">
          <div className="flex bg-slate-50 p-2.5 items-center justify-center relative border-b border-slate-200">
            <span className="text-[22px] font-bold text-slate-700">
              LOW &amp; HIGH VALUE
            </span>
          </div>
          <div>
            <div className="grid grid-cols-2 gap-4 border-b border-slate-200">
              <div className="border-r border-slate-200 p-4">
                <p className="text-sm text-slate-500 mb-1">LOW VALUE</p>
                <p className="text-lg font-bold text-slate-900">
                  {placeholder(data?.low?.toFixed(name === "SILVER" ? 3 : 2))}
                </p>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-500 mb-1">LOW NEW VALUE</p>
                <p className="text-lg font-bold text-slate-900">
                  {placeholder(data?.displayLow)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-r border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">HIGH VALUE</p>
                <p className="text-lg font-bold text-slate-900">
                  {placeholder(data?.high?.toFixed(name === "SILVER" ? 3 : 2))}
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-500 mb-1">HIGH NEW VALUE</p>
                <p className="text-lg font-bold text-slate-900">
                  {placeholder(data?.displayHigh)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardShell className="scrollbar-none space-y-8 pb-12">
      {/* ── SECTION 1: LIVE SPOT RATES & SPREADS ── */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Live Spot Rates & Spreads
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TradingCard
            name="GOLD"
            data={goldData}
            bidSpread={spreadSettings.goldBidSpread}
            askSpread={spreadSettings.goldAskSpread}
            onSpreadChange={(type, value) =>
              handleSpreadChange("gold", type, value)
            }
          />
          <TradingCard
            name="SILVER"
            data={silverData}
            bidSpread={spreadSettings.silverBidSpread}
            askSpread={spreadSettings.silverAskSpread}
            onSpreadChange={(type, value) =>
              handleSpreadChange("silver", type, value)
            }
          />
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* ── SECTION 2: COMMODITY BUILDER ── */}
      <div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Commodity Builder
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Merchant Commodities
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Configure gold, silver, and platinum products with live real-time
              price calculation templates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showForm) {
                setForm(initialForm);
                setEditingId(null);
              }
              setShowForm((v) => !v);
            }}
            className="btn-primary"
          >
            {showForm ? (
              <X className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {showForm
              ? "Cancel"
              : editingId
                ? "Edit Commodity"
                : "Add Commodity"}
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message}
            <button onClick={() => setMessage("")} className="ml-auto">
              <X className="h-3.5 w-3.5 opacity-50 hover:opacity-100" />
            </button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          {/* Form Panel */}
          {showForm && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
              <h2 className="mb-5 flex items-center gap-2 font-bold text-slate-900">
                {editingId ? (
                  <Edit className="h-4 w-4 text-blue-500" />
                ) : (
                  <Plus className="h-4 w-4 text-blue-500" />
                )}
                {editingId ? "Edit Commodity" : "Create Commodity"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Product Name *</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Gold Bar 999"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
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
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: m.color }}
                        />
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Purity</label>
                    <select
                      className={inputClass}
                      value={form.purity}
                      onChange={(e) =>
                        setForm({ ...form, purity: e.target.value })
                      }
                    >
                      {PURITIES.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Unit</label>
                    <select
                      className={inputClass}
                      value={form.unit}
                      onChange={(e) =>
                        setForm({ ...form, unit: e.target.value })
                      }
                    >
                      {UNITS.map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Weight</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={form.weight}
                      onChange={(e) =>
                        setForm({ ...form, weight: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Image URL</label>
                    <input
                      className={inputClass}
                      placeholder="https://..."
                      value={form.image}
                      onChange={(e) =>
                        setForm({ ...form, image: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Premium & Charge */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Pricing Adjustments
                  </p>
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
                          step="0.01"
                          className={inputClass}
                          value={(form as any)[field.key]}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [field.key]: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Price Preview */}
                <div className="rounded-xl bg-slate-900 p-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-wide opacity-50 mb-3">
                    Real-Time Price Preview (AED)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase">
                          Buy Rate
                        </span>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {previewBuy}
                      </p>
                      <p className="text-[9px] opacity-40">
                        Dynamic based on live feed
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                        <TrendingDown className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase">
                          Sell Rate
                        </span>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {previewSell}
                      </p>
                      <p className="text-[9px] opacity-40">
                        Dynamic based on live feed
                      </p>
                    </div>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Active
                    </p>
                    <p className="text-xs text-slate-400">Show on TV screens</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.active}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, active: !prev.active }))
                    }
                    className={`relative h-6 w-11 rounded-full transition-all ${form.active ? "bg-blue-600" : "bg-slate-300"}`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${form.active ? "left-6" : "left-1"}`}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={saveCommodity}
                  disabled={savingCommodity}
                  className="btn-primary w-full"
                >
                  {savingCommodity ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {savingCommodity
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Save Commodity"}
                </button>
              </div>
            </div>
          )}

          {/* Commodity List */}
          <div className={showForm ? "" : "xl:col-span-2"}>
            {/* Metal Filter */}
            <div className="mb-4 flex gap-2 flex-wrap">
              {["ALL", ...METALS.map((m) => m.key)].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setActiveMetal(m)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    activeMetal === m
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {m === "ALL"
                    ? `All (${items.length})`
                    : `${m} (${items.filter((i) => i.metal === m).length})`}
                </button>
              ))}
            </div>

            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-16 text-center">
                <Sparkles className="h-10 w-10 text-slate-300 mb-3" />
                <p className="font-semibold text-slate-500">
                  No commodities yet
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Add your first commodity using the button above.
                </p>
              </div>
            ) : (
              <div
                className={`grid gap-4 ${showForm ? "sm:grid-cols-1 md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
              >
                {filteredItems.map((item) => {
                  const metal = METALS.find((m) => m.key === item.metal);
                  const dynamicBuyPrice = calculatePreviewPrice(item, "buy");
                  const dynamicSellPrice = calculatePreviewPrice(item, "sell");

                  return (
                    <article
                      key={item._id}
                      className={`overflow-hidden rounded-2xl border bg-white p-4 transition-all hover:shadow-sm flex flex-col justify-between ${
                        item.active
                          ? "border-slate-200 shadow-sm"
                          : "border-slate-100 opacity-60"
                      }`}
                    >
                      <div>
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: metal?.color || "#94a3b8" }}
                            >
                              {item.metal.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {item.metal} · {item.purity} · {item.weight}{" "}
                                {item.unit}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleActive(item)}
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase cursor-pointer transition-all ${
                              item.active
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            {item.active ? "Active" : "Inactive"}
                          </button>
                        </div>

                        {/* Live dynamic buy / sell display */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-2 text-center">
                            <p className="text-[9px] font-bold uppercase text-emerald-600 mb-0.5">
                              Live Buy
                            </p>
                            <p className="text-sm font-bold text-emerald-700">
                              {dynamicBuyPrice}
                            </p>
                          </div>
                          <div className="rounded-lg bg-red-50/50 border border-red-100 p-2 text-center">
                            <p className="text-[9px] font-bold uppercase text-red-500 mb-0.5">
                              Live Sell
                            </p>
                            <p className="text-sm font-bold text-red-600">
                              {dynamicSellPrice}
                            </p>
                          </div>
                        </div>

                        {/* Premium and charge information */}
                        <div className="border-t border-slate-100 pt-2.5 space-y-1 text-[11px] text-slate-500">
                          <div className="flex justify-between">
                            <span>Premiums (B/S):</span>
                            <span className="font-medium">
                              +{item.buyPremium} / +{item.sellPremium}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Charges (B/S):</span>
                            <span className="font-medium">
                              {item.buyCharge} / {item.sellCharge}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all cursor-pointer"
                          title="Edit commodity"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item._id)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer"
                          title="Delete commodity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function SpotRatePage() {
  return <SpotRateContent />;
}
