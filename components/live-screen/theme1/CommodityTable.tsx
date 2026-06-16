"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/autoplay";

const OUNCE = 31.103;
const AED = 3.674;

const UNIT_MULTIPLIER: Record<string, number> = {
  GM: 1,
  KG: 1000,
  TTB: 116.64,
  TOLA: 11.664,
  OZ: 31.103,
};

const PURITY_TO_KARAT: Record<string, string> = {
  9999: "24K",
  "999.9": "24K",
  999: "24K",
  995: "24K",
  958: "23K",
  950: "23K",
  920: "22K",
  916: "22K",
  900: "21.6K",
  875: "21K",
  833: "20K",
  750: "18K",
  708: "17K",
  700: "16.8K",
  666: "16K",
  625: "15K",
  585: "14K",
  583: "14K",
  500: "12K",
  417: "10K",
  375: "9K",
};

interface CommodityTableProps {
  items: any[];
  goldData: any;
  silverData: any;
}

const CommodityTable = ({ items, goldData, silverData }: CommodityTableProps) => {
  const getSpot = (metal: string) => {
    const lower = metal?.toLowerCase() || "";
    if (lower.includes("gold") || lower.includes("minted")) return goldData;
    if (lower.includes("silver")) return silverData;
    return null;
  };

  const purityFactor = (purity: any) => (purity ? purity / 10 ** String(purity).length : 1);

  const formatPrice = (value: number) => {
    if (value == null || isNaN(value)) return "—";
    const intLen = Math.floor(Math.abs(value)).toString().length;
    let decimals = 3;
    if (intLen >= 4) decimals = 0;
    else if (intLen === 3) decimals = 2;
    return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const getPurityLabel = (purity: string | number) => PURITY_TO_KARAT[purity] || purity;

  const rows = items?.map((item) => {
    const spot = getSpot(item.metal);
    const effectiveSpot = spot || goldData;
    if (!effectiveSpot) return null;

    const mult = UNIT_MULTIPLIER[item.weight] || 1;
    const pur = purityFactor(item.purity);
    const unitValue = Number(item.unit) || 1;

    const baseBid = (effectiveSpot.bid / OUNCE) * AED * mult * unitValue * pur;
    const baseAsk = (effectiveSpot.ask / OUNCE) * AED * mult * unitValue * pur;

    return {
      metal_name: item.name || item.metal_name,
      purity: item.purity,
      metal: item.metal,
      unit: `${unitValue} ${item.weight || item.unit}`, // Adapt for both API formats
      bid: baseBid + (Number(item.buyCharge) || 0) + (Number(item.buyPremium) || 0),
      ask: baseAsk + (Number(item.sellCharge) || 0) + (Number(item.sellPremium) || 0),
    };
  }).filter(Boolean) ?? [];

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth <= 768);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  if (!rows.length) return null;

  return (
    <Box sx={{ width: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1.4fr 0.8fr 0.8fr 0.8fr",
          py: "0.9vw",
          px: "1.5vw",
          alignItems: "end",
          borderRadius: "1vw",
          background: "linear-gradient(180deg, rgba(40,15,5,0.55) 0%, rgba(20,8,2,0.45) 100%)",
          backdropFilter: "blur(0.35vw)",
          border: "0.1vw solid rgba(255, 210, 170, 0.32)",
          margin: ".4vw",
          boxShadow: `inset 0 0 0.08vw rgba(255,255,255,0.15), 0 0 0.8vw rgba(255,140,60,0.08)`,
        }}
      >
        {["COMMODITY", "UNIT", "BUY AED", "SELL AED"].map((header, i) => (
          <Typography
            key={i}
            sx={{
              fontSize: { xs: "14px", lg: "1.2vw", xl: "1.3vw" },
              fontWeight: 600,
              color: "#fff",
              textAlign: i < 2 ? "start" : "center",
              letterSpacing: i === 0 ? "0.04vw" : "0",
            }}
          >
            {header}
          </Typography>
        ))}
      </Box>

      <Box sx={{ mt: "1vw", maxHeight: { xs: "auto", sm: "20vw" } }}>
        <Swiper
          direction="vertical"
          slidesPerView={Math.min(5, rows.length)}
          loop={rows.length > 5}
          modules={[Autoplay]}
          autoplay={{ delay: 0, disableOnInteraction: false }}
          speed={3000}
          style={{
            height: isMobile ? "35vw" : "20vw",
            backdropFilter: "blur(5px)",
            borderRadius: "1vw",
            margin: ".4vw",
            background: "linear-gradient(180deg, rgba(40,15,5,0.55) 0%, rgba(20,8,2,0.45) 100%)",
            border: "0.1vw solid rgba(255, 210, 170, 0.32)",
            boxShadow: `inset 0 0 0.08vw rgba(255,255,255,0.15), 0 0 0.8vw rgba(255,140,60,0.08)`,
          }}
        >
          {rows.map((row, index) => (
            <SwiperSlide key={index}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 0.8fr 0.8fr 0.8fr",
                  alignItems: "center",
                  py: ".7vw",
                  px: "1.5vw",
                  height: "100%",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    width: "100%",
                    height: "1px",
                    background: "linear-gradient(to right, transparent 5%, rgba(255, 210, 170, 0.76),transparent 95%)",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: "14px", sm: "12px", lg: "1.6vw", xl: "1.4vw" },
                    fontWeight: 800,
                    color: "#fff",
                    display: "grid",
                    alignItems: "center",
                    justifyContent: "start",
                    gridTemplateColumns: "auto auto",
                    textAlign: "start",
                    lineHeight: "1",
                    gap: { xs: "7px", lg: "0.3vw" },
                  }}
                >
                  {row.metal_name || row.metal}
                  <Typography sx={{ fontSize: { xs: "12px", sm: "10px", lg: "1.2vw" }, fontWeight: 400, color: "#fff" }}>
                    {getPurityLabel(row.purity)}
                  </Typography>
                </Typography>

                <Typography sx={{ fontSize: { xs: "14px", lg: "1.3vw", xl: "1.4vw" }, color: "#fff", textAlign: "start" }}>
                  {row.unit}
                </Typography>

                <Typography sx={{ fontSize: { xs: "14px", lg: "1.5vw", xl: "1.4vw" }, fontWeight: 600, color: "#fff" }}>
                  {formatPrice(row.bid)}
                </Typography>

                <Typography sx={{ fontSize: { xs: "14px", lg: "1.5vw", xl: "1.4vw" }, fontWeight: 600, color: "#fff" }}>
                  {formatPrice(row.ask)}
                </Typography>
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Box>
  );
};

export default CommodityTable;
