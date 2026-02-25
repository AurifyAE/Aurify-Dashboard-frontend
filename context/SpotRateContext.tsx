"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { API_URL, API_KEY, SOCKET_SECRET } from "@/lib/env";
import { BACKEND_URL } from "@/lib/env";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MetalLiveData {
  bid: number;
  ask: number;
  low: number;
  high: number;
  /** Computed with spread applied */
  displayBid: string;
  displayAsk: string;
  displayLow: string;
  displayHigh: string;
}

export interface SpreadSettings {
  goldBidSpread: number;
  goldAskSpread: number;
  silverBidSpread: number;
  silverAskSpread: number;
}

interface SpotRateContextValue {
  goldData: MetalLiveData | null;
  silverData: MetalLiveData | null;
  isConnected: boolean;
  spreadSettings: SpreadSettings;
  updateSpreadSettings: (settings: Partial<SpreadSettings>) => void;
}

type MarketUpdate = {
  symbol: string;
  bid?: number;
  ask?: number;
  low?: number;
  high?: number;
};

const SPOT_RATE_EVENT_NAMES = [
  "market-data",
  "spotrate",
  "spot-rate",
  "spot-rates",
  "rates",
  "data",
] as const;

const isGoldSymbol = (symbol: string) =>
  symbol === "XAU" || symbol === "Gold" || symbol === "GOLD";

const isSilverSymbol = (symbol: string) =>
  symbol === "XAG" || symbol === "Silver" || symbol === "SILVER";

// ─── Calculation helpers ──────────────────────────────────────────────────────
const calcValues = (
  bid: number,
  bidSpread: number,
  askSpread: number,
  offset: number,
  precision: number,
) => {
  const bidVal = bid + bidSpread;
  const askVal = bidVal + askSpread + offset;
  return {
    bid: bidVal.toFixed(precision),
    ask: askVal.toFixed(precision),
  };
};

const extractServerURL = (result: any): string | null => {
  const serverURL: string | undefined =
    result?.data?.info?.serverURL ||
    result?.data?.info?.serverUrl ||
    result?.data?.serverURL ||
    result?.data?.serverUrl ||
    result?.info?.serverURL ||
    result?.info?.serverUrl ||
    result?.serverURL ||
    result?.serverUrl ||
    (typeof result?.data === "string" ? result.data : undefined);
  return typeof serverURL === "string" && serverURL.length ? serverURL : null;
};

const normalizeToMarketUpdates = (data: unknown): MarketUpdate[] => {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  const updates: MarketUpdate[] = [];

  // Single item: { symbol, bid, ask, low, high }
  if (typeof d.symbol === "string") {
    updates.push({
      symbol: d.symbol,
      bid: typeof d.bid === "number" ? d.bid : Number(d.bid) || undefined,
      ask: typeof d.ask === "number" ? d.ask : Number(d.ask) || undefined,
      low: typeof d.low === "number" ? d.low : Number(d.low) || undefined,
      high: typeof d.high === "number" ? d.high : Number(d.high) || undefined,
    });
    return updates;
  }

  // Nested: { Gold: {...}, Silver: {...} } (also allow XAU/XAG keys)
  for (const key of ["Gold", "GOLD", "XAU", "Silver", "SILVER", "XAG"]) {
    const block = d[key];
    if (block && typeof block === "object") {
      const b = block as Record<string, unknown>;
      updates.push({
        symbol: key,
        bid: typeof b.bid === "number" ? b.bid : Number(b.bid) || undefined,
        ask: typeof b.ask === "number" ? b.ask : Number(b.ask) || undefined,
        low: typeof b.low === "number" ? b.low : Number(b.low) || undefined,
        high: typeof b.high === "number" ? b.high : Number(b.high) || undefined,
      });
    }
  }

  // Array of items: { data: [ { symbol, ... }, ... ] }
  if (Array.isArray(d.data)) {
    for (const item of d.data) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).symbol === "string"
      ) {
        const it = item as Record<string, unknown>;
        updates.push({
          symbol: String(it.symbol),
          bid: typeof it.bid === "number" ? it.bid : Number(it.bid) || undefined,
          ask: typeof it.ask === "number" ? it.ask : Number(it.ask) || undefined,
          low: typeof it.low === "number" ? it.low : Number(it.low) || undefined,
          high:
            typeof it.high === "number" ? it.high : Number(it.high) || undefined,
        });
      }
    }
  }

  return updates;
};

// ─── Context ──────────────────────────────────────────────────────────────────
const SpotRateContext = createContext<SpotRateContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function SpotRateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [goldData, setGoldData] = useState<MetalLiveData | null>(null);
  const [silverData, setSilverData] = useState<MetalLiveData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [spreadSettings, setSpreadSettings] = useState<SpreadSettings>({
    goldBidSpread: 0,
    goldAskSpread: 0.5,
    silverBidSpread: 0,
    silverAskSpread: 0.05,
  });

  // Keep latest spread settings accessible inside socket callbacks
  const spreadRef = useRef(spreadSettings);
  spreadRef.current = spreadSettings;

  // Fetch per-user spread settings from our backend when logged in
  useEffect(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/spotrate/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          const data = json?.data;
          if (data) {
            setSpreadSettings({
              goldBidSpread: Number(data.goldBidSpread) ?? 0,
              goldAskSpread: Number(data.goldAskSpread) ?? 0.5,
              silverBidSpread: Number(data.silverBidSpread) ?? 0,
              silverAskSpread: Number(data.silverAskSpread) ?? 0.05,
            });
            console.log("[SpotRate] Spread settings loaded from backend (per user)");
          }
        }
      } catch (err) {
        console.warn("[SpotRate] Could not fetch spread settings:", err);
      }
    };

    fetchSettings();
  }, [user]);

  const updateSpreadSettings = useCallback(
    async (settings: Partial<SpreadSettings>) => {
      setSpreadSettings((prev) => ({ ...prev, ...settings }));
      if (user) {
        const token = getToken();
        if (token) {
          try {
            await fetch(`${BACKEND_URL}/api/spotrate/settings`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              credentials: "include",
              body: JSON.stringify(settings),
            });
          } catch (err) {
            console.warn("[SpotRate] Failed to persist spread settings:", err);
          }
        }
      }
    },
    [user],
  );

  // Process incoming raw market data and update state
  const processMarketData = useCallback(
    (
      symbol: string,
      data: { bid?: number; ask?: number; low?: number; high?: number },
    ) => {
      const { goldBidSpread, goldAskSpread, silverBidSpread, silverAskSpread } =
        spreadRef.current;

      if (isGoldSymbol(symbol)) {
        const bid = Number(data.bid ?? 0);
        const low = Number(data.low ?? 0);
        const high = Number(data.high ?? 0);
        const vals = calcValues(bid, goldBidSpread, goldAskSpread, 0.5, 2);
        const lowVals = calcValues(low, goldBidSpread, goldAskSpread, 0.5, 2);
        const highVals = calcValues(high, goldBidSpread, goldAskSpread, 0.5, 2);

        setGoldData({
          bid,
          ask: Number(data.ask ?? 0),
          low,
          high,
          displayBid: vals.bid,
          displayAsk: vals.ask,
          displayLow: lowVals.bid,
          displayHigh: highVals.bid,
        });
      }

      if (isSilverSymbol(symbol)) {
        const bid = Number(data.bid ?? 0);
        const low = Number(data.low ?? 0);
        const high = Number(data.high ?? 0);
        const vals = calcValues(bid, silverBidSpread, silverAskSpread, 0.05, 3);
        const lowVals = calcValues(
          low,
          silverBidSpread,
          silverAskSpread,
          0.05,
          3,
        );
        const highVals = calcValues(
          high,
          silverBidSpread,
          silverAskSpread,
          0.05,
          3,
        );

        setSilverData({
          bid,
          ask: Number(data.ask ?? 0),
          low,
          high,
          displayBid: vals.bid,
          displayAsk: vals.ask,
          displayLow: lowVals.bid,
          displayHigh: highVals.bid,
        });
      }
    },
    [],
  );

  // ── Fetch server URL from API, then connect socket ─────────────────────────
  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;

    const symbols = ["GOLD", "SILVER"];

    const connectSocket = async () => {
      try {
        // Step 1: Fetch the actual socket server URL from the API
        console.log("[SpotRate] Fetching server URL from API...");
        const response = await fetch(`${API_URL}/get-server`, {
          headers: {
            "Content-Type": "application/json",
            "X-Secret-Key": API_KEY,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch server URL: ${response.status}`);
        }

        const result = await response.json();
        const serverURL = extractServerURL(result);

        if (!serverURL) {
          console.error(
            "[SpotRate] No serverURL returned from /get-server. Response shape:",
            JSON.stringify(result, null, 2).slice(0, 500),
          );
          return;
        }

        if (cancelled) return;

        console.log("[SpotRate] Server URL:", serverURL);

        // Step 2: Connect to the socket server directly (like the original code)
        socket = io(serverURL, {
          query: { secret: SOCKET_SECRET },
          transports: ["websocket"],
          withCredentials: true,
        });

        socket.on("connect", () => {
          console.log("[SpotRate] ✅ Connected to WebSocket server");
          setIsConnected(true);
          socket?.emit("request-data", symbols);
        });

        socket.on("disconnect", (reason) => {
          console.log("[SpotRate] ❌ Disconnected:", reason);
          setIsConnected(false);
        });

        const handleSpotRatePayload = (data: unknown) => {
          for (const u of normalizeToMarketUpdates(data)) {
            if (u.symbol) processMarketData(u.symbol, u);
          }
        };

        for (const eventName of SPOT_RATE_EVENT_NAMES) {
          socket.on(eventName, handleSpotRatePayload);
        }

        if (process.env.NODE_ENV !== "production") {
          socket.onAny((eventName, ...args) => {
            if (!(SPOT_RATE_EVENT_NAMES as readonly string[]).includes(eventName)) {
              console.log(
                "[SpotRate] Socket event:",
                eventName,
                args.length ? args : "",
              );
            }
          });
        }

        socket.on("connect_error", (err) => {
          console.error("[SpotRate] Connection error:", err.message);
          setIsConnected(false);
        });

        socket.on("error", (err) => {
          console.error("[SpotRate] Socket error:", err);
        });
      } catch (err) {
        console.error("[SpotRate] Failed to initialize socket:", err);
      }
    };

    connectSocket();

    return () => {
      cancelled = true;
      if (socket) {
        socket.disconnect();
      }
    };
  }, [processMarketData]);

  // Re-compute displayed values when spread settings change (without reconnecting)
  useEffect(() => {
    setGoldData((prev) => {
      if (!prev) return prev;
      const { goldBidSpread, goldAskSpread } = spreadSettings;
      const vals = calcValues(prev.bid, goldBidSpread, goldAskSpread, 0.5, 2);
      const lowVals = calcValues(
        prev.low,
        goldBidSpread,
        goldAskSpread,
        0.5,
        2,
      );
      const highVals = calcValues(
        prev.high,
        goldBidSpread,
        goldAskSpread,
        0.5,
        2,
      );
      return {
        ...prev,
        displayBid: vals.bid,
        displayAsk: vals.ask,
        displayLow: lowVals.bid,
        displayHigh: highVals.bid,
      };
    });
    setSilverData((prev) => {
      if (!prev) return prev;
      const { silverBidSpread, silverAskSpread } = spreadSettings;
      const vals = calcValues(
        prev.bid,
        silverBidSpread,
        silverAskSpread,
        0.05,
        3,
      );
      const lowVals = calcValues(
        prev.low,
        silverBidSpread,
        silverAskSpread,
        0.05,
        3,
      );
      const highVals = calcValues(
        prev.high,
        silverBidSpread,
        silverAskSpread,
        0.05,
        3,
      );
      return {
        ...prev,
        displayBid: vals.bid,
        displayAsk: vals.ask,
        displayLow: lowVals.bid,
        displayHigh: highVals.bid,
      };
    });
  }, [spreadSettings]);

  return (
    <SpotRateContext.Provider
      value={{
        goldData,
        silverData,
        isConnected,
        spreadSettings,
        updateSpreadSettings,
      }}
    >
      {children}
    </SpotRateContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSpotRate(): SpotRateContextValue {
  const ctx = useContext(SpotRateContext);
  if (!ctx)
    throw new Error("useSpotRate must be used inside <SpotRateProvider>");
  return ctx;
}
