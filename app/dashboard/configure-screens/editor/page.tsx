"use client";
import React, {
  Suspense,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Upload,
  Check,
  ChevronDown,
  Bell,
  Cog,
  Palette,
  Building2,
  Newspaper,
  Youtube,
  Globe,
  BarChart2,
  Image as ImageIcon,
  Layers,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import Image from "next/image";

// ─── Font Definitions ──────────────────────────────────────────────────────────
interface FontOption {
  name: string;
  family: string;
  googleFamily: string;
  category: string;
  preview?: string;
}

const FONT_OPTIONS: FontOption[] = [
  { name: "Inter", family: "'Inter', sans-serif", googleFamily: "Inter:wght@400;600;700", category: "Sans-Serif" },
  { name: "Roboto", family: "'Roboto', sans-serif", googleFamily: "Roboto:wght@400;700", category: "Sans-Serif" },
  { name: "Montserrat", family: "'Montserrat', sans-serif", googleFamily: "Montserrat:wght@400;600;700;800", category: "Sans-Serif" },
  { name: "Poppins", family: "'Poppins', sans-serif", googleFamily: "Poppins:wght@400;600;700", category: "Sans-Serif" },
  { name: "DM Sans", family: "'DM Sans', sans-serif", googleFamily: "DM+Sans:wght@400;500;700", category: "Sans-Serif" },
  { name: "Nunito", family: "'Nunito', sans-serif", googleFamily: "Nunito:wght@400;600;700;800", category: "Sans-Serif" },
  { name: "Lato", family: "'Lato', sans-serif", googleFamily: "Lato:wght@400;700;900", category: "Sans-Serif" },
  { name: "Rajdhani", family: "'Rajdhani', sans-serif", googleFamily: "Rajdhani:wght@400;600;700", category: "Display" },
  { name: "Oswald", family: "'Oswald', sans-serif", googleFamily: "Oswald:wght@400;500;600;700", category: "Display" },
  { name: "Bebas Neue", family: "'Bebas Neue', sans-serif", googleFamily: "Bebas+Neue", category: "Display", preview: "GOLD BULLION" },
  { name: "Exo 2", family: "'Exo 2', sans-serif", googleFamily: "Exo+2:wght@400;600;700;800", category: "Display" },
  { name: "Playfair Display", family: "'Playfair Display', serif", googleFamily: "Playfair+Display:wght@400;700;800", category: "Serif" },
  { name: "Merriweather", family: "'Merriweather', serif", googleFamily: "Merriweather:wght@400;700;900", category: "Serif" },
  { name: "Space Mono", family: "'Space Mono', monospace", googleFamily: "Space+Mono:wght@400;700", category: "Monospace", preview: "54,671.00" },
  { name: "Roboto Mono", family: "'Roboto Mono', monospace", googleFamily: "Roboto+Mono:wght@400;600;700", category: "Monospace", preview: "54,671.00" },
  { name: "Cinzel", family: "'Cinzel', serif", googleFamily: "Cinzel:wght@400;700;900", category: "Luxury", preview: "GOLD BULLION" },
];

const FONT_CATEGORIES = ["All", "Sans-Serif", "Display", "Serif", "Monospace", "Luxury"];

// ─── World Clocks Data ────────────────────────────────────────────────────────
interface ClockCity {
  id: string;
  label: string;
  country: string;
  code: string;      // ISO 3166-1 alpha-2 for flagcdn.com
  timezone: string;
}

const WORLD_CLOCKS: ClockCity[] = [
  { id: "uae", label: "UAE", country: "United Arab Emirates", code: "ae", timezone: "Asia/Dubai" },
  { id: "london", label: "UK", country: "United Kingdom", code: "gb", timezone: "Europe/London" },
  { id: "newyork", label: "USA", country: "United States", code: "us", timezone: "America/New_York" },
  { id: "tokyo", label: "Japan", country: "Japan", code: "jp", timezone: "Asia/Tokyo" },
  { id: "singapore", label: "Singapore", country: "Singapore", code: "sg", timezone: "Asia/Singapore" },
  { id: "sydney", label: "Australia", country: "Australia", code: "au", timezone: "Australia/Sydney" },
  { id: "hongkong", label: "Hong Kong", country: "Hong Kong", code: "hk", timezone: "Asia/Hong_Kong" },
  { id: "zurich", label: "Switzerland", country: "Switzerland", code: "ch", timezone: "Europe/Zurich" },
  { id: "moscow", label: "Russia", country: "Russia", code: "ru", timezone: "Europe/Moscow" },
  { id: "paris", label: "France", country: "France", code: "fr", timezone: "Europe/Paris" },
  { id: "toronto", label: "Canada", country: "Canada", code: "ca", timezone: "America/Toronto" },
  { id: "mumbai", label: "India", country: "India", code: "in", timezone: "Asia/Kolkata" },
  { id: "riyadh", label: "Saudi Arabia", country: "Saudi Arabia", code: "sa", timezone: "Asia/Riyadh" },
  { id: "beijing", label: "China", country: "China", code: "cn", timezone: "Asia/Shanghai" },
  { id: "frankfurt", label: "Germany", country: "Germany", code: "de", timezone: "Europe/Berlin" },
];

function getClockTime(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: true,
    }).format(new Date());
  } catch {
    return "--:--";
  }
}

function useClockTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
}

function useLoadGoogleFonts(fonts: FontOption[]) {
  useEffect(() => {
    const families = fonts.map((f) => f.googleFamily).join("&family=");
    const href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, []);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface CommodityRow {
  id: string;
  label: string;
  unit: string;
  bid: string;
  ask: string;
  enabled: boolean;
}

interface TemplateConfig {
  bgColor: string;
  textColor: string;
  font: string;
  companyName: string;
  companyTagline: string;
  companyNameColor: string;
  taglineColor: string;
  logoUrl: string | null;
  showCompanyName: boolean;
  companyDescription: string;
  showCompanyDescription: boolean;
  spotCardBg: string;
  spotCardBorder: string;
  spotMetalLabelColor: string;
  spotBidColor: string;
  spotAskBg: string;
  spotAskColor: string;
  spotLowColor: string;
  spotHighColor: string;
  headerBgColor: string;
  headerTextColor: string;
  tableBgColor: string;
  commodityNameColor: string;
  askValueColor: string;
  bidValueColor: string;
  clockBg: string;
  clockTimeColor: string;
  clockCities: string[];
  showClockFlag: boolean;
  newsTickerBg: string;
  newsTickerText: string;
  showGold: boolean;
  showSilver: boolean;
  showClocks: boolean;
  newsHeadline: string;
  newsDescription: string;
  youtubeUrl: string;
  showAskPrice: boolean;
  showBidPrice: boolean;
  commodities: CommodityRow[];
  bgType: "color" | "image";
  bgImageUrl: string | null;
  bgImageSize: "cover" | "contain" | "repeat";
}

const DEFAULT_COMMODITIES: CommodityRow[] = [
  { id: "ttbar999", label: "TTBAR 999", unit: "1 TTB", bid: "54,671", ask: "54,671", enabled: true },
  { id: "kilobar995", label: "KILOBAR 995", unit: "1 KG", bid: "54,671", ask: "54,671", enabled: true },
  { id: "gold995", label: "GOLD 995", unit: "1 GM", bid: "54,671", ask: "54,671", enabled: true },
  { id: "gold9999", label: "GOLD 9999", unit: "1 GM", bid: "54,671", ask: "54,671", enabled: true },
  { id: "silver999", label: "SILVER 999", unit: "1 KG", bid: "54,671", ask: "54,671", enabled: false },
  { id: "platinum", label: "PLATINUM", unit: "1 GM", bid: "54,671", ask: "54,671", enabled: false },
];

const DEFAULT_CONFIG: TemplateConfig = {
  bgColor: "#0f1419",
  textColor: "#ffffff",
  font: "'Inter', sans-serif",
  companyName: "KESHAV BULLION",
  companyTagline: "THE GOLD TRADING L.L.C",
  companyNameColor: "#d4a017",
  taglineColor: "#ffffff",
  logoUrl: null,
  showCompanyName: true,
  companyDescription: "",
  showCompanyDescription: true,
  spotCardBg: "rgba(255,255,255,0.05)",
  spotCardBorder: "#d4a01733",
  spotMetalLabelColor: "#d4a017",
  spotBidColor: "#ffffff",
  spotAskBg: "#dc2626",
  spotAskColor: "#ffffff",
  spotLowColor: "#ef4444",
  spotHighColor: "#22c55e",
  headerBgColor: "#1a2332",
  headerTextColor: "#d4a017",
  tableBgColor: "#111820",
  commodityNameColor: "#e2e8f0",
  askValueColor: "#d4a017",
  bidValueColor: "#4ade80",
  clockBg: "#1a2332",
  clockTimeColor: "#d4a017",
  clockCities: ["uae", "london", "newyork", "mumbai"],
  showClockFlag: true,
  newsTickerBg: "#d4a017",
  newsTickerText: "#000000",
  showGold: true,
  showSilver: true,
  showClocks: true,
  newsHeadline: "",
  newsDescription: "",
  youtubeUrl: "",
  showAskPrice: true,
  showBidPrice: true,
  commodities: DEFAULT_COMMODITIES,
  bgType: "color",
  bgImageUrl: null,
  bgImageSize: "cover",
};

// ─── Template Preview ─────────────────────────────────────────────────────────
function TemplatePreview({ config, scale }: { config: TemplateConfig; scale: number }) {
  useClockTick();
  const activeCommodities = config.commodities.filter((c) => c.enabled);
  return (
    <div style={{
      width: 900, height: 560,
      transform: `scale(${scale})`, transformOrigin: "top left",
      background: config.bgType === "image" && config.bgImageUrl
        ? undefined
        : config.bgColor,
      backgroundImage: config.bgType === "image" && config.bgImageUrl
        ? `url(${config.bgImageUrl})`
        : undefined,
      backgroundSize: config.bgType === "image" && config.bgImageUrl
        ? config.bgImageSize === "repeat" ? "auto" : config.bgImageSize
        : undefined,
      backgroundRepeat: config.bgType === "image" && config.bgImageUrl
        ? config.bgImageSize === "repeat" ? "repeat" : "no-repeat"
        : undefined,
      backgroundPosition: "center",
      color: config.textColor,
      fontFamily: config.font, position: "relative",
      overflow: "hidden", padding: "20px 24px", boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {config.showGold && <SpotCard metal="GOLD" icon="🥇" bid="1,234.00" ask="1,234.00" low="4601.19" high="4601.19" config={config} flex={1} />}
        {config.showSilver && <SpotCard metal="SILVER" icon="🥈" bid="1,234.00" ask="1,234.00" low="4611.41" high="4601.19" config={config} flex={1} />}
      </div>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        {config.logoUrl ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <img src={config.logoUrl} alt="logo" style={{ height: 48, maxWidth: 160, objectFit: "contain" }} />
            {config.showCompanyName && config.companyName && (
              <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: 3, color: config.companyNameColor, textTransform: "uppercase" }}>
                {config.companyName}
              </span>
            )}
          </div>
        ) : (
          config.showCompanyName && (
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 3, color: config.companyNameColor, textTransform: "uppercase" }}>
              {config.companyName || "YOUR COMPANY"}
            </div>
          )
        )}
      </div>
      {config.companyTagline && (
        <div style={{ textAlign: "center", fontSize: 11, letterSpacing: 2, color: config.taglineColor, opacity: 0.85, marginBottom: 4 }}>
          {config.companyTagline}
        </div>
      )}
      {config.showCompanyDescription && config.companyDescription && (
        <div style={{ textAlign: "center", fontSize: 11, color: config.textColor, opacity: 0.55, marginBottom: 10, padding: "0 40px" }}>
          {config.companyDescription}
        </div>
      )}

      {/* ── World Clocks in Preview — flag PNG images from flagcdn ── */}
      {config.showClocks && config.clockCities.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          {WORLD_CLOCKS.filter((c) => config.clockCities.includes(c.id)).map((c) => (
            <div key={c.id} style={{
              textAlign: "center", background: config.clockBg, borderRadius: 8,
              padding: "6px 12px", minWidth: 68,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            }}>
              {config.showClockFlag && (
                <img
                  src={`https://flagcdn.com/32x24/${c.code}.png`}
                  width={28} height={21} alt={c.label}
                  style={{ borderRadius: 3, objectFit: "cover", display: "block" }}
                />
              )}
              <div style={{ fontSize: 9, letterSpacing: 1, color: config.textColor, opacity: 0.6 }}>{c.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: config.clockTimeColor }}>{getClockTime(c.timezone)}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", fontSize: 11, color: config.textColor, opacity: 0.45, marginBottom: 12, letterSpacing: 1 }}>
        OCT 26, 2023 · Monday
      </div>
      {activeCommodities.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", background: config.tableBgColor, borderRadius: 8, overflow: "hidden", fontSize: 13 }}>
          <thead>
            <tr style={{ background: config.headerBgColor }}>
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: config.headerTextColor }}>COMMODITY</th>
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: config.headerTextColor }}>UNIT</th>
              {config.showAskPrice && <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: config.headerTextColor }}>ASK ($)</th>}
              {config.showBidPrice && <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: config.headerTextColor }}>BID ($)</th>}
            </tr>
          </thead>
          <tbody>
            {activeCommodities.map((row, idx) => (
              <tr key={row.id} style={{ background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.03)" }}>
                <td style={{ padding: "7px 12px", color: config.commodityNameColor }}>{row.label}</td>
                <td style={{ padding: "7px 12px", color: config.commodityNameColor }}>{row.unit}</td>
                {config.showAskPrice && <td style={{ padding: "7px 12px", color: config.askValueColor, fontWeight: 600 }}>{row.ask}</td>}
                {config.showBidPrice && <td style={{ padding: "7px 12px", color: config.bidValueColor, fontWeight: 600 }}>{row.bid}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {(config.newsHeadline || config.newsDescription) && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: config.newsTickerBg, color: config.newsTickerText, padding: "5px 16px", fontSize: 11, fontWeight: 600 }}>
          {config.newsHeadline && <span style={{ marginRight: 6 }}>{config.newsHeadline}:</span>}
          {config.newsDescription}
        </div>
      )}
    </div>
  );
}



function SpotCard({ metal, icon, bid, ask, low, high, config, flex: flexVal }: {
  metal: string; icon: string; bid: string; ask: string; low: string; high: string; config: TemplateConfig; flex?: number;
}) {
  return (
    <div style={{ 
      background: config.spotCardBg || '#111', 
      borderRadius: 12, 
      padding: "16px", 
      border: `1px solid ${config.spotCardBorder || "rgba(255,255,255,0.06)"}`, 
      flex: flexVal ?? "1", 
      minWidth: 0,
    }}>
      {/* Header: Clean & Compact */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            
            {/* ── Inline Metal SVG Icons ── */}
            {metal.toLowerCase() === 'gold' ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="10" fill="url(#goldGrad)" stroke="#a16207" strokeWidth="0.6"/>
                <circle cx="11" cy="11" r="7.5" fill="url(#goldShine)" opacity="0.4"/>
                <ellipse cx="8.5" cy="8" rx="3" ry="1.6" fill="rgba(255,255,255,0.3)" transform="rotate(-35 8.5 8)"/>
                <text x="11" y="15" textAnchor="middle" fontSize="7.5" fontWeight="900" fontFamily="Georgia, serif" fill="#78350f" letterSpacing="0.3">Au</text>
                <defs>
                  <radialGradient id="goldGrad" cx="35%" cy="28%" r="72%" gradientUnits="objectBoundingBox">
                    <stop offset="0%" stopColor="#fef08a"/>
                    <stop offset="35%" stopColor="#facc15"/>
                    <stop offset="70%" stopColor="#d97706"/>
                    <stop offset="100%" stopColor="#92400e"/>
                  </radialGradient>
                  <radialGradient id="goldShine" cx="40%" cy="35%" r="60%" gradientUnits="objectBoundingBox">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9"/>
                    <stop offset="100%" stopColor="#facc15" stopOpacity="0"/>
                  </radialGradient>
                </defs>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="10" fill="url(#silverGrad)" stroke="#6b7280" strokeWidth="0.6"/>
                <circle cx="11" cy="11" r="7.5" fill="url(#silverShine)" opacity="0.4"/>
                <ellipse cx="8.5" cy="8" rx="3" ry="1.6" fill="rgba(255,255,255,0.35)" transform="rotate(-35 8.5 8)"/>
                <text x="11" y="15" textAnchor="middle" fontSize="7.5" fontWeight="900" fontFamily="Georgia, serif" fill="#1f2937" letterSpacing="0.3">Ag</text>
                <defs>
                  <radialGradient id="silverGrad" cx="35%" cy="28%" r="72%" gradientUnits="objectBoundingBox">
                    <stop offset="0%" stopColor="#f8fafc"/>
                    <stop offset="35%" stopColor="#cbd5e1"/>
                    <stop offset="70%" stopColor="#94a3b8"/>
                    <stop offset="100%" stopColor="#475569"/>
                  </radialGradient>
                  <radialGradient id="silverShine" cx="40%" cy="35%" r="60%" gradientUnits="objectBoundingBox">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9"/>
                    <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0"/>
                  </radialGradient>
                </defs>
              </svg>
            )}

          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>{metal}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>USD / OZ</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#10b981' }} />
          LIVE
        </div>
      </div>

      {/* Pricing: High Contrast Typography */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>BID</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>{bid}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            L: <span style={{ color: '#fff' }}>{low}</span>
          </div>
        </div>
        
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>ASK</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>{ask}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            H: <span style={{ color: '#fff' }}>{high}</span>
          </div>
        </div>
      </div>
    </div>
  );
}








// ─── Font Picker ──────────────────────────────────────────────────────────────
function FontPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedFont = FONT_OPTIONS.find((f) => f.family === value) ?? FONT_OPTIONS[0];
  const filtered = FONT_OPTIONS.filter((f) => {
    const matchCat = category === "All" || f.category === category;
    return matchCat && f.name.toLowerCase().includes(search.toLowerCase());
  });

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 360;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= dropdownHeight
        ? rect.bottom + 4
        : rect.top - dropdownHeight - 4;
      setDropdownPos({
        top,
        left: rect.right - 280, // align right edge
        width: Math.max(280, rect.width),
      });
    }
    setOpen((o) => !o);
  };

  // Close on scroll to keep position in sync
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={triggerRef}
        onClick={handleOpen}
        style={{
          width: "100%", height: 34, padding: "0 10px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#ffffff", border: `1px solid ${open ? "#3b82f6" : "#d1d5db"}`,
          borderRadius: 6, cursor: "pointer", color: "#374151",
          fontFamily: selectedFont.family, fontSize: 13,
          transition: "border-color 0.15s",
        }}
      >
        <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{selectedFont.name}</span>
        <ChevronDown style={{
          width: 14, height: 14, color: "#9ca3af", flexShrink: 0, marginLeft: 8,
          transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s",
        }} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <>
          {/* Backdrop */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            onClick={() => { setOpen(false); setSearch(""); }}
          />
          {/* Dropdown panel — rendered at body level, no overflow clipping */}
          <div style={{
            position: "fixed",
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
            zIndex: 9999,
            overflow: "hidden",
          }}>
            {/* Search */}
            <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ position: "relative" }}>
                <svg viewBox="0 0 20 20" fill="none" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#9ca3af", pointerEvents: "none" }}>
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Search fonts…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%", height: 32, paddingLeft: 28, paddingRight: 10,
                    boxSizing: "border-box", background: "#f9fafb",
                    border: "1px solid #e5e7eb", borderRadius: 6,
                    color: "#374151", fontSize: 12, outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Category pills */}
            <div style={{ display: "flex", gap: 4, padding: "8px 10px", overflowX: "auto", borderBottom: "1px solid #f3f4f6" }}>
              {FONT_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  flexShrink: 0, padding: "3px 8px",
                  background: category === cat ? "#3b82f6" : "#f3f4f6",
                  color: category === cat ? "#fff" : "#6b7280",
                  border: "none", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.12s",
                }}>{cat}</button>
              ))}
            </div>

            {/* Font list */}
            <div style={{ overflowY: "auto", maxHeight: 260 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", fontSize: 12, color: "#9ca3af" }}>No fonts match "{search}"</div>
              ) : filtered.map((font) => (
                <button key={font.name} onClick={() => { onChange(font.family); setOpen(false); setSearch(""); }}
                  style={{
                    width: "100%", padding: "9px 12px", boxSizing: "border-box",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: font.family === value ? "rgba(59,130,246,0.07)" : "transparent",
                    border: "none", borderBottom: "1px solid #f9fafb", cursor: "pointer", textAlign: "left",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (font.family !== value) (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = font.family === value ? "rgba(59,130,246,0.07)" : "transparent"; }}
                >
                  <div>
                    <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{font.category}</div>
                    <div style={{ fontFamily: font.family, fontSize: 15, color: "#111827" }}>{font.preview ?? font.name}</div>
                    {!font.preview && <div style={{ fontFamily: font.family, fontSize: 10, color: "#9ca3af" }}>Aa Bb 123</div>}
                  </div>
                  {font.family === value && (
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check style={{ width: 10, height: 10, color: "#fff" }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ─── Color Row ──────────────────────────────────────────────────────────────
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 5, background: value, border: "1.5px solid #d1d5db", cursor: "pointer", overflow: "hidden", position: "relative", flexShrink: 0 }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
            style={{ position: "absolute", inset: "-4px", opacity: 0, cursor: "pointer", width: "150%", height: "150%" }}
          />
        </div>
        <span style={{ fontSize: 12, color: "#6b7280", fontFamily: "monospace", background: "#f9fafb", padding: "3px 8px", borderRadius: 5, border: "1px solid #e5e7eb", minWidth: 66, textAlign: "center" }}>
          {value.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

// ─── Light Input ──────────────────────────────────────────────────────────────
function LightInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 8, padding: "0 16px" }}>
      {label && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", height: 34, padding: "0 10px", boxSizing: "border-box", background: "#ffffff", border: `1px solid ${focused ? "#3b82f6" : "#e5e7eb"}`, borderRadius: 6, color: "#374151", fontSize: 13, outline: "none", fontFamily: "inherit" }}
      />
    </div>
  );
}

function LightTextarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 8, padding: "0 16px" }}>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "8px 10px", boxSizing: "border-box", background: "#ffffff", border: `1px solid ${focused ? "#3b82f6" : "#e5e7eb"}`, borderRadius: 6, color: "#374151", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.5 }}
      />
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width: 42, height: 24, borderRadius: 12,
      background: checked ? "#3b82f6" : "#d1d5db",
      border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: checked ? 21 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

// ─── Check Row ────────────────────────────────────────────────────────────────
function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 14, color: "#111827", fontWeight: 500 }}>{label}</span>
      <div onClick={() => onChange(!checked)} style={{
        width: 20, height: 20, borderRadius: 4, cursor: "pointer",
        background: checked ? "#3b82f6" : "#ffffff",
        border: `2px solid ${checked ? "#3b82f6" : "#d1d5db"}`,
        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0,
      }}>
        {checked && <Check style={{ width: 12, height: 12, color: "#fff" }} />}
      </div>
    </div>
  );
}

// ─── Logo Upload Zone ─────────────────────────────────────────────────────────
function LogoZone({ logoUrl, onClick }: { logoUrl: string | null; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        border: `1.5px dashed ${hovered ? "#3b82f6" : "#d1d5db"}`, borderRadius: 8,
        padding: logoUrl ? "12px" : "22px 12px", textAlign: "center", cursor: "pointer",
        background: hovered ? "#eff6ff" : "#f9fafb", transition: "all 0.15s", margin: "0 16px",
      }}>
      {logoUrl ? (
        <img src={logoUrl} alt="logo" style={{ height: 36, objectFit: "contain", margin: "0 auto" }} />
      ) : (
        <>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", border: "1px solid #e5e7eb" }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}>
              <path d="M4 4a2 2 0 012-2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M14 2v6h6" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="12" y1="18" x2="12" y2="11" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M9.5 13.5L12 11l2.5 2.5" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>Drag and drop file, or click to select file</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>Accepted : PNG, SVG · Max : 5MB</div>
        </>
      )}
    </div>
  );
}

// ─── Background Image Zone ────────────────────────────────────────────────────
function BgImageZone({ imageUrl, onUpload, onClear }: {
  imageUrl: string | null;
  onUpload: (url: string) => void;
  onClear: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpload(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ margin: "0 0 10px" }}>
      {imageUrl ? (
        <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1.5px solid #e5e7eb" }}>
          <img src={imageUrl} alt="bg" style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
          <div style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: hovered ? 1 : 0, transition: "opacity 0.2s",
          }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
          >
            <button onClick={() => inputRef.current?.click()} style={{
              background: "#ffffff", border: "none", borderRadius: 6,
              padding: "5px 10px", fontSize: 11, fontWeight: 600, color: "#374151", cursor: "pointer",
            }}>Replace</button>
            <button onClick={onClear} style={{
              background: "#ef4444", border: "none", borderRadius: 6,
              padding: "5px 10px", fontSize: 11, fontWeight: 600, color: "#fff", cursor: "pointer",
            }}>Remove</button>
          </div>
          {!hovered && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            }}
              onMouseEnter={() => setHovered(true)}
            />
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
          style={{
            border: `1.5px dashed ${hovered ? "#3b82f6" : "#d1d5db"}`, borderRadius: 8,
            padding: "18px 12px", textAlign: "center", cursor: "pointer",
            background: hovered ? "#eff6ff" : "#f9fafb", transition: "all 0.15s",
          }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 7px", border: "1px solid #e5e7eb" }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 20, height: 20 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#9ca3af" strokeWidth="1.5" />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="#9ca3af" strokeWidth="1.5" />
              <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>Click to upload background image</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>JPG, PNG, WebP · Max 5MB</div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

// ─── Clock Search ─────────────────────────────────────────────────────────────
function ClockSearch({ clockCities, onUpdate }: {
  clockCities: string[];
  onUpdate: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [inputFocused, setInputFocused] = useState(false);

  const filtered = WORLD_CLOCKS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.country.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ padding: "10px 12px 8px" }}>
      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <svg viewBox="0 0 20 20" fill="none"
          style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#9ca3af", pointerEvents: "none" }}>
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search country or city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          style={{
            width: "100%", height: 34, paddingLeft: 30, paddingRight: query ? 32 : 10,
            boxSizing: "border-box", background: "#f9fafb",
            border: `1px solid ${inputFocused ? "#3b82f6" : "#e5e7eb"}`,
            borderRadius: 8, color: "#374151", fontSize: 12,
            outline: "none", fontFamily: "inherit",
          }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            background: "#e5e7eb", border: "none", borderRadius: "50%",
            width: 18, height: 18, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", padding: 0,
          }}>
            <svg viewBox="0 0 12 12" fill="none" style={{ width: 8, height: 8 }}>
              <path d="M1 1l10 10M11 1L1 11" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Selected chips */}
      {clockCities.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10, padding: "6px 8px", background: "#f8faff", borderRadius: 8, border: "1px solid #e0eaff" }}>
          {WORLD_CLOCKS.filter((c) => clockCities.includes(c.id)).map((city) => (
            <div key={city.id} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "3px 6px 3px 6px", borderRadius: 20,
              background: "#dbeafe", border: "1.5px solid #93c5fd",
            }}>
              <img
                src={`https://flagcdn.com/24x18/${city.code}.png`}
                width={16} height={12} alt={city.label}
                style={{ borderRadius: 2, objectFit: "cover", display: "block", flexShrink: 0 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#1d4ed8" }}>{city.label}</span>
              <button onClick={() => onUpdate(clockCities.filter((id) => id !== city.id))}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "#93c5fd", marginLeft: 1 }}>
                <svg viewBox="0 0 12 12" fill="none" style={{ width: 10, height: 10 }}>
                  <path d="M1 1l10 10M11 1L1 11" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filtered list */}
      <div style={{ maxHeight: 210, overflowY: "auto", borderRadius: 8, border: "1px solid #e5e7eb", background: "#ffffff" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "14px 12px", textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
            No results for "{query}"
          </div>
        ) : (
          filtered.map((city, idx) => {
            const enabled = clockCities.includes(city.id);
            return (
              <div
                key={city.id}
                onClick={() => onUpdate(enabled ? clockCities.filter((id) => id !== city.id) : [...clockCities, city.id])}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 10px", cursor: "pointer",
                  borderBottom: idx < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                  background: enabled ? "rgba(59,130,246,0.06)" : "transparent",
                  transition: "background 0.1s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img
                    src={`https://flagcdn.com/24x18/${city.code}.png`}
                    width={24} height={18} alt={city.label}
                    style={{ borderRadius: 3, objectFit: "cover", display: "block", flexShrink: 0 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: enabled ? "#1d4ed8" : "#111827" }}>{city.label}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{city.country}</div>
                  </div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  background: enabled ? "#3b82f6" : "#ffffff",
                  border: `2px solid ${enabled ? "#3b82f6" : "#d1d5db"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {enabled && (
                    <svg viewBox="0 0 12 12" fill="none" style={{ width: 8, height: 8 }}>
                      <path d="M1.5 6l3 3 6-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Panel Section (collapsible) ──────────────────────────────────────────────
function PanelSection({ title, icon, children, defaultOpen = false, accent }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid #e5e7eb" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 16px", background: open ? "#f8faff" : "#ffffff",
        border: "none", cursor: "pointer", transition: "background 0.15s", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && (
            <div style={{
              width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
              background: open ? (accent ?? "#3b82f6") : "#f3f4f6",
              color: open ? "#fff" : "#9ca3af", transition: "all 0.15s",
            }}>
              {icon}
            </div>
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{title}</span>
        </div>
        <ChevronDown style={{
          width: 14, height: 14, color: "#9ca3af",
          transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s",
        }} />
      </button>
      {open && <div style={{ borderTop: "1px solid #f3f4f6", paddingBottom: 4 }}>{children}</div>}
    </div>
  );
}

// ─── Color Accordion ──────────────────────────────────────────────────────────
function ColorAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ margin: "4px 12px 4px", borderRadius: 8, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      <button onClick={() => setOpen((o) => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 12px", background: open ? "#f0f4ff" : "#f9fafb",
        border: "none", cursor: "pointer", borderBottom: open ? "1px solid #e5e7eb" : "none", transition: "background 0.15s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: "linear-gradient(135deg, #f87171, #60a5fa, #34d399)", flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: open ? "#3b82f6" : "#6b7280" }}>{title}</span>
        </div>
        <ChevronDown style={{ width: 12, height: 12, color: open ? "#3b82f6" : "#9ca3af", transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
      </button>
      {open && <div style={{ padding: "10px 12px 6px", background: "#ffffff" }}>{children}</div>}
    </div>
  );
}

type RightTab = "content" | "design";

// ─── Main Editor ──────────────────────────────────────────────────────────────
function TemplateEditorInner() {
  const router = useRouter();

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [zoom, setZoom] = useState(0.75);
  const [published, setPublished] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("content");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom((z) => Math.min(1.2, Math.max(0.3, Math.round((z + delta) * 100) / 100)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useLoadGoogleFonts(FONT_OPTIONS);

  const update = useCallback(<K extends keyof TemplateConfig>(key: K, value: TemplateConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleCommodity = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      commodities: prev.commodities.map((c) => c.id === id ? { ...c, enabled: !c.enabled } : c),
    }));
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update("logoUrl", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePublish = () => {
    setPublished(true);
    setTimeout(() => setPublished(false), 2500);
  };

  const canvasW = 900 * zoom;
  const canvasH = 560 * zoom;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "#f3f4f6", fontFamily: "'Inter', sans-serif", overflow: "hidden", color: "#111827",
    }}>

      {/* ─── Top Nav ─── */}
      <div style={{
        height: 56, flexShrink: 0, background: "#ffffff", borderBottom: "1px solid #e5e7eb",
        display: "flex", alignItems: "center", padding: "0 20px 0 0", gap: 12,
      }}>
        <button onClick={() => router.push("/dashboard/configure-screens")} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "transparent", border: "none", color: "#6b7280", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "5px 8px 5px 0",
        }}>
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Customize Template
        </button>

      </div>

      {/* ─── Body ─── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ═══ CANVAS ═══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div ref={canvasRef} style={{
            flex: 1, overflow: "auto",
            background: "#e8eaed",
            backgroundImage: "radial-gradient(circle, #c8ccd4 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}>
            {/* ── Floating Zoom Controls ── */}
            <div style={{
              position: "sticky", top: 16, zIndex: 10,
              display: "flex", justifyContent: "center", pointerEvents: "none",
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 2,
                background: "rgba(255,255,255,0.92)", border: "1px solid #e5e7eb",
                borderRadius: 10, padding: "4px 8px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
                backdropFilter: "blur(8px)", pointerEvents: "auto",
              }}>
                <button
                  onClick={() => setZoom((z) => Math.max(0.3, parseFloat((z - 0.1).toFixed(2))))}
                  disabled={zoom <= 0.3}
                  title="Zoom out"
                  style={{
                    width: 30, height: 30, borderRadius: 6, background: "transparent", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: zoom <= 0.3 ? "not-allowed" : "pointer",
                    color: zoom <= 0.3 ? "#d1d5db" : "#374151",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (zoom > 0.3) (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <ZoomOut style={{ width: 15, height: 15 }} />
                </button>

                <div style={{ width: 1, height: 18, background: "#e5e7eb", margin: "0 2px" }} />

                <span style={{ fontSize: 12, color: "#374151", fontWeight: 700, minWidth: 38, textAlign: "center", userSelect: "none" }}>
                  {Math.round(zoom * 100)}%
                </span>

                <div style={{ width: 1, height: 18, background: "#e5e7eb", margin: "0 2px" }} />

                <button
                  onClick={() => setZoom((z) => Math.min(1.2, parseFloat((z + 0.1).toFixed(2))))}
                  disabled={zoom >= 1.2}
                  title="Zoom in"
                  style={{
                    width: 30, height: 30, borderRadius: 6, background: "transparent", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: zoom >= 1.2 ? "not-allowed" : "pointer",
                    color: zoom >= 1.2 ? "#d1d5db" : "#374151",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (zoom < 1.2) (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <ZoomIn style={{ width: 15, height: 15 }} />
                </button>

                <div style={{ width: 1, height: 18, background: "#e5e7eb", margin: "0 2px" }} />

                <button
                  onClick={() => setZoom(1)}
                  title="Reset zoom"
                  style={{
                    width: 30, height: 30, borderRadius: 6, background: "transparent", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#374151", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <Maximize2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            <div style={{
              minWidth: canvasW + 80, minHeight: canvasH + 80,
              display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 40,
            }}>
              <div style={{
                width: canvasW, height: canvasH, position: "relative",
                boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
                borderRadius: 6, overflow: "hidden",
              }}>
                <TemplatePreview config={config} scale={zoom} />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        <aside style={{
          width: 300, flexShrink: 0,
          height: "100%",
          overflow: "auto",
          background: "#ffffff", borderLeft: "1px solid #e5e7eb",
          display: "flex", flexDirection: "column",
        }}>

          {/* Publish Button */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
            <button onClick={handlePublish} style={{
              width: "100%", height: 40,
              background: published ? "linear-gradient(135deg, #059669, #10b981)" : "#3b82f6",
              border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s",
            }}>
              {published ? <><Check style={{ width: 15, height: 15 }} />Published!</> : "Publish"}
            </button>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
            {([
              { key: "content", label: "Content", icon: <Layers style={{ width: 13, height: 13 }} /> },
              { key: "design", label: "Design", icon: <Palette style={{ width: 13, height: 13 }} /> },
            ] as { key: RightTab; label: string; icon: React.ReactNode }[]).map(tab => (
              <button key={tab.key} onClick={() => setRightTab(tab.key)} style={{
                flex: 1, height: 40, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: rightTab === tab.key ? "#ffffff" : "transparent",
                borderBottom: rightTab === tab.key ? "2px solid #3b82f6" : "2px solid transparent",
                color: rightTab === tab.key ? "#3b82f6" : "#6b7280",
                fontSize: 13, fontWeight: 600, transition: "all 0.15s",
              }}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable Panel Content */}
          <div style={{ flex: 1, overflowY: "auto" }}>

            {/* ── CONTENT TAB ── */}
            {rightTab === "content" && (
              <>
                <PanelSection title="Company Logo" icon={<ImageIcon style={{ width: 13, height: 13 }} />} accent="#f59e0b" defaultOpen>
                  <div style={{ padding: "8px 0 4px" }}>
                    <LogoZone logoUrl={config.logoUrl} onClick={() => logoInputRef.current?.click()} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 6px" }}>
                      <div>
                        <div style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>Show Company Name</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>Display alongside logo</div>
                      </div>
                      <ToggleSwitch checked={config.showCompanyName} onChange={(v) => update("showCompanyName", v)} />
                    </div>
                  </div>
                </PanelSection>

                <PanelSection title="Company Info" icon={<Building2 style={{ width: 13, height: 13 }} />} accent="#f59e0b" defaultOpen>
                  <div style={{ padding: "8px 0 4px" }}>
                    <LightInput label="Company Name" value={config.companyName} onChange={(v) => update("companyName", v)} placeholder="e.g. KESHAV BULLION" />
                    <LightInput label="Tagline" value={config.companyTagline} onChange={(v) => update("companyTagline", v)} placeholder="e.g. THE GOLD TRADING L.L.C" />
                    <div style={{ padding: "0 16px", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Description</div>
                      <LightTextarea value={config.companyDescription} onChange={(v) => update("companyDescription", v)} placeholder="Short company description..." />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 16px 8px" }}>
                      <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Show Description</span>
                      <ToggleSwitch checked={config.showCompanyDescription} onChange={(v) => update("showCompanyDescription", v)} />
                    </div>
                  </div>
                </PanelSection>

                <PanelSection title="Spot Rate" icon={<BarChart2 style={{ width: 13, height: 13 }} />} accent="#f59e0b">
                  <div style={{ paddingBottom: 4 }}>
                    <CheckRow label="GOLD" checked={config.showGold} onChange={(v) => update("showGold", v)} />
                    <CheckRow label="SILVER" checked={config.showSilver} onChange={(v) => update("showSilver", v)} />
                  </div>
                </PanelSection>

                <PanelSection title="Commodities" icon={<Layers style={{ width: 13, height: 13 }} />} accent="#8b5cf6">
                  <div style={{ padding: "8px 0 4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 16px 12px", alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>ASK PRICE</span>
                        <ToggleSwitch checked={config.showAskPrice} onChange={(v) => update("showAskPrice", v)} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>BID PRICE</span>
                        <ToggleSwitch checked={config.showBidPrice} onChange={(v) => update("showBidPrice", v)} />
                      </div>
                    </div>
                    {config.commodities.map((c) => (
                      <div key={c.id} onClick={() => toggleCommodity(c.id)} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 16px", borderBottom: "1px solid #f9fafb", cursor: "pointer",
                      }}>
                        <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{c.label}</span>
                        <div style={{
                          width: 20, height: 20, borderRadius: 4,
                          background: c.enabled ? "#3b82f6" : "#ffffff",
                          border: `2px solid ${c.enabled ? "#3b82f6" : "#d1d5db"}`,
                          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0,
                        }}>
                          {c.enabled && <Check style={{ width: 12, height: 12, color: "#fff" }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </PanelSection>

                <PanelSection title="News Ticker" icon={<Newspaper style={{ width: 13, height: 13 }} />} accent="#ef4444">
                  <div style={{ padding: "8px 0 4px" }}>
                    <LightInput label="Headline" value={config.newsHeadline} onChange={(v) => update("newsHeadline", v)} placeholder="Headline" />
                    <div style={{ padding: "0 16px", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Description</div>
                      <LightTextarea value={config.newsDescription} onChange={(v) => update("newsDescription", v)} placeholder="News description..." />
                    </div>
                  </div>
                </PanelSection>

                <PanelSection title="YouTube Video" icon={<Youtube style={{ width: 13, height: 13 }} />} accent="#ef4444">
                  <div style={{ padding: "8px 0 4px" }}>
                    <LightInput value={config.youtubeUrl} onChange={(v) => update("youtubeUrl", v)} placeholder="Paste YouTube video URL here" />
                  </div>
                </PanelSection>

                {/* ── World Clocks — flag image chips ── */}
                <PanelSection title="World Clocks" icon={<Globe style={{ width: 13, height: 13 }} />} accent="#0ea5e9">
                  <div style={{ padding: "6px 0 4px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 16px 10px", borderBottom: "1px solid #f3f4f6" }}>
                      <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Show Clocks</span>
                      <ToggleSwitch checked={config.showClocks} onChange={(v) => update("showClocks", v)} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px 10px", borderBottom: "1px solid #f3f4f6" }}>
                      <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Show Flag</span>
                      <ToggleSwitch checked={config.showClockFlag} onChange={(v) => update("showClockFlag", v)} />
                    </div>

                    {/* Clock search + selector */}
                    <ClockSearch
                      clockCities={config.clockCities ?? []}
                      onUpdate={(next) => update("clockCities", next)}
                    />
                  </div>
                </PanelSection>
              </>
            )}

            {/* ── DESIGN TAB ── */}
            {rightTab === "design" && (
              <>


                <PanelSection title="Colors & Font" icon={<Palette style={{ width: 13, height: 13 }} />} accent="#8b5cf6" defaultOpen>
                  <div style={{ padding: "6px 0 4px" }}>
                    <ColorAccordion title="General">
                      {/* ── Background Type Toggle ── */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, marginBottom: 6 }}>Background</div>
                        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                          {(["color", "image"] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => update("bgType", type)}
                              style={{
                                flex: 1, height: 32, borderRadius: 6, border: "none", cursor: "pointer",
                                fontSize: 12, fontWeight: 600,
                                background: config.bgType === type ? "#3b82f6" : "#f3f4f6",
                                color: config.bgType === type ? "#ffffff" : "#6b7280",
                                transition: "all 0.15s",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                              }}
                            >
                              {type === "color" ? (
                                <>
                                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 12, height: 12 }}>
                                    <circle cx="8" cy="8" r="6" fill={config.bgType === "color" ? "#fff" : "#9ca3af"} fillOpacity="0.9" />
                                  </svg>
                                  Color
                                </>
                              ) : (
                                <>
                                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 12, height: 12 }}>
                                    <rect x="1" y="1" width="14" height="14" rx="2" stroke={config.bgType === "image" ? "#fff" : "#9ca3af"} strokeWidth="1.5" />
                                    <path d="M1 10l4-4 3 3 2-2 5 5" stroke={config.bgType === "image" ? "#fff" : "#9ca3af"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  Image
                                </>
                              )}
                            </button>
                          ))}
                        </div>

                        {config.bgType === "color" ? (
                          <ColorRow label="Color" value={config.bgColor} onChange={(v) => update("bgColor", v)} />
                        ) : (
                          <>
                            <BgImageZone
                              imageUrl={config.bgImageUrl}
                              onUpload={(url) => update("bgImageUrl", url)}
                              onClear={() => update("bgImageUrl", null)}
                            />
                            {config.bgImageUrl && (
                              <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, marginBottom: 6 }}>Image Fit</div>
                                <div style={{ display: "flex", gap: 5 }}>
                                  {(["cover", "contain", "repeat"] as const).map((size) => (
                                    <button
                                      key={size}
                                      onClick={() => update("bgImageSize", size)}
                                      style={{
                                        flex: 1, height: 28, borderRadius: 5, border: "none", cursor: "pointer",
                                        fontSize: 10, fontWeight: 600, textTransform: "capitalize",
                                        background: config.bgImageSize === size ? "#3b82f6" : "#f3f4f6",
                                        color: config.bgImageSize === size ? "#fff" : "#6b7280",
                                        transition: "all 0.15s",
                                      }}
                                    >
                                      {size}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <ColorRow label="Text overlay" value={config.bgColor} onChange={(v) => update("bgColor", v)} />
                          </>
                        )}
                      </div>

                      <ColorRow label="Text" value={config.textColor} onChange={(v) => update("textColor", v)} />
                      <div style={{ marginTop: 8, marginBottom: 2 }}>
                        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, marginBottom: 5 }}>Font</div>
                        <FontPicker value={config.font} onChange={(v) => update("font", v)} />
                      </div>
                    </ColorAccordion>
                    <ColorAccordion title="Company">
                      <ColorRow label="Title Color" value={config.companyNameColor} onChange={(v) => update("companyNameColor", v)} />
                      <ColorRow label="Tagline Color" value={config.taglineColor} onChange={(v) => update("taglineColor", v)} />
                    </ColorAccordion>
                    <ColorAccordion title="Spot Rate">
                      <ColorRow label="Card BG" value={config.spotCardBg} onChange={(v) => update("spotCardBg", v)} />
                      <ColorRow label="Card Border" value={config.spotCardBorder} onChange={(v) => update("spotCardBorder", v)} />
                      <ColorRow label="Metal Label" value={config.spotMetalLabelColor} onChange={(v) => update("spotMetalLabelColor", v)} />
                      <ColorRow label="BID Value" value={config.spotBidColor} onChange={(v) => update("spotBidColor", v)} />
                      <ColorRow label="ASK Background" value={config.spotAskBg} onChange={(v) => update("spotAskBg", v)} />
                      <ColorRow label="ASK Text" value={config.spotAskColor} onChange={(v) => update("spotAskColor", v)} />
                      <ColorRow label="LOW Value" value={config.spotLowColor} onChange={(v) => update("spotLowColor", v)} />
                      <ColorRow label="HIGH Value" value={config.spotHighColor} onChange={(v) => update("spotHighColor", v)} />
                    </ColorAccordion>
                    <ColorAccordion title="Commodities">
                      <ColorRow label="Header BG" value={config.headerBgColor} onChange={(v) => update("headerBgColor", v)} />
                      <ColorRow label="Header Text" value={config.headerTextColor} onChange={(v) => update("headerTextColor", v)} />
                      <ColorRow label="Table BG" value={config.tableBgColor} onChange={(v) => update("tableBgColor", v)} />
                      <ColorRow label="Row Text" value={config.commodityNameColor} onChange={(v) => update("commodityNameColor", v)} />
                      <ColorRow label="ASK Value" value={config.askValueColor} onChange={(v) => update("askValueColor", v)} />
                      <ColorRow label="BID Value" value={config.bidValueColor} onChange={(v) => update("bidValueColor", v)} />
                    </ColorAccordion>
                    <ColorAccordion title="World Clocks">
                      <ColorRow label="Clock BG" value={config.clockBg} onChange={(v) => update("clockBg", v)} />
                      <ColorRow label="Time Color" value={config.clockTimeColor} onChange={(v) => update("clockTimeColor", v)} />
                    </ColorAccordion>
                    <ColorAccordion title="News Ticker">
                      <ColorRow label="Ticker BG" value={config.newsTickerBg} onChange={(v) => update("newsTickerBg", v)} />
                      <ColorRow label="Ticker Text" value={config.newsTickerText} onChange={(v) => update("newsTickerText", v)} />
                    </ColorAccordion>
                    <div style={{ height: 8 }} />
                  </div>
                </PanelSection>
              </>
            )}

          </div>
        </aside>
      </div>

      <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
    </div>
  );
}

export default function TemplateEditorPage() {
  return (
    <div className="h-screen flex">
      <div className="background_image fixed inset-0 -z-1 bg-no-repeat bg-cover">
        <Image src={"/images/background.svg"} height={1000} width={1000} alt="" />
      </div>
      <Sidebar />
      <div className="flex-1 transition-all duration-300 p-5 overflow-hidden">
        <div className="h-full bg-white rounded-[15px] overflow-hidden flex flex-col">
          <Header />
          <main className="flex-1 pl-6 pb-6 h-9 space-y-6">
            <Suspense fallback={
              <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
                <div style={{ color: "#6b7280", fontSize: 14 }}>Loading editor…</div>
              </div>
            }>
              <TemplateEditorInner />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}