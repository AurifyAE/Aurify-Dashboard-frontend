'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/autoplay';

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
  9999: '24K',
  '999.9': '24K',
  999: '24K',
  995: '24K',
  958: '23K',
  950: '23K',
  920: '22K',
  916: '22K',
  900: '21.6K',
  875: '21K',
  833: '20K',
  750: '18K',
  708: '17K',
  700: '16.8K',
  666: '16K',
  625: '15K',
  585: '14K',
  583: '14K',
  500: '12K',
  417: '10K',
  375: '9K',
};

interface CommodityTableProps {
  theme: 'theme1' | 'theme2' | 'theme3';
  items?: any[];
  goldData: any;
  silverData: any;
  colors?: any;
}

const CommodityTable = ({
  theme,
  items = [],
  goldData,
  silverData,
  colors = {},
}: CommodityTableProps) => {
  const getSpot = (metal: string) => {
    const lower = metal?.toLowerCase() || '';
    if (lower.includes('gold') || lower.includes('minted')) return goldData;
    if (lower.includes('silver')) return silverData;
    return null;
  };

  const purityFactor = (purity: any) => {
    if (!purity) return 1;
    const num = Number(purity);
    return num > 1000 ? num / 10000 : num / 1000;
  };

  const formatPrice = (value: number) => {
    if (value == null || isNaN(value)) return '—';
    const intLen = Math.floor(Math.abs(value)).toString().length;
    let decimals = 3;
    if (intLen >= 4) decimals = 0;
    else if (intLen === 3) decimals = 2;
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const getPurityLabel = (purity: string | number) => PURITY_TO_KARAT[purity] || purity;

  const rows =
    items
      ?.map((item) => {
        const spot = getSpot(item.metal);
        const effectiveSpot = spot || goldData;
        if (!effectiveSpot) return null;

        const weightKey = (item.weight || '') as keyof typeof UNIT_MULTIPLIER;
        const mult = UNIT_MULTIPLIER[weightKey] || 1;
        const pur = purityFactor(item.purity);
        const unitValue = Number(item.unit) || 1;

        const baseBid = (effectiveSpot.bid / OUNCE) * AED * mult * unitValue * pur;
        const baseAsk = (effectiveSpot.ask / OUNCE) * AED * mult * unitValue * pur;

        return {
          metal_name: item.name || item.metal_name,
          purity: item.purity,
          metal: item.metal,
          unit: `${unitValue} ${item.weight || item.unit}`,
          bid: baseBid + (Number(item.buyCharge) || 0) + (Number(item.buyPremium) || 0),
          ask: baseAsk + (Number(item.sellCharge) || 0) + (Number(item.sellPremium) || 0),
        };
      })
      .filter(Boolean) ?? [];

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth <= 768);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  if (!rows.length) return null;

  // -- Theme Specific Configs --
  const isTheme1 = theme === 'theme1';
  const isTheme2 = theme === 'theme2';
  const isTheme3 = theme === 'theme3';

  // Grid layout
  const gridColumns = isTheme1 ? '2.5fr 1fr 1fr 1fr' : '1.4fr 0.8fr 0.8fr 0.8fr';
  const tableHeight = isMobile ? '35vw' : isTheme1 ? '20vw' : '18vw';

  // Header configs
  let headerBg =
    colors.tableHeaderBg ||
    'linear-gradient(90deg, rgba(35,18,10,0.9) 0%, rgba(55,25,12,0.95) 50%, rgba(35,18,10,0.9) 100%)';
  let headerBorder = '0.05vw solid rgba(255, 210, 170, 0.2)';
  let headerShadow = '0 0.4vw 1vw rgba(0,0,0,0.4)';
  let headerTitles = ['ITEM', 'UNIT', 'BUY', 'SELL'];

  if (isTheme2) {
    headerBg = colors.tableHeaderBg || '#aa8a4b11';
    headerBorder = '0.1vw solid #eee2d73d';
    headerShadow = '0px 0px 25px rgba(69, 79, 170, 0.25) inset';
    headerTitles = ['COMMODITY', 'UNIT', 'BUY AED', 'SELL AED'];
  } else if (isTheme3) {
    headerBg =
      colors.tableHeaderBg ||
      'linear-gradient(180deg, rgba(40,15,5,0.55) 0%, rgba(20,8,2,0.45) 100%)';
    headerBorder = '0.1vw solid rgba(249 184 98 / 0.44)';
    headerShadow = 'inset 0 0 0.08vw rgba(255,255,255,0.15), 0 0 0.8vw rgba(255,140,60,0.08)';
    headerTitles = ['COMMODITY', 'UNIT', 'BUY AED', 'SELL AED'];
  }

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: gridColumns,
          gap: '0',
          py: '0.9vw',
          px: '1.5vw',
          alignItems: isTheme1 ? 'center' : 'end',
          background: headerBg,
          borderRadius: '1vw',
          border: headerBorder,
          boxShadow: headerShadow,
          mb: '0.4vw',
          margin: '.4vw',
          backdropFilter: 'blur(0.35vw)',
        }}
      >
        {headerTitles.map((title, i) => (
          <Typography
            key={title}
            sx={{
              fontSize: { xs: '14px', lg: '1.2vw', xl: '1.3vw' },
              fontWeight: 600,
              color: colors.tableText || (isTheme1 ? '#e2c08d' : '#fff'),
              textAlign: i < 2 ? 'start' : 'center',
              letterSpacing: i === 0 ? '0.04vw' : '0',
            }}
          >
            {title}
          </Typography>
        ))}
      </Box>

      {/* Table Body */}
      <Box
        sx={{
          maxHeight: tableHeight,
          mt: '1vw',
        }}
      >
        <Swiper
          direction="vertical"
          slidesPerView={isTheme1 ? Math.min(5, rows.length) : Math.min(6, rows.length)}
          loop={rows.length > (isTheme1 ? 5 : 6)}
          modules={[Autoplay]}
          autoplay={{ delay: 0, disableOnInteraction: false }}
          speed={3000}
          style={{
            height: tableHeight,
            backdropFilter: 'blur(0.4vw)',
            borderRadius: '1vw',
            background: isTheme1
              ? 'transparent'
              : isTheme2
                ? colors.tableRowBg || '#aa8a4b11'
                : colors.tableRowBg ||
                  'linear-gradient(180deg, rgba(30,10,3,0.3) 0%, rgba(20,8,2,0.6) 100%)',
            ...(isTheme2 && {
              border: '0.1vw solid #eee2d73d',
              boxShadow: '0px 0px 25px rgba(69, 79, 170, 0.25) inset',
              margin: '.4vw',
            }),
            ...(isTheme3 && {
              border: '0.1vw solid #FFC98370',
              boxShadow: 'inset 0 0 0.08vw rgba(255,255,255,0.15), 0 0 0.8vw rgba(255,140,60,0.08)',
              margin: '.4vw',
            }),
          }}
        >
          {rows.map((row, index) => {
            let rowBg = 'transparent';
            let rowBorder = 'none';

            if (isTheme1) {
              rowBg =
                'linear-gradient(90deg, rgba(20,10,5,0.85) 0%, rgba(35,15,8,0.9) 50%, rgba(20,10,5,0.85) 100%)';
              rowBorder = '0.05vw solid rgba(255,255,255,0.05)';
            }

            if (!row) return null;

            return (
              <SwiperSlide key={index}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: gridColumns,
                    gap: '0',
                    alignItems: 'center',
                    background: rowBg,
                    py: '.7vw',
                    px: '1.5vw',
                    border: rowBorder,
                    height: '100%',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: {
                        xs: '14px',
                        sm: '12px',
                        lg: '1.6vw',
                        xl: '1.4vw',
                      },
                      fontWeight: 800,
                      color: colors.tableText || '#fff',
                      display: isTheme1 ? 'grid' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'start',
                      gridTemplateColumns: isTheme1 ? 'auto auto' : undefined,
                      textAlign: 'start',
                      lineHeight: '1',
                      gap: { xs: '7px', lg: '0.3vw' },
                    }}
                  >
                    {row.metal_name || row.metal}
                    <Typography
                      sx={{
                        fontSize: { xs: '12px', sm: '10px', lg: '1.2vw' },
                        fontWeight: 400,
                        color: colors.tableText || '#fff',
                      }}
                    >
                      {isTheme1
                        ? getPurityLabel(row.purity)
                        : row.metal === 'Minted Bar'
                          ? ''
                          : row.purity}
                    </Typography>
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: { xs: '14px', lg: '1.3vw', xl: '1.4vw' },
                      color: colors.tableText || '#fff',
                      textAlign: 'start',
                    }}
                  >
                    {row.unit}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: {
                        xs: '14px',
                        lg: isTheme1 ? '1.4vw' : '1.5vw',
                        xl: isTheme1 ? '1.5vw' : '1.4vw',
                      },
                      fontWeight: 600,
                      color: colors.tableText || '#fff',
                      textAlign: 'center',
                      fontVariantNumeric: isTheme2 ? 'tabular-nums' : undefined,
                    }}
                  >
                    {formatPrice(row.bid)}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: {
                        xs: '14px',
                        lg: isTheme1 ? '1.4vw' : '1.5vw',
                        xl: isTheme1 ? '1.5vw' : '1.4vw',
                      },
                      fontWeight: 600,
                      color: colors.tableText || '#fff',
                      textAlign: 'center',
                      fontVariantNumeric: isTheme2 ? 'tabular-nums' : undefined,
                    }}
                  >
                    {formatPrice(row.ask)}
                  </Typography>
                </Box>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </Box>
    </Box>
  );
};

export default CommodityTable;
