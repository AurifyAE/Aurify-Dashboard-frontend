'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface SystemClockProps {
  theme: 'theme1' | 'theme2' | 'theme3';
  colors?: any;
}

const SystemClock = ({ theme, colors = {} }: SystemClockProps) => {
  const [timeData, setTimeData] = useState({
    day: '',
    date: '',
    time: '',
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();

      const dayStr = now.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();
      const dateStr = now
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        .toUpperCase();

      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      setTimeData({
        day: dayStr,
        date: dateStr,
        time: timeStr,
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const isTheme1 = theme === 'theme1';
  const isTheme3 = theme === 'theme3';
  const defaultColor = isTheme1 ? '#000000' : isTheme3 ? '#FFC983' : '#FFFFFF';
  const textColor = colors?.dateText || defaultColor;

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1vw',
          mb: '1vw',
          width: '100%',
          padding: '0vw 2.5vw',
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '12px', sm: '2vw' },
            fontWeight: 400,
            letterSpacing: '2px',
            color: textColor,
            lineHeight: '1',
          }}
        >
          {timeData.date || '-- --- ----'}
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '12px', sm: '1vw' },
            color: textColor,
            letterSpacing: '2px',
            lineHeight: '1',
          }}
        >
          {timeData.day || '-----'}
        </Typography>
      </Box>
    </Box>
  );
};

export default SystemClock;
