"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

interface NewsTickerProps {
  newsItems: any[];
  merchantName?: string;
}

const NewsTicker = ({ newsItems = [], merchantName = "Live Updates" }: NewsTickerProps) => {
  const tickerItems = newsItems.length <= 1 && newsItems.length > 0 ? Array(5).fill(newsItems[0]) : newsItems;

  if (!tickerItems.length) {
    tickerItems.push({ title: "Welcome", description: "Welcome to our showroom" });
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: { xs: "38px", lg: "2.7vw" },
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        backdropFilter: "blur(0.6vw)",
        background: `linear-gradient(90deg, rgba(25,12,6,0.82) 0%, rgba(48,22,10,0.72) 40%, rgba(20,8,2,0.85) 100%)`,
        borderTop: "0.05vw solid rgba(255,220,180,0.12)",
        borderBottom: "0.05vw solid rgba(255,220,180,0.08)",
        boxShadow: `inset 0 0 1vw rgba(255,180,120,0.03), 0 0 1vw rgba(0,0,0,0.18)`,
      }}
    >
      <Typography
        sx={{
          color: "#fff",
          background: `linear-gradient(321deg, rgba(79, 37, 17, 0.45), rgb(177 115 89 / 55%), rgba(79, 37, 17, 0.45) 100%)`,
          fontSize: { xs: "12px", lg: "1.2vw" },
          fontWeight: "700",
          whiteSpace: "nowrap",
          padding: "0 3.5vw",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {merchantName}
      </Typography>

      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <Box sx={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", animation: "ticker 70s linear infinite" }}>
          {tickerItems.map((item, index) => (
            <Typography
              key={index}
              component="span"
              sx={{ color: "#fff", fontSize: { xs: "12px", lg: "1.3vw" }, fontWeight: 500, whiteSpace: "nowrap", marginRight: "4vw" }}
            >
              {item?.description || item?.content || item?.title || ""}
            </Typography>
          ))}
        </Box>
      </Box>
      <style>
        {`
          @keyframes ticker {
            0% { transform: translateX(30%); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>
    </Box>
  );
};

export default NewsTicker;
