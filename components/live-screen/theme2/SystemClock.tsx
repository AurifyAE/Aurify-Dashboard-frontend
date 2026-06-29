'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

const SystemClock = ({ colors }: { colors?: any }) => {
  const [timeData, setTimeData] = useState({
    day: '',
    date: '',
    time: '',
  });

  useEffect(() => {
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

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Glass Container */}
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
        {/* Date */}
        <Typography
          sx={{
            fontSize: {
              xs: '12px',
              sm: '2vw',
            },
            fontWeight: 400,
            letterSpacing: '2px',
            color: colors?.clockText || '#FFFFFF',
          }}
        >
          {timeData.date || '-- --- ----'}
        </Typography>
        {/* Day */}
        <Typography
          sx={{
            fontSize: {
              xs: '12px',
              sm: '1vw',
            },
            color: colors?.clockText || '#fff',
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
