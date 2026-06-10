"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2, Save, Trash2, X, Plus, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { swal } from "@/lib/swal";
import Loader from "@/components/loader/loader";
import { useSpotRate } from "@/context/SpotRateContext";
import {
  fetchCommodities,
  createCommodity,
  updateCommodity,
  deleteCommodity,
  type CommodityRow,
} from "@/lib/api/commodities";

// ─── Constants (match legacy dashboard exactly) ────────────────────────────────
const TROY_OUNCE = 31.103;   // oz→gram divisor (matches legacy "/ 31.103")
const AED_RATE   = 3.674;    // USD → AED

// Gold/Silver ask offset (bid → ask gap, matches legacy +0.5 / +0.05)
const GOLD_OFFSET   = 0.5;
const SILVER_OFFSET = 0.05;

// Weight unit → gram multiplier (matches legacy getUnitMultiplier)
const UNIT_MULTIPLIER: Record<string, number> = {
  gram : 1,
  gm   : 1,
  kg   : 1000,
  oz   : 31.1034768,
  tola : 11.664,
  ttb  : 116.64,
};

const METAL_OPTIONS = ["GOLD", "KILOBAR", "TTBAR", "SILVER"] as const;
const PURITY_OPTIONS = ["99999", "999", "995", "916", "875"] as const;
const WEIGHT_OPTIONS = ["GM", "KG", "TTB", "TOLA", "OZ"] as const;

// ─── Purity factor ─────────────────────────────────────────────────────────────
// Matches legacy:
//   const digitsBeforeDecimal = getNumberOfDigitsBeforeDecimal(commodity.purity);
//   parseInt(commodity.purity) / Math.pow(10, digitsBeforeDecimal)
// e.g. "999" → 999/1000 = 0.999 | "916" → 916/1000 = 0.916
const purityFactor = (purity: string): number => {
  const n = parseInt(purity, 10);
  if (!Number.isFinite(n) || n <= 0) return 1;
  const digits = String(Math.abs(n)).length;
  return n / Math.pow(10, digits);
};

// ─── Parse "1 GM" / "10 KG" style unit strings ───────────────────────────────
const parseUnit = (unit: string): { count: number; weight: string } => {
  const parts  = unit.trim().split(/\s+/);
  const count  = Number(parts[0]) || 1;
  const weight = (parts[1] || "GM").toLowerCase();
  return { count, weight };
};

// ─── Resolve gold vs silver data ──────────────────────────────────────────────
const getSpotForMetal = (
  metal: string,
  gold  : { bid: number; ask: number } | null,
  silver: { bid: number; ask: number } | null,
) => {
  const lower = metal.toLowerCase();
  if (lower.includes("silver") || lower === "xag") return silver;
  return gold;
};

const isGoldMetal = (metal: string): boolean => {
  const lower = metal.toLowerCase();
  return !lower.includes("silver") && lower !== "xag";
};

// ─── Core price calculation — exact port of legacy calculatePrice ──────────────
//
//  SELL:
//    metalAskingPrice  = rawBid + bidSpread + offset        (same as legacy)
//    price = ((metalAskingPrice + askSpread + sellPremium) / 31.103)
//            × AED × unitCount × unitMultiplier × purityFactor
//            + sellCharge
//
//  BUY:
//    metalBiddingPrice = rawBid                             (no spread, same as legacy)
//    price = ((metalBiddingPrice + bidSpread + buyPremium) / 31.103)
//            × AED × unitCount × unitMultiplier × purityFactor
//            + buyCharge
//
const calculatePrice = (params: {
  rawBid    : number;
  bidSpread : number;
  askSpread : number;
  offset    : number;
  premium   : number;
  charge    : number;
  unitCount : number;
  unitWeight: string;
  purity    : string;
  type      : "sell" | "buy";
}): number => {
  const {
    rawBid, bidSpread, askSpread, offset,
    premium, charge, unitCount, unitWeight, purity, type,
  } = params;

  const unitMultiplier = UNIT_MULTIPLIER[unitWeight.toLowerCase()] ?? 1;
  const pur = purityFactor(purity);

  // Sell uses the asking side; Buy uses the bidding side (legacy logic)
  const metalPrice    = type === "sell" ? rawBid + bidSpread + offset : rawBid;
  const spreadForType = type === "sell" ? askSpread : bidSpread;

  return (
    ((metalPrice + spreadForType + premium) / TROY_OUNCE) *
    AED_RATE *
    unitCount *
    unitMultiplier *
    pur +
    charge
  );
};

// ─── Formatting ───────────────────────────────────────────────────────────────
const formatPrice = (value: number | null): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  const intLen = Math.floor(Math.abs(value)).toString().length;
  let decimals = 3;
  if (intLen >= 4) decimals = 0;
  else if (intLen === 3) decimals = 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// ─── 1 GM rate cards (top section) ───────────────────────────────────────────
// Legacy formula shown in the top cards:
//   (bid + bidSpread) / 31.103  [USD]
//   × AED                       [AED]
const calc1GmUsd = (bid: number, bidSpread: number): number =>
  (bid + bidSpread) / TROY_OUNCE;
const calc1GmAed = (bid: number, bidSpread: number): number =>
  calc1GmUsd(bid, bidSpread) * AED_RATE;

// ─── Default add form ─────────────────────────────────────────────────────────
const defaultAddForm = {
  metal      : "GOLD",
  purity     : "999",
  unitCount  : 1,
  weight     : "GM",
  sellPremium: 0,
  sellCharges: 0,
  buyPremium : 0,
  buyCharges : 0,
};

export default function CommodityPage() {
  const [currency, setCurrency]     = useState("UNITED ARAB EMIRATES DIRHAM");
  const [editMode, setEditMode]     = useState(false);
  const { goldData, silverData, spreadSettings } = useSpotRate();

  const [commodities, setCommodities] = useState<CommodityRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addForm, setAddForm]         = useState<typeof defaultAddForm>(defaultAddForm);
  const [addSubmitting, setAddSubmitting]   = useState(false);
  const [saveAllLoading, setSaveAllLoading] = useState(false);

  // ── Load commodities ────────────────────────────────────────────────────────
  const loadCommodities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCommodities();
      setCommodities(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load commodities";
      setCommodities([]);
      void swal.error(msg);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  }, []);

  useEffect(() => { loadCommodities(); }, [loadCommodities]);

  // ── Edit mode helpers ───────────────────────────────────────────────────────
  const updateLocalCommodity = (id: string, field: keyof CommodityRow, value: number) => {
    setCommodities((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleSaveAll = async () => {
    setSaveAllLoading(true);
    try {
      for (const item of commodities) {
        await updateCommodity(item.id, {
          buyPremium : item.buyPremium,
          sellPremium: item.sellPremium,
          sellCharges: item.sellCharges,
          buyCharges : item.buyCharges,
        });
      }
      setEditMode(false);
    } catch (e) {
      void swal.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaveAllLoading(false);
    }
  };

  // ── Add commodity ───────────────────────────────────────────────────────────
  const handleAddCommoditySubmit = async () => {
    const unit    = `${addForm.unitCount} ${addForm.weight}`;
    const payload = {
      metal      : addForm.metal,
      purity     : addForm.purity,
      unit,
      buyPremium : addForm.buyPremium,
      sellPremium: addForm.sellPremium,
      sellCharges: addForm.sellCharges,
      buyCharges : addForm.buyCharges,
    };
    const tempId: string        = `temp-${Date.now()}`;
    const optimistic: CommodityRow = { id: tempId, ...payload };
    setCommodities((prev) => [optimistic, ...prev]);
    setAddForm(defaultAddForm);
    setSidebarOpen(false);
    setAddSubmitting(true);
    try {
      const created = await createCommodity(payload);
      setCommodities((prev) => prev.map((c) => (c.id === tempId ? created : c)));
    } catch (e) {
      setCommodities((prev) => prev.filter((c) => c.id !== tempId));
      void swal.error(e instanceof Error ? e.message : "Failed to add commodity");
    } finally {
      setAddSubmitting(false);
    }
  };

  // ── Delete commodity ────────────────────────────────────────────────────────
  const handleDeleteCommodity = async (id: string) => {
    const result = await swal.confirm({
      title      : "Remove commodity?",
      text       : "This will remove the commodity from the list.",
      confirmText: "Yes, remove",
      confirmColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteCommodity(id);
      setCommodities((prev) => prev.filter((c) => c.id !== id));
      void swal.success("Removed");
    } catch (e) {
      void swal.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  // ── 1 GM rate cards ─────────────────────────────────────────────────────────
  const goldBidSpread   = spreadSettings.goldBidSpread;
  const goldAskSpread   = spreadSettings.goldAskSpread;
  const silverBidSpread = spreadSettings.silverBidSpread;
  const silverAskSpread = spreadSettings.silverAskSpread;

  const goldRawBid   = goldData?.bid   ?? null;
  const silverRawBid = silverData?.bid ?? null;

  const goldGmUsd   = goldRawBid   != null ? calc1GmUsd(goldRawBid,   goldBidSpread)   : null;
  const goldGmAed   = goldRawBid   != null ? calc1GmAed(goldRawBid,   goldBidSpread)   : null;
  const silverGmUsd = silverRawBid != null ? calc1GmUsd(silverRawBid, silverBidSpread) : null;
  const silverGmAed = silverRawBid != null ? calc1GmAed(silverRawBid, silverBidSpread) : null;

  const isInitialLoading   = loading;
  const isSaving           = saveAllLoading || addSubmitting;
  const showFullscreenLoader = isInitialLoading || isSaving;

  return (
    <>
      {showFullscreenLoader && <Loader />}
      <DashboardShell className="overflow-y-auto">
        {/* ── Header bar ─────────────────────────────────────────────────── */}
        <div className="flex mb-8 flex-col justify-between gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-[220px] flex items-center gap-3">
              <label className="text-sm text-slate-600 h-auto block">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNITED ARAB EMIRATES DIRHAM">
                    UNITED ARAB EMIRATES DIRHAM
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="bg-blue-500 px-7 text-white py-5 rounded-xl hover:bg-blue-600 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Commodity
            </Button>
          </div>

          {/* ── 1 GM rate cards ──────────────────────────────────────────── */}
          <div className="flex gap-8 w-full">
            {/* GOLD */}
            <div className="grid grid-cols-2 items-center overflow-hidden shadow-lg bg-white rounded-xl border border-slate-200 px-6 py-3 gap-3 flex-1">
              <p className="text-[24px] flex align-center relative z-1 font-semibold text-[#C9A44C]">
                GOLD 1 GM
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm align-middle">
                <div className="flex flex-col align-center text-center justify-center">
                  <div className="text-slate-600">USD</div>
                  <div className="text-xl font-bold">
                    {goldGmUsd == null ? "—" : goldGmUsd.toFixed(4)}
                  </div>
                </div>
                <div className="flex flex-col align-center text-center justify-center">
                  <div className="text-md text-slate-600">AED</div>
                  <div className="text-xl font-bold">
                    {goldGmAed == null ? "—" : goldGmAed.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>

            {/* SILVER */}
            <div className="grid grid-cols-2 items-center overflow-hidden shadow-lg bg-white rounded-xl border border-slate-200 px-6 py-3 gap-3 flex-1">
              <p className="text-[24px] relative z-1 font-semibold text-[#8C8E8F]">
                SILVER 1 GM
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col align-center text-center justify-center">
                  <div className="text-slate-600">USD</div>
                  <div className="text-xl font-bold">
                    {silverGmUsd == null ? "—" : silverGmUsd.toFixed(4)}
                  </div>
                </div>
                <div className="flex flex-col align-center text-center justify-center">
                  <div className="text-slate-600">AED</div>
                  <div className="text-xl font-bold">
                    {silverGmAed == null ? "—" : silverGmAed.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Commodity table ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <h2 className="text-lg font-semibold text-slate-800">
              Commodity Rates (AED)
            </h2>
            {!loading && commodities.length > 0 && (
              editMode ? (
                <div className="flex gap-3">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={saveAllLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saveAllLoading
                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      : <Save className="w-4 h-4 mr-2" />
                    }
                    Save All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Rates
                </Button>
              )
            )}
          </div>

          {commodities.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-slate-500 mb-4">
                No commodities yet. Add your first one to get started.
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Commodity
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50 border-0">
                <TableRow className="border-0">
                  <TableHead>Metal</TableHead>
                  <TableHead>Purity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Sell (AED)</TableHead>
                  <TableHead className="text-right">Buy (AED)</TableHead>
                  <TableHead className="text-right">Sell Premium</TableHead>
                  <TableHead className="text-right">Buy Premium</TableHead>
                  <TableHead className="text-right">Sell Charges</TableHead>
                  <TableHead className="text-right">Buy Charges</TableHead>
                  <TableHead className="w-20 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commodities.map((item) => {
                  const spot   = getSpotForMetal(item.metal, goldData, silverData);
                  const isGold = isGoldMetal(item.metal);
                  const offset = isGold ? GOLD_OFFSET : SILVER_OFFSET;
                  const bSpread = isGold ? goldBidSpread   : silverBidSpread;
                  const aSpread = isGold ? goldAskSpread   : silverAskSpread;
                  const rawBid  = spot?.bid ?? null;

                  const { count, weight } = parseUnit(item.unit);

                  const sellAed = rawBid == null ? null : calculatePrice({
                    rawBid,
                    bidSpread : bSpread,
                    askSpread : aSpread,
                    offset,
                    premium   : Number(item.sellPremium) || 0,
                    charge    : Number(item.sellCharges) || 0,
                    unitCount : count,
                    unitWeight: weight,
                    purity    : item.purity,
                    type      : "sell",
                  });

                  const buyAed = rawBid == null ? null : calculatePrice({
                    rawBid,
                    bidSpread : bSpread,
                    askSpread : aSpread,
                    offset,
                    premium   : Number(item.buyPremium) || 0,
                    charge    : Number(item.buyCharges) || 0,
                    unitCount : count,
                    unitWeight: weight,
                    purity    : item.purity,
                    type      : "buy",
                  });

                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50 border-0">
                      <TableCell className="font-medium">{item.metal}</TableCell>
                      <TableCell>{item.purity}</TableCell>
                      <TableCell>{item.unit}</TableCell>

                      {/* Sell Price */}
                      <TableCell className="text-right font-medium text-emerald-700">
                        {formatPrice(sellAed)}
                      </TableCell>

                      {/* Buy Price */}
                      <TableCell className="text-right font-medium text-blue-700">
                        {formatPrice(buyAed)}
                      </TableCell>

                      {/* Sell Premium */}
                      <TableCell className="text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            value={item.sellPremium}
                            onChange={(e) =>
                              updateLocalCommodity(item.id, "sellPremium", Number(e.target.value))
                            }
                            className="h-8 w-20 text-right ml-auto"
                          />
                        ) : item.sellPremium}
                      </TableCell>

                      {/* Buy Premium */}
                      <TableCell className="text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            value={item.buyPremium}
                            onChange={(e) =>
                              updateLocalCommodity(item.id, "buyPremium", Number(e.target.value))
                            }
                            className="h-8 w-20 text-right ml-auto"
                          />
                        ) : item.buyPremium}
                      </TableCell>

                      {/* Sell Charges */}
                      <TableCell className="text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            value={item.sellCharges}
                            onChange={(e) =>
                              updateLocalCommodity(item.id, "sellCharges", Number(e.target.value))
                            }
                            className="h-8 w-20 text-right ml-auto"
                          />
                        ) : item.sellCharges}
                      </TableCell>

                      {/* Buy Charges */}
                      <TableCell className="text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            value={item.buyCharges}
                            onChange={(e) =>
                              updateLocalCommodity(item.id, "buyCharges", Number(e.target.value))
                            }
                            className="h-8 w-20 text-right ml-auto"
                          />
                        ) : item.buyCharges}
                      </TableCell>

                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteCommodity(item.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                          title="Delete commodity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DashboardShell>

      {/* ── Add Commodity sidebar ─────────────────────────────────────────── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            aria-hidden
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-white shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-label="Add Commodity"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0">
              <h2 className="text-lg font-semibold text-slate-800">Add Commodity</h2>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-5 min-h-0">
              {/* Metal */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Metal</label>
                <Select
                  value={addForm.metal}
                  onValueChange={(v) => setAddForm((f) => ({ ...f, metal: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[100]">
                    {METAL_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Purity */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Purity</label>
                <Select
                  value={addForm.purity}
                  onValueChange={(v) => setAddForm((f) => ({ ...f, purity: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[100]">
                    {PURITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit count + weight */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium text-slate-700">Unit</label>
                  <Input
                    type="number"
                    min={0.001}
                    step={0.001}
                    value={addForm.unitCount}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, unitCount: Number(e.target.value) || 1 }))
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium text-slate-700">Weight</label>
                  <Select
                    value={addForm.weight}
                    onValueChange={(v) => setAddForm((f) => ({ ...f, weight: v }))}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[100]">
                      {WEIGHT_OPTIONS.map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Premium & Charges */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <span className="text-sm font-medium text-slate-700">Premium &amp; Charges</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Sell Premium (USD)</label>
                    <Input
                      type="number" step={0.01} value={addForm.sellPremium}
                      onChange={(e) => setAddForm((f) => ({ ...f, sellPremium: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Sell Charges (AED)</label>
                    <Input
                      type="number" step={0.01} value={addForm.sellCharges}
                      onChange={(e) => setAddForm((f) => ({ ...f, sellCharges: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Buy Premium (USD)</label>
                    <Input
                      type="number" step={0.01} value={addForm.buyPremium}
                      onChange={(e) => setAddForm((f) => ({ ...f, buyPremium: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Buy Charges (AED)</label>
                    <Input
                      type="number" step={0.01} value={addForm.buyCharges}
                      onChange={(e) => setAddForm((f) => ({ ...f, buyCharges: Number(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>

              {/* Live price preview using the same formula */}
              {(() => {
                const previewSpot   = getSpotForMetal(addForm.metal, goldData, silverData);
                const previewIsGold = isGoldMetal(addForm.metal);
                const previewOffset = previewIsGold ? GOLD_OFFSET : SILVER_OFFSET;
                const previewBSpread = previewIsGold ? goldBidSpread   : silverBidSpread;
                const previewASpread = previewIsGold ? goldAskSpread   : silverAskSpread;
                const previewRawBid  = previewSpot?.bid ?? null;
                const wt = addForm.weight.toLowerCase();

                const previewSellAed = previewRawBid == null ? null : calculatePrice({
                  rawBid: previewRawBid, bidSpread: previewBSpread, askSpread: previewASpread,
                  offset: previewOffset, premium: addForm.sellPremium, charge: addForm.sellCharges,
                  unitCount: addForm.unitCount, unitWeight: wt, purity: addForm.purity, type: "sell",
                });
                const previewBuyAed = previewRawBid == null ? null : calculatePrice({
                  rawBid: previewRawBid, bidSpread: previewBSpread, askSpread: previewASpread,
                  offset: previewOffset, premium: addForm.buyPremium, charge: addForm.buyCharges,
                  unitCount: addForm.unitCount, unitWeight: wt, purity: addForm.purity, type: "buy",
                });
                const previewSellUsd = previewSellAed != null ? previewSellAed / AED_RATE : null;
                const previewBuyUsd  = previewBuyAed  != null ? previewBuyAed  / AED_RATE : null;

                return (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <span className="text-sm font-medium text-slate-700">Live Price Preview</span>
                    <div className="rounded-lg bg-slate-50 p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">AED</span>
                        <span>
                          Buy <strong>{formatPrice(previewBuyAed)}</strong>
                          &nbsp;&nbsp;Sell <strong>{formatPrice(previewSellAed)}</strong>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">USD</span>
                        <span>
                          Buy <strong>{formatPrice(previewBuyUsd)}</strong>
                          &nbsp;&nbsp;Sell <strong>{formatPrice(previewSellUsd)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-5 border-t border-slate-200">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleAddCommoditySubmit}
                disabled={addSubmitting}
              >
                {addSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Add to list
              </Button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
