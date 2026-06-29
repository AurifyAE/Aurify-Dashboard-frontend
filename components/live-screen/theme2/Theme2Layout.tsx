'use client';
import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography } from '@mui/material';
import SpotRate from './SpotRate';
import CommodityTable from './CommodityTable';
import NewsTicker from './News';
import WorldClockHorizontal from './WorldClock';
import SystemClock from './SystemClock';
import PoweredByAurify from './PoweredByAurify';
import io from 'socket.io-client';
import { API_URL, API_KEY, SOCKET_SECRET } from '@/lib/env';

export default function Theme2Layout({
  data,
  isPreview = false,
}: {
  data?: any;
  isPreview?: boolean;
}) {
  const { merchant, theme, layout, commodities, news } = data || {};
  const widgets = layout?.widgets || ['Spot Rates', 'Commodity Table', 'News', 'Clock'];
  const colors = layout?.styles?.colorOverride || layout?.colorOverride || {};
  const showLogo = layout?.styles?.showLogo ?? true;
  const showName = layout?.styles?.showName ?? true;

  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [serverURL, setServerURL] = useState<string | null>(null);

  useEffect(() => {
    const fetchServerURL = async () => {
      try {
        const response = await fetch(`${API_URL}/get-server`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Secret-Key': API_KEY,
          },
          credentials: 'include',
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
        console.error('Failed to fetch server URL:', err);
      }
    };
    fetchServerURL();
  }, []);

  useEffect(() => {
    if (!serverURL) return;
    const socket = io(serverURL, {
      query: { secret: SOCKET_SECRET },
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      socket.emit('request-data', ['GOLD', 'SILVER']);
    });

    socket.on('market-data', (data) => {
      const updates: any[] = [];
      if (Array.isArray(data)) {
        updates.push(...data);
      } else if (data && typeof data === 'object') {
        if (data.symbol) {
          updates.push(data);
        } else {
          for (const key of ['Gold', 'GOLD', 'XAU', 'Silver', 'SILVER', 'XAG']) {
            if (data[key] && typeof data[key] === 'object') {
              updates.push({ symbol: key, ...data[key] });
            }
          }
        }
      }

      if (updates.length > 0) {
        setMarketData((prev) => {
          const next = { ...prev };
          updates.forEach((item) => {
            if (item.symbol) {
              const sym = item.symbol.toUpperCase();
              next[sym] = { ...next[sym], ...item };
              if (sym === 'XAU') next['GOLD'] = { ...next['GOLD'], ...item };
              if (sym === 'XAG') next['SILVER'] = { ...next['SILVER'], ...item };
            }
          });
          return next;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [serverURL, isPreview]);

  const rawGold = marketData['GOLD'];
  const goldData = rawGold
    ? {
        ...rawGold,
        ask: rawGold.ask || (rawGold.bid ? (parseFloat(rawGold.bid) + 0.5).toFixed(2) : undefined),
      }
    : {
        bid: 2345.6,
        ask: 2346.1,
        low: 2340.0,
        high: 2350.0,
      };

  const rawSilver = marketData['SILVER'];
  const silverData = rawSilver
    ? {
        ...rawSilver,
        ask:
          rawSilver.ask ||
          (rawSilver.bid ? (parseFloat(rawSilver.bid) + 0.05).toFixed(2) : undefined),
      }
    : {
        bid: 28.4,
        ask: 28.45,
        low: 28.0,
        high: 28.6,
      };

  const defaultCommodities = [
    {
      metal: 'GOLD',
      metal_name: 'Gold Bar 999',
      purity: 999,
      unit: 1,
      weight: 'GM',
      buyCharge: 0,
      buyPremium: 2,
      sellCharge: 0,
      sellPremium: 2,
      group: 'commodity',
    },
    {
      metal: 'GOLD',
      metal_name: 'Gold Coin',
      purity: 916,
      unit: 8,
      weight: 'GM',
      buyCharge: 0,
      buyPremium: 10,
      sellCharge: 0,
      sellPremium: 10,
      group: 'group1',
    },
  ];
  const displayCommodities = commodities?.length > 0 ? commodities : defaultCommodities;

  return (
    <Box
      sx={{
        height: isPreview ? '100%' : '100dvh',
        minHeight: '100dvh',
        color: 'white',
        pb: { xs: '0', md: '3vw' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        position: 'relative',
        fontFamily: "'Scaver', sans-serif",
      }}
    >
      <Box
        sx={{
          position: isPreview ? 'absolute' : 'fixed',
          left: '0',
          bottom: '0',
          top: '0',
          right: '0',
          height: '100%',
          width: '100%',
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={theme?.customizations?.backgroundUrl || '/images/theme2-bg.png'}
          alt="background"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
        />
      </Box>

      <Grid
        container
        spacing={1}
        sx={{
          minHeight: '100%',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          zIndex: 1,
          position: 'relative',
          m: 0,
          p: '0 2vw',
          alignItems: 'center',
          width: '100%',
          display: 'flex',
        }}
      >
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            padding: '1vw .5vw',
            gap: '1vw',
          }}
        >
          {widgets.includes('Clock') && <SystemClock colors={colors} />}

          {widgets.includes('Commodity Table') && (
            <>
              <CommodityTable
                commodities={displayCommodities}
                isCommodity={true}
                goldData={goldData}
                silverData={silverData}
                colors={colors}
              />
              <CommodityTable
                commodities={displayCommodities}
                isMintedBar={true}
                goldData={goldData}
                silverData={silverData}
                colors={colors}
              />
            </>
          )}
          {widgets.includes('Clock') && <WorldClockHorizontal colors={colors} />}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'grid', padding: '1vw', gap: '1vw' }}>
          <Box
            sx={{
              height: 'auto',
              width: { xs: '40vw', sm: '20vw' },
              marginBottom: { xs: '20px', sm: '0vw' },
              mx: 'auto',
            }}
          >
            {showLogo ? (
              <img
                src={merchant?.logo || '/images/logo-placeholder.svg'}
                alt={merchant?.companyName}
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  maxHeight: '15vw',
                }}
              />
            ) : showName ? (
              <Typography variant="h4" sx={{ color: '#d4a017', fontWeight: 'bold' }}>
                {merchant?.companyName || 'Merchant'}
              </Typography>
            ) : null}
          </Box>

          {widgets.includes('Spot Rates') && (
            <SpotRate goldData={goldData} silverData={silverData} colors={colors} />
          )}
          <PoweredByAurify colors={colors} />
        </Grid>

        {widgets.includes('News') && (
          <Grid
            size={{ xs: 12 }}
            sx={{
              mt: { xs: '20px', md: '0' },
              position: 'fixed',
              zIndex: 1,
              bottom: '0',
              width: '100%',
              left: '0',
              p: 0,
            }}
          >
            <NewsTicker
              newsItems={news}
              merchantName={merchant?.companyName}
              newsHeading={layout?.header?.newsHeading || layout?.newsHeading}
              colors={colors}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
