"use client";
import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/autoplay";

const OUNCE = 31.103;
const AED = 3.674;

const UNIT_MULTIPLIER = {
  GM: 1,
  KG: 1000,
  TTB: 116.64,
  TOLA: 11.664,
  OZ: 31.103,
};

interface CommodityItem {
  metal?: string;
  metal_name?: string;
  name?: string;
  purity?: string | number;
  unit?: string | number;
  weight?: string;
  buyCharge?: string | number;
  buyPremium?: string | number;
  sellCharge?: string | number;
  sellPremium?: string | number;
  group?: string;
}

interface SpotData {
  bid: number;
  ask: number;
  low: number;
  high: number;
}

interface CommodityTableProps {
  commodities?: CommodityItem[];
  isMintedBar?: boolean;
  isCommodity?: boolean;
  goldData?: SpotData;
  silverData?: SpotData;
}

interface TableDataItem {
  group?: string;
  metal_name?: string;
  name?: string;
  metal?: string;
  purity?: string | number;
  weight: string;
  bid: number;
  ask: number;
}

const CommodityTable = ({
  commodities = [],
  isMintedBar = false,
  isCommodity = false,
  goldData,
  silverData,
}: CommodityTableProps) => {
  /* -----------------------
     HELPERS
  ------------------------ */

  const getSpot = (metal: string | undefined) => {
    const lower = metal?.toLowerCase() || "";

    if (lower.includes("gold") || lower.includes("minted")) {
      return goldData;
    }

    if (lower.includes("silver")) {
      return silverData;
    }

    return null;
  };
  const purityFactor = (purity: string | number | undefined) => {
    if (!purity) return 1;

    const num = Number(purity);

    return num > 1000 ? num / 10000 : num / 1000;
  };
  const formatByDigits = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return "";

    const integerDigits = Math.floor(Math.abs(value)).toString().length;

    let decimals = 3;
    if (integerDigits >= 4) decimals = 0;
    else if (integerDigits === 3) decimals = 2;

    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };
  const [isMobile, setIsMobile] = useState(false);

  const formatPrice = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return "—";

    const intLen = Math.floor(Math.abs(value)).toString().length;

    let decimals = 3;
    if (intLen >= 4) decimals = 0;
    else if (intLen === 3) decimals = 2;

    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);

    return () => window.removeEventListener("resize", checkWidth);
  }, []);
  /* -----------------------
     BUILD TABLE DATA
  ------------------------ */

  const buildTableData = (): TableDataItem[] => {
    if (!commodities?.length) return [];

    const list: TableDataItem[] = [];
    commodities.forEach((item) => {
      const spot = getSpot(item.metal);
      const effectiveSpot = spot || goldData;

      if (!effectiveSpot) return;

      const weightKey = (item.weight || "") as keyof typeof UNIT_MULTIPLIER;
      const multiplier = UNIT_MULTIPLIER[weightKey] || 1;
      const purity = purityFactor(item.purity);
      const unitValue = Number(item.unit) || 1;

      const baseBid =
        (effectiveSpot.bid / 31.103) * AED * multiplier * unitValue * purity;
      const baseAsk =
        (effectiveSpot.ask / 31.103) * AED * multiplier * unitValue * purity;

      const bid =
        baseBid +
        (Number(item.buyCharge) || 0) +
        (Number(item.buyPremium) || 0);
      const ask =
        baseAsk +
        (Number(item.sellCharge) || 0) +
        (Number(item.sellPremium) || 0);

      list.push({
        group: item.group,
        metal_name: item.name || item.metal_name,
        name: item.metal,
        metal: item.metal,
        purity: item.purity,
        weight: `${item.unit} ${item.weight}`,
        bid,
        ask,
      });
    });
    return list;
  };

  const data = buildTableData();

  /* -----------------------
     FILTER GROUPS
  ------------------------ */

  const commodityData = data.filter((item) => item.group === "commodity");

  const mintedBarData = data.filter((item) => item.group === "group1");

  // -----table height---
  const tableHeight = isMobile ? "35vw" : "18vw";
  // -----table items number---
  const tableItemsNumber = isMobile ? 6 : 5;

  /* -----------------------
     TABLE COMPONENT
  ------------------------ */

  const renderTable = (title: string, rows: TableDataItem[]) => {
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
            // background: "#aa8a4b1a",
            background: "#aa8a4b11",

            backdropFilter: "blur(0.3vw)",
            border: "0.1vw solid #eee2d73d",
            boxShadow: "0px 0px 25px rgba(69, 79, 170, 0.25) inset",

            margin: ".4vw",
          }}
        >
          <Typography
            sx={{
              // fontSize: "1.2vw",
              fontSize: {
                xs: "14px",
                lg: "1.2vw",
                xl: "1.3vw",
              },
              fontWeight: 600,
              color: "#fff",
              letterSpacing: "0.04vw",
              textAlign: "start",
            }}
          >
            {title.toUpperCase()}
          </Typography>

          <Typography
            sx={{
              // fontSize: "1.2vw",
              fontSize: {
                xs: "14px",
                lg: "1.2vw",
                xl: "1.3vw",
              },
              fontWeight: 600,
              color: "#fff",
              textAlign: "start",
            }}
          >
            UNIT
          </Typography>

          {title === "Commodity" && (
            <Typography
              sx={{
                fontSize: {
                  xs: "14px",
                  lg: "1.2vw",
                  xl: "1.3vw",
                },
                fontWeight: 600,
                color: "#fff",
                textAlign: "center",
              }}
            >
              BUY AED
            </Typography>
          )}

          <Typography
            sx={{
              // fontSize: "1.2vw",
              fontSize: {
                xs: "14px",
                lg: "1.2vw",
                xl: "1.3vw",
              },
              fontWeight: 600,
              color: "#fff",
              textAlign: "center",
            }}
          >
            SELL AED{" "}
          </Typography>
        </Box>

        <Box
          sx={{
            maxHeight: tableHeight,
          }}
        >
          {rows.length === 0 ? (
            <Typography
              sx={{
                py: "3vw",
                textAlign: "center",
                color: "rgba(227,192,120,0.4)",
                fontSize: "1.25vw",
              }}
            >
              No data available
            </Typography>
          ) : (
            <Swiper
              direction="vertical"
              slidesPerView={tableItemsNumber}
              loop={true}
              modules={[Autoplay]}
              autoplay={{
                delay: 0,
                disableOnInteraction: false,
              }}
              initialSlide={0}
              speed={3000} // 👈 higher = smoother slow scroll
              // allowTouchMove={false} // important for TV
              style={{
                height: tableHeight,

                backdropFilter: "blur(5px)",
                background: "#aa8a4b15",
                borderRadius: "1vw",
                border: "0.1vw solid #eee2d73d",
                boxShadow: "0px 0px 25px  rgba(69, 79, 170, 0.25)  inset",
                margin: ".4vw",
              }}
            >
              {rows.map((row: TableDataItem, index: number) => (
                <SwiperSlide key={index}>
                  <Box
                    key={index}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 0.8fr 0.8fr 0.8fr",
                      alignItems: "center",
                      py: ".7vw",
                      px: "1.5vw",
                      height: "100%",
                    }}
                  >
                    <Typography
                      sx={{
                        // fontSize: "1.24vw",
                        fontSize: {
                          xs: "14px",
                          sm: "12px",
                          lg: "1.6vw",
                          xl: "1.4vw",
                        },
                        fontWeight: 800,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center ",
                        justifyContent: "start",
                        gap: {
                          xs: "7px",
                          lg: "0.3vw",
                        },
                      }}
                    >
                      {row.metal_name ? row.metal_name : row.name}
                      <Typography
                        sx={{
                          // fontSize: "1vw",
                          fontSize: {
                            xs: "12px",
                            sm: "10px",
                            lg: "1.2vw",
                          },
                          fontWeight: 400,
                          color: "#fff",
                          // mb:'-0.5vw'
                        }}
                      >
                        {row.metal == "Minted Bar" ? "" : row.purity}
                      </Typography>
                    </Typography>

                    <Typography
                      sx={{
                        // fontSize: "1.18vw",
                        fontSize: {
                          xs: "14px",
                          lg: "1.3vw",
                          xl: "1.4vw",
                        },
                        color: "#fff",
                        textAlign: "start",
                      }}
                    >
                      {row.weight}
                    </Typography>
                    <Typography
                      sx={{
                        // fontSize: "1.32vw",
                        fontSize: {
                          xs: "14px",
                          lg: "1.5vw",
                          xl: "1.4vw",
                        },
                        fontVariantNumeric: "tabular-nums",
                        textAlign: "center",

                        fontWeight: 600,
                        color: "#fff", // soft pink ASK
                      }}
                    >
                      {formatPrice(row.bid)}
                    </Typography>

                    <Typography
                      sx={{
                        // fontSize: "1.32vw",
                        fontSize: {
                          xs: "14px",
                          lg: "1.5vw",
                          xl: "1.4vw",
                        },
                        fontVariantNumeric: "tabular-nums",
                        textAlign: "center",

                        fontWeight: 600,
                        color: "#fff", // soft pink ASK
                      }}
                    >
                      {formatPrice(row.ask)}
                    </Typography>
                  </Box>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </Box>
      </Box>
    );
  };

  /* -----------------------
     RENDER
  ------------------------ */

  return (
    <Box sx={{ width: "100%" }}>
      {isCommodity && renderTable("Commodity", commodityData)}
      {isMintedBar && renderTable("Minted Bars", mintedBarData)}
    </Box>
  );
};

export default CommodityTable;
