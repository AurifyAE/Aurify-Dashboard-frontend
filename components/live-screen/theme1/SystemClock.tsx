'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

const SystemClock = ({ colors = {} }: { colors?: any }) => {
  const [timeData, setTimeData] = useState({ day: '', date: '', time: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const MONTHS = [
        'JAN',
        'FEB',
        'MAR',
        'APR',
        'MAY',
        'JUN',
        'JUL',
        'AUG',
        'SEP',
        'OCT',
        'NOV',
        'DEC',
      ];

      const dayStr = DAYS[now.getDay()];
      const dateStr = `${String(now.getDate()).padStart(2, '0')} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      setTimeData({ day: dayStr, date: dateStr, time: timeStr });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1vw',
          width: '100%',
          padding: '0vw 2.5vw',
          borderRadius: '20px',
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '12px', sm: '2vw' },
            fontWeight: 400,
            letterSpacing: '2px',
            color: colors.clockText || '#fff',
          }}
        >
          {timeData.date || '-- --- ----'}
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '12px', sm: '1vw' },
            color: colors.clockText || '#fff',
            letterSpacing: '2px',
          }}
        >
          {timeData.day || '-----'}
        </Typography>
      </Box>
    </Box>
  );
};

export default SystemClock;
