'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import logoPlaceholder from '../images/logo-placeholder.svg';

interface MerchantLogoProps {
  theme: 'theme1' | 'theme2' | 'theme3';
  merchant: any;
  layout: any;
  colors?: any;
}

const MerchantLogo = ({ theme, merchant, layout, colors = {} }: MerchantLogoProps) => {
  // Common properties
  const showLogo = layout?.styles?.showLogo ?? true;
  const showName = layout?.styles?.showName ?? true;
  const logoUrl = layout?.styles?.logoUrl || merchant?.logo || logoPlaceholder.src;
  const companyName = merchant?.companyName || 'Merchant';

  const isTheme1 = theme === 'theme1';
  const isTheme2 = theme === 'theme2';
  const isTheme3 = theme === 'theme3';

  // Box dimensions and styling based on theme
  let boxWidth = { xs: '40vw', sm: '18vw' };
  let boxHeight: any = 'auto';
  let boxMx: any = undefined;

  if (isTheme2) {
    boxWidth = { xs: '40vw', sm: '20vw' };
    boxMx = 'auto';
  } else if (isTheme3) {
    boxWidth = { xs: '40vw', sm: '25vw' };
    boxHeight = { xs: '150px', sm: '250px' };
  }

  // Image styling based on theme
  let imgStyle: React.CSSProperties = {
    width: '100%',
    height: isTheme3 ? '100%' : 'auto',
    objectFit: 'contain',
  };

  if (isTheme2) {
    imgStyle.maxHeight = '15vw';
  }

  return (
    <Box
      sx={{
        height: boxHeight,
        width: boxWidth,
        marginBottom: { xs: '20px', sm: '0vw' },
        mx: boxMx,
      }}
    >
      {showLogo ? (
        <img src={logoUrl} alt={companyName} style={imgStyle} />
      ) : showName ? (
        isTheme3 ? (
          <Box sx={{ fontSize: '2vw', fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
            {companyName}
          </Box>
        ) : (
          <Typography
            variant="h4"
            sx={{
              color: isTheme1 ? colors.primary || '#d4a017' : '#d4a017',
              fontWeight: 'bold',
            }}
          >
            {companyName}
          </Typography>
        )
      ) : null}
    </Box>
  );
};

export default MerchantLogo;
