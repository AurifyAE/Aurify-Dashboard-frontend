"use client";
import React from "react";
import { Box, Typography } from "@mui/material";

interface NewsItem {
  title?: string;
  content?: string;
}

interface NewsTickerProps {
  newsItems?: NewsItem[];
  merchantName?: string;
  newsHeading?: string;
}

const NewsTicker = ({
  newsItems = [],
  merchantName,
  newsHeading,
}: NewsTickerProps) => {
  // Ensure enough items for smooth scrolling
  const tickerItems =
    newsItems.length <= 1 ? Array(5).fill(newsItems[0]) : newsItems;

  return (
    <Box
      sx={{
        width: "100%",
        // height: "3vw",
        height: {
          xs: "35px",
          lg: "3vw",
        },
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        backdropFilter: "blur(0.3vw)",
        borderTop: "0.1vw solid #eee2d73d",

      }}
    >
      {/* LEFT BRAND */}
      <Typography
        sx={{
          color: "#fff",
          background: "#112251",
          fontSize: {
            xs: "12px",
            lg: "1.2vw",
          },
          fontWeight: "700",
          whiteSpace: "nowrap",
          padding: "0 3.5vw",
          height: "100%",
          display: "flex",
          alignItems: "center",
          borderRadius: "0.1vw",
          justifyContent: "center",

          flexShrink: 0,
        }}
      >
        {newsHeading || (merchantName ? `${merchantName} Updates` : "Company Updates")}
      </Typography>

      {/* SCROLL AREA */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            animation: "ticker 70s linear infinite",
          }}
        >
          {tickerItems.map((item, index) => (
            <Typography
              key={index}
              component="span"
              sx={{
                color: "#fff",
                // fontSize: "1.3vw",
                fontSize: {
                  xs: "12px",
                  lg: "1.3vw",
                },
                fontWeight: 500,
                whiteSpace: "nowrap",
                marginRight: "4vw",
              }}
            >
              {item?.title ? `${item.title}${item.content ? ` - ${item.content}` : ""}` : ""}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* KEYFRAMES */}
      <style>
        {`
          @keyframes ticker {
            0% {
              transform: translateX(30%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default NewsTicker;
