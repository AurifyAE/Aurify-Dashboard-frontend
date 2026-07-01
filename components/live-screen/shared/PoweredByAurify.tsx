'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import aurifyLogoBlack from '../images/aurify-logo-black.svg';
import aurifyLogo from '../images/aurify-logo.svg';

interface PoweredByAurifyProps {
  colors?: any;
  fontSize?: any;
  defaultColor?: string;
  mt?: string | number;
}

const PoweredByAurify = ({
  colors,
  fontSize = { xs: '15px', md: '1.2vw' },
  defaultColor = '#fff',
  mt,
}: PoweredByAurifyProps) => {
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
        ...(mt && { mt }),
      }}
    >
      <Typography
        component="a"
        href="https://www.aurify.ae"
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          fontSize,
          fontWeight: 500,
          color: colors?.poweredByText || defaultColor,
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
          src={
            String(colors?.useBlackLogo) === 'true'
              ? aurifyLogoBlack.src
              : aurifyLogo.src
          }
          alt="Aurify"
          sx={{
            height: { xs: '5vw', md: '1.5vw' },
            objectFit: 'contain',
          }}
        />
      </Typography>
    </Box>
  );
};

export default PoweredByAurify;
