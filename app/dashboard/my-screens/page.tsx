 "use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Square, Eye, Copy, Check } from "lucide-react";
import Image from "next/image";
import Loader from "@/components/loader/loader";

function ScreenPreviewInner() {
  return (
    <div className="rounded-lg overflow-hidden bg-[#0f1419] text-white w-full aspect-video max-w-2xl mx-auto">
      <div className="p-3 grid grid-cols-2 gap-2">
        <div className="rounded bg-emerald-600/90 px-2 py-1.5">
          <div className="text-[10px] font-semibold text-emerald-100">GOLD</div>
          <div className="text-xs font-bold">1,234.00</div>
          <div className="text-xs font-bold text-red-200">1,234.00</div>
        </div>
        <div className="rounded bg-slate-600/90 px-2 py-1.5">
          <div className="text-[10px] font-semibold text-slate-200">SILVER</div>
          <div className="text-xs font-bold">1,234.00</div>
          <div className="text-xs font-bold text-red-200">1,234.00</div>
        </div>
      </div>
      <div className="text-center py-3">
        <div className="text-amber-400 font-bold text-xl tracking-wide">KESHAV</div>
        <div className="text-[10px] text-white/70 mt-0.5">OCT 26 2323 Monday</div>
      </div>
      <div className="flex justify-center gap-2 pb-2">
        {["🇦🇪", "🇬🇧", "🇺🇸", "🇮🇳"].map((f, i) => (
          <span key={i} className="text-base">
            {f}
          </span>
        ))}
      </div>
      <div className="border-t border-white/10 mx-3 pt-2">
        <div className="grid grid-cols-4 gap-1 text-[10px]">
          <div className="font-semibold text-amber-400/90">COMMODITY</div>
          <div className="font-semibold text-amber-400/90">QTY</div>
          <div className="font-semibold text-amber-400/90">BID</div>
          <div className="font-semibold text-amber-400/90">ASK</div>
          <div className="text-white/90">Tola Bar</div>
          <div className="text-white/90">1</div>
          <div className="text-white/90">5,469</div>
          <div className="text-white/90">5,461</div>
        </div>
      </div>
    </div>
  );
}

const MOCK_SCREENS = [
  {
    id: "1",
    name: "Main Display",
    url: "aurify.ae/keshavbullion",
    status: "active" as const,
  },
];

export default function MyScreensPage() {
  const [screens] = useState(MOCK_SCREENS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const copyUrl = async (url: string, id: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("input");
        input.value = url;
        input.readOnly = true;
        input.style.position = "absolute";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <>
      {loading && <Loader />}
      <div className="h-screen flex">
      <div className="fixed inset-0 -z-10 bg-[#f8fafc]" />
      <div className="fixed inset-0 -z-10 bg-linear-to-br from-slate-50 to-white" />
      <div className="background_image fixed inset-0 -z-1 bg-no-repeat bg-cover">
        <Image src="/images/background.svg" height={1000} width={1000} alt="" />
      </div>
      <Sidebar />
      <div className="flex-1 transition-all duration-300 p-5 overflow-hidden">
        <div className="h-full bg-white rounded-[15px] overflow-hidden flex flex-col shadow-sm">
          <Header />

          <main className="flex-1 p-6 overflow-y-auto">
            <h1 className="text-xl font-semibold text-slate-800 mb-6">My Screens</h1>

            <div className="space-y-8 max-w-3xl">
              {screens.map((screen) => (
                <div
                  key={screen.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Preview card */}
                  <div className="p-6 bg-slate-50">
                    <ScreenPreviewInner />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 p-5 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      EDIT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      STOP
                    </Button>
                    <Button variant="outline" size="sm" className="text-slate-600">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>

                  {/* URL & Status */}
                  <div className="flex flex-wrap items-center gap-3 p-5 pt-0">
                    <div className="flex-1 min-w-[200px] flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-600 shrink-0">URL</span>
                      <Input
                        readOnly
                        value={screen.url}
                        className="flex-1 bg-slate-50 text-slate-800 font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => copyUrl(screen.url, screen.id)}
                        title="Copy URL"
                      >
                        {copiedId === screen.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-500" />
                        )}
                      </Button>
                    </div>
                    <div className="shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${screen.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {screen.status === "active" ? "ACTIVE" : "STOPPED"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {screens.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <p className="mb-4">No screens yet.</p>
                <p className="text-sm">Create one from Configure Screens.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
    </>
  );
}
