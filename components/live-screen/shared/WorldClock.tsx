'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

const clockConfig = [
  { key: 'india', label: 'INDIA', timeZone: 'Asia/Kolkata', flag: '/images/india.png' },
  { key: 'uae', label: 'UAE', timeZone: 'Asia/Dubai', flag: '/images/uae.png' },
  { key: 'london', label: 'LONDON', timeZone: 'Europe/London', flag: '/images/uk.png' },
  { key: 'usa', label: 'USA', timeZone: 'America/New_York', flag: '/images/usa.png' },
];

interface WorldClockProps {
  theme: 'theme1' | 'theme2' | 'theme3';
  colors?: any;
}

const WorldClockHorizontal = ({ theme, colors = {} }: WorldClockProps) => {
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

  // Theme 2 only shows 3 clocks (removes USA)
  const displayClocks = isTheme2 ? clockConfig.filter((c) => c.key !== 'usa') : clockConfig;

  // Colors
  const defaultColor = isTheme1 ? '#000000' : isTheme3 ? '#FFC983' : '#fff';
  const textColor = colors?.clockText || defaultColor;

  return (
    <Box
      sx={{
        display: isTheme2 ? 'grid' : 'flex',
        alignItems: 'center',
        gridTemplateColumns: isTheme2 ? 'repeat(3, 1fr)' : undefined,
        justifyContent: isTheme2 ? undefined : 'space-around',
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
            justifyContent: isTheme2 ? 'center' : undefined,
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
                fontSize: isTheme1 ? { xs: '8px', lg: '0.6vw' } : { xs: '14px', lg: '1vw' },
                fontWeight: isTheme1 ? '600' : '500',
                textTransform: isTheme1 ? 'uppercase' : undefined,
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
