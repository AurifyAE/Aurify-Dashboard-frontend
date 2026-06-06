"use client";

import React, { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { marketplaceApi, type MerchantNews } from "@/lib/api/marketplace";
import { Save } from "lucide-react";

const TYPES = ["Market News", "Promotions", "Offers", "Announcements", "Events"];
const PLACEMENTS = ["Top Ticker", "Bottom Ticker", "Popup", "Slider"];

export default function NewsManagementPage() {
  const [items, setItems] = useState<MerchantNews[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "Announcements",
    priority: 1,
    active: true,
    placement: "Bottom Ticker",
    startDate: "",
    endDate: "",
  });

  const load = () => marketplaceApi.news().then(setItems).catch((err) => setMessage(err.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await marketplaceApi.saveNews(form);
      setForm({ title: "", content: "", type: "Announcements", priority: 1, active: true, placement: "Bottom Ticker", startDate: "", endDate: "" });
      await load();
      setMessage("News saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <DashboardShell>
            <h1 className="text-2xl font-semibold text-slate-900">News Management</h1>
            <p className="mt-1 text-sm text-slate-600">Control ticker news, promotions, announcements, events and placements per merchant.</p>
            {message && <div className="my-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">{message}</div>}
            <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
              <section className="rounded-lg border border-slate-200 p-5">
                <h2 className="mb-4 font-semibold text-slate-900">Create news</h2>
                <div className="grid gap-4">
                  <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  <Textarea placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                  <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((type) => <option key={type}>{type}</option>)}
                  </select>
                  <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
                    {PLACEMENTS.map((placement) => <option key={placement}>{placement}</option>)}
                  </select>
                  <Input type="number" min="1" placeholder="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                    <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <Checkbox checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: Boolean(v) })} />
                    Active
                  </label>
                  <Button onClick={save} className="bg-sky-600 hover:bg-sky-700">
                    <Save className="mr-2 h-4 w-4" />
                    Save News
                  </Button>
                </div>
              </section>
              <section className="rounded-lg border border-slate-200 p-5">
                <h2 className="mb-4 font-semibold text-slate-900">Ticker queue</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <article key={item._id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{item.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">{item.content}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{item.placement}</span>
                      </div>
                      <div className="mt-3 text-xs text-slate-500">{item.type} · Priority {item.priority} · {item.active ? "Active" : "Inactive"}</div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
    </DashboardShell>
  );
}
