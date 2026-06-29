'use client';
import React from 'react';
import CommonPoweredBy from '../shared/PoweredByAurify';

const PoweredByAurify = ({ colors }: { colors?: any }) => {
  return <CommonPoweredBy colors={colors} defaultColor="#FFC983" />;
};

export default PoweredByAurify;
