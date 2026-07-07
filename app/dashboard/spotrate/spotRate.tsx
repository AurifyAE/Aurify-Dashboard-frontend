'use client';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';
import axiosInstance from '../../axios/axiosInstance';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { marketplaceApi } from '@/lib/api/marketplace';
import DashboardShell from '@/components/dashboard/DashboardShell';
import AddCommodityModal from './AddCommodityModal';
import { API_URL, API_KEY, SOCKET_SECRET } from '@/lib/env';

interface CurrencySelectorProps {
  onCurrencyChange: (currency: string, exchangeRate: number) => void;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = React.memo(({ onCurrencyChange }) => {
  const { currency, setCurrency } = useCurrency();
  const exchangeRates = useMemo<Record<string, number>>(
    () => ({ AED: 3.674, USD: 1, EUR: 0.92, GBP: 0.79 }),
    []
  );

  const handleChange = useCallback(
    (newCurrency: string) => {
      setCurrency(newCurrency);
      onCurrencyChange(newCurrency, exchangeRates[newCurrency]);
    },
    [onCurrencyChange, setCurrency, exchangeRates]
  );

  const options = [
    { value: 'AED', label: 'AED', flag: '🇦🇪' },
    { value: 'USD', label: 'USD', flag: '🇺🇸' },
    { value: 'EUR', label: 'EUR', flag: '🇪🇺' },
    { value: 'GBP', label: 'GBP', flag: '🇬🇧' },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
      {options.map((opt) => {
        const isSelected = currency === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleChange(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
              isSelected
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            <span>{opt.flag}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
});

CurrencySelector.displayName = 'CurrencySelector';

interface MetalTheme {
  color: string;
  text: string;
  bg: string;
  border: string;
  accent: string;
  glow: string;
}

const defaultBlueTheme: MetalTheme = {
  color: '#3b82f6',
  text: 'text-blue-600',
  bg: 'bg-blue-50/50',
  border: 'border-blue-200/50',
  accent: 'bg-blue-500',
  glow: 'focus:ring-blue-500/20 focus:border-blue-500',
};

const metalThemes: Record<string, MetalTheme> = {
  gold: defaultBlueTheme,
  silver: defaultBlueTheme,
  platinum: defaultBlueTheme,
  copper: defaultBlueTheme,
  default: defaultBlueTheme,
};

interface PriceCardProps {
  title: string;
  initialPrice: any;
  initialSpread: any;
  metal: string;
  type: string;
  onSpreadUpdate?: (metal: string, type: string, newSpread: number) => void;
  getSpreadOrMarginFromDB: (metal: string, type: string) => number;
}

// PriceCard Component
const PriceCard: React.FC<PriceCardProps> = React.memo(
  ({
    title,
    initialPrice,
    initialSpread,
    metal,
    type,
    onSpreadUpdate,
    getSpreadOrMarginFromDB,
  }) => {
    const [spread, setSpread] = useState(initialSpread);
    const [isEditing, setIsEditing] = useState(false);
    const [tempSpread, setTempSpread] = useState(initialSpread);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      setSpread(initialSpread);
      setTempSpread(initialSpread);
      setIsLoading(false);
    }, [initialSpread]);

    const handleEditClick = useCallback(() => {
      setIsEditing(true);
      setTempSpread(spread);
    }, [spread]);

    const handleSpreadChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setTempSpread(e.target.value);
    }, []);

    const handleSave = useCallback(() => {
      const newSpread = parseFloat(tempSpread);
      setIsEditing(false);
      setSpread(newSpread);
      if (onSpreadUpdate) {
        onSpreadUpdate(metal, type, newSpread);
      }
    }, [metal, type, tempSpread, onSpreadUpdate]);

    const theme = useMemo(() => {
      const lower = (metal || '').toLowerCase();
      return metalThemes[lower] || metalThemes.default;
    }, [metal]);

    if (isLoading) {
      return (
        <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm p-5 overflow-hidden">
          <Skeleton variant="text" width="60%" height={24} />
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="80%" height={20} />
          </div>
        </div>
      );
    }

    const priceValue =
      initialPrice !== undefined && initialPrice !== null ? parseFloat(initialPrice) : 0;
    const spreadValue = spread !== undefined && spread !== null ? parseFloat(spread) : 0;
    const finalPrice = (priceValue + spreadValue).toFixed(4);

    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all duration-300 p-5">
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ backgroundColor: theme.color }}
        />
        {!isEditing && (
          <button
            type="button"
            onClick={handleEditClick}
            className="absolute top-4 right-4 h-8 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-all text-xs font-semibold cursor-pointer"
          >
            <svg
              className="w-3 h-3 text-slate-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 512 512"
            >
              <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
            </svg>
            <span>Edit</span>
          </button>
        )}
        {isEditing && (
          <button
            type="button"
            onClick={handleSave}
            className="absolute top-4 right-4 h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            Save
          </button>
        )}

        <div className="pt-6 grid grid-cols-3 gap-4">
          <div className="flex flex-col">
            <h6 className="text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
              {title} Spot
            </h6>
            <p className="text-slate-800 font-extrabold text-[15px] tracking-tight">
              {initialPrice !== undefined && initialPrice !== null
                ? parseFloat(initialPrice).toFixed(4)
                : 'N/A'}
            </p>
          </div>
          <div className="flex flex-col">
            <h6 className="text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
              Spread
            </h6>
            <div className="h-8 w-24">
              {isEditing ? (
                <input
                  type="number"
                  step="0.0001"
                  value={tempSpread}
                  onChange={handleSpreadChange}
                  className={`text-slate-800 font-bold text-xs p-1.5 border border-slate-200 rounded-lg w-full h-full focus:outline-none transition-all shadow-inner ${theme.glow}`}
                />
              ) : (
                <p className="text-slate-700 font-bold text-[15px]">
                  {spread !== undefined && spread !== null
                    ? parseFloat(spread).toFixed(4)
                    : '0.0000'}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <h6 className="text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">{`${title}ing Price`}</h6>
            <p
              className={`font-black text-[15px] tracking-tight ${title === 'Bid' ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {finalPrice}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

PriceCard.displayName = 'PriceCard';

interface ValueCardProps {
  lowValue: any;
  highValue: any;
  spreadMarginData: any;
  metal: string;
  onMarginUpdate?: (metal: string, type: string, newMargin: number) => void;
  getSpreadOrMarginFromDB: (metal: string, type: string) => number;
}

// ValueCard Component
const ValueCard: React.FC<ValueCardProps> = React.memo(
  ({ lowValue, highValue, spreadMarginData, metal, onMarginUpdate, getSpreadOrMarginFromDB }) => {
    const getLowMargin = useCallback(() => {
      const key = `${metal.toLowerCase()}LowMargin`;
      return spreadMarginData[key] || 0;
    }, [spreadMarginData, metal]);

    const getHighMargin = useCallback(() => {
      const key = `${metal.toLowerCase()}HighMargin`;
      return spreadMarginData[key] || 0;
    }, [spreadMarginData, metal]);

    const [lowMargin, setLowMargin] = useState(() => getSpreadOrMarginFromDB(metal, 'low'));
    const [highMargin, setHighMargin] = useState(() => getSpreadOrMarginFromDB(metal, 'high'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      setLowMargin(getLowMargin());
      setHighMargin(getHighMargin());
      setIsLoading(false);
    }, [spreadMarginData, getLowMargin, getHighMargin]);

    const [isEditing, setIsEditing] = useState(false);

    const handleEditClick = useCallback(() => {
      setIsEditing(true);
    }, []);

    const handleMarginChange = useCallback(
      (setter: React.Dispatch<React.SetStateAction<any>>) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
          setter(e.target.value);
        },
      []
    );

    const handleSave = useCallback(() => {
      setIsEditing(false);
      const lowVal = parseFloat(String(lowMargin)) || 0;
      const highVal = parseFloat(String(highMargin)) || 0;
      setLowMargin(lowVal);
      setHighMargin(highVal);
      if (onMarginUpdate) {
        onMarginUpdate(metal, 'low', lowVal);
        onMarginUpdate(metal, 'high', highVal);
      }
    }, [metal, lowMargin, highMargin, onMarginUpdate]);

    const theme = useMemo(() => {
      const lower = (metal || '').toLowerCase();
      return metalThemes[lower] || metalThemes.default;
    }, [metal]);

    if (isLoading) {
      return (
        <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm p-5 overflow-hidden">
          <Skeleton variant="text" width="60%" height={24} />
          <div className="space-y-4 mt-4">
            <Skeleton variant="rectangular" height={30} className="rounded-lg" />
            <Skeleton variant="rectangular" height={30} className="rounded-lg" />
          </div>
        </div>
      );
    }

    const lowSpot = parseFloat(String(lowValue)) || 0;
    const lowMarg = parseFloat(String(lowMargin)) || 0;
    const newLowVal = (lowSpot + lowMarg).toFixed(4);

    const highSpot = parseFloat(String(highValue)) || 0;
    const highMarg = parseFloat(String(highMargin)) || 0;
    const newHighVal = (highSpot + highMarg).toFixed(4);

    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all duration-300 p-5">
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ backgroundColor: theme.color }}
        />
        {!isEditing && (
          <button
            type="button"
            onClick={handleEditClick}
            className="absolute top-4 right-4 h-8 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-all text-xs font-semibold cursor-pointer"
          >
            <svg
              className="w-3 h-3 text-slate-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 512 512"
            >
              <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
            </svg>
            <span>Edit</span>
          </button>
        )}
        {isEditing && (
          <button
            type="button"
            onClick={handleSave}
            className="absolute top-4 right-4 h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            Save
          </button>
        )}
        <div className="space-y-3 pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <h6 className="text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
                Low Spot
              </h6>
              <p className="text-slate-800 font-extrabold text-[15px] tracking-tight">
                {lowSpot.toFixed(4)}
              </p>
            </div>
            <div className="flex flex-col">
              <h6 className="text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
                Margin
              </h6>
              <div className="h-8 w-24">
                {isEditing ? (
                  <input
                    type="number"
                    step="0.0001"
                    value={lowMargin}
                    onChange={handleMarginChange(setLowMargin)}
                    className={`text-slate-800 font-bold text-xs p-1.5 border border-slate-200 rounded-lg w-full h-full focus:outline-none transition-all shadow-inner ${theme.glow}`}
                  />
                ) : (
                  <p className="text-slate-700 font-bold text-[15px]">{lowMarg.toFixed(4)}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <h6 className="text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
                Low New Price
              </h6>
              <p className="text-slate-800 font-black text-[15px] tracking-tight">{newLowVal}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
            <div className="flex flex-col">
              <h6 className="text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
                High Spot
              </h6>
              <p className="text-slate-800 font-extrabold text-[15px] tracking-tight">
                {highSpot.toFixed(4)}
              </p>
            </div>
            <div className="flex flex-col">
              <h6 className="text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
                Margin
              </h6>
              <div className="h-8 w-24">
                {isEditing ? (
                  <input
                    type="number"
                    step="0.0001"
                    value={highMargin}
                    onChange={handleMarginChange(setHighMargin)}
                    className={`text-slate-800 font-bold text-xs p-1.5 border border-slate-200 rounded-lg w-full h-full focus:outline-none transition-all shadow-inner ${theme.glow}`}
                  />
                ) : (
                  <p className="text-slate-700 font-bold text-[15px]">{highMarg.toFixed(4)}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <h6 className="text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
                High New Price
              </h6>
              <p className="text-slate-800 font-black text-[15px] tracking-tight">{newHighVal}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ValueCard.displayName = 'ValueCard';

interface TradingViewWidgetProps {
  symbol: string;
  title: string;
}

// TradingViewWidget Component
const TradingViewWidget: React.FC<TradingViewWidgetProps> = React.memo(({ symbol, title }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = useCallback(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, []);

  const theme = useMemo(() => {
    const lower = (title || '').toLowerCase();
    return metalThemes[lower] || metalThemes.default;
  }, [title]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
      style={{ height: '392px' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: theme.color }}
      />

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h6 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${theme.accent}`} />
            {title} Market
          </h6>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Real-Time Spot Chart
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          LIVE
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative flex-1 bg-slate-50">
        {isLoading && (
          <Skeleton variant="rectangular" width="100%" height="100%" className="absolute inset-0" />
        )}

        <div className="w-full h-full">
          <iframe
            scrolling="no"
            allowTransparency={true}
            frameBorder="0"
            src={`https://www.tradingview-widget.com/embed-widget/symbol-overview/?locale=in#%7B%22symbols%22%3A%5B%5B%22${symbol}%7C1D%22%5D%5D%2C%22chartOnly%22%3Afalse%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22colorTheme%22%3A%22light%22%2C%22showVolume%22%3Afalse%2C%22showMA%22%3Afalse%2C%22hideDateRanges%22%3Afalse%2C%22hideMarketStatus%22%3Afalse%2C%22hideSymbolLogo%22%3Afalse%2C%22scalePosition%22%3A%22right%22%2C%22scaleMode%22%3A%22Normal%22%2C%22fontSize%22%3A%2210%22%2C%22chartType%22%3A%22area%22%7D`}
            title="symbol overview TradingView widget"
            lang="en"
            className="w-full h-full"
            style={{
              userSelect: 'none',
              boxSizing: 'border-box',
              display: 'block',
            }}
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    </div>
  );
});

TradingViewWidget.displayName = 'TradingViewWidget';

// Main SpotRate Component
const SpotRate: React.FC = () => {
  const [exchangeRate, setExchangeRate] = useState(3.674);
  const [openModal, setOpenModal] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { user } = useAuth();
  const [selectedCommodity, setSelectedCommodity] = useState<any>(null);
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [serverURL, setServerURL] = useState('');
  const [adminId, setAdminId] = useState('');
  const [commodities, setCommodities] = useState<any[]>([]);
  const [uniqueMetals, setUniqueMetals] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [spreadMarginData, setSpreadMarginData] = useState<Record<string, any>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commodityToDelete, setCommodityToDelete] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const availableMetals = useMemo(() => ['Gold', 'Silver', 'Platinum', 'Copper'], []);
  const [visibleMetals, setVisibleMetals] = useState<string[]>(['Gold', 'Silver']);

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

  const getUnitMultiplier = useCallback((unit: any) => {
    const lowerCaseUnit = String(unit).toLowerCase();
    switch (lowerCaseUnit) {
      case 'gram':
        return 1;
      case 'kg':
        return 1000;
      case 'oz':
        return 31.1034768;
      case 'tola':
        return 11.664;
      case 'ttb':
        return 116.64;
      default:
        return 1;
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userName = user?.email;

      if (!userName) {
        setIsLoading(false);
        return; // Don't fetch if no userName is present
      }

      const [serverURLResponse, adminDataResponse, merchantInfo] = await Promise.all([
        fetch(`${API_URL}/get-server`, {
          headers: { 'Content-Type': 'application/json', 'X-Secret-Key': API_KEY },
          credentials: 'include',
        }).then((res) => res.json()),
        axiosInstance.get(`/data/${userName}`),
        marketplaceApi.myMerchant().catch(() => null),
      ]);
      const serverUrlResult =
        serverURLResponse?.data?.info?.serverURL ||
        serverURLResponse?.data?.info?.serverUrl ||
        serverURLResponse?.data?.serverURL ||
        serverURLResponse?.data?.serverUrl ||
        serverURLResponse?.serverURL ||
        serverURLResponse?.serverUrl ||
        serverURLResponse?.info?.serverURL ||
        serverURLResponse?.info?.serverUrl ||
        null;

      setServerURL(serverUrlResult);
      setAdminId(adminDataResponse.data.data._id);

      if (merchantInfo && (merchantInfo as any).allowedCommodities?.length > 0) {
        setVisibleMetals((merchantInfo as any).allowedCommodities);
      } else {
        setVisibleMetals([]);
      }

      const uniqueSymbols = [
        ...new Set<string>(
          adminDataResponse.data.data.commodities.map((commodity: any) => commodity.symbol)
        ),
      ];
      const uppercaseSymbols = uniqueSymbols.map((symbol) => symbol.toUpperCase());
      setSymbols(uppercaseSymbols);
      setUniqueMetals(uniqueSymbols);

      if (adminDataResponse.data.data._id) {
        const commoditiesResponse = await axiosInstance.get(
          `/spotrates/${adminDataResponse.data.data._id}`
        );
        if (commoditiesResponse.data) {
          setSpreadMarginData(commoditiesResponse.data);
        }
        if (commoditiesResponse.data && commoditiesResponse.data.commodities) {
          const parsedCommodities = commoditiesResponse.data.commodities.map((commodity: any) => ({
            ...commodity,
            metal_name: commodity.metal_name ?? null,
            purity: parseFloat(commodity.purity),
            unit: parseFloat(commodity.unit),
            weight: commodity.weight,
            sellCharge: parseFloat(commodity.sellCharge),
            buyCharge: parseFloat(commodity.buyCharge),
          }));
          setCommodities(parsedCommodities);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('An error occurred while fetching data');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderLoadingSkeleton = () => (
    <div className="p-6 grid gap-8 grid-cols-1 md:grid-cols-2 mx-4 md:mx-8 lg:mx-14">
      {[1, 2, 3, 4].map((index) => (
        <div key={index} className="col-span-1">
          <Skeleton variant="rectangular" height={300} />
          <div className="space-y-4 mt-4">
            <Skeleton variant="rectangular" height={100} />
            <Skeleton variant="rectangular" height={100} />
            <Skeleton variant="rectangular" height={200} />
          </div>
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    setCommodities((prevCommodities) =>
      prevCommodities.map((commodity) => {
        const updatedCommodity = { ...commodity };
        const metal = commodity.metal.toLowerCase().includes('gold') ? 'Gold' : commodity.metal;
        if (marketData[metal]) {
          const metalBiddingPrice =
            parseFloat(marketData[metal].bid) + parseFloat(getSpreadOrMarginFromDB(metal, 'bid'));
          const metalAskingPrice =
            parseFloat(marketData[metal].bid) +
            parseFloat(getSpreadOrMarginFromDB(metal, 'bid')) +
            parseFloat(getSpreadOrMarginFromDB(metal, 'ask')) +
            (metal === 'Gold' ? 0.5 : 0.05);

          updatedCommodity.sellAED = calculatePrice(metalBiddingPrice, commodity, 'sell');
          updatedCommodity.buyAED = calculatePrice(metalAskingPrice, commodity, 'buy');
          updatedCommodity.sellUSD = (updatedCommodity.sellAED / exchangeRate).toFixed(4);
          updatedCommodity.buyUSD = (updatedCommodity.buyAED / exchangeRate).toFixed(4);
        }

        return updatedCommodity;
      })
    );
  }, [marketData, getSpreadOrMarginFromDB, exchangeRate]);

  const handleOpenAddModal = useCallback(() => {
    setSelectedCommodity(null);
    setIsEditing(false);
    setOpenModal(true);
  }, []);

  const getNumberOfDigitsBeforeDecimal = useCallback((value: any) => {
    if (value === undefined || value === null) {
      return 0;
    }

    const valueStr = value.toString();
    const [integerPart] = valueStr.split('.');
    return integerPart.length;
  }, []);

  const calculatePrice = useCallback(
    (metalPrice: number, commodity: any, type: string) => {
      const unitMultiplier = getUnitMultiplier(commodity.weight);
      const digitsBeforeDecimal = getNumberOfDigitsBeforeDecimal(commodity.purity);
      const premium = type === 'sell' ? commodity.sellPremium : commodity.buyPremium;
      const charge = type === 'sell' ? commodity.sellCharge : commodity.buyCharge;
      const metal = commodity.metal.toLowerCase().includes('gold') ? 'Gold' : commodity.metal;
      const spread = parseFloat(getSpreadOrMarginFromDB(metal, type === 'sell' ? 'ask' : 'bid'));

      return (
        ((metalPrice + spread + premium) / 31.103) *
          exchangeRate *
          commodity.unit *
          unitMultiplier *
          (parseInt(commodity.purity) / Math.pow(10, digitsBeforeDecimal)) +
        parseFloat(charge)
      ).toFixed(4);
    },
    [getUnitMultiplier, getNumberOfDigitsBeforeDecimal, getSpreadOrMarginFromDB, exchangeRate]
  );

  const handleSpreadOrMarginUpdate = useCallback(
    async (metal: string, type: string, newValue: number) => {
      try {
        const response = await axiosInstance.post('/update-spread', {
          adminId,
          metal,
          type,
          value: parseFloat(String(newValue)),
        });

        if (response.status === 200 && response.data.data) {
          setSpreadMarginData((prevData) => ({
            ...prevData,
            ...response.data.data,
          }));
        }
      } catch (err) {
        console.error('Error updating spread:', err);
      }
    },
    [adminId]
  );

  const handleDeleteClick = useCallback((commodity: any) => {
    setCommodityToDelete(commodity);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (commodityToDelete) {
      try {
        await axiosInstance.delete(`/commodities/${adminId}/${commodityToDelete._id}`);
        setCommodities((prevCommodities) =>
          prevCommodities.filter((commodity) => commodity._id !== commodityToDelete._id)
        );
        setDeleteDialogOpen(false);
        toast.success('Commodity deleted successfully!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } catch (err) {
        console.error('Error deleting commodity:', err);
      }
    }
  }, [adminId, commodityToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setCommodityToDelete(null);
  }, []);

  useEffect(() => {
    if (!serverURL) {
      console.log('Waiting for Server URL for socket connection...');
      return;
    }

    if (!SOCKET_SECRET) {
      console.error('Socket secret is not defined in environment variables');
      return;
    }

    const socket = io(serverURL, {
      query: { secret: SOCKET_SECRET },
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      socket.emit('request-data', symbols);
    });

    const SPOT_RATE_EVENT_NAMES = [
      'market-data',
      'spotrate',
      'spot-rate',
      'spot-rates',
      'rates',
      'data',
    ] as const;

    const handleSpotRatePayload = (data: any) => {
      // Normalize array payloads if any
      const payloads = Array.isArray(data) ? data : [data];
      for (const item of payloads) {
        if (item && item.symbol) {
          setMarketData((prevData) => ({
            ...prevData,
            [item.symbol]: {
              ...item,
              bidChanged:
                prevData[item.symbol] && item.bid !== prevData[item.symbol].bid
                  ? item.bid > prevData[item.symbol].bid
                    ? 'up'
                    : 'down'
                  : null,
            },
          }));
        }
      }
    };

    for (const eventName of SPOT_RATE_EVENT_NAMES) {
      socket.on(eventName, handleSpotRatePayload);
    }

    socket.on('error', (err: any) => {
      console.error('Socket error:', err);
      setError('An error occurred while receiving data');
    });

    return () => {
      socket.disconnect();
    };
  }, [symbols, serverURL]);

  const handleSaveCommodity = useCallback(
    async (commodityData: any, isEditMode: boolean) => {
      if (isEditMode) {
        setCommodities((prevCommodities) =>
          prevCommodities.map((commodity) =>
            commodity._id === commodityData._id ? { ...commodity, ...commodityData } : commodity
          )
        );
        toast.success('Commodity updated successfully!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        setCommodities((prevCommodities) => [...prevCommodities, commodityData]);
        toast.success('Commodity added successfully!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
      setIsEditing(false);
      setOpenModal(false);
      const fetchUpdatedCommodities = async () => {
        try {
          const response = await axiosInstance.get(`/spotrates/${adminId}`);
          if (response.data && response.data.commodities) {
            const normalizedCommodities = response.data.commodities.map((commodity: any) => ({
              ...commodity,
              metal_name: commodity.metal_name ?? null,
            }));
            setCommodities(normalizedCommodities);
          }
        } catch (err) {
          console.error('Error fetching updated commodities:', err);
        }
      };

      fetchUpdatedCommodities();
    },
    [adminId]
  );

  const handleCloseModal = useCallback(() => {
    setOpenModal(false);
    setSelectedCommodity(null);
    setIsEditing(false);
  }, []);

  const handleEditCommodity = useCallback((commodity: any) => {
    setSelectedCommodity({
      ...commodity,
      metal_name: commodity.metal_name ?? '',
    });
    setIsEditing(true);
    setOpenModal(true);
  }, []);

  const handleCurrencyChange = useCallback(
    (newCurrency: string, newExchangeRate: number) => {
      setCurrency(newCurrency);
      setExchangeRate(parseFloat(String(newExchangeRate)));
    },
    [setCurrency]
  );

  const renderCommodityRows = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          {Array.from({ length: 10 }).map((_, cellIndex) => (
            <TableCell key={cellIndex} sx={{ py: 2 }}>
              <Skeleton variant="text" />
            </TableCell>
          ))}
        </TableRow>
      ));
    }
    return commodities.map((row) => {
      const isGoldRelated =
        row.metal &&
        (row.metal.toLowerCase().includes('gold') ||
          row.metal.toLowerCase().includes('minted bar'));
      const metal = isGoldRelated ? 'Gold' : row.metal || 'Unknown';
      const metalBiddingPrice =
        marketData[metal] && marketData[metal].bid ? parseFloat(marketData[metal].bid) : 0;
      const metalAskingPrice =
        marketData[metal] && marketData[metal].bid
          ? parseFloat(marketData[metal].bid) +
            parseFloat(getSpreadOrMarginFromDB(metal, 'bid')) +
            (isGoldRelated ? 0.5 : 0.05)
          : 0;

      const sellPrice = calculatePrice(metalAskingPrice, row, 'sell');
      const buyPrice = calculatePrice(metalBiddingPrice, row, 'buy');

      const rowTheme = metalThemes[metal.toLowerCase()] || metalThemes.default;

      return (
        <TableRow
          key={row._id}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(248, 250, 252, 0.6)',
            },
            transition: 'background-color 0.2s ease',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <TableCell sx={{ fontWeight: 'bold', color: '#1e293b', py: 1.5 }}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${rowTheme.accent}`} />
              {row.metal_name?.trim() || row.metal}
            </div>
          </TableCell>
          <TableCell sx={{ py: 1.5 }}>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rowTheme.bg} ${rowTheme.text} border ${rowTheme.border}`}
            >
              {row.purity}
            </span>
          </TableCell>
          <TableCell sx={{ color: '#475569', fontWeight: '500', py: 1.5 }}>
            <span className="bg-slate-100/80 px-2 py-1 rounded-lg text-xs font-bold text-slate-600 border border-slate-200/40">
              {`${row.unit} ${row.weight}`}
            </span>
          </TableCell>
          <TableCell sx={{ fontWeight: 'bold', color: '#dc2626', py: 1.5 }}>{sellPrice}</TableCell>
          <TableCell sx={{ fontWeight: 'bold', color: '#16a34a', py: 1.5 }}>{buyPrice}</TableCell>
          <TableCell sx={{ color: '#475569', py: 1.5 }}>
            {row.sellPremium !== undefined && row.sellPremium !== null
              ? `+${row.sellPremium}`
              : '0.00'}
          </TableCell>
          <TableCell sx={{ color: '#475569', py: 1.5 }}>
            {row.buyPremium !== undefined && row.buyPremium !== null
              ? `+${row.buyPremium}`
              : '0.00'}
          </TableCell>
          <TableCell sx={{ color: '#475569', py: 1.5 }}>
            {row.sellCharge !== undefined && row.sellCharge !== null ? `${row.sellCharge}` : '0.00'}
          </TableCell>
          <TableCell sx={{ color: '#475569', py: 1.5 }}>
            {row.buyCharge !== undefined && row.buyCharge !== null ? `${row.buyCharge}` : '0.00'}
          </TableCell>
          <TableCell sx={{ py: 1.5 }}>
            <div className="flex gap-1.5">
              <IconButton
                onClick={() => handleEditCommodity(row)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#3b82f6',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: '#eff6ff',
                    borderColor: '#bfdbfe',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.1)',
                  },
                }}
              >
                <EditIcon sx={{ fontSize: '15px' }} />
              </IconButton>
              <IconButton
                onClick={() => handleDeleteClick(row)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#ef4444',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: '#fef2f2',
                    borderColor: '#fecaca',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.1)',
                  },
                }}
              >
                <DeleteIcon sx={{ fontSize: '15px' }} />
              </IconButton>
            </div>
          </TableCell>
        </TableRow>
      );
    });
  };
  const symbolMap: Record<string, string> = {
    copper: 'COMEX:HG1!',
    gold: 'TVC:GOLD',
    silver: 'TVC:SILVER',
    platinum: 'TVC:PLATINUM',
  };

  const handleCloseDialog = (event: any, reason: string) => {
    if (reason && reason === 'backdropClick') return;
    handleDeleteCancel();
  };

  return (
    <DashboardShell className="space-y-6 pb-12">
      {/* Page Header Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-blue-100">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_100%_0%,#3b82f6,transparent_30%),radial-gradient(circle_at_0%_100%,#60a5fa,transparent_30%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
              <span className="text-blue-600">Spot Rates & Spreads</span>
              <span className="text-slate-400 text-lg font-light">Console</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Configure spreads, margins, and manage your commodity catalog with live price
              calculations.
            </p>
          </div>
    
        </div>
      </div>

      {/* Spreads & Charts Section */}
      {/* <div className="flex items-center gap-2 mt-4 px-1">
        <span className="text-sm font-semibold text-slate-600 mr-2">Visible Spot Rates:</span>
        {availableMetals.map((m) => {
          const isActive = visibleMetals.includes(m);
          return (
            <button
              key={m}
              onClick={() => handleToggleMetal(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm border border-transparent'
                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div> */}

      {isLoading ? (
        renderLoadingSkeleton()
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {visibleMetals.map((metal, index) => (
            <div
              key={metal}
              className={`col-span-1 ${
                index === visibleMetals.length - 1 && visibleMetals.length % 2 !== 0
                  ? 'md:col-span-2'
                  : ''
              }`}
            >
              <div
                className={`grid gap-4 ${
                  index === visibleMetals.length - 1 && visibleMetals.length % 2 !== 0
                    ? 'md:grid-cols-2'
                    : 'grid-cols-1'
                }`}
              >
                <TradingViewWidget symbol={symbolMap[metal.toLowerCase()]} title={metal} />
                <div className="space-y-4">
                  <PriceCard
                    title="Bid"
                    initialPrice={marketData[metal]?.bid}
                    initialSpread={getSpreadOrMarginFromDB(metal, 'bid')}
                    metal={metal}
                    type="bid"
                    onSpreadUpdate={handleSpreadOrMarginUpdate}
                    getSpreadOrMarginFromDB={getSpreadOrMarginFromDB}
                  />
                  <PriceCard
                    title="Ask"
                    initialPrice={
                      parseFloat(marketData[metal]?.bid) +
                      getSpreadOrMarginFromDB(metal, 'bid') +
                      (metal === 'Gold' ? 0.5 : 0.05)
                    }
                    initialSpread={getSpreadOrMarginFromDB(metal, 'ask')}
                    metal={metal}
                    type="ask"
                    onSpreadUpdate={handleSpreadOrMarginUpdate}
                    getSpreadOrMarginFromDB={getSpreadOrMarginFromDB}
                  />
                  <ValueCard
                    lowValue={marketData[metal]?.low}
                    highValue={marketData[metal]?.high}
                    spreadMarginData={spreadMarginData}
                    metal={metal}
                    onMarginUpdate={handleSpreadOrMarginUpdate}
                    getSpreadOrMarginFromDB={getSpreadOrMarginFromDB}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live 1GM Conversions Grid */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
          Live Spot Conversions (1 Gram)
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {visibleMetals.map((metal) => {
            const theme = metalThemes[metal.toLowerCase()] || metalThemes.default;
            const usdVal = isLoading
              ? '—'
              : (
                  (parseFloat(marketData[metal]?.bid) +
                    parseFloat(getSpreadOrMarginFromDB(metal, 'bid'))) /
                  31.103
                ).toFixed(4);
            const curVal = isLoading
              ? '—'
              : (
                  ((parseFloat(marketData[metal]?.bid) +
                    parseFloat(getSpreadOrMarginFromDB(metal, 'bid'))) /
                    31.103) *
                  exchangeRate
                ).toFixed(4);

            return (
              <div
                key={metal}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ backgroundColor: theme.color }}
                />
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                    {metal} 1GM
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${theme.bg} ${theme.text} border ${theme.border}`}
                  >
                    LIVE FEED
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">USD</p>
                    <p className="text-sm font-black text-slate-800">{usdVal}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                      {currency}
                    </p>
                    <p className="text-sm font-black text-blue-700">{curVal}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commodity Table Catalog */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Commodity Pricing Catalog</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Add, update, and manage your gold, silver, or custom metal products pricing
              structures.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            ADD COMMODITY
          </button>
        </div>

        <TableContainer
          component={Paper}
          className="shadow-none border border-slate-100 rounded-2xl overflow-hidden"
        >
          <Table sx={{ minWidth: 650 }} aria-label="commodity table">
            <TableHead>
              <TableRow className="bg-slate-50/80 border-b border-slate-200/60">
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    color: '#64748b',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    py: 1.5,
                  }}
                >
                  Metal
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    color: '#64748b',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    py: 1.5,
                  }}
                >
                  Purity
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    color: '#64748b',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    py: 1.5,
                  }}
                >
                  Unit
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    color: '#64748b',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    py: 1.5,
                  }}
                >
                  Sell ({currency})
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    color: '#64748b',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    py: 1.5,
                  }}
                >
                  Buy ({currency})
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    color: '#64748b',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    py: 1.5,
                  }}
                >
                  Sell Premium
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    color: '#64748b',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    py: 1.5,
                  }}
                >
                  Buy Premium
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    color: '#64748b',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    py: 1.5,
                  }}
                >
                  Sell Charges
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    color: '#64748b',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    py: 1.5,
                  }}
                >
                  Buy Charges
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    color: '#64748b',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    py: 1.5,
                  }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{renderCommodityRows()}</TableBody>
          </Table>
        </TableContainer>
      </div>

      <AddCommodityModal
        open={openModal}
        onClose={handleCloseModal}
        onSave={handleSaveCommodity}
        initialData={selectedCommodity}
        marketData={marketData}
        isEditing={isEditing}
        getSpreadOrMarginFromDB={getSpreadOrMarginFromDB}
        exchangeRate={exchangeRate}
        currency={currency}
        spreadMarginData={spreadMarginData}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            handleCloseDialog(event, reason);
          }
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        {...({
          PaperProps: {
            sx: {
              borderRadius: '16px',
              padding: 1,
            },
          },
        } as any)}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1e293b' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText
            id="alert-dialog-description"
            sx={{ marginTop: 1, color: '#64748b', fontSize: '14px' }}
          >
            Are you sure you want to delete this commodity? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleDeleteCancel}
            sx={{
              color: '#64748b',
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#f1f5f9',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            sx={{
              background: 'linear-gradient(270deg, #ef4444 0%, #f43f5e 100%)',
              color: 'white',
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: '8px',
              boxShadow: 'none',
              '&:hover': {
                background: 'linear-gradient(270deg, #dc2626 0%, #e11d48 100%)',
                boxShadow: 'none',
              },
            }}
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </DashboardShell>
  );
};

export default React.memo(SpotRate);
