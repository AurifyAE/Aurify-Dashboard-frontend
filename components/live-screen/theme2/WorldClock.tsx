'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

const clockConfig = [
  {
    key: 'india',
    label: 'INDIA',
    timeZone: 'Asia/Kolkata',
    flag: '/images/india.png',
  },
  {
    key: 'uae',
    label: 'UAE',
    timeZone: 'Asia/Dubai',
    flag: '/images/uae.png',
  },
  {
    key: 'london',
    label: 'LONDON',
    timeZone: 'Europe/London',
    flag: '/images/uk.png',
  },
];

const WorldClockHorizontal = ({ colors }: { colors?: any }) => {
  const [times, setTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };

      const updatedTimes: Record<string, string> = {};

      clockConfig.forEach((clock) => {
        updatedTimes[clock.key] = now.toLocaleTimeString('en-US', {
          ...timeOptions,
          timeZone: clock.timeZone,
        });
      });

      setTimes(updatedTimes);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        display: 'grid',
        alignItems: 'center',
        gridTemplateColumns: 'repeat(3,1fr)',
        gap: '1vw',
        width: '100%',
      }}
    >
      {clockConfig.map((clock) => (
        <Box
          key={clock.key}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: {
              xs: '10px',
              lg: '1vw',
            },
          }}
        >
          <Box
            sx={{
              width: {
                xs: '30px',
                lg: '3vw',
              },
            }}
          >
            <img src={clock.flag} alt={clock.label} style={{ width: '100%', height: 'auto' }} />
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'start',
              flexDirection: 'column',
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: '14px',
                  lg: '1vw',
                },
                fontWeight: 500,
                color: colors?.clockText || '#fff',
              }}
            >
              {clock.label}
            </Typography>

            <Typography
              sx={{
                fontSize: {
                  xs: '14px',
                  lg: '1vw',
                },
                color: colors?.clockText || '#fff',
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
