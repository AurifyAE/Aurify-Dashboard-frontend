"use client";

import React, { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import Image from "next/image";
import { Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  useSpotRate,
  MetalLiveData,
  SpreadSettings,
} from "@/context/SpotRateContext";

// ─── Inner page — consumes SpotRateContext ─────────────────────────────────────
function SpotRateContent() {
  const {
    goldData,
    silverData,
    isConnected,
    spreadSettings,
    updateSpreadSettings,
  } = useSpotRate();
  const [isEditMode, setIsEditMode] = useState(false);

  // ── Spread change helpers ─────────────────────────────────────────────────
  const handleSpreadChange = (
    metal: "gold" | "silver",
    type: "bid" | "ask",
    value: number,
  ) => {
    const key =
      `${metal}${type === "bid" ? "Bid" : "Ask"}Spread` as keyof SpreadSettings;
    updateSpreadSettings({ [key]: value });
  };

  // ── Fallback placeholders ─────────────────────────────────────────────────
  const placeholder = (v: string | number | undefined, fallback = "—") =>
    v !== undefined && v !== null && v !== 0 ? String(v) : fallback;

  // ── TradingCard component ─────────────────────────────────────────────────
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
        <div className="p-5 border-1 mb-6 rounded-xl border-slate-100">
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
              className="bg-blue-400 text-white rounded-md px-3 py-1.5 text-sm cursor-pointer"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditMode(false)}
              className="bg-red-500 text-white rounded-md px-3 py-1.5 text-sm cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* BID Section */}
        <div className="rounded-lg mb-3 border-1 border-gray-200 overflow-hidden">
          <div className="flex bg-blue-50 p-2.5 items-center justify-center relative">
            <span className="text-[22px] font-bold text-slate-700">BID</span>
            {!isEditMode && (
              <Edit2
                onClick={() => setIsEditMode(true)}
                className="w-4 h-4 absolute right-2.5 top-2.5 text-blue-500 cursor-pointer"
              />
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="border-r-1 p-4 border-gray-200">
              <p className="text-sm text-slate-500 font-bold mb-1">BID</p>
              <p className="text-xl font-bold text-slate-900">
                {placeholder(data?.displayBid)}
              </p>
            </div>
            <div className="border-r-1 p-4 border-gray-200 text-center">
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
              <p className="text-sm text-slate-500 mb-1">BIDING PRICE</p>
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
        <div className="rounded-lg mb-3 border-1 border-gray-200 overflow-hidden">
          <div className="flex bg-blue-50 p-2.5 items-center justify-center relative">
            <span className="text-[22px] font-bold text-slate-700">ASK</span>
            {!isEditMode && (
              <Edit2
                onClick={() => setIsEditMode(true)}
                className="w-4 h-4 absolute right-2.5 top-2.5 text-blue-500 cursor-pointer"
              />
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="border-r-1 p-4 border-gray-200">
              <p className="text-sm text-slate-500 font-bold mb-1">ASK</p>
              <p className="text-xl font-bold text-slate-900">
                {placeholder(data?.displayAsk)}
              </p>
            </div>
            <div className="border-r-1 p-4 border-gray-200 text-center">
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
        <div className="rounded-lg mb-3 border-1 border-gray-200 overflow-hidden">
          <div className="flex bg-blue-50 p-2.5 items-center justify-center relative">
            <span className="text-[22px] font-bold text-slate-700">
              LOW &amp; HIGH VALUE
            </span>
          </div>
          <div>
            <div className="grid grid-cols-2 gap-4 border-b-1 border-gray-200">
              <div className="border-r-1 p-4 border-gray-200">
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
              <div className="border-r-1 p-4 border-gray-200">
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
    <div className="h-screen flex">
      <div className="background_image fixed inset-0 -z-1 bg-no-repeat bg-cover">
        <Image
          src={"/images/background.svg"}
          height={1000}
          width={1000}
          alt=""
        />
      </div>
      <Sidebar />
      <div className="flex-1 transition-all duration-300 p-5 overflow-hidden">
        <div className="h-full bg-white rounded-[15px] overflow-hidden flex flex-col">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto scrollbar-none">
            {/* Trading Cards Grid */}
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
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Page — SpotRateProvider is now in the root layout ──────────────────────
export default function SpotRatePage() {
  return <SpotRateContent />;
}
