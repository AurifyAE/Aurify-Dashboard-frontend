'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface LiveSpotRateProps {
  goldData: any;
  silverData: any;
  colors?: any;
}

const LiveSpotRate = ({ goldData, silverData, colors = {} }: LiveSpotRateProps) => {
  const [goldBidDir, setGoldBidDir] = useState('neutral');
  const [goldAskDir, setGoldAskDir] = useState('neutral');
  const [silverBidDir, setSilverBidDir] = useState('neutral');
  const [silverAskDir, setSilverAskDir] = useState('neutral');

  const prev = useRef({
    goldBid: null,
    goldAsk: null,
    silverBid: null,
    silverAsk: null,
  });

  const detectChange = (prevVal: any, currVal: any, setDir: any) => {
    if (prevVal === null) return currVal;

    if (currVal > prevVal) {
      setDir('rise');
      setTimeout(() => setDir('neutral'), 800);
    } else if (currVal < prevVal) {
      setDir('fall');
      setTimeout(() => setDir('neutral'), 800);
    }
    return currVal;
  };

  useEffect(() => {
    if (goldData?.bid) {
      prev.current.goldBid = detectChange(prev.current.goldBid, goldData.bid, setGoldBidDir);
    }
  }, [goldData?.bid]);

  useEffect(() => {
    if (goldData?.ask) {
      prev.current.goldAsk = detectChange(prev.current.goldAsk, goldData.ask, setGoldAskDir);
    }
  }, [goldData?.ask]);

  useEffect(() => {
    if (silverData?.bid) {
      prev.current.silverBid = detectChange(
        prev.current.silverBid,
        silverData.bid,
        setSilverBidDir
      );
    }
  }, [silverData?.bid]);

  useEffect(() => {
    if (silverData?.ask) {
      prev.current.silverAsk = detectChange(
        prev.current.silverAsk,
        silverData.ask,
        setSilverAskDir
      );
    }
  }, [silverData?.ask]);

  const getColors = (dir: string, isBuy: boolean) => {
    if (dir === 'rise')
      return {
        bgColor: '#4dbf00',
        border: '1px solid #4dbf00',
        color: 'white',
      };
    if (dir === 'fall')
      return {
        bgColor: '#FF0040',
        border: '1px solid #FF0040',
        color: 'white',
      };
    return {
      bgColor: isBuy ? colors?.buyBg || '#F0F8FF00' : colors?.sellBg || '#F0F8FF00',
      border: '1px solid #FFFFFF',
      color: isBuy ? colors?.buyText || '#fff' : colors?.sellText || '#fff',
    };
  };

  const PricePulse = ({ label, value, dir }: { label: string; value: any; dir: string }) => {
    const { bgColor, border, color } = getColors(dir, label === 'BID');
    const hasPulse = dir !== 'neutral';

    const type = label;
    const isBuy = type === 'BID';

    return (
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          mb: '.5vw',
          overflow: 'hidden',
          borderRadius: '1vw',
          ...(hasPulse && {
            animation: dir === 'rise' ? 'pulseRise 0.8s ease-out' : 'pulseFall 0.8s ease-out',
            bgcolor:
              dir === 'rise' ? '0 0 0 0 rgba(0,255,157,0.6)' : '0 0 0 0 rgba(255,51,102,0.6)',
          }),
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '15px', sm: '2.5vw', md: '1.5vw' },
            letterSpacing: '0.25vw',
            color: '#fff',
            pl: '1vw',
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: {
              xs: '18px',
              sm: '2.5vw',
              md: '1.8vw',
              lg: '2.4vw',
              xl: '2.4vw',
            },
            fontWeight: 800,
            letterSpacing: '0.18vw',
            textAlign: 'center',
            color: '#fff',
            border: border,
            borderRadius: '1vw',
            fontVariantNumeric: 'tabular-nums',
            transition: 'all 0.4s ease',
          }}
        >
          {value || '---'}
        </Typography>
      </Box>
    );
  };

  const MetalPanel = ({
    data,
    bidDir,
    askDir,
    theme,
  }: {
    data: any;
    bidDir: string;
    askDir: string;
    theme: string;
  }) => {
    const isSilver = theme === 'silver';
    let title = isSilver ? 'SILVER' : 'GOLD';

    return (
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '1.8vw',
          backdropFilter: 'blur(0.8vw)',
          background:
            theme === 'gold' && colors?.buyBg
              ? colors.buyBg
              : theme === 'silver' && colors?.sellBg
                ? colors.sellBg
                : `linear-gradient(135deg,  rgba(46, 16, 1, 0.52) 0%,  rgba(88, 53, 35, 0.72), rgba(72, 29, 7, 0.52) 100%)`,
          border: '0.18vw solid rgba(255, 225, 190, 0.28)',
          padding: { xs: '2vw 3vw', sm: '0.5vw 2vw', md: '1.5vw 1vw' },
          display: 'grid',
          alignItems: 'center',
          gap: '1vw',
          gridTemplateColumns: '.7fr 1fr 1fr',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            padding: '0.08vw',
            borderRadius: 'inherit',
            background: `linear-gradient(150deg, rgba(255, 210, 170, 0.32) 0%, #fce0c7ff 35%, #6B3417 70%, #FFD7A8 100%)`,
            WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{ width: '4.5vw', height: '4.5vw', objectFit: 'contain' }}
            component="img"
            src={isSilver ? '/images/silver-bar.png' : '/images/gold-bar.png'}
            alt={title}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <Box
            sx={{
              fontSize: { xs: '14px', md: '1.7vw' },
              fontWeight: 700,
              letterSpacing: '0.1em',
              background: isSilver
                ? 'linear-gradient(90deg, #CCFBFF,#9AC6FF)'
                : 'linear-gradient(90deg, #FFF7CC,#FFCD9A)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: '1',
            }}
          >
            {title}
          </Box>
        </Box>

        <Box
          sx={{
            fontSize: {
              xs: '15px',
              sm: '2.5vw',
              md: '1.8vw',
              lg: '1.5vw',
              xl: '1.2vw',
            },
            color: '#fff',
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          <PricePulse label="BID" value={data?.bid} dir={bidDir} />
          LOW <span style={{ color: '#FF0040' }}>{data?.low || '---'}</span>
        </Box>

        <Box
          sx={{
            fontSize: {
              xs: '15px',
              sm: '2.5vw',
              md: '1.8vw',
              lg: '1.5vw',
              xl: '1.2vw',
            },
            color: '#fff',
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          <PricePulse label="ASK" value={data?.ask} dir={askDir} />
          HIGH <span style={{ color: '#4dbf00' }}>{data?.high || '---'}</span>
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gap: '1vw',
        width: '100%',
        alignItems: 'end',
        marginTop: { xs: '20px', sm: '0vw' },
        gridTemplateColumns: { xs: '1fr' },
      }}
    >
      <MetalPanel data={goldData} bidDir={goldBidDir} askDir={goldAskDir} theme="gold" />
      <MetalPanel data={silverData} bidDir={silverBidDir} askDir={silverAskDir} theme="silver" />
    </Box>
  );
};

export default LiveSpotRate;
