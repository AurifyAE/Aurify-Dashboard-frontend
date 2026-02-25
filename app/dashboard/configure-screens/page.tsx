"use client";

import React, { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Eye, ChevronRight } from "lucide-react";
import Image from "next/image";

const TEMPLATES = [
  {
    id: "1",
    name: "Template 1",
    features: ["Spot Rate (Gold & Silver)", "Max 4 Commodities", "3 Country Clock", "News"],
    maxCommodities: 4,
  },
  {
    id: "2",
    name: "Template 2",
    features: ["Spot Rate (Gold & Silver)", "Max 10 Commodities", "3 Country Clock", "News"],
    maxCommodities: 10,
  },
];

function TemplatePreviewCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-lg overflow-hidden bg-[#0f1419] text-white ${
        compact ? "aspect-video" : "min-h-[280px]"
      }`}
    >
      <div className="p-3 grid grid-cols-2 gap-2">
        <div className="rounded bg-emerald-600/90 px-2 py-1.5">
          <div className="text-[10px] font-semibold text-emerald-100">GOLD</div>
          <div className="text-xs font-bold">BID: 1,234.00</div>
          <div className="text-xs font-bold text-red-200">ASK: 1,234.00</div>
          <div className="text-[10px] text-white/80">LOW 1234.00 · HIGH 1234.00</div>
        </div>
        <div className="rounded bg-slate-600/90 px-2 py-1.5">
          <div className="text-[10px] font-semibold text-slate-200">SILVER</div>
          <div className="text-xs font-bold">BID: 1,234.00</div>
          <div className="text-xs font-bold text-red-200">ASK: 1,234.00</div>
          <div className="text-[10px] text-white/80">LOW 1234.00 · HIGH 1234.00</div>
        </div>
      </div>
      <div className="text-center py-2">
        <div className="text-amber-400 font-bold text-lg tracking-wide">KESHAV AUCTION</div>
        <div className="text-[10px] text-white/70">OCT 26, 2023 Monday</div>
      </div>
      <div className="flex justify-center gap-1 pb-1">
        {["🇦🇪", "🇬🇧", "🇺🇸", "🇮🇳"].map((f, i) => (
          <span key={i} className="text-sm">
            {f}
          </span>
        ))}
      </div>
      <div className="border-t border-white/10 mx-2 pt-1">
        <div className="grid grid-cols-5 gap-0.5 text-[9px]">
          <div className="font-semibold text-amber-400/90">COMMODITY</div>
          <div className="font-semibold text-amber-400/90">UNIT</div>
          <div className="font-semibold text-amber-400/90">BID</div>
          <div className="font-semibold text-amber-400/90 col-span-2">ASK</div>
          <div className="text-white/90">Ten Tola Bar</div>
          <div className="text-white/90">1 TTB</div>
          <div className="text-white/90">5469</div>
          <div className="text-white/90 col-span-2">5461</div>
          <div className="text-white/90">One Kilo Bar</div>
          <div className="text-white/90">1 KG</div>
          <div className="text-white/90">—</div>
          <div className="text-white/90 col-span-2">—</div>
        </div>
      </div>
    </div>
  );
}

export default function ConfigureScreensPage() {
  const [search, setSearch] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);

  const openDetails = (t: (typeof TEMPLATES)[0]) => {
    setSelectedTemplate(t);
    setDetailsOpen(true);
  };

  return (
    <div className="h-screen flex">
      <div className="fixed inset-0 -z-10 bg-[#f8fafc]" />
    
      <div className="background_image fixed inset-0 -z-1 bg-no-repeat bg-cover">
        <Image src="/images/background.svg" height={1000} width={1000} alt="" />
      </div>  <Sidebar />
      <div className="flex-1 transition-all duration-300 p-5 overflow-hidden">
        <div className="h-full bg-white rounded-[15px] overflow-hidden flex flex-col shadow-sm">
          <Header />

          <main className="flex-1 p-6 overflow-y-auto">
            {/* Banner */}
            <div className="relative rounded-xl overflow-hidden bg-linear-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e40af] mb-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 800 400\'%3E%3Cpath fill=\'%23ffffff\' fill-opacity=\'.06\' d=\'M0 200 Q200 100 400 200 T800 200 L800 400 L0 400 Z\'/%3E%3Cpath fill=\'%23ffffff\' fill-opacity=\'.04\' d=\'M0 250 Q300 150 600 250 L800 220 L800 400 L0 400 Z\'/%3E%3C/svg%3E')] bg-cover bg-bottom" />
              <div className="relative px-8 py-10 text-center">
                <h1 className="text-2xl font-bold text-white mb-6">
                  Find the best template for your screen
                </h1>
                <div className="max-w-md mx-auto relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-11 h-12 rounded-lg border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* All Templates */}
            <h2 className="text-lg font-semibold text-slate-800 mb-4">All Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-3">
                    <TemplatePreviewCard compact />
                  </div>
                  <ul className="px-5 pb-3 text-sm text-slate-600 space-y-1">
                    {t.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-amber-500">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="px-5 pb-5">
                    <Button
                      variant="outline"
                      className="w-full bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100"
                      onClick={() => openDetails(t)}
                    >
                      VIEW MORE DETAILS
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Template Details floating sidebar */}
      {detailsOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            aria-hidden
            onClick={() => setDetailsOpen(false)}
          />
          <aside
            className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-slate-50 shadow-2xl z-50 flex flex-col border-l border-slate-200"
            role="dialog"
            aria-label="Template Details"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white shrink-0">
              <h2 className="text-lg font-semibold text-slate-800">Template Details</h2>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-white">
                <TemplatePreviewCard />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Features</h3>
                <ul className="space-y-2">
                  {selectedTemplate?.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-sky-100 text-sky-600">
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-sky-100 text-sky-600">
                      ✓
                    </span>
                    Youtube
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 bg-white">
              <Button className="w-full bg-sky-600 hover:bg-sky-700">
                <Eye className="w-4 h-4 mr-2" />
                Live Preview
              </Button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
