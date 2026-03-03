"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Pencil, Square, Eye, Copy, Check, Play } from "lucide-react";
import Image from "next/image";
import Loader from "@/components/loader/loader";
import { useRouter } from "next/navigation";

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
        <div className="text-amber-400 font-bold text-xl tracking-wide">
          KESHAV
        </div>
        <div className="text-[10px] text-white/70 mt-0.5">
          OCT 26 2323 Monday
        </div>
      </div>
    </div>
  );
}

type ScreenType = {
  id: string;
  name: string;
  url: string;
  status: "active" | "inactive";
  templateId: number;
};

const MOCK_SCREENS: ScreenType[] = [
  {
    id: "1",
    name: "Main Display",
    url: "aurify.ae/keshavbullion",
    status: "active",
    templateId: 2,
  },
];

export default function MyScreensPage() {
  const router = useRouter();
  const [screens, setScreens] = useState<ScreenType[]>(MOCK_SCREENS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const toggleStatus = (id: string) => {
    setScreens((prev) =>
      prev.map((screen) =>
        screen.id === id
          ? {
              ...screen,
              status:
                screen.status === "active" ? "inactive" : "active",
            }
          : screen
      )
    );
  };

  const copyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
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
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 to-white" />
        <div className="background_image fixed inset-0 -z-1 bg-no-repeat bg-cover">
          <Image
            src="/images/background.svg"
            height={1000}
            width={1000}
            alt=""
          />
        </div>

        <Sidebar />

        <div className="flex-1 transition-all duration-300 p-5 overflow-hidden">
          <div className="h-full bg-white rounded-[15px] overflow-hidden flex flex-col shadow-sm">
            <Header />

            <main className="flex-1 p-6 overflow-y-auto">
              <h1 className="text-xl font-semibold text-slate-800 mb-6">
                My Screens
              </h1>

              {screens.map((screen) => (
                <div
                  key={screen.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-2 max-w-lg mb-6"
                >
                  {/* Preview */}
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <ScreenPreviewInner />
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-3 p-4">
                    {/* EDIT BUTTON */}
                    <Button
                      onClick={() =>
                        router.push(
                          `/dashboard/configure-screens/editor?templateId=${screen.templateId}`
                        )
                      }
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border-none shadow-none font-bold py-6"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      EDIT
                    </Button>

                    {/* START / STOP BUTTON */}
                    <Button
                      onClick={() => toggleStatus(screen.id)}
                      className={`flex-1 border-none shadow-none font-bold py-6 ${
                        screen.status === "active"
                          ? "bg-red-50 hover:bg-red-100 text-red-500"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      {screen.status === "active" ? (
                        <>
                          <Square className="w-4 h-4 mr-2 fill-current" />
                          STOP
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          START
                        </>
                      )}
                    </Button>

                    {/* VIEW BUTTON */}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-slate-100 p-6"
                    >
                      <Eye className="w-5 h-5 text-slate-400" />
                    </Button>
                  </div>

                  {/* URL + STATUS */}
                  <div className="px-4 pb-4 flex items-center gap-3">
                    <div className="flex flex-1 items-center bg-slate-50 border border-slate-100 rounded-lg px-3 py-1">
                      <span className="text-[10px] font-bold text-slate-400 mr-3">
                        URL
                      </span>
                      <input
                        readOnly
                        value={screen.url}
                        className="bg-transparent text-sm text-slate-600 outline-none w-full font-medium"
                      />
                      <button
                        onClick={() =>
                          copyUrl(screen.url, screen.id)
                        }
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {copiedId === screen.id ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div
                      className={`text-[10px] font-bold px-4 py-3 rounded-lg tracking-wider ${
                        screen.status === "active"
                          ? "bg-emerald-50 text-emerald-500"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {screen.status === "active"
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </div>
                  </div>
                </div>
              ))}

              {screens.length === 0 && (
                <div className="text-center py-16 text-slate-500">
                  <p className="mb-4">No screens yet.</p>
                  <p className="text-sm">
                    Create one from Configure Screens.
                  </p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
