'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import Marquee from 'react-fast-marquee';

interface NewsItem {
  title?: string;
  content?: string;
}

interface NewsTickerProps {
  newsItems?: NewsItem[];
  merchantName?: string;
  newsHeading?: string;
  colors?: any;
  containerBg?: string;
  brandColor?: string;
  brandBg?: string;
}

const NewsTicker = ({
  newsItems = [],
  merchantName,
  newsHeading,
  colors,
  containerBg = '#010101',
  brandColor,
  brandBg,
}: NewsTickerProps) => {
  const tickerItems =
    newsItems.length === 0
      ? [{ title: 'your news here' }]
      : newsItems.length === 1
        ? Array(5).fill(newsItems[0])
        : newsItems;

  return (
    <Box
      sx={{
        width: '100%',
        height: {
          xs: '35px',
          lg: '3vw',
        },
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: colors?.newsBg || containerBg,
        backdropFilter: 'blur(0.3vw)',
        borderTop: '0.1vw solid #eee2d73d',
      }}
    >
      {/* LEFT BRAND */}
      <Typography
        sx={{
          color: brandColor || colors?.newsText || '#fff',
          background: brandBg || colors?.newsBg || '#202020',
          fontSize: {
            xs: '12px',
            lg: '1.2vw',
          },
          fontWeight: '700',
          whiteSpace: 'nowrap',
          padding: '0 3.5vw',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '0.1vw',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {newsHeading || (merchantName ? `${merchantName} Updates` : 'Company Updates')}
      </Typography>

      {/* SCROLL AREA */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Marquee speed={40} gradient={false} autoFill={true} loop={0} direction="left">
          {tickerItems.map((item, index) => (
            <Typography
              key={index}
              component="span"
              sx={{
                color: colors?.newsText || '#fff',
                fontSize: {
                  xs: '12px',
                  lg: '1.3vw',
                },
                fontWeight: 500,
                whiteSpace: 'nowrap',
                mx: '1vw',
                flexShrink: 0,
              }}
            >
              {item?.title ? `${item.title}${item.content ? ` - ${item.content}` : ''}` : ''}
            </Typography>
          ))}
        </Marquee>
      </Box>
    </Box>
  );
};

export default NewsTicker;
