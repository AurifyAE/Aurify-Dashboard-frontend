'use client';
import React from 'react';
import CommonPoweredBy from '../shared/PoweredByAurify';

const PoweredByAurify = ({ colors }: { colors?: any }) => {
  return <CommonPoweredBy colors={colors} imageFilter="brightness(0) invert(1)" />;
};

export default PoweredByAurify;
