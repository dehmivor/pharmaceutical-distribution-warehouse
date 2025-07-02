'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  FormHelperText,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  ViewList as ViewIcon,
  Description as ContractIcon,
  LocalShipping as SupplierIcon,
  Event as EventIcon,
  Inventory as InventoryIcon,
  MonetizationOn as PriceIcon,
  StarBorder as KpiIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import axios from 'axios';
import useSWRMutation from 'swr/mutation'; // Import useSWRMutation cho POST

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const InfoField = ({ label, value, icon: Icon, onChange, disabled = false, error = false, helperText = '' }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
      {Icon && <Icon sx={{ fontSize: 20, color: 'text.secondary' }} />}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
    <Box
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        padding: '8px 12px',
        backgroundColor: '#fafafa',
        minHeight: 40,
        display: 'flex',
        alignItems: 'center',
        borderColor: error ? 'red' : '#e0e0e0'
      }}
    >
      <TextField
        fullWidth
        value={value}
        onChange={onChange}
        disabled={disabled}
        variant="standard"
        error={error}
        helperText={helperText}
        sx={{ '& .MuiInputBase-input': { color: 'text.primary' } }}
      />
    </Box>
  </Box>
);

async function createContract(url, { arg: payload }) {
  const response = await axiosInstance.post(url, payload, {
    headers: getAuthHeaders()
  });
  return response.data;
}

const SupplierContractAddDialog = ({ open, onClose, onSuccess, suppliers = [], medicines = [] }) => {
  const [formData, setFormData] = useState({
    contract_code: '',
    supplier_id: '',
    start_date: null,
    end_date: null,
    items: [{ medicine_id: '', quantity: '', min_order_quantity: '', unit_price: '', kpi_details: [] }]
  });
  const [errorValidate, setErrorValidate] = useState({});
  const [errorApi, setErrorApi] = useState('');
  const [loading, setLoading] = useState(false);
  const { trigger, isMutating } = useSWRMutation('/supplier-contract', createContract);

  useEffect(() => {
    if (open) {
      setFormData({
        contract_code: '',
        supplier_id: '',
        start_date: null,
        end_date: null,
        items: [{ medicine_id: '', quantity: '', min_order_quantity: '', unit_price: '', kpi_details: [] }]
      });
      setErrorValidate({});
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorValidate((prev) => ({ ...prev, [name]: '' }));
  };

  const handleDateChange = (field) => (date) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
    setErrorValidate((prev) => ({ ...prev, [field]: '' }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData((prev) => ({ ...prev, items: newItems }));
    setErrorValidate((prev) => {
      const newErrors = { ...prev };
      if (newErrors.items && newErrors.items[index]) {
        newErrors.items[index][field] = '';
      }
      return newErrors;
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { medicine_id: '', quantity: '', min_order_quantity: '', unit_price: '', kpi_details: [] }]
    }));
  };

  const handleKpiChange = (itemIndex, kpiIndex, field, value) => {
    const newItems = [...formData.items];
    if (!newItems[itemIndex].kpi_details[kpiIndex]) {
      newItems[itemIndex].kpi_details[kpiIndex] = {};
    }
    newItems[itemIndex].kpi_details[kpiIndex][field] = value;
    setFormData((prev) => ({ ...prev, items: newItems }));
    setErrorValidate((prev) => {
      const newErrors = { ...prev };
      if (newErrors.items && newErrors.items[itemIndex] && newErrors.items[itemIndex].kpi_details) {
        newErrors.items[itemIndex].kpi_details[kpiIndex] = newErrors.items[itemIndex].kpi_details[kpiIndex] || {};
        newErrors.items[itemIndex].kpi_details[kpiIndex][field] = '';
      }
      return newErrors;
    });
  };

  const addKpi = (index) => {
    const newItems = [...formData.items];
    if (!newItems[index].kpi_details) newItems[index].kpi_details = [];
    newItems[index].kpi_details.push({ min_sale_quantity: '', profit_percentage: '' });
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const validateForm = () => {
    let newErrors = {};

    // Validate contract_code
    if (!formData.contract_code.trim()) {
      newErrors.contract_code = 'Mã hợp đồng là bắt buộc';
    }

    // Validate supplier_id
    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Nhà cung cấp là bắt buộc';
    }

    // Validate start_date
    if (!formData.start_date) {
      newErrors.start_date = 'Ngày bắt đầu là bắt buộc';
    }

    // Validate end_date
    if (!formData.end_date) {
      newErrors.end_date = 'Ngày kết thúc là bắt buộc';
    } else if (formData.start_date && formData.end_date <= formData.start_date) {
      newErrors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    // Validate items
    if (formData.items.length === 0) {
      newErrors.items = 'Phải có ít nhất 1 thuốc';
    } else {
      newErrors.items = formData.items
        .map((item, index) => {
          let itemErrors = {};
          if (!item.medicine_id) itemErrors.medicine_id = 'Thuốc là bắt buộc';
          if (!item.quantity && item.quantity !== 0) itemErrors.quantity = 'Số lượng là bắt buộc';
          else {
            const parsedQuantity = parseInt(item.quantity.replace(',', '.'), 10);
            if (isNaN(parsedQuantity) || parsedQuantity <= 0 || parsedQuantity !== Math.floor(parsedQuantity)) {
              itemErrors.quantity = 'Số lượng phải là số nguyên dương';
            }
          }
          if (!item.min_order_quantity && item.min_order_quantity !== 0) itemErrors.min_order_quantity = 'Số lượng tối thiểu là bắt buộc';
          else {
            const parsedMinOrder = parseInt(item.min_order_quantity.replace(',', '.'), 10);
            if (isNaN(parsedMinOrder) || parsedMinOrder <= 0 || parsedMinOrder !== Math.floor(parsedMinOrder)) {
              itemErrors.min_order_quantity = 'Số lượng tối thiểu phải là số nguyên dương';
            }
          }
          if (!item.unit_price && item.unit_price !== 0) itemErrors.unit_price = 'Đơn giá là bắt buộc';
          else {
            const parsedUnitPrice = parseFloat(item.unit_price.replace(',', '.'));
            if (isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
              itemErrors.unit_price = 'Đơn giá phải là số không âm';
            }
          }
          if (item.kpi_details && item.kpi_details.length > 0) {
            itemErrors.kpi_details = item.kpi_details
              .map((kpi, kpiIndex) => {
                let kpiErrors = {};
                if (!kpi.min_sale_quantity && kpi.min_sale_quantity !== 0)
                  kpiErrors.min_sale_quantity = 'Số lượng tối thiểu bán là bắt buộc';
                else if (isNaN(Number(kpi.min_sale_quantity)) || Number(kpi.min_sale_quantity) < 0)
                  kpiErrors.min_sale_quantity = 'Số lượng tối thiểu bán phải là số không âm';
                if (!kpi.profit_percentage && kpi.profit_percentage !== 0) kpiErrors.profit_percentage = 'Lợi nhuận (%) là bắt buộc';
                else if (isNaN(Number(kpi.profit_percentage)) || Number(kpi.profit_percentage) < 0 || Number(kpi.profit_percentage) > 100)
                  kpiErrors.profit_percentage = 'Lợi nhuận (%) phải là số từ 0 đến 100';
                return Object.keys(kpiErrors).length > 0 ? kpiErrors : null;
              })
              .filter((error) => error !== null);
          }
          return Object.keys(itemErrors).length > 0 ? itemErrors : null;
        })
        .filter((error) => error !== null);
      if (newErrors.items.length === 0) delete newErrors.items;
    }

    console.log('Lỗi là', newErrors);
    setErrorValidate(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrorApi('');

    try {
      const payload = {
        ...formData,
        items: formData.items.map((item) => ({
          ...item,
          quantity: parseInt(item.quantity.replace(',', '.'), 10),
          min_order_quantity: parseInt(item.min_order_quantity.replace(',', '.'), 10),
          unit_price: parseFloat(item.unit_price.replace(',', '.')),
          kpi_details: item.kpi_details.map((kpi) => ({
            ...kpi,
            min_sale_quantity: Number(kpi.min_sale_quantity),
            profit_percentage: Number(kpi.profit_percentage)
          }))
        }))
      };

      const response = await trigger(payload, {
        onSuccess: (data) => {
          if (data.success) {
            onSuccess(data.data);
            onClose();
          } else {
            setErrorApi(data.message || 'Tạo hợp đồng thất bại');
          }
        },
        onError: (err) => {
          const serverMessage = err.response?.data?.message || err.message;
          setErrorApi(serverMessage || 'Lỗi khi tạo hợp đồng mới');
        }
      });
    } catch (err) {
      console.error('Create supplier contract error:', err);
      const serverMessage = err.response?.data?.message;
      setErrorApi(serverMessage || 'Lỗi khi tạo hợp đồng mới');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ViewIcon />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Thêm Hợp Đồng Nhà Cung Cấp
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Thêm mới hợp đồng
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Đóng">
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {errorApi && (
          <Alert severity="error" sx={{ m: 3, mb: 0 }}>
            {errorApi}
          </Alert>
        )}
        {/* Card 1: Thông tin chính */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContractIcon color="primary" /> Thông Tin Chung
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InfoField
                  label="Mã hợp đồng"
                  value={formData.contract_code}
                  onChange={(e) => handleChange({ target: { name: 'contract_code', value: e.target.value } })}
                  error={!!errorValidate.contract_code}
                  helperText={errorValidate.contract_code}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <SupplierIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Nhà cung cấp
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      padding: '8px 12px',
                      backgroundColor: '#fafafa',
                      minHeight: 40,
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      minWidth: 250,
                      borderColor: !!errorValidate.supplier_id ? 'red' : '#e0e0e0'
                    }}
                  >
                    <Autocomplete
                      options={suppliers}
                      getOptionLabel={(option) => option.name || ''}
                      value={suppliers.find((s) => s._id === formData.supplier_id) || null}
                      onChange={(event, newValue) => {
                        setFormData((prev) => ({
                          ...prev,
                          supplier_id: newValue ? newValue._id : ''
                        }));
                        setErrorValidate((prev) => ({ ...prev, supplier_id: '' }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          placeholder="Chọn nhà cung cấp"
                          error={!!errorValidate.supplier_id}
                          helperText={errorValidate.supplier_id}
                          InputProps={{
                            ...params.InputProps,
                            disableUnderline: true
                          }}
                          sx={{ width: '100%' }}
                        />
                      )}
                      filterOptions={(options, { inputValue }) =>
                        options.filter((option) => option.name.toLowerCase().includes(inputValue.toLowerCase()))
                      }
                      sx={{ width: '100%' }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card 2: Thời gian hiệu lực */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon color="success" /> Thời Gian Hiệu Lực
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errorValidate.start_date}>
                    <DatePicker
                      label="Ngày bắt đầu"
                      value={formData.start_date}
                      onChange={handleDateChange('start_date')}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: {
                          error: !!errorValidate.start_date,
                          fullWidth: true
                        }
                      }}
                    />
                    {errorValidate.start_date && <FormHelperText sx={{ color: 'error.main' }}>{errorValidate.start_date}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errorValidate.end_date}>
                    <DatePicker
                      label="Ngày kết thúc"
                      value={formData.end_date}
                      onChange={handleDateChange('end_date')}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: {
                          error: !!errorValidate.end_date,
                          fullWidth: true
                        }
                      }}
                    />
                    {errorValidate.end_date && <FormHelperText sx={{ color: 'error.main' }}>{errorValidate.end_date}</FormHelperText>}
                  </FormControl>
                </Grid>
              </Grid>
            </LocalizationProvider>
          </CardContent>
        </Card>

        {/* Card 3: Danh sách thuốc */}
        <Card sx={{ border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon color="secondary" /> Danh Sách Thuốc
            </Typography>
            {formData.items.map((item, index) => (
              <Box key={index} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Thuốc #{index + 1}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <InventoryIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Thuốc
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          padding: '8px 12px',
                          backgroundColor: '#fafafa',
                          minHeight: 40,
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          minWidth: 200,
                          borderColor: errorValidate.items?.[index]?.medicine_id ? 'red' : '#e0e0e0'
                        }}
                      >
                        <Autocomplete
                          options={medicines}
                          getOptionLabel={(option) => option.license_code || ''}
                          value={medicines.find((m) => m._id === item.medicine_id) || null}
                          onChange={(event, newValue) => {
                            handleItemChange(index, 'medicine_id', newValue ? newValue._id : '');
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              placeholder="Chọn thuốc"
                              error={!!errorValidate.items?.[index]?.medicine_id}
                              helperText={errorValidate.items?.[index]?.medicine_id}
                              InputProps={{
                                ...params.InputProps,
                                disableUnderline: true
                              }}
                              sx={{ width: '100%' }}
                            />
                          )}
                          filterOptions={(options, { inputValue }) =>
                            options.filter((option) => option.license_code.toLowerCase().includes(inputValue.toLowerCase()))
                          }
                          sx={{ width: '100%' }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InfoField
                      label="Số lượng đặt"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      error={!!errorValidate.items?.[index]?.quantity}
                      helperText={errorValidate.items?.[index]?.quantity}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InfoField
                      label="Số lượng tối thiểu"
                      value={item.min_order_quantity}
                      onChange={(e) => handleItemChange(index, 'min_order_quantity', e.target.value)}
                      error={!!errorValidate.items?.[index]?.min_order_quantity}
                      helperText={errorValidate.items?.[index]?.min_order_quantity}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InfoField
                      label="Đơn giá"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      error={!!errorValidate.items?.[index]?.unit_price}
                      helperText={errorValidate.items?.[index]?.unit_price}
                    />
                  </Grid>
                  {/* KPI (optional) */}
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!item.kpi_details.length}
                            onChange={(e) => {
                              if (e.target.checked && !item.kpi_details.length) addKpi(index);
                            }}
                          />
                        }
                        label="Thêm KPI"
                      />
                      {item.kpi_details.map((kpi, kpiIndex) => (
                        <Box key={kpiIndex} sx={{ pl: 4, mt: 1 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={5}>
                              <TextField
                                fullWidth
                                label="Số lượng tối thiểu bán"
                                value={kpi.min_sale_quantity || ''}
                                onChange={(e) => handleKpiChange(index, kpiIndex, 'min_sale_quantity', e.target.value)}
                                error={!!errorValidate.items?.[index]?.kpi_details?.[kpiIndex]?.min_sale_quantity}
                                helperText={errorValidate.items?.[index]?.kpi_details?.[kpiIndex]?.min_sale_quantity}
                              />
                            </Grid>
                            <Grid item xs={5}>
                              <TextField
                                fullWidth
                                label="Lợi nhuận (%)"
                                value={kpi.profit_percentage || ''}
                                onChange={(e) => handleKpiChange(index, kpiIndex, 'profit_percentage', e.target.value)}
                                error={!!errorValidate.items?.[index]?.kpi_details?.[kpiIndex]?.profit_percentage}
                                helperText={errorValidate.items?.[index]?.kpi_details?.[kpiIndex]?.profit_percentage}
                              />
                            </Grid>
                            <Grid item xs={2}>
                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                  const newItems = [...formData.items];
                                  newItems[index].kpi_details.splice(kpiIndex, 1);
                                  setFormData((prev) => ({ ...prev, items: newItems }));
                                }}
                              >
                                Xóa
                              </Button>
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                      {item.kpi_details.length > 0 && (
                        <Box sx={{ pl: 4, mt: 1 }}>
                          <Button variant="outlined" onClick={() => addKpi(index)}>
                            Thêm KPI khác
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ))}
            {errorValidate.items && typeof errorValidate.items === 'string' && (
              <Typography color="error" sx={{ mt: 1 }}>
                {errorValidate.items}
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={addItem} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Thêm thuốc
              </Button>
            </Box>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, bgcolor: 'grey.50', borderTop: '1px solid #e0e0e0' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ px: 3, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            px: 3,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' }
          }}
          disabled={loading}
        >
          {loading ? 'Đang tạo...' : 'Tạo hợp đồng'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupplierContractAddDialog;
