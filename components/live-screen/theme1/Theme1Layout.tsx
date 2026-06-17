"use client";

import React, { useEffect, useState } from "react";
import { Grid, Box, Typography } from "@mui/material";
import io from "socket.io-client";
import CommodityTable from "./CommodityTable";
import LiveSpotRate from "./LiveSpotRate";
import NewsTicker from "./NewsTicker";
import WorldClockHorizontal from "./WorldClock";
import SystemClock from "./SystemClock";
import PoweredByAurify from "./PoweredByAurify";
import { API_URL, API_KEY, SOCKET_SECRET } from "@/lib/env";

export default function Theme1Layout({
  data,
  isPreview = false,
}: {
  data?: any;
  isPreview?: boolean;
}) {
  const { merchant, theme, layout, commodities, news } = data;
  const widgets = layout?.widgets || [
    "Spot Rates",
    "Commodity Table",
    "News",
    "Clock",
  ];
  const showLogo = layout?.styles?.showLogo ?? true;
  const showName = layout?.styles?.showName ?? true;
  const [serverURL, setServerURL] = useState("");
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const symbols = ["GOLD", "SILVER"];
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServerURL = async () => {
      try {
        const response = await fetch(`${API_URL}/get-server`, {
          headers: {
            "Content-Type": "application/json",
            "X-Secret-Key": API_KEY,
          },
          credentials: "include",
        });
        const resData = await response.json();
        const serverUrlResult =
          resData?.data?.info?.serverURL ||
          resData?.data?.info?.serverUrl ||
          resData?.data?.serverURL ||
          resData?.data?.serverUrl ||
          resData?.serverURL ||
          resData?.serverUrl ||
          resData?.info?.serverURL ||
          resData?.info?.serverUrl ||
          null;
        setServerURL(serverUrlResult);
      } catch (err) {
        console.error("Failed to fetch server URL:", err);
      }
    };
    fetchServerURL();
  }, []);

  useEffect(() => {
    if (!serverURL) return;

    const socket = io(serverURL, {
      query: { secret: SOCKET_SECRET },
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("request-data", symbols);
    });

    socket.on("market-data", (data) => {
      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (item.symbol) {
            setMarketData((prev) => ({
              ...prev,
              [item.symbol]: { ...prev[item.symbol], ...item },
            }));
          }
        });
      } else if (data && data.symbol) {
        setMarketData((prev) => ({
          ...prev,
          [data.symbol]: { ...prev[data.symbol], ...data },
        }));
      }
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
      setError("An error occurred while receiving data");
    });

    return () => {
      socket.disconnect();
    };
  }, [serverURL]);

  const goldData = marketData["GOLD"] || {
    bid: 2345.6,
    ask: 2346.1,
    low: 2340.0,
    high: 2350.0,
  };
  const silverData = marketData["SILVER"] || {
    bid: 28.4,
    ask: 28.45,
    low: 28.0,
    high: 28.6,
  };

  const defaultCommodities = [
    {
      metal: "GOLD",
      metal_name: "Gold Bar 999",
      purity: 999,
      unit: 1,
      weight: "GM",
      buyCharge: 0,
      buyPremium: 2,
      sellCharge: 0,
      sellPremium: 2,
    },
    {
      metal: "GOLD",
      metal_name: "Gold Coin",
      purity: 916,
      unit: 8,
      weight: "GM",
      buyCharge: 0,
      buyPremium: 10,
      sellCharge: 0,
      sellPremium: 10,
    },
  ];
  const displayCommodities =
    commodities?.length > 0 ? commodities : defaultCommodities;

  return (
    <Box
      sx={{
        height: isPreview ? "100%" : "100dvh",
        minHeight: "100dvh",
        color: "white",
        pb: { xs: "0", md: "3vw" },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#140b10",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: isPreview ? "absolute" : "fixed",
          left: "0",
          bottom: "0",
          top: "0",
          right: "0",
          height: "100%",
          width: "100%",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <Box
          component="img"
          src={theme?.customizations?.backgroundUrl || "/images/theme1-bg.png"}
          alt="background"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          sx={{ height: "100%", width: "100%", objectFit: "cover" }}
        />
      </Box>

      <Grid
        container
        spacing={10}
        sx={{
          minHeight: "100%",
          justifyContent: "space-between",
          flexWrap: "wrap",
          zIndex: 1,
          position: "relative",
          m: 0,
          p: "0 2vw",
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "1vw",
            gap: "1vw",
          }}
        >
          <Box
            sx={{
              height: "auto",
              width: { xs: "40vw", sm: "18vw" },
              marginBottom: { xs: "20px", sm: "0vw" },
            }}
          >
            {showLogo ? (
              <img
                src={merchant?.logo || "/images/theme1-logo.svg"}
                alt={merchant?.companyName || "Dipanjali"}
                style={{ width: "100%", height: "auto", objectFit: "contain" }}
              />
            ) : showName ? (
              <Typography
                variant="h4"
                sx={{ color: "#d4a017", fontWeight: "bold" }}
              >
                {merchant?.companyName || "Merchant"}
              </Typography>
            ) : null}
          </Box>
          {widgets.includes("Commodity Table") && (
            <CommodityTable
              items={displayCommodities}
              goldData={goldData}
              silverData={silverData}
            />
          )}
        </Grid>

        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{ padding: "1vw", gap: "1vw", display: "grid" }}
        >
          {widgets.includes("Clock") && (
            <>
              <WorldClockHorizontal />
              <SystemClock />
            </>
          )}
          {widgets.includes("Spot Rates") && (
            <LiveSpotRate goldData={goldData} silverData={silverData} />
          )}
          <PoweredByAurify />
        </Grid>

        {widgets.includes("News") && (
          <Grid
            size={{ xs: 12 }}
            sx={{
              mt: { xs: "20px", md: "0" },
              position: { xs: "unset", md: isPreview ? "absolute" : "fixed" },
              zIndex: 1,
              bottom: "0",
              width: "100%",
              left: "0",
            }}
          >
            <NewsTicker newsItems={news} merchantName={merchant?.companyName} />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
