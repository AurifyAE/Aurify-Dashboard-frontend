"use client";

import React, { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { marketplaceApi, type MerchantCommodity } from "@/lib/api/marketplace";
import { Save } from "lucide-react";

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

const calculatePreview = (spot: number, weight: number, charge: number) => {
  const purityFactor = 0.999;
  return ((spot / 31.1035) * 3.674 * weight * purityFactor + charge).toFixed(2);
};

export default function MerchantCommoditiesPage() {
  const [items, setItems] = useState<MerchantCommodity[]>([]);
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");

  const load = () => marketplaceApi.commodities().then(setItems).catch((err) => setMessage(err.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await marketplaceApi.saveCommodity(form);
      setForm(initial);
      await load();
      setMessage("Commodity saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <DashboardShell>
            <h1 className="text-2xl font-semibold text-slate-900">Commodity Builder</h1>
            <p className="mt-1 text-sm text-slate-600">Create merchant products while keeping Aurify spot-rate calculations as the source of truth.</p>
            {message && <div className="my-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">{message}</div>}
            <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
              <section className="rounded-lg border border-slate-200 p-5">
                <h2 className="mb-4 font-semibold text-slate-900">Create commodity</h2>
                <div className="grid gap-4">
                  <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Metal" value={form.metal} onChange={(e) => setForm({ ...form, metal: e.target.value })} />
                    <Input placeholder="Purity" value={form.purity} onChange={(e) => setForm({ ...form, purity: e.target.value })} />
                    <Input type="number" placeholder="Weight" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} />
                    <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                    <Input type="number" placeholder="Buy premium" value={form.buyPremium} onChange={(e) => setForm({ ...form, buyPremium: Number(e.target.value) })} />
                    <Input type="number" placeholder="Sell premium" value={form.sellPremium} onChange={(e) => setForm({ ...form, sellPremium: Number(e.target.value) })} />
                    <Input type="number" placeholder="Buy charge" value={form.buyCharge} onChange={(e) => setForm({ ...form, buyCharge: Number(e.target.value) })} />
                    <Input type="number" placeholder="Sell charge" value={form.sellCharge} onChange={(e) => setForm({ ...form, sellCharge: Number(e.target.value) })} />
                  </div>
                  <Input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <Checkbox checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: Boolean(v) })} />
                    Active
                  </label>
                  <div className="rounded-lg bg-slate-950 p-4 text-white">
                    <div className="text-xs text-slate-400">Live preview using sample bid/ask</div>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                      <div>BUY {calculatePreview(2300 + form.buyPremium, form.weight, form.buyCharge)}</div>
                      <div>SELL {calculatePreview(2305 + form.sellPremium, form.weight, form.sellCharge)}</div>
                    </div>
                  </div>
                  <Button onClick={save} className="bg-sky-600 hover:bg-sky-700">
                    <Save className="mr-2 h-4 w-4" />
                    Save Commodity
                  </Button>
                </div>
              </section>
              <section className="rounded-lg border border-slate-200 p-5">
                <h2 className="mb-4 font-semibold text-slate-900">Merchant commodities</h2>
                <div className="grid gap-3">
                  {items.map((item) => (
                    <article key={item._id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{item.name}</h3>
                          <p className="text-sm text-slate-600">{item.metal} · {item.purity} · {item.weight} {item.unit}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{item.active ? "Active" : "Inactive"}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
                        <div>Buy charge: {item.buyCharge}</div>
                        <div>Sell charge: {item.sellCharge}</div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
    </DashboardShell>
  );
}
