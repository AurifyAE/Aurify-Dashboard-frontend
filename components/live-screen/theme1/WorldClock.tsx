"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

const clockConfig = [
  { key: "india", label: "INDIA", timeZone: "Asia/Kolkata", flag: "/images/india.png" },
  { key: "uae", label: "UAE", timeZone: "Asia/Dubai", flag: "/images/uae.png" },
  { key: "london", label: "LONDON", timeZone: "Europe/London", flag: "/images/uk.png" },
  { key: "usa", label: "USA", timeZone: "America/New_York", flag: "/images/usa.png" },
];

const WorldClockHorizontal = ({ colors = {} }: { colors?: any }) => {
  const [times, setTimes] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const timeOptions: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
      const updatedTimes: Record<string, string> = {};

      clockConfig.forEach((clock) => {
        try {
          updatedTimes[clock.key] = now.toLocaleTimeString("en-US", { ...timeOptions, timeZone: clock.timeZone });
        } catch (e) {
          updatedTimes[clock.key] = "--:--";
        }
      });
      setTimes(updatedTimes);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: "1vw", width: "100%" }}>
      {clockConfig.map((clock) => (
        <Box key={clock.key} sx={{ display: "flex", alignItems: "center", gap: { xs: "10px", lg: "1vw" } }}>
          <Box sx={{ width: { xs: "30px", lg: "3vw" } }}>
            <img src={clock.flag} alt={clock.label} style={{ width: "100%", height: "auto" }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "start", flexDirection: "column" }}>
            <Typography sx={{ color: colors.clockText || "#fff", fontSize: { xs: "8px", lg: "0.6vw" }, fontWeight: "600", textTransform: "uppercase" }}>
              {clock.label}
            </Typography>
            <Typography sx={{ fontSize: { xs: "14px", lg: "1vw" }, color: colors.clockText || "#fff" }}>
              {times[clock.key] || "--:--"}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default WorldClockHorizontal;
