"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Monitor,
  Wifi,
  Activity,
  CreditCard,
  Bell,
  ShieldCheck,
  Plus,
  Tv,
  User,
  Headphones,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Users,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpotRate } from "@/context/SpotRateContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface HistoryPoint {
  time: string;
  price: number;
  timestamp?: number;
}

const DashboardData = () => {
  const { goldData, silverData, isConnected } = useSpotRate();
  const [mounted, setMounted] = useState(false);
  const [activeMetal, setActiveMetal] = useState<"gold" | "silver">("gold");
  const [activeInterval, setActiveInterval] = useState<"Live" | "1H" | "24H" | "7D">("Live");

  // Keep a live price buffer (last 20 ticks) for smooth scrolling line
  const [goldTicks, setGoldTicks] = useState<HistoryPoint[]>([]);
  const [silverTicks, setSilverTicks] = useState<HistoryPoint[]>([]);

  // Baselines to calculate percentage variations during the live session
  const [goldBaseline, setGoldBaseline] = useState<number | null>(null);
  const [silverBaseline, setSilverBaseline] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Capture Gold socket ticks (exactly 1-minute intervals)
  useEffect(() => {
    if (goldData?.bid) {
      const price = parseFloat(goldData.bid.toString());
      if (goldBaseline === null) {
        setGoldBaseline(price * 0.9985); // start baseline slightly lower for positive initial visual trend
      }

      const now = Date.now();
      const oneMinuteMs = 60000; // 60 seconds

      setGoldTicks((prev) => {
        // Pre-populate 15 minutes of historical points if empty
        if (prev.length === 0) {
          return Array.from({ length: 15 }).map((_, i) => {
            const time = new Date(now - (15 - i) * oneMinuteMs);
            const factor = 1 + Math.sin(i * 0.6) * 0.0004;
            return {
              time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              price: parseFloat((price * factor).toFixed(2)),
              timestamp: now - (15 - i) * oneMinuteMs,
            };
          });
        }

        const last = prev[prev.length - 1];
        const elapsed = now - (last.timestamp || 0);

        if (elapsed >= oneMinuteMs) {
          const timeStr = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const next = [...prev, {
            time: timeStr,
            price,
            timestamp: now,
          }];
          return next.slice(-20);
        } else {
          // Update the current active minute's price value to the latest live tick
          const updatedLast = {
            ...last,
            price,
          };
          return [...prev.slice(0, -1), updatedLast];
        }
      });
    }
  }, [goldData?.bid, goldBaseline]);

  // Capture Silver socket ticks (exactly 1-minute intervals)
  useEffect(() => {
    if (silverData?.bid) {
      const price = parseFloat(silverData.bid.toString());
      if (silverBaseline === null) {
        setSilverBaseline(price * 0.9975);
      }

      const now = Date.now();
      const oneMinuteMs = 60000; // 60 seconds

      setSilverTicks((prev) => {
        // Pre-populate
        if (prev.length === 0) {
          return Array.from({ length: 15 }).map((_, i) => {
            const time = new Date(now - (15 - i) * oneMinuteMs);
            const factor = 1 + Math.sin(i * 0.6) * 0.001;
            return {
              time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              price: parseFloat((price * factor).toFixed(3)),
              timestamp: now - (15 - i) * oneMinuteMs,
            };
          });
        }

        const last = prev[prev.length - 1];
        const elapsed = now - (last.timestamp || 0);

        if (elapsed >= oneMinuteMs) {
          const timeStr = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const next = [...prev, {
            time: timeStr,
            price,
            timestamp: now,
          }];
          return next.slice(-20);
        } else {
          const updatedLast = {
            ...last,
            price,
          };
          return [...prev.slice(0, -1), updatedLast];
        }
      });
    }
  }, [silverData?.bid, silverBaseline]);

  // Generate clean, natural mock history based on the active spot price
  const getHistoricalData = (basePrice: number, interval: string) => {
    const count = interval === "7D" ? 7 : 15;
    return Array.from({ length: count }).map((_, i) => {
      const wave = Math.sin(i * 0.6) * 0.001;
      const noise = (Math.cos(i * 1.5) + (Math.random() - 0.5) * 0.4) * 0.0005;
      const price = basePrice * (1 + wave + noise);
      
      let timeLabel = "";
      const now = new Date();
      if (interval === "1H") {
        const t = new Date(now.getTime() - (count - i) * 5 * 60000);
        timeLabel = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } else if (interval === "24H") {
        const t = new Date(now.getTime() - (count - i) * 60 * 60000);
        timeLabel = `${t.getHours()}:00`;
      } else {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const t = new Date(now.getTime() - (count - i) * 24 * 60 * 60000);
        timeLabel = days[t.getDay()];
      }

      return {
        time: timeLabel,
        price: parseFloat(price.toFixed(2)),
      };
    });
  };

  const goldPrice = goldData?.displayBid ?? "—";
  const silverPrice = silverData?.displayBid ?? "—";
  const goldPriceNum = goldData?.bid ? parseFloat(goldData.bid.toString()) : 2350;
  const silverPriceNum = silverData?.bid ? parseFloat(silverData.bid.toString()) : 29;

  // Selected chart dataset
  const chartData = useMemo(() => {
    const isGold = activeMetal === "gold";
    const base = isGold ? goldPriceNum : silverPriceNum;
    const ticks = isGold ? goldTicks : silverTicks;

    if (activeInterval === "Live") {
      // Fallback placeholder during initial connection buffer
      if (ticks.length === 0) {
        return Array.from({ length: 12 }).map((_, i) => ({
          time: `${i * 3}s`,
          price: base + (Math.sin(i * 0.8) * (base * 0.0003)),
        }));
      }
      return ticks;
    }
    return getHistoricalData(base, activeInterval);
  }, [activeMetal, activeInterval, goldTicks, silverTicks, goldPriceNum, silverPriceNum]);

  // Calculate live percentage differences
  const goldPct = useMemo(() => {
    if (!goldPriceNum || !goldBaseline) return 0.22;
    const pct = ((goldPriceNum - goldBaseline) / goldBaseline) * 100;
    return parseFloat(pct.toFixed(2));
  }, [goldPriceNum, goldBaseline]);

  const silverPct = useMemo(() => {
    if (!silverPriceNum || !silverBaseline) return -0.15;
    const pct = ((silverPriceNum - silverBaseline) / silverBaseline) * 100;
    return parseFloat(pct.toFixed(2));
  }, [silverPriceNum, silverBaseline]);

  // Devices & Sync counts
  const devicePieData = [
    { name: "Online", value: 3, color: "#38BDF8" },
    { name: "Offline", value: 1, color: "#EF4444" },
  ];

  // Country rate calculator
  const countryRates = useMemo(() => {
    const uae = (goldPriceNum / 31.1035) * 3.674;
    const india = (goldPriceNum / 31.1035) * 83.95;
    const saudi = (goldPriceNum / 31.1035) * 3.75;
    return [
      { name: "India", display: `${india.toLocaleString(undefined, { maximumFractionDigits: 0 })} INR`, pct: 100, flag: "🇮🇳" },
      { name: "UAE", display: `${uae.toLocaleString(undefined, { maximumFractionDigits: 1 })} AED`, pct: 85, flag: "🇦🇪" },
      { name: "Saudi Arabia", display: `${saudi.toLocaleString(undefined, { maximumFractionDigits: 1 })} SAR`, pct: 80, flag: "🇸🇦" },
    ];
  }, [goldPriceNum]);

  // Color theme definitions for active metal (glowing lines & custom gradients)
  const chartColor = activeMetal === "gold" ? "#C9A44C" : "#8C8E8F";

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Gold card */}
        <Card className="border border-slate-100/80 shadow-sm bg-white rounded-2xl relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#C9A44C]" />
          <CardContent className="p-5 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              <span>Gold Spot Rate</span>
              <span className={cn(
                "flex items-center font-bold text-[11px]",
                goldPct >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {goldPct >= 0 ? <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> : <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />}
                {goldPct >= 0 ? `+${goldPct}` : goldPct}%
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{goldPrice}</h3>
              <span className="text-[10px] font-bold text-slate-400">USD / oz</span>
            </div>
            {/* Minimalist sparkline */}
            <div className="h-8 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={goldTicks.slice(-8)}>
                  <Area type="monotone" dataKey="price" stroke="#C9A44C" strokeWidth={1.5} fillOpacity={0.03} fill="#C9A44C" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Silver card */}
        <Card className="border border-slate-100/80 shadow-sm bg-white rounded-2xl relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#8C8E8F]" />
          <CardContent className="p-5 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              <span>Silver Spot Rate</span>
              <span className={cn(
                "flex items-center font-bold text-[11px]",
                silverPct >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {silverPct >= 0 ? <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> : <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />}
                {silverPct >= 0 ? `+${silverPct}` : silverPct}%
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{silverPrice}</h3>
              <span className="text-[10px] font-bold text-slate-400">USD / oz</span>
            </div>
            {/* Minimalist sparkline */}
            <div className="h-8 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={silverTicks.slice(-8)}>
                  <Area type="monotone" dataKey="price" stroke="#8C8E8F" strokeWidth={1.5} fillOpacity={0.03} fill="#8C8E8F" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* TV Status Donut Card */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl transition-all duration-300 hover:shadow-md">
          <CardContent className="p-5 flex items-center justify-between h-full">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">TV Devices</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">3 / 4</h3>
              <span className="text-[10px] font-medium text-slate-400 block">Screens Online</span>
            </div>
            <div className="w-16 h-16 relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={devicePieData} cx="50%" cy="50%" innerRadius={18} outerRadius={26} dataKey="value">
                    {devicePieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700">75%</div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Slots Card */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl transition-all duration-300 hover:shadow-md">
          <CardContent className="p-5 flex items-center justify-between h-full">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">License Allocation</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">30%</h3>
              <span className="text-[10px] font-medium text-slate-400 block">3 of 10 Slots Used</span>
            </div>
            <div className="w-14 h-14 relative flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" stroke="#F1F5F9" strokeWidth="3" fill="none" />
                <circle cx="18" cy="18" r="14" stroke="#38BDF8" strokeWidth="3" strokeDasharray="88" strokeDashoffset="61.6" strokeLinecap="round" fill="none" />
              </svg>
              <div className="absolute text-[10px] font-black text-slate-700">3/10</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Elegant Main Graph Card */}
      <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="px-6 py-4.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-[#4067B1] h-4.5 w-4.5" />
              <h3 className="font-bold text-slate-800 text-[14px]">Spot Rate Analytics</h3>
              <span className={cn(
                "text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
                isConnected ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
              )}>
                <span className={cn("w-1 h-1 rounded-full", isConnected ? "bg-emerald-500 animate-ping" : "bg-rose-500")} />
                {isConnected ? "LIVE FEED" : "DISCONNECTED"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-time dynamic exchange rate updates</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Metal toggle */}
            <div className="flex bg-slate-200/50 p-0.5 rounded-xl text-xs font-bold border border-slate-200/30">
              <button onClick={() => setActiveMetal("gold")} className={cn("px-3.5 py-1.5 rounded-lg transition-all cursor-pointer", activeMetal === "gold" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Gold</button>
              <button onClick={() => setActiveMetal("silver")} className={cn("px-3.5 py-1.5 rounded-lg transition-all cursor-pointer", activeMetal === "silver" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Silver</button>
            </div>
            {/* Interval Filter */}
            <div className="flex bg-slate-200/50 p-0.5 rounded-xl text-xs font-bold border border-slate-200/30">
              {(["Live", "1H", "24H", "7D"] as const).map((v) => (
                <button key={v} onClick={() => setActiveInterval(v)} className={cn("px-3 py-1.5 rounded-lg transition-all cursor-pointer", activeInterval === v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>{v}</button>
              ))}
            </div>
          </div>
        </div>

        <CardContent className="p-6 bg-gradient-to-b from-white to-slate-50/30">
          <div className="mb-4.5 flex justify-between items-baseline">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Bullion Value</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-slate-800 tracking-tight">
                  {activeMetal === "gold" ? goldPrice : silverPrice}
                </span>
                <span className="text-xs font-bold text-slate-400">USD / oz</span>
                <span className={cn(
                  "text-xs font-black px-1.5 py-0.5 rounded-md flex items-center ml-1.5",
                  (activeMetal === "gold" ? goldPct : silverPct) >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                )}>
                  {(activeMetal === "gold" ? goldPct : silverPct) >= 0 ? "+" : ""}
                  {activeMetal === "gold" ? goldPct : silverPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Glowing dynamic Area Chart */}
          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -15, right: 5, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: "bold" }} />
                <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: "bold" }} />
                
                {/* Custom Glassmorphism Tooltip */}
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/90 backdrop-blur-md px-3.5 py-2.5 border border-white/20 rounded-xl shadow-lg shadow-slate-100 flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{payload[0].payload.time}</span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-sm font-black text-slate-800">${payload[0].value}</span>
                            <span className="text-[9px] font-bold text-slate-400">USD</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#glowGradient)"
                  isAnimationActive={true}
                  animationDuration={600}
                  activeDot={{
                    r: 5,
                    stroke: "white",
                    strokeWidth: 2,
                    fill: chartColor,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grid for Bottom Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Country Rates Bar */}
        <Card className="border border-slate-100/80 shadow-sm bg-white rounded-2xl p-5 space-y-4 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-1.5 text-slate-800">
            <Globe className="text-[#4067B1] h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Country Rates</span>
          </div>
          <div className="space-y-3">
            {countryRates.map((c, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1"><span>{c.flag}</span>{c.name}</span>
                  <span className="font-extrabold text-slate-800">{c.display}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sky-400 to-[#4067B1] transition-all" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Total Merchants growth */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-1.5 text-slate-800">
            <Users className="text-[#38BDF8] h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Merchants</span>
          </div>
          <div className="flex justify-between items-end mt-4">
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-slate-800 leading-none">42</h3>
              <span className="text-[10px] font-bold text-emerald-600 block">+2 registered this month</span>
            </div>
            <div className="flex gap-1 h-8 items-end">
              {[8, 12, 18, 22, 28, 32, 42].map((v, i) => (
                <div key={i} className="w-2.5 bg-sky-100 hover:bg-[#38BDF8] rounded-t-sm transition-all" style={{ height: `${(v / 42) * 100}%` }} title={`${v} Merchants`} />
              ))}
            </div>
          </div>
        </Card>

        {/* Recent Activity Mini List */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl p-5 space-y-4 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-1.5 text-slate-800">
            <Clock className="text-[#4067B1] h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Recent Activity</span>
          </div>
          <div className="space-y-3.5 pl-1">
            {[
              { title: "Boardroom TV connected", time: "09:10 AM" },
              { title: "Spot rate threshold passed", time: "09:08 AM" },
              { title: "Branch profile updated", time: "08:45 AM" },
            ].map((act, i) => (
              <div key={i} className="flex gap-3 relative group">
                {/* indicator */}
                <div className="w-1.5 h-1.5 rounded-full bg-[#4067B1] mt-1.5 flex-shrink-0" />
                <div className="flex-1 flex justify-between text-xs font-medium">
                  <span className="text-slate-700 truncate mr-2">{act.title}</span>
                  <span className="text-slate-400 text-[10px] font-normal flex-shrink-0">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* News Bulletins list */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Latest News</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            "Gold trends upward as global central banks signal interest rate relief",
            "Silver experiences massive retail demand in Asian physical markets",
            "Precious metals surge amidst new clean energy manufacturing quotas",
          ].map((title, i) => (
            <Card key={i} className="border border-slate-100 shadow-sm bg-white rounded-2xl hover:border-[#4067B1] transition-all p-4.5 group cursor-pointer">
              <CardContent className="p-0 flex flex-col justify-between h-20 text-xs">
                <p className="font-bold text-slate-700 leading-relaxed group-hover:text-[#4067B1] transition-colors line-clamp-3">{title}</p>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-50 mt-1">
                  <span>Bulletin Feed</span>
                  <span>10m ago</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardData;
