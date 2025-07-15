'use client';

import { useState, useEffect } from 'react';
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
  Store as RetailerIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import axios from 'axios';
import useSWRMutation from 'swr/mutation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
        sx={{ '& .MuiInputBase-input': { color: 'text.primary' } }}
      />
    </Box>
    {/* Hiển thị error message bên ngoài Box */}
    {error && helperText && (
      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
        {helperText}
      </Typography>
    )}
  </Box>
);

async function createContract(url, { arg: payload }) {
  const response = await axiosInstance.post(url, payload, {
    headers: getAuthHeaders()
  });
  return response.data;
}

// Helper function để validate số nguyên strict
const isValidInteger = (value) => {
  // Loại bỏ khoảng trắng
  const trimmed = value.toString().trim();
  // Kiểm tra chỉ chứa số
  if (!/^\d+$/.test(trimmed)) return false;
  // Parse và kiểm tra
  const parsed = Number.parseInt(trimmed, 10);
  return !isNaN(parsed) && parsed > 0 && parsed.toString() === trimmed;
};

// Helper function để validate số thực strict
const isValidFloat = (value) => {
  // Loại bỏ khoảng trắng
  const trimmed = value.toString().trim();
  // Kiểm tra format số (có thể có dấu chấm)
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return false;
  // Parse và kiểm tra
  const parsed = Number.parseFloat(trimmed);
  return !isNaN(parsed) && parsed >= 0;
};

const EconomicContractAddDialog = ({ open, onClose, onSuccess, suppliers = [], retailers = [], medicines = [] }) => {
  const [formData, setFormData] = useState({
    contract_code: '',
    partner_type: 'Supplier', // Default to Supplier
    partner_id: '',
    start_date: null,
    end_date: null,
    items: [{ medicine_id: '', quantity: '', unit_price: '' }]
  });

  const [errorValidate, setErrorValidate] = useState({});
  const [errorApi, setErrorApi] = useState('');

  const { trigger, isMutating } = useSWRMutation('/api/economic-contracts', createContract);

  useEffect(() => {
    if (open) {
      setFormData({
        contract_code: '',
        partner_type: 'Supplier',
        partner_id: '',
        start_date: null,
        end_date: null,
        items: [{ medicine_id: '', quantity: '', unit_price: '' }]
      });
      setErrorValidate({});
      setErrorApi('');
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'partner_type' && { partner_id: '' }) // Reset partner_id when partner_type changes
    }));
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

    // Clear error cho field cụ thể của item cụ thể
    setErrorValidate((prev) => {
      const newErrors = { ...prev };
      if (newErrors.items && Array.isArray(newErrors.items) && newErrors.items[index]) {
        newErrors.items[index] = {
          ...newErrors.items[index],
          [field]: ''
        };
        // Nếu item không còn error nào, xóa item đó khỏi array
        if (Object.values(newErrors.items[index]).every((err) => !err)) {
          newErrors.items[index] = null;
        }
      }
      return newErrors;
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { medicine_id: '', quantity: '', unit_price: '' }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, items: newItems }));

      // Cập nhật lại errors sau khi xóa item
      setErrorValidate((prev) => {
        const newErrors = { ...prev };
        if (newErrors.items && Array.isArray(newErrors.items)) {
          newErrors.items = newErrors.items.filter((_, i) => i !== index);
          if (newErrors.items.length === 0 || newErrors.items.every((item) => !item)) {
            delete newErrors.items;
          }
        }
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate contract_code
    if (!formData.contract_code.trim()) {
      newErrors.contract_code = 'Mã hợp đồng là bắt buộc';
    }

    // Validate partner_id
    if (!formData.partner_id) {
      newErrors.partner_id = 'Đối tác là bắt buộc';
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
      // Tạo array errors cho từng item
      const itemErrors = [];

      formData.items.forEach((item, index) => {
        const itemError = {};

        // Validate medicine_id
        if (!item.medicine_id) {
          itemError.medicine_id = 'Thuốc là bắt buộc';
        }

        // Validate quantity với strict checking
        if (!item.quantity && item.quantity !== '0') {
          itemError.quantity = 'Số lượng là bắt buộc';
        } else if (!isValidInteger(item.quantity)) {
          itemError.quantity = 'Số lượng phải là số nguyên dương (chỉ chứa chữ số)';
        }

        // Validate unit_price với strict checking
        if (!item.unit_price && item.unit_price !== '0') {
          itemError.unit_price = 'Đơn giá là bắt buộc';
        } else if (!isValidFloat(item.unit_price)) {
          itemError.unit_price = 'Đơn giá phải là số không âm (chỉ chứa chữ số và dấu chấm)';
        }

        // Chỉ thêm vào array nếu có lỗi
        itemErrors[index] = Object.keys(itemError).length > 0 ? itemError : null;
      });

      // Chỉ set items error nếu có ít nhất 1 item có lỗi
      if (itemErrors.some((error) => error !== null)) {
        newErrors.items = itemErrors;
      }
    }

    setErrorValidate(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setErrorApi('');

    try {
      const payload = {
        ...formData,
        items: formData.items.map((item) => ({
          ...item,
          quantity: Number.parseInt(item.quantity, 10),
          unit_price: Number.parseFloat(item.unit_price)
        }))
      };

      const response = await trigger(payload, {
        onSuccess: (data) => {
          if (data.success) {
            onSuccess(data.data);
            onClose();
          } else {
            setErrorApi(data.message || 'Tạo hợp đồng kinh tế thất bại');
          }
        },
        onError: (err) => {
          const serverMessage = err.response?.data?.message || err.message;
          setErrorApi(serverMessage || 'Lỗi khi tạo hợp đồng kinh tế');
        }
      });
    } catch (err) {
      console.error('Create economic contract error:', err);
      const serverMessage = err.response?.data?.message;
      setErrorApi(serverMessage || 'Lỗi khi tạo hợp đồng kinh tế');
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
              Thêm Hợp Đồng Kinh tế
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
          <Alert severity="error" sx={{ mb: 3 }}>
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
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Loại đối tác
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
                      minWidth: 250
                    }}
                  >
                    <Autocomplete
                      options={[
                        { value: 'Supplier', label: 'Nhà cung cấp' },
                        { value: 'Retailer', label: 'Nhà bán lẻ' }
                      ]}
                      getOptionLabel={(option) => option.label || ''}
                      value={
                        formData.partner_type
                          ? [
                              { value: 'Supplier', label: 'Nhà cung cấp' },
                              { value: 'Retailer', label: 'Nhà bán lẻ' }
                            ].find((opt) => opt.value === formData.partner_type)
                          : { value: 'Supplier', label: 'Nhà cung cấp' }
                      }
                      onChange={(event, newValue) => {
                        setFormData((prev) => ({
                          ...prev,
                          partner_type: newValue ? newValue.value : 'Supplier',
                          partner_id: '' // Reset partner_id when partner_type changes
                        }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          placeholder="Chọn loại đối tác"
                          InputProps={{
                            ...params.InputProps,
                            disableUnderline: true
                          }}
                          sx={{ width: '100%' }}
                        />
                      )}
                      sx={{ width: '100%' }}
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    {formData.partner_type === 'Supplier' ? (
                      <SupplierIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    ) : (
                      <RetailerIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Đối tác
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
                      borderColor: !!errorValidate.partner_id ? 'red' : '#e0e0e0'
                    }}
                  >
                    <Autocomplete
                      options={formData.partner_type === 'Supplier' ? suppliers : retailers}
                      getOptionLabel={(option) => option.name || ''}
                      value={
                        (formData.partner_type === 'Supplier'
                          ? suppliers.find((s) => s._id === formData.partner_id)
                          : retailers.find((r) => r._id === formData.partner_id)) || null
                      }
                      onChange={(event, newValue) => {
                        setFormData((prev) => ({
                          ...prev,
                          partner_id: newValue ? newValue._id : ''
                        }));
                        setErrorValidate((prev) => ({ ...prev, partner_id: '' }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          placeholder={formData.partner_type === 'Supplier' ? 'Chọn nhà cung cấp' : 'Chọn nhà bán lẻ'}
                          error={!!errorValidate.partner_id}
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
                  {/* Error message cho partner */}
                  {errorValidate.partner_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {errorValidate.partner_id}
                    </Typography>
                  )}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Thuốc #{index + 1}
                  </Typography>
                  {formData.items.length > 1 && (
                    <Button size="small" color="error" onClick={() => removeItem(index)} sx={{ textTransform: 'none' }}>
                      Xóa
                    </Button>
                  )}
                </Box>

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
                          borderColor:
                            errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.medicine_id
                              ? 'red'
                              : '#e0e0e0'
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
                              error={
                                !!(errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.medicine_id)
                              }
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
                      {/* Error message cho medicine */}
                      {errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.medicine_id && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                          {errorValidate.items[index].medicine_id}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <InfoField
                      label="Số lượng đặt"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      error={!!(errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.quantity)}
                      helperText={
                        errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.quantity
                          ? errorValidate.items[index].quantity
                          : ''
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <InfoField
                      label="Đơn giá"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      error={!!(errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.unit_price)}
                      helperText={
                        errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.unit_price
                          ? errorValidate.items[index].unit_price
                          : ''
                      }
                    />
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
          disabled={isMutating}
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
          disabled={isMutating}
        >
          {isMutating ? 'Đang tạo...' : 'Tạo hợp đồng'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EconomicContractAddDialog;
