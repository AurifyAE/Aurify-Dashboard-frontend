'use client';
import React from 'react';
import CommonPoweredBy from '../shared/PoweredByAurify';

const PoweredByAurify = ({ colors }: { colors?: any }) => {
  return <CommonPoweredBy colors={colors} fontSize={{ xs: '15px', md: '1vw' }} mt="auto" />;
};

export default PoweredByAurify;
