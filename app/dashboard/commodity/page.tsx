"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
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
import { useSpotRate } from "@/context/SpotRateContext";
import {
  fetchCommodities,
  createCommodity,
  updateCommodity,
  deleteCommodity,
  type CommodityRow,
} from "@/lib/api/commodities";

const OUNCE = 31.103;
const AED = 3.674;

const UNIT_MULTIPLIER: Record<string, number> = {
  GM: 1,
  KG: 1000,
  TTB: 116.64,
  TOLA: 11.664,
  OZ: 31.103,
};

const METAL_OPTIONS = ["GOLD", "KILOBAR", "TTBAR", "SILVER"] as const;
const PURITY_OPTIONS = ["99999", "999", "995", "916", "875"] as const;
const WEIGHT_OPTIONS = ["GM", "KG", "TTB", "TOLA", "OZ"] as const;

const purityFactor = (purity: string) => {
  const n = Number(purity);
  if (!Number.isFinite(n) || n <= 0) return 1;
  const digits = String(Math.trunc(Math.abs(n))).length;
  return n / 10 ** digits;
};

const parseUnit = (unit: string): { count: number; weight: string } => {
  const parts = unit.trim().split(/\s+/);
  const count = Number(parts[0]) || 1;
  const weight = (parts[1] || "GM").toUpperCase();
  return { count, weight };
};

const getSpotForMetal = (
  metal: string,
  gold: { bid: number; ask: number } | null,
  silver: { bid: number; ask: number } | null,
) => {
  const lower = metal.toLowerCase();
  if (lower.includes("silver") || lower.includes("xag")) return silver;
  return gold;
};

const formatPrice = (value: number | null) => {
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

const defaultAddForm = {
  metal: "GOLD",
  purity: "999",
  unitCount: 1,
  weight: "GM",
  sellPremium: 0,
  sellCharges: 0,
  buyPremium: 0,
  buyCharges: 0,
};

export default function CommodityPage() {
  const [currency, setCurrency] = useState("UNITED ARAB EMIRATES DIRHAM");
  const [editMode, setEditMode] = useState(false);
  const { goldData, silverData } = useSpotRate();

  const [commodities, setCommodities] = useState<CommodityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addForm, setAddForm] = useState<{
    metal: string;
    purity: string;
    unitCount: number;
    weight: string;
    sellPremium: number;
    sellCharges: number;
    buyPremium: number;
    buyCharges: number;
  }>(defaultAddForm);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [saveAllLoading, setSaveAllLoading] = useState(false);

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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommodities();
  }, [loadCommodities]);

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
          buyPremium: item.buyPremium,
          sellPremium: item.sellPremium,
          sellCharges: item.sellCharges,
          buyCharges: item.buyCharges,
        });
      }
      setEditMode(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      void swal.error(msg);
    } finally {
      setSaveAllLoading(false);
    }
  };

  const handleAddCommoditySubmit = async () => {
    const unit = `${addForm.unitCount} ${addForm.weight}`;
    const payload = {
      metal: addForm.metal,
      purity: addForm.purity,
      unit,
      buyPremium: addForm.buyPremium,
      sellPremium: addForm.sellPremium,
      sellCharges: addForm.sellCharges,
      buyCharges: addForm.buyCharges,
    };
    const tempId = `temp-${Date.now()}`;
    const optimistic: CommodityRow = {
      id: tempId,
      ...payload,
    };
    setCommodities((prev) => [optimistic, ...prev]);
    setAddForm(defaultAddForm);
    setSidebarOpen(false);
    setAddSubmitting(true);
    try {
      const created = await createCommodity(payload);
      setCommodities((prev) =>
        prev.map((c) => (c.id === tempId ? created : c)),
      );
    } catch (e) {
      setCommodities((prev) => prev.filter((c) => c.id !== tempId));
      const msg = e instanceof Error ? e.message : "Failed to add commodity";
      void swal.error(msg);
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleDeleteCommodity = async (id: string) => {
    const result = await swal.confirm({
      title: "Remove commodity?",
      text: "This will remove the commodity from the list.",
      confirmText: "Yes, remove",
      confirmColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteCommodity(id);
      setCommodities((prev) => prev.filter((c) => c.id !== id));
      void swal.success("Removed");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete";
      void swal.error(msg);
    }
  };

  const goldGmUsd = goldData ? goldData.ask / OUNCE : null;
  const silverGmUsd = silverData ? silverData.ask / OUNCE : null;
  const goldGmAed = goldGmUsd != null ? goldGmUsd * AED : null;
  const silverGmAed = silverGmUsd != null ? silverGmUsd * AED : null;

  return (
    <div className="h-screen flex">
      <div className="fixed inset-0 -z-10 bg-linear-to-br from-slate-50 to-white" />
      <div className="background_image fixed inset-0 -z-1 bg-no-repeat bg-cover">
        <Image src="/images/background.svg" height={1000} width={1000} alt="" />
      </div>
      <Sidebar />
      <div className="flex-1 transition-all duration-300 p-5 overflow-hidden">
        <div className="h-full bg-white rounded-[15px] overflow-hidden flex flex-col">
          <Header />

          <main className="flex-1 p-6 overflow-y-auto">
            <div className="flex mb-8 flex-col justify-between gap-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-[220px] flex items-center gap-3">
                  <label className="text-sm text-slate-600 h-auto block">Currency</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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

              <div className="flex gap-8 w-full">
                <div className="grid grid-cols-2 overflow-hidden shadow-lg bg-white rounded-xl border border-slate-200 px-6 py-3 gap-3 flex-1">
                  <p className="text-[24px] relative z-1 font-semibold text-[#C9A44C]">GOLD 1 GM</p>
                  <div className="grid grid-cols-2 gap-4 text-sm align-middle">
                    <div className="flex flex-col align-center text-center justify-center">
                      <div className="text-slate-600">USD</div>
                      <div className="text-xl font-bold">{goldGmUsd == null ? "—" : goldGmUsd.toFixed(2)}</div>
                    </div>
                    <div className="flex flex-col align-center text-center justify-center">
                      <div className="text-md text-slate-600">AED</div>
                      <div className="text-xl font-bold">{goldGmAed == null ? "—" : goldGmAed.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 overflow-hidden shadow-lg bg-white rounded-xl border border-slate-200 px-6 py-3 gap-3 flex-1">
                  <p className="text-[24px] relative z-1 font-semibold text-[#8C8E8F]">SILVER 1 GM</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col align-center text-center justify-center">
                      <div className="text-slate-600">USD</div>
                      <div className="text-xl font-bold">{silverGmUsd == null ? "—" : silverGmUsd.toFixed(2)}</div>
                    </div>
                    <div className="flex flex-col align-center text-center justify-center">
                      <div className="text-slate-600">AED</div>
                      <div className="text-xl font-bold">{silverGmAed == null ? "—" : silverGmAed.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center justify-between p-5">
                <h2 className="text-lg font-semibold text-slate-800">Commodity Rates (AED)</h2>
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
                        {saveAllLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : commodities.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-slate-500 mb-4">No commodities yet. Add your first one to get started.</p>
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
                      <TableHead className="text-right">Buy Premium</TableHead>
                      <TableHead className="text-right">Sell Premium</TableHead>
                      <TableHead className="text-right">Sell Charges</TableHead>
                      <TableHead className="text-right">Buy Charges</TableHead>
                      <TableHead className="w-20 text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commodities.map((item) => {
                      const spot = getSpotForMetal(item.metal, goldData, silverData);
                      const { count, weight } = parseUnit(item.unit);
                      const mult = UNIT_MULTIPLIER[weight] || 1;
                      const pur = purityFactor(item.purity);
                      const baseBid = spot ? (spot.bid / OUNCE) * AED * mult * count * pur : null;
                      const baseAsk = spot ? (spot.ask / OUNCE) * AED * mult * count * pur : null;
                      const buyAed = baseBid == null ? null : baseBid + (Number(item.buyCharges) || 0) + (Number(item.buyPremium) || 0);
                      const sellAed = baseAsk == null ? null : baseAsk + (Number(item.sellCharges) || 0) + (Number(item.sellPremium) || 0);

                      return (
                        <TableRow key={item.id} className="hover:bg-slate-50 border-0">
                          <TableCell className="font-medium">{item.metal}</TableCell>
                          <TableCell>{item.purity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right font-medium">{formatPrice(sellAed)}</TableCell>
                          <TableCell className="text-right font-medium">{formatPrice(buyAed)}</TableCell>
                          <TableCell className="text-right">
                            {editMode ? (
                              <Input
                                type="number"
                                value={item.buyPremium}
                                onChange={(e) => updateLocalCommodity(item.id, "buyPremium", Number(e.target.value))}
                                className="h-8 w-20 text-right ml-auto"
                              />
                            ) : (
                              item.buyPremium
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editMode ? (
                              <Input
                                type="number"
                                value={item.sellPremium}
                                onChange={(e) => updateLocalCommodity(item.id, "sellPremium", Number(e.target.value))}
                                className="h-8 w-20 text-right ml-auto"
                              />
                            ) : (
                              item.sellPremium
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editMode ? (
                              <Input
                                type="number"
                                value={item.sellCharges}
                                onChange={(e) => updateLocalCommodity(item.id, "sellCharges", Number(e.target.value))}
                                className="h-8 w-20 text-right ml-auto"
                              />
                            ) : (
                              item.sellCharges
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editMode ? (
                              <Input
                                type="number"
                                value={item.buyCharges}
                                onChange={(e) => updateLocalCommodity(item.id, "buyCharges", Number(e.target.value))}
                                className="h-8 w-20 text-right ml-auto"
                              />
                            ) : (
                              item.buyCharges
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDeleteCommodity(item.id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded"
                                title="Delete commodity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Floating Add Commodity sidebar — overlay + panel */}
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Metal</label>
                <Select value={addForm.metal} onValueChange={(v) => setAddForm((f) => ({ ...f, metal: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[100]">
                    {METAL_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Purity</label>
                <Select value={addForm.purity} onValueChange={(v) => setAddForm((f) => ({ ...f, purity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[100]">
                    {PURITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium text-slate-700">Unit</label>
                  <Input
                    type="number"
                    min={0.001}
                    step={0.001}
                    value={addForm.unitCount}
                    onChange={(e) => setAddForm((f) => ({ ...f, unitCount: Number(e.target.value) || 1 }))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium text-slate-700">Weight</label>
                  <Select value={addForm.weight} onValueChange={(v) => setAddForm((f) => ({ ...f, weight: v }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[100]">
                      {WEIGHT_OPTIONS.map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <span className="text-sm font-medium text-slate-700">Premium & Charges</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Sell Premium (USD)</label>
                    <Input
                      type="number"
                      step={0.01}
                      value={addForm.sellPremium}
                      onChange={(e) => setAddForm((f) => ({ ...f, sellPremium: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Sell Charges (AED)</label>
                    <Input
                      type="number"
                      step={0.01}
                      value={addForm.sellCharges}
                      onChange={(e) => setAddForm((f) => ({ ...f, sellCharges: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Buy Premium (USD)</label>
                    <Input
                      type="number"
                      step={0.01}
                      value={addForm.buyPremium}
                      onChange={(e) => setAddForm((f) => ({ ...f, buyPremium: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Buy Charges (AED)</label>
                    <Input
                      type="number"
                      step={0.01}
                      value={addForm.buyCharges}
                      onChange={(e) => setAddForm((f) => ({ ...f, buyCharges: Number(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>
              {(() => {
                const spot = getSpotForMetal(addForm.metal, goldData, silverData);
                const mult = UNIT_MULTIPLIER[addForm.weight] || 1;
                const pur = purityFactor(addForm.purity);
                const baseBid = spot ? (spot.bid / OUNCE) * AED * mult * addForm.unitCount * pur : null;
                const baseAsk = spot ? (spot.ask / OUNCE) * AED * mult * addForm.unitCount * pur : null;
                const buyAed = baseBid != null ? baseBid + addForm.buyCharges + addForm.buyPremium : null;
                const sellAed = baseAsk != null ? baseAsk + addForm.sellCharges + addForm.sellPremium : null;
                const buyUsd = baseBid != null ? baseBid / AED : null;
                const sellUsd = baseAsk != null ? baseAsk / AED : null;
                return (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <span className="text-sm font-medium text-slate-700">Live Price</span>
                    <div className="rounded-lg bg-slate-50 p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">AED</span>
                        <span>Buy {formatPrice(buyAed)} &nbsp; Sell {formatPrice(sellAed)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">USD</span>
                        <span>Buy {formatPrice(buyUsd)} &nbsp; Sell {formatPrice(sellUsd)}</span>
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
    </div>
  );
}
