"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

interface NewsTickerProps {
  newsItems?: any[];
  merchantName?: string;
  colors?: any;
}

const marqueeStyles = `
  @keyframes ticker {
    0% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }
  .marquee {
    display: inline-block;
    white-space: nowrap;
    animation: ticker 20s linear infinite;
  }
`;

const NewsTicker = ({ newsItems = [], merchantName = "Merchant", colors = {} }: NewsTickerProps) => {
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
        background: colors.newsBg || "#000",
        borderTop: "0.2vw solid rgba(212, 160, 23, 0.5)",
        borderBottom: "0.2vw solid rgba(212, 160, 23, 0.5)",
        boxShadow: "0 -0.5vw 1vw rgba(0,0,0,0.5)",
        zIndex: 50,
      }}
    >
      <Box
        sx={{
          backgroundColor: "#111",
          color: "#d4a017",
          padding: { xs: "5px 15px", md: "0.8vw 2vw" },
          fontWeight: 800,
          fontSize: { xs: "12px", md: "1.2vw" },
          whiteSpace: "nowrap",
          borderRight: "0.2vw solid #d4a017",
          boxShadow: "0.5vw 0 1vw rgba(0,0,0,0.8)",
          zIndex: 2,
          textTransform: "uppercase",
          letterSpacing: "0.1vw",
        }}
      >
        {merchantName}
      </Box>

      <Box sx={{ flex: 1, overflow: "hidden", position: "relative", whiteSpace: "nowrap" }}>
        <style>{marqueeStyles}</style>
        <Box className="marquee">
          {tickerItems.map((item, index) => (
            <Typography
              key={index}
              component="span"
              sx={{ color: colors.newsText || "#fff", fontSize: { xs: "12px", lg: "1.3vw" }, fontWeight: 500, whiteSpace: "nowrap", marginRight: "4vw" }}
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
