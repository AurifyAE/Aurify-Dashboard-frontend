'use client';

import React, { createContext, useCallback, useContext, useState, useMemo, ReactNode } from 'react';
import axiosInstance from '../app/axios/axiosInstance';

export interface SpotRatePastedContextValue {
  marketData: Record<string, any>;
  updateMarketData: (newMarketData: Record<string, any>) => void;
  commodities: any[];
  spreadMarginData: Record<string, any>;
  getSpreadOrMarginFromDB: (metal: string, type: string) => number;
  categoryId: string | null;
  setCategoryId: (id: string) => void;
  adminId: string;
  setAdminId: (id: string) => void;
  isLoading: boolean;
  fetchData: () => Promise<void>;
  bidAskPrices: Record<string, { bid: number; ask: number }>;
  updateBidAskPrices: (metal: string, bid: number, ask: number) => void;
}

const SpotRateContext = createContext<SpotRatePastedContextValue | null>(null);

export const SpotRatePastedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [commodities, setCommodities] = useState<any[]>([]);
  const [spreadMarginData, setSpreadMarginData] = useState<Record<string, any>>({});
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [adminId, setAdminId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bidAskPrices, setBidAskPrices] = useState<Record<string, { bid: number; ask: number }>>(
    {}
  );

  const fetchData = useCallback(async () => {
    if (!categoryId || !adminId) return;

    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/spotrates/${adminId}/${categoryId}`);

      if (response.data) {
        setSpreadMarginData(response.data);
        if (response.data.commodities) {
          setCommodities(response.data.commodities);
        }
        if (response.data.marketData) {
          setMarketData(response.data.marketData);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, adminId]);

  const updateMarketData = useCallback((newMarketData: Record<string, any>) => {
    setMarketData((prevData) => ({
      ...prevData,
      ...newMarketData,
    }));
  }, []);

  const updateBidAskPrices = useCallback((metal: string, bid: number, ask: number) => {
    setBidAskPrices((prevPrices) => ({
      ...prevPrices,
      [metal]: { bid, ask },
    }));
  }, []);

  const getSpreadOrMarginFromDB = useCallback(
    (metal: string, type: string) => {
      const lowerMetal = metal.toLowerCase();
      const key = `${lowerMetal}${
        type.charAt(0).toUpperCase() + type.slice(1)
      }${type === 'low' || type === 'high' ? 'Margin' : 'Spread'}`;
      return spreadMarginData[key] || 0;
    },
    [spreadMarginData]
  );

  const setAdminIdAndFetchData = useCallback(
    (id: string) => {
      setAdminId(id);
      if (categoryId) {
        fetchData();
      }
    },
    [categoryId, fetchData]
  );

  const setCategoryIdAndFetchData = useCallback(
    (id: string) => {
      setCategoryId(id);
      if (adminId) {
        fetchData();
      }
    },
    [adminId, fetchData]
  );

  // Memoize the entire value object to prevent consumers from re-rendering on parent renders
  const value = useMemo<SpotRatePastedContextValue>(
    () => ({
      marketData,
      updateMarketData,
      commodities,
      spreadMarginData,
      getSpreadOrMarginFromDB,
      categoryId,
      setCategoryId: setCategoryIdAndFetchData,
      adminId,
      setAdminId: setAdminIdAndFetchData,
      isLoading,
      fetchData,
      bidAskPrices,
      updateBidAskPrices,
    }),
    [
      marketData,
      updateMarketData,
      commodities,
      spreadMarginData,
      getSpreadOrMarginFromDB,
      categoryId,
      setCategoryIdAndFetchData,
      adminId,
      setAdminIdAndFetchData,
      isLoading,
      fetchData,
      bidAskPrices,
      updateBidAskPrices,
    ]
  );

  return <SpotRateContext.Provider value={value}>{children}</SpotRateContext.Provider>;
};

export const useSpotRatePasted = (): SpotRatePastedContextValue => {
  const context = useContext(SpotRateContext);
  if (!context) {
    throw new Error('useSpotRatePasted must be used inside <SpotRatePastedProvider>');
  }
  return context;
};
