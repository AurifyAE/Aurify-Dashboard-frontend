import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, Grid, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '../../axios/axiosInstance';
import { Snackbar, Alert } from '@mui/material';


const AddCommodityModal = ({ open, onClose, onSave, initialData, marketData, isEditing, exchangeRate, currency, spreadMarginData }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState({});
  const [commodityId, setCommodityId] = useState(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [formData, setFormData] = useState({
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
  const [commodities, setCommodities] = useState([]);
  const [spotRates, setSpotRates] = useState(null);
  const [adminId, setAdminId] = useState('');
  const [errors, setErrors] = useState(null);

  const exchangeRates = useMemo(() => ({
    AED: 3.674,
    USD: 1,
    EUR: 0.92,
    GBP: 0.79
  }), []);

  const convertCurrency = useCallback((amount, fromCurrency, toCurrency) => {
    if (!amount) return '';
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return '';
    const inUSD = parsed / exchangeRates[fromCurrency];
    return (inUSD * exchangeRates[toCurrency]).toFixed(4);
  }, [exchangeRates]);

  const getUnitMultiplier = useCallback((weight) => {
    switch (weight) {
      case 'GM': return 1;
      case 'KG': return 1000;
      case 'TTB': return 116.6400;
      case 'TOLA': return 11.664;
      case 'OZ': return 31.1034768;
      default: return 1;
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
        const userName = localStorage.getItem('userName');
        if (!userName) {
          console.error('userName not found in localStorage.');
          return;
        }
        const response = await axiosInstance.get(`/data/${userName}`);
        if (response && response.data && response.data.data) {
          setAdminId(response.data.data._id);
        } else {
          console.error('Invalid response or missing data:', response);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    fetchAdminId();
  }, []);


  useEffect(() => {
    if (initialData && (isEditing || open)) {
      setFormData(prevState => ({
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
  }, [initialData, isEditing, open]);

  useEffect(() => {
    const fetchSpotRates = async () => {
      if (!adminId) return;
      try {
        const response = await axiosInstance.get(`/spotrates/${adminId}`);
        if (response && response.data && typeof response.data === 'object') {
          setSpotRates(response.data);
        } else {
          setSpotRates({}); // Initialize with an empty object if data is invalid
        }
      } catch (error) {
        console.error('Error fetching spot rates:', error);
        setErrors('Failed to fetch spot rates');
        setSpotRates({}); // Initialize with an empty object on error
      }
    };

    if (adminId) {
      fetchSpotRates();
    }
  }, [adminId]);


  const calculatePrices = useCallback(() => {
    setFormData(prevState => {
      if (prevState.metal && prevState.purity && prevState.unit && prevState.weight) {
        const metal = prevState.metal;
        const isGoldRelated = ['Gold', 'Gold Kilobar', 'Gold TOLA', 'Gold Ten TOLA', 'Gold Coin', 'Minted Bar'].includes(metal);
        const metalBid = isGoldRelated ? marketData['Gold']?.bid : (marketData[metal]?.bid || 0);
        const bidSpread = spreadMarginData[`${metal.toLowerCase()}BidSpread`] || 0;
        const askSpread = spreadMarginData[`${metal.toLowerCase()}AskSpread`] || 0;
        const additionalPrice = isGoldRelated ? 0.5 : 0.05;

        const unitMultiplier = getUnitMultiplier(prevState.weight);
        const purityValue = parseFloat(prevState.purity);
        const purityLength = String(prevState.purity).split('.')[0].length;

        const sellPremiumUSD = parseFloat(prevState.sellPremiumUSD) || 0;
        const buyPremiumUSD = parseFloat(prevState.buyPremiumUSD) || 0;
        const sellCharge = parseFloat(prevState.sellCharges) || 0;
        const buyCharge = parseFloat(prevState.buyCharges) || 0;

        const baseBuyPrice = (((parseFloat(metalBid) + parseFloat(bidSpread) + parseFloat(buyPremiumUSD)) / 31.103) * exchangeRate * prevState.unit * unitMultiplier) * (purityValue / Math.pow(10, purityLength));
        const baseSellPrice = (((parseFloat(metalBid) + parseFloat(bidSpread) + parseFloat(askSpread) + additionalPrice + parseFloat(sellPremiumUSD)) / 31.103) * exchangeRate * prevState.unit * unitMultiplier) * (purityValue / Math.pow(10, purityLength));

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
          buyUSD: convertCurrency(buyPrice.toFixed(4), currency, 'USD')
        };
      }
      return prevState;
    });
  }, [marketData, spreadMarginData, exchangeRate, currency, getUnitMultiplier, convertCurrency]);


  useEffect(() => {
    calculatePrices();
  }, [formData.metal, formData.purity, formData.unit, formData.weight, formData.buyCharges, formData.sellCharges, formData.buyPremiumUSD, formData.sellPremiumUSD, calculatePrices]);




  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (!name) return;

    let updatedValue = value;
    if (['purity', 'unit'].includes(name)) {
      updatedValue = value === '' ? '' : value;
    } else if (['sellPremiumUSD', 'sellCharges', 'buyPremiumUSD', 'buyCharges', 'buyAED', 'buyUSD', 'sellAED', 'sellUSD', 'metal_name'].includes(name)) {
      updatedValue = value === '' ? '' : value;
    }

    setFormData(prevState => ({
      ...prevState,
      [name]: updatedValue
    }));
  }, []);

  useEffect(() => {
    const fetchCommodities = async () => {
      const userName = localStorage.getItem('userName');
      if (!userName) {
        setError('User not logged in');
        return;
      }
      try {
        const response = await axiosInstance.get(`/data/${userName}`);
        if (response && response.data && response.data.data && Array.isArray(response.data.data.commodities)) {
          const fetchedCommodities = response.data.data.commodities;
          const goldItems = [
            { _id: 'gold', symbol: 'Gold' },
            { _id: 'gold-kilobar', symbol: 'Gold Kilobar' },
            { _id: 'gold-tola', symbol: 'Gold TOLA' },
            { _id: 'gold-ten-tola', symbol: 'Ten TOLA' },
            { _id: 'gold-coin', symbol: 'Gold Coin' },
            { _id: 'minted-bar', symbol: 'Minted Bar' }
          ];
          const nonGoldItems = fetchedCommodities.filter(item => !goldItems.find(goldItem => goldItem.symbol === item.symbol));
          const combinedCommodities = [...goldItems, ...nonGoldItems];
          setCommodities(combinedCommodities);
        } else {
          console.error('Invalid commodities data:', response.data);
        }
      } catch (error) {
        console.error('Error fetching commodities:', error);
      }
    };

    fetchCommodities();
  }, []);


  const handleSave = useCallback(async () => {
    const requiredFields = ['metal', 'purity', 'unit', 'weight'];
    const emptyFields = requiredFields.filter(field => !formData[field]);

    if (emptyFields.length > 0) {
      setToastMessage(`${emptyFields.join(', ')} ${emptyFields.length > 1 ? 'are' : 'is'} required`);
      setToastOpen(true);
      return;
    }

    try {
      const commodityData = {
        metal: formData.metal,
        purity: parseFloat(formData.purity),
        unit: parseFloat(formData.unit),
        weight: formData.weight,
      };

      if (formData.sellCharges !== '') commodityData.sellCharge = parseFloat(formData.sellCharges) || 0;
      if (formData.buyCharges !== '') commodityData.buyCharge = parseFloat(formData.buyCharges) || 0;
      if (formData.sellPremiumUSD !== '') commodityData.sellPremium = parseFloat(formData.sellPremiumUSD) || 0;
      if (formData.buyPremiumUSD !== '') commodityData.buyPremium = parseFloat(formData.buyPremiumUSD) || 0;

      commodityData.metal_name = formData.metal_name?.trim() ? formData.metal_name.trim() : null;
      commodityData.group = formData.group || 'commodity';

      let response;
      if (isEditMode) {
        response = await axiosInstance.patch(`/spotrate-commodity/${adminId}/${initialData._id}`, commodityData);
      } else {
        response = await axiosInstance.post('/spotrate-commodity', { adminId, commodity: commodityData });
      }

      if (response.status === 200) {
        onSave(commodityData, isEditMode);
        resetForm();
        onClose();
      } else {
        console.error('Failed to update/add commodity');
      }
    } catch (error) {
      console.error('Error saving commodity:', error);
    }
  }, [formData, isEditMode, adminId, initialData, onSave, onClose, resetForm]);



  const handleToastClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setToastOpen(false);
  };

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
    },
    '& .Mui-disabled': {
      backgroundColor: 'transparent',
      color: 'inherit',
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
      disableBackdropClick={true}
      disableEscapeKeyDown={true}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa', borderBottom: '1px solid #dee2e6', p: 2 }}>
        <Typography variant="h6">{isEditMode ? 'Edit Commodity' : 'Add New Commodity'}</Typography>
        <Button onClick={onClose}><CloseIcon /></Button>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography variant="body2" fontWeight="medium" mb={1}>Metal</Typography>
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
                  <MenuItem key={commodity._id} value={commodity.symbol}>
                    {commodity.symbol}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="">Loading...</MenuItem>
              )}
            </Select>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" fontWeight="medium" mb={1}>Purity</Typography>
            <Select
              name="purity"
              value={formData.purity}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
              required
            >
              <MenuItem value={9999}>9999</MenuItem>
              <MenuItem value={999.9}>999.9</MenuItem>
              <MenuItem value={999}>999</MenuItem>
              <MenuItem value={995}>995</MenuItem>
              <MenuItem value={916}>916</MenuItem>
              <MenuItem value={920}>920</MenuItem>
              <MenuItem value={875}>875</MenuItem>
              <MenuItem value={750}>750</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" fontWeight="medium" mb={1}>Sell Premium</Typography>
            <TextField
              name="sellPremiumUSD"
              placeholder="USD"
              value={formData.sellPremiumUSD}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" fontWeight="medium" mb={1}>Sell Charges</Typography>
            <TextField
              name="sellCharges"
              placeholder={currency}
              value={formData.sellCharges}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" fontWeight="medium" mb={1}>Unit</Typography>
            <TextField
              name="unit"
              type="number"
              value={formData.unit}
              onChange={handleChange}
              fullWidth
              size="small"
              inputProps={{ min: 0, max: 1000, step: 0.1 }}
              required
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" fontWeight="medium" mb={1}>Weight</Typography>
            <Select
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
              required
            >
              <MenuItem value="GM">GM</MenuItem>
              <MenuItem value="KG">KG</MenuItem>
              <MenuItem value="TTB">TTB</MenuItem>
              <MenuItem value="TOLA">TOLA</MenuItem>
              <MenuItem value="OZ">OZ</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" fontWeight="medium" mb={1}>Buy Premium</Typography>
            <TextField
              name="buyPremiumUSD"
              placeholder="USD"
              value={formData.buyPremiumUSD}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" fontWeight="medium" mb={1}>Buy Charges</Typography>
            <TextField
              name="buyCharges"
              placeholder={currency}
              value={formData.buyCharges}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" fontWeight="medium" mb={1}>Alternate Metal Name</Typography>
            <TextField
              name="metal_name"
              placeholder="Optional"
              value={formData.metal_name}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" fontWeight="medium" mb={1}>Group</Typography>
            <Select
              name="group"
              value={formData.group}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={inputStyle}
            >
              <MenuItem value="commodity">Commodity</MenuItem>
              <MenuItem value="group1">Group 1</MenuItem>
              <MenuItem value="group2">Group 2</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr>
                  <th style={{ width: '20%' }}></th>
                  <th style={{ width: '40%' }}>{currency}</th>
                  <th style={{ width: '40%' }}>USD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th align="middle">Buy</th>
                  <td>
                    <TextField
                      name={`buy${currency}`}
                      value={formData[`buyAED`]}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      sx={inputStyle}
                      disabled={true}
                      inputProps={{
                        style: { textAlign: 'center' }
                      }}
                    />
                  </td>
                  <td>
                    <TextField
                      name="buyUSD"
                      value={formData.buyUSD}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      sx={inputStyle}
                      disabled={true}
                      inputProps={{
                        style: { textAlign: 'center' }
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <th align="middle">Sell</th>
                  <td>
                    <TextField
                      name={`sell${currency}`}
                      value={formData[`sellAED`]}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      sx={inputStyle}
                      disabled={true}
                      inputProps={{
                        style: { textAlign: 'center' }
                      }}
                    />
                  </td>
                  <td>
                    <TextField
                      name="sellUSD"
                      value={formData.sellUSD}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      sx={inputStyle}
                      disabled={true}
                      inputProps={{
                        style: { textAlign: 'center' }
                      }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ bgcolor: '#f8f9fa', borderTop: '1px solid #dee2e6', p: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onClose} variant="contained" color="inherit" sx={{ mr: 1 }}>
          Close
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {isEditMode ? 'Save Changes' : 'Save'}
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