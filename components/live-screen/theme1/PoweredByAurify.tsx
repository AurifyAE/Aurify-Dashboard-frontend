'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

const PoweredByAurify = () => {
  return (
    <Box
      sx={{
        textDecoration: 'none',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6vw',
        padding: '0.8vw 1.4vw',
      }}
    >
      <Typography
        component="a"
        href="https://www.aurify.ae"
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          fontSize: { xs: '15px', md: '1.2vw' },
          fontWeight: 500,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5vw',
          whiteSpace: 'nowrap',
          letterSpacing: '0.05em',
        }}
      >
        Powered by
        <Box
          component="img"
          src="/images/aurify-logo.svg"
          alt="Aurify"
          sx={{
            height: { xs: '5vw', md: '1.5vw' },
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
          }}
        />
      </Typography>
    </Box>
  );
};

export default PoweredByAurify;
