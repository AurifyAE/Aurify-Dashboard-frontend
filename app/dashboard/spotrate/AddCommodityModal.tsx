'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '../../axios/axiosInstance';
import { Snackbar, Alert } from '@mui/material';
import { useAuth } from '@/context/AuthContext';

interface AddCommodityModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (commodityData: any, isEditMode: boolean) => void;
  initialData: any;
  marketData: any;
  isEditing: boolean;
  getSpreadOrMarginFromDB: (metal: string, type: string) => number;
  exchangeRate: number;
  currency: string;
  spreadMarginData: any;
}

interface FormData {
  metal: string;
  purity: number | string;
  unit: number | string;
  weight: string;
  sellPremiumUSD: string;
  sellCharges: string;
  buyPremiumUSD: string;
  buyCharges: string;
  buyAED: string;
  buyUSD: string;
  sellAED: string;
  sellUSD: string;
  metal_name: string;
  group: string;
}

const AddCommodityModal: React.FC<AddCommodityModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  marketData,
  isEditing,
  exchangeRate,
  currency,
  spreadMarginData,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [commodityId, setCommodityId] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [formData, setFormData] = useState<FormData>({
    metal: 'Gold',
    purity: 999,
    unit: 1,
    weight: 'GM',
    sellPremiumUSD: '',
    sellCharges: '',
    buyPremiumUSD: '',
    buyCharges: '',
    buyAED: '',
    buyUSD: '',
    sellAED: '',
    sellUSD: '',
    metal_name: '',
    group: 'commodity',
  });
  const [commodities, setCommodities] = useState<any[]>([]);
  const [adminId, setAdminId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const exchangeRates = useMemo<Record<string, number>>(
    () => ({
      AED: 3.674,
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
    }),
    []
  );

  const convertCurrency = useCallback(
    (amount: string, fromCurrency: string, toCurrency: string) => {
      if (!amount) return '';
      const parsed = parseFloat(amount);
      if (isNaN(parsed)) return '';
      const inUSD = parsed / exchangeRates[fromCurrency];
      return (inUSD * exchangeRates[toCurrency]).toFixed(4);
    },
    [exchangeRates]
  );

  const getUnitMultiplier = useCallback((weight: string) => {
    switch (weight) {
      case 'GM':
        return 1;
      case 'KG':
        return 1000;
      case 'TTB':
        return 116.64;
      case 'TOLA':
        return 11.664;
      case 'OZ':
        return 31.1034768;
      default:
        return 1;
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      metal: 'Gold',
      purity: 999,
      unit: 1,
      weight: 'GM',
      sellPremiumUSD: '',
      sellCharges: '',
      buyPremiumUSD: '',
      buyCharges: '',
      buyAED: '',
      buyUSD: '',
      sellAED: '',
      sellUSD: '',
      metal_name: '',
      group: 'commodity',
    });
    setIsEditMode(false);
    setCommodityId(null);
  }, []);

  useEffect(() => {
    const fetchAdminId = async () => {
      try {
        const userName = user?.email;
        if (!userName) {
          // Suppress error log to avoid console noise if user is not yet logged in or uses different auth
          return;
        }
        const response = await axiosInstance.get(`/data/${userName}`);
        if (response && response.data && response.data.data) {
          setAdminId(response.data.data._id);
        } else {
          console.error('Invalid response or missing data:', response);
        }
      } catch (err) {
        console.error('Error fetching user ID:', err);
      }
    };

    fetchAdminId();
  }, [user?.email]);

  useEffect(() => {
    if (initialData && (isEditing || open)) {
      setFormData((prevState) => ({
        ...prevState,
        ...initialData,
        sellCharges: initialData.sellCharge || initialData.sellCharges || '',
        buyCharges: initialData.buyCharge || initialData.buyCharges || '',
        sellPremiumUSD: initialData.sellPremium || initialData.sellPremiumUSD || '',
        buyPremiumUSD: initialData.buyPremium || initialData.buyPremiumUSD || '',
        metal_name: initialData.metal_name ?? '',
        group: initialData.group ?? 'commodity',
      }));
      setCommodityId(initialData.id || initialData._id);
      setIsEditMode(true);
    } else if (open) {
      resetForm();
    }
  }, [initialData, isEditing, open, resetForm]);

  const calculatePrices = useCallback(() => {
    setFormData((prevState) => {
      if (prevState.metal && prevState.purity && prevState.unit && prevState.weight) {
        const metal = prevState.metal;
        const isGoldRelated = [
          'Gold',
          'Gold Kilobar',
          'Gold TOLA',
          'Gold Ten TOLA',
          'Gold Coin',
          'Minted Bar',
        ].includes(metal);
        const metalBid = isGoldRelated ? marketData['Gold']?.bid : marketData[metal]?.bid || 0;
        const bidSpread = spreadMarginData[`${metal.toLowerCase()}BidSpread`] || 0;
        const askSpread = spreadMarginData[`${metal.toLowerCase()}AskSpread`] || 0;
        const additionalPrice = isGoldRelated ? 0.5 : 0.05;

        const unitMultiplier = getUnitMultiplier(prevState.weight);
        const purityValue = parseFloat(String(prevState.purity));
        const purityLength = String(prevState.purity).split('.')[0].length;

        const sellPremiumUSD = parseFloat(prevState.sellPremiumUSD) || 0;
        const buyPremiumUSD = parseFloat(prevState.buyPremiumUSD) || 0;
        const sellCharge = parseFloat(prevState.sellCharges) || 0;
        const buyCharge = parseFloat(prevState.buyCharges) || 0;

        const baseBuyPrice =
          ((parseFloat(String(metalBid)) +
            parseFloat(String(bidSpread)) +
            parseFloat(String(buyPremiumUSD))) /
            31.103) *
          exchangeRate *
          parseFloat(String(prevState.unit)) *
          unitMultiplier *
          (purityValue / Math.pow(10, purityLength));
        const baseSellPrice =
          ((parseFloat(String(metalBid)) +
            parseFloat(String(bidSpread)) +
            parseFloat(String(askSpread)) +
            additionalPrice +
            parseFloat(String(sellPremiumUSD))) /
            31.103) *
          exchangeRate *
          parseFloat(String(prevState.unit)) *
          unitMultiplier *
          (purityValue / Math.pow(10, purityLength));

        const sellPrice = baseSellPrice + sellCharge;
        const buyPrice = baseBuyPrice + buyCharge;

        if (isNaN(sellPrice) || isNaN(buyPrice)) {
          return prevState;
        }

        return {
          ...prevState,
          sellAED: sellPrice.toFixed(4),
          buyAED: buyPrice.toFixed(4),
          sellUSD: convertCurrency(sellPrice.toFixed(4), currency, 'USD'),
          buyUSD: convertCurrency(buyPrice.toFixed(4), currency, 'USD'),
        };
      }
      return prevState;
    });
  }, [marketData, spreadMarginData, exchangeRate, currency, getUnitMultiplier, convertCurrency]);

  useEffect(() => {
    calculatePrices();
  }, [
    formData.metal,
    formData.purity,
    formData.unit,
    formData.weight,
    formData.buyCharges,
    formData.sellCharges,
    formData.buyPremiumUSD,
    formData.sellPremiumUSD,
    calculatePrices,
  ]);

  const handleChange = useCallback((e: any) => {
    const { name, value } = e.target;
    if (!name) return;

    let updatedValue = value;
    if (['purity', 'unit'].includes(name)) {
      updatedValue = value === '' ? '' : value;
    } else if (
      [
        'sellPremiumUSD',
        'sellCharges',
        'buyPremiumUSD',
        'buyCharges',
        'buyAED',
        'buyUSD',
        'sellAED',
        'sellUSD',
        'metal_name',
      ].includes(name)
    ) {
      updatedValue = value === '' ? '' : value;
    }

    setFormData((prevState) => ({
      ...prevState,
      [name]: updatedValue,
    }));
  }, []);

  useEffect(() => {
    const fetchCommodities = async () => {
      const userName = user?.email;
      if (!userName) {
        setError('User not logged in');
        return;
      }
      try {
        const response = await axiosInstance.get(`/data/${userName}`);
        if (
          response &&
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data.commodities)
        ) {
          const fetchedCommodities = response.data.data.commodities;
          const goldItems = [
            { _id: 'gold', symbol: 'Gold' },
            { _id: 'gold-kilobar', symbol: 'Gold Kilobar' },
            { _id: 'gold-tola', symbol: 'Gold TOLA' },
            { _id: 'gold-ten-tola', symbol: 'Ten TOLA' },
            { _id: 'gold-coin', symbol: 'Gold Coin' },
            { _id: 'minted-bar', symbol: 'Minted Bar' },
          ];
          const nonGoldItems = fetchedCommodities.filter(
            (item: any) => !goldItems.find((goldItem) => goldItem.symbol === item.symbol)
          );
          const combinedCommodities = [...goldItems, ...nonGoldItems];
          setCommodities(combinedCommodities);
        } else {
          console.error('Invalid commodities data:', response.data);
        }
      } catch (err) {
        console.error('Error fetching commodities:', err);
      }
    };

    fetchCommodities();
  }, [user?.email]);

  const handleSave = useCallback(async () => {
    const requiredFields: (keyof FormData)[] = ['metal', 'purity', 'unit', 'weight'];
    const emptyFields = requiredFields.filter((field) => !formData[field]);

    if (emptyFields.length > 0) {
      setToastMessage(
        `${emptyFields.join(', ')} ${emptyFields.length > 1 ? 'are' : 'is'} required`
      );
      setToastOpen(true);
      return;
    }

    try {
      const commodityData: any = {
        metal: formData.metal,
        purity: parseFloat(String(formData.purity)),
        unit: parseFloat(String(formData.unit)),
        weight: formData.weight,
      };

      if (formData.sellCharges !== '')
        commodityData.sellCharge = parseFloat(formData.sellCharges) || 0;
      if (formData.buyCharges !== '')
        commodityData.buyCharge = parseFloat(formData.buyCharges) || 0;
      if (formData.sellPremiumUSD !== '')
        commodityData.sellPremium = parseFloat(formData.sellPremiumUSD) || 0;
      if (formData.buyPremiumUSD !== '')
        commodityData.buyPremium = parseFloat(formData.buyPremiumUSD) || 0;

      commodityData.metal_name = formData.metal_name?.trim() ? formData.metal_name.trim() : null;
      commodityData.group = formData.group || 'commodity';

      let response;
      if (isEditMode && initialData) {
        response = await axiosInstance.patch(
          `/spotrate-commodity/${adminId}/${initialData._id}`,
          commodityData
        );
      } else {
        response = await axiosInstance.post('/spotrate-commodity', {
          adminId,
          commodity: commodityData,
        });
      }

      if (response.status === 200) {
        onSave(commodityData, isEditMode);
        resetForm();
        onClose();
      } else {
        console.error('Failed to update/add commodity');
      }
    } catch (err) {
      console.error('Error saving commodity:', err);
    }
  }, [formData, isEditMode, adminId, initialData, onSave, onClose, resetForm]);

  const handleToastClose = (event: any, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setToastOpen(false);
  };

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      fontSize: '13px',
      backgroundColor: '#f8fafc',
      '& fieldset': {
        borderColor: '#e2e8f0',
      },
      '&:hover fieldset': {
        borderColor: '#cbd5e1',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#3b82f6',
      },
    },
  };

  const previewInputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: 'bold',
      backgroundColor: '#ffffff',
      '& .MuiOutlinedInput-input': {
        textAlign: 'center',
        py: 1,
      },
      '&.Mui-disabled': {
        backgroundColor: '#ffffff',
        color: '#1e293b',
        WebkitTextFillColor: '#1e293b',
      },
      '& fieldset': {
        borderColor: '#e2e8f0',
      },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          resetForm();
          onClose();
        }
      }}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '20px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f1f5f9',
          px: 3,
          py: 2.5,
        }}
      >
        <Typography component="div" variant="h6" sx={{ fontWeight: 'extrabold', color: '#1e293b' }}>
          {isEditMode ? 'Edit Commodity Template' : 'Add New Commodity Template'}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: '#94a3b8', hover: { color: '#64748b' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-3">
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: '#475569', mb: 1, fontSize: '12px' }}
            >
              Metal
            </Typography>
            <Select
              name="metal"
              value={formData.metal}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
              required
            >
              {commodities.length > 0 ? (
                commodities.map((commodity) => (
                  <MenuItem key={commodity._id} value={commodity.symbol} sx={{ fontSize: '13px' }}>
                    {commodity.symbol}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" sx={{ fontSize: '13px' }}>
                  Loading...
                </MenuItem>
              )}
            </Select>
          </div>
          <div className="col-span-3">
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: '#475569', mb: 1, fontSize: '12px' }}
            >
              Purity
            </Typography>
            <Select
              name="purity"
              value={formData.purity}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
              required
            >
              <MenuItem value={9999} sx={{ fontSize: '13px' }}>
                9999
              </MenuItem>
              <MenuItem value={999.9} sx={{ fontSize: '13px' }}>
                999.9
              </MenuItem>
              <MenuItem value={999} sx={{ fontSize: '13px' }}>
                999
              </MenuItem>
              <MenuItem value={995} sx={{ fontSize: '13px' }}>
                995
              </MenuItem>
              <MenuItem value={916} sx={{ fontSize: '13px' }}>
                916
              </MenuItem>
              <MenuItem value={920} sx={{ fontSize: '13px' }}>
                920
              </MenuItem>
              <MenuItem value={875} sx={{ fontSize: '13px' }}>
                875
              </MenuItem>
              <MenuItem value={750} sx={{ fontSize: '13px' }}>
                750
              </MenuItem>
            </Select>
          </div>
          <div className="col-span-3">
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: '#475569', mb: 1, fontSize: '12px' }}
            >
              Sell Premium
            </Typography>
            <TextField
              name="sellPremiumUSD"
              placeholder="USD"
              value={formData.sellPremiumUSD}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
            />
          </div>
          <div className="col-span-3">
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: '#475569', mb: 1, fontSize: '12px' }}
            >
              Sell Charges
            </Typography>
            <TextField
              name="sellCharges"
              placeholder={currency}
              value={formData.sellCharges}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
            />
          </div>
          <div className="col-span-3">
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: '#475569', mb: 1, fontSize: '12px' }}
            >
              Unit
            </Typography>
            <TextField
              name="unit"
              type="number"
              value={formData.unit}
              onChange={handleChange}
              fullWidth
              size="small"
              // @ts-ignore
              inputProps={{ min: 0, max: 1000, step: 0.1 }}
              required
              sx={inputStyle}
            />
          </div>
          <div className="col-span-3">
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: '#475569', mb: 1, fontSize: '12px' }}
            >
              Weight
            </Typography>
            <Select
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
              required
            >
              <MenuItem value="GM" sx={{ fontSize: '13px' }}>
                GM
              </MenuItem>
              <MenuItem value="KG" sx={{ fontSize: '13px' }}>
                KG
              </MenuItem>
              <MenuItem value="TTB" sx={{ fontSize: '13px' }}>
                TTB
              </MenuItem>
              <MenuItem value="TOLA" sx={{ fontSize: '13px' }}>
                TOLA
              </MenuItem>
              <MenuItem value="OZ" sx={{ fontSize: '13px' }}>
                OZ
              </MenuItem>
            </Select>
          </div>
          <div className="col-span-3">
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: '#475569', mb: 1, fontSize: '12px' }}
            >
              Buy Premium
            </Typography>
            <TextField
              name="buyPremiumUSD"
              placeholder="USD"
              value={formData.buyPremiumUSD}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
            />
          </div>
          <div className="col-span-3">
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: '#475569', mb: 1, fontSize: '12px' }}
            >
              Buy Charges
            </Typography>
            <TextField
              name="buyCharges"
              placeholder={currency}
              value={formData.buyCharges}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
            />
          </div>
          <div className="col-span-6">
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: '#475569', mb: 1, fontSize: '12px' }}
            >
              Alternate Metal Name
            </Typography>
            <TextField
              name="metal_name"
              placeholder="Optional"
              value={formData.metal_name}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
            />
          </div>
          <div className="col-span-6">
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: '#475569', mb: 1, fontSize: '12px' }}
            >
              Group
            </Typography>
            <Select
              name="group"
              value={formData.group}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
            >
              <MenuItem value="commodity" sx={{ fontSize: '13px' }}>
                Commodity
              </MenuItem>
              <MenuItem value="group1" sx={{ fontSize: '13px' }}>
                Group 1
              </MenuItem>
              <MenuItem value="group2" sx={{ fontSize: '13px' }}>
                Group 2
              </MenuItem>
            </Select>
          </div>
          <div className="col-span-12">
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-1.5 mt-2">
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th
                      style={{
                        width: '20%',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        padding: '6px 8px',
                        borderRadius: '8px 0 0 8px',
                      }}
                    >
                      Type
                    </th>
                    <th
                      style={{
                        width: '40%',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        padding: '6px 8px',
                      }}
                    >
                      {currency}
                    </th>
                    <th
                      style={{
                        width: '40%',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        padding: '6px 8px',
                        borderRadius: '0 8px 8px 0',
                      }}
                    >
                      USD
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      align="center"
                      style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}
                    >
                      Buy
                    </td>
                    <td>
                      <TextField
                        name={`buy${currency}`}
                        value={formData.buyAED}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        sx={previewInputStyle}
                        disabled={true}
                      />
                    </td>
                    <td>
                      <TextField
                        name="buyUSD"
                        value={formData.buyUSD}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        sx={previewInputStyle}
                        disabled={true}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td
                      align="center"
                      style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}
                    >
                      Sell
                    </td>
                    <td>
                      <TextField
                        name={`sell${currency}`}
                        value={formData.sellAED}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        sx={previewInputStyle}
                        disabled={true}
                      />
                    </td>
                    <td>
                      <TextField
                        name="sellUSD"
                        value={formData.sellUSD}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        sx={previewInputStyle}
                        disabled={true}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end', gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            color: '#64748b',
            fontWeight: 'bold',
            textTransform: 'none',
            borderRadius: '10px',
            px: 2.5,
            py: 1,
            '&:hover': {
              backgroundColor: '#f1f5f9',
            },
          }}
        >
          Close
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            background: 'linear-gradient(270deg, rgb(0, 128, 207) 0%, rgb(0, 163, 255) 100%)',
            color: 'white',
            fontWeight: 'bold',
            textTransform: 'none',
            borderRadius: '10px',
            px: 3,
            py: 1,
            boxShadow: '0 4px 6px -1px rgb(0 163 255 / 0.1), 0 2px 4px -2px rgb(0 163 255 / 0.1)',
            '&:hover': {
              background: 'linear-gradient(270deg, rgb(0, 110, 180) 0%, rgb(0, 140, 220) 100%)',
              boxShadow: 'none',
            },
          }}
        >
          {isEditMode ? 'Save Changes' : 'Save Commodity'}
        </Button>
      </DialogActions>
      <Snackbar open={toastOpen} autoHideDuration={6000} onClose={handleToastClose}>
        <Alert onClose={handleToastClose} severity="error" sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default React.memo(AddCommodityModal);
