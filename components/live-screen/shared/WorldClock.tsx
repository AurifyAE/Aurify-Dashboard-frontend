'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

export const clockConfig = [
  { key: 'india', label: 'INDIA', timeZone: 'Asia/Kolkata', flag: '/images/india.png' },
  { key: 'uae', label: 'UAE', timeZone: 'Asia/Dubai', flag: '/images/uae.png' },
  { key: 'london', label: 'LONDON', timeZone: 'Europe/London', flag: '/images/uk.png' },
  { key: 'usa', label: 'USA', timeZone: 'America/New_York', flag: '/images/usa.png' },
  {
    key: 'singapore',
    label: 'SINGAPORE',
    timeZone: 'Asia/Singapore',
    flag: '/images/singapore.png',
  },
  { key: 'saudi', label: 'SAUDI', timeZone: 'Asia/Riyadh', flag: '/images/saudi.png' },
  { key: 'qatar', label: 'QATAR', timeZone: 'Asia/Qatar', flag: '/images/qatar.png' },
  { key: 'bahrain', label: 'BAHRAIN', timeZone: 'Asia/Bahrain', flag: '/images/bahrain.png' },
  { key: 'kuwait', label: 'KUWAIT', timeZone: 'Asia/Kuwait', flag: '/images/kuwait.png' },
  { key: 'oman', label: 'OMAN', timeZone: 'Asia/Muscat', flag: '/images/oman.png' },
];

interface WorldClockProps {
  theme: 'theme1' | 'theme2' | 'theme3';
  colors?: any;
  selectedClocks?: string[];
}

const WorldClockHorizontal = ({ theme, colors = {}, selectedClocks }: WorldClockProps) => {
  const [times, setTimes] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      const updatedTimes: Record<string, string> = {};

      clockConfig.forEach((clock) => {
        try {
          updatedTimes[clock.key] = now.toLocaleTimeString('en-US', {
            ...timeOptions,
            timeZone: clock.timeZone,
          });
        } catch (e) {
          updatedTimes[clock.key] = '--:--';
        }
      });
      setTimes(updatedTimes);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const isTheme1 = theme === 'theme1';
  const isTheme2 = theme === 'theme2';
  const isTheme3 = theme === 'theme3';

  // Use selected clocks if provided, otherwise fallback to theme defaults
  let displayClocks = clockConfig;

  if (selectedClocks && selectedClocks.length > 0) {
    displayClocks = selectedClocks
      .map((key) => clockConfig.find((c) => c.key === key))
      .filter((c): c is (typeof clockConfig)[0] => c !== undefined);
  } else {
    // By default, initially show only 3 clocks (India, UAE, London)
    displayClocks = clockConfig.slice(0, 3);
  }

  // Colors
  const defaultColor = isTheme1 ? '#000000' : isTheme3 ? '#FFC983' : '#fff';
  const textColor = colors?.clockText || defaultColor;

  return (
    <Box
      sx={{
        display: 'grid',
        alignItems: 'center',
        gridTemplateColumns: 'repeat(3, 1fr)',
        justifyContent: 'space-around',
        gap: '1vw',
        width: '100%',
      }}
    >
      {displayClocks.map((clock) => (
        <Box
          key={clock.key}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: '10px', lg: '1vw' },
          }}
        >
          <Box sx={{ width: { xs: '30px', lg: '3vw' } }}>
            <img
              src={clock.flag}
              alt={clock.label}
              style={{ width: '100%', height: 'auto' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'start', flexDirection: 'column' }}>
            <Typography
              sx={{
                color: textColor,
                fontSize: { xs: '8px', lg: '0.6vw' },
                fontWeight: '600',
                textTransform: 'uppercase',
              }}
            >
              {clock.label}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '14px', lg: '1vw' },
                color: textColor,
              }}
            >
              {times[clock.key] || '--:--'}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default WorldClockHorizontal;
