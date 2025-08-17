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
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Alert,
  Chip,
  Divider,
  InputAdornment,
  FormHelperText
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as ContractIcon,
  LocalShipping as SupplierIcon,
  Store as RetailerIcon,
  Event as EventIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  AttachFile as AnnexIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';
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

const isValidInteger = (value) => {
  const num = parseInt(value);
  return !isNaN(num) && num > 0 && Number.isInteger(num);
};

const isValidFloat = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

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
        backgroundColor: disabled ? '#f5f5f5' : '#fafafa',
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
        sx={{
          '& .MuiInputBase-input': {
            color: disabled ? 'text.disabled' : 'text.primary'
          }
        }}
      />
    </Box>
    {error && helperText && (
      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
        {helperText}
      </Typography>
    )}
  </Box>
);

async function updateContract(url, { arg: payload }) {
  const response = await axiosInstance.put(url, payload, {
    headers: getAuthHeaders()
  });
  return response.data;
}

const PrincipalContractEditDialog = ({ open, onClose, contract, onSuccess, suppliers = [], retailers = [], isViewMode = false }) => {
  const trans = useTrans();
  const [formData, setFormData] = useState({
    contract_code: '',
    contract_type: 'principal',
    partner_type: 'Supplier',
    partner_id: '',
    start_date: null,
    end_date: null,
    items: [{ medicine_id: '', unit_price: '' }],
    annexes: []
  });
  const [errorValidate, setErrorValidate] = useState({});
  const [errorApi, setErrorApi] = useState('');
  const [medicines, setMedicines] = useState([]);
  const { trigger, isMutating } = useSWRMutation(contract?._id ? `/api/contract/${contract._id}` : null, updateContract);

  // Fetch medicines
  const fetchAllMedicines = async () => {
    try {
      const response = await axiosInstance.get('/api/medicine/all/v1', {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setMedicines(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAllMedicines();
    }
  }, [open]);

  useEffect(() => {
    if (open && contract) {
      setFormData({
        contract_code: contract.contract_code || '',
        contract_type: contract.contract_type || 'principal',
        partner_type: contract.partner_type || 'Supplier',
        partner_id: contract.partner_id?._id || contract.partner_id || '',
        start_date: contract.start_date ? new Date(contract.start_date) : null,
        end_date: contract.end_date ? new Date(contract.end_date) : null,
        items:
          contract.items && contract.items.length > 0
            ? contract.items.map((item) => ({
                medicine_id: item.medicine_id?._id || item.medicine_id || '',
                unit_price: item.unit_price?.toString() || ''
              }))
            : [{ medicine_id: '', unit_price: '' }],
        annexes: contract.annexes
          ? contract.annexes
              .filter((annex) => (contract.status === 'active' ? annex.status === 'active' : true))
              .map((annex) => ({
                ...annex,
                signed_date: annex.signed_date ? new Date(annex.signed_date) : null,
                end_date_change: annex.end_date_change
                  ? {
                      ...annex.end_date_change,
                      new_end_date: annex.end_date_change.new_end_date ? new Date(annex.end_date_change.new_end_date) : null
                    }
                  : null,
                medicine_changes: annex.medicine_changes
                  ? {
                      add_items: annex.medicine_changes.add_items
                        ? annex.medicine_changes.add_items.map((item) => ({
                            medicine_id: item.medicine_id?._id || item.medicine_id || '',
                            unit_price: item.unit_price?.toString() || ''
                          }))
                        : [],
                      remove_items: annex.medicine_changes.remove_items
                        ? annex.medicine_changes.remove_items.map((item) => ({
                            medicine_id: item.medicine_id?._id || item.medicine_id || ''
                          }))
                        : [],
                      update_prices: annex.medicine_changes.update_prices
                        ? annex.medicine_changes.update_prices.map((item) => ({
                            medicine_id: item.medicine_id?._id || item.medicine_id || '',
                            unit_price: item.unit_price?.toString() || ''
                          }))
                        : []
                    }
                  : { add_items: [], remove_items: [], update_prices: [] }
              }))
          : []
      });
      setErrorValidate({});
      setErrorApi('');
    }
  }, [open, contract]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'partner_type' && { partner_id: '' })
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

    setErrorValidate((prev) => {
      const newErrors = { ...prev };
      if (newErrors.items && Array.isArray(newErrors.items) && newErrors.items[index]) {
        newErrors.items[index] = {
          ...newErrors.items[index],
          [field]: ''
        };
        if (Object.values(newErrors.items[index]).every((err) => !err)) {
          newErrors.items[index] = null;
        }
      }
      return newErrors;
    });
  };

  const addItem = () => {
    const newItem = { medicine_id: '', unit_price: '' };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, items: newItems }));

      setErrorValidate((prev) => {
        const newErrors = { ...prev };
        if (newErrors.items && Array.isArray(newErrors.items)) {
          newErrors.items = newErrors.items.filter((_, i) => i !== index);
        }
        return newErrors;
      });
    }
  };

  const addAnnex = () => {
    const newAnnex = {
      annex_code: '',
      description: '',
      signed_date: null,
      medicine_changes: {
        add_items: [],
        remove_items: [],
        update_prices: []
      },
      end_date_change: null
    };
    setFormData((prev) => ({
      ...prev,
      annexes: [...prev.annexes, newAnnex]
    }));
  };

  const removeAnnex = (index) => {
    const newAnnexes = formData.annexes.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  const handleAnnexChange = (annexIndex, field, value) => {
    const newAnnexes = [...formData.annexes];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (!newAnnexes[annexIndex][parent]) {
        newAnnexes[annexIndex][parent] = {};
      }
      newAnnexes[annexIndex][parent][child] = value;
    } else {
      newAnnexes[annexIndex][field] = value;
    }
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  // Add items functions
  const addAnnexAddItem = (annexIndex) => {
    const newAnnexes = [...formData.annexes];
    if (!newAnnexes[annexIndex].medicine_changes) {
      newAnnexes[annexIndex].medicine_changes = {};
    }
    if (!newAnnexes[annexIndex].medicine_changes.add_items) {
      newAnnexes[annexIndex].medicine_changes.add_items = [];
    }
    newAnnexes[annexIndex].medicine_changes.add_items.push({
      medicine_id: '',
      unit_price: ''
    });
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  const removeAnnexAddItem = (annexIndex, itemIndex) => {
    const newAnnexes = [...formData.annexes];
    newAnnexes[annexIndex].medicine_changes.add_items.splice(itemIndex, 1);
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  const handleAnnexAddItemChange = (annexIndex, itemIndex, field, value) => {
    const newAnnexes = [...formData.annexes];
    newAnnexes[annexIndex].medicine_changes.add_items[itemIndex][field] = value;
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  // Remove items functions
  const addAnnexRemoveItem = (annexIndex) => {
    const newAnnexes = [...formData.annexes];
    if (!newAnnexes[annexIndex].medicine_changes) {
      newAnnexes[annexIndex].medicine_changes = {};
    }
    if (!newAnnexes[annexIndex].medicine_changes.remove_items) {
      newAnnexes[annexIndex].medicine_changes.remove_items = [];
    }
    newAnnexes[annexIndex].medicine_changes.remove_items.push({
      medicine_id: ''
    });
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  const removeAnnexRemoveItem = (annexIndex, itemIndex) => {
    const newAnnexes = [...formData.annexes];
    newAnnexes[annexIndex].medicine_changes.remove_items.splice(itemIndex, 1);
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  const handleAnnexRemoveItemChange = (annexIndex, itemIndex, field, value) => {
    const newAnnexes = [...formData.annexes];
    newAnnexes[annexIndex].medicine_changes.remove_items[itemIndex][field] = value;
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  // Update prices functions
  const addAnnexUpdatePrice = (annexIndex) => {
    const newAnnexes = [...formData.annexes];
    if (!newAnnexes[annexIndex].medicine_changes) {
      newAnnexes[annexIndex].medicine_changes = {};
    }
    if (!newAnnexes[annexIndex].medicine_changes.update_prices) {
      newAnnexes[annexIndex].medicine_changes.update_prices = [];
    }
    newAnnexes[annexIndex].medicine_changes.update_prices.push({
      medicine_id: '',
      unit_price: ''
    });
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  const removeAnnexUpdatePrice = (annexIndex, itemIndex) => {
    const newAnnexes = [...formData.annexes];
    newAnnexes[annexIndex].medicine_changes.update_prices.splice(itemIndex, 1);
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  const handleAnnexUpdatePriceChange = (annexIndex, itemIndex, field, value) => {
    const newAnnexes = [...formData.annexes];
    newAnnexes[annexIndex].medicine_changes.update_prices[itemIndex][field] = value;
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  const handleAnnexEndDateChange = (annexIndex, date) => {
    const newAnnexes = [...formData.annexes];
    if (!newAnnexes[annexIndex].end_date_change) {
      newAnnexes[annexIndex].end_date_change = {};
    }
    newAnnexes[annexIndex].end_date_change.new_end_date = date;
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  const validateForm = () => {
    const errors = {};

    // Validate contract_code
    if (!formData.contract_code.trim()) {
      errors.contract_code = trans.common.contractCodeRequired;
    }

    // Validate partner_id
    if (!formData.partner_id) {
      errors.partner_id = 'Vui lòng chọn đối tác';
    }

    // Validate dates
    if (!formData.start_date) {
      errors.start_date = trans.common.startDateRequired;
    }

    if (!formData.end_date) {
      errors.end_date = trans.common.endDateRequired;
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      errors.end_date = trans.common.endDateMustBeAfterStart;
    }

    // Validate items
    const itemErrors = [];
    formData.items.forEach((item, index) => {
      const itemError = {};

      if (!item.medicine_id) {
        itemError.medicine_id = 'Vui lòng chọn thuốc';
      }

      if (!item.unit_price) {
        itemError.unit_price = 'Giá đơn vị không được để trống';
      } else if (!isValidFloat(item.unit_price)) {
        itemError.unit_price = 'Giá đơn vị phải là số hợp lệ';
      }

      if (Object.keys(itemError).length > 0) {
        itemErrors[index] = itemError;
      }
    });

    if (itemErrors.length > 0) {
      errors.items = itemErrors;
    }

    // Validate annexes
    const annexErrors = [];
    formData.annexes.forEach((annex, annexIndex) => {
      const annexError = {};

      if (!annex.annex_code) {
        annexError.annex_code = trans.common.annexCodeRequired;
      }

      if (!annex.signed_date) {
        annexError.signed_date = trans.common.signedDateRequired;
      }

      // Validate add_items
      if (annex.medicine_changes?.add_items) {
        const addItemErrors = [];
        annex.medicine_changes.add_items.forEach((item, itemIndex) => {
          const itemError = {};

          if (!item.medicine_id) {
            itemError.medicine_id = 'Vui lòng chọn thuốc';
          }

          if (!item.unit_price) {
            itemError.unit_price = 'Đơn giá không được để trống';
          } else if (!isValidFloat(item.unit_price)) {
            itemError.unit_price = 'Đơn giá phải là số hợp lệ';
          }

          if (Object.keys(itemError).length > 0) {
            addItemErrors[itemIndex] = itemError;
          }
        });

        if (addItemErrors.length > 0) {
          annexError.add_items = addItemErrors;
        }
      }

      // Validate remove_items
      if (annex.medicine_changes?.remove_items) {
        const removeItemErrors = [];
        annex.medicine_changes.remove_items.forEach((item, itemIndex) => {
          const itemError = {};

          if (!item.medicine_id) {
            itemError.medicine_id = 'Vui lòng chọn thuốc';
          }

          if (Object.keys(itemError).length > 0) {
            removeItemErrors[itemIndex] = itemError;
          }
        });

        if (removeItemErrors.length > 0) {
          annexError.remove_items = removeItemErrors;
        }
      }

      // Validate update_prices
      if (annex.medicine_changes?.update_prices) {
        const updatePriceErrors = [];
        annex.medicine_changes.update_prices.forEach((item, itemIndex) => {
          const itemError = {};

          if (!item.medicine_id) {
            itemError.medicine_id = 'Vui lòng chọn thuốc';
          }

          if (!item.unit_price) {
            itemError.unit_price = 'Giá mới không được để trống';
          } else if (!isValidFloat(item.unit_price)) {
            itemError.unit_price = 'Giá mới phải là số hợp lệ';
          }

          if (Object.keys(itemError).length > 0) {
            updatePriceErrors[itemIndex] = itemError;
          }
        });

        if (updatePriceErrors.length > 0) {
          annexError.update_prices = updatePriceErrors;
        }
      }

      if (Object.keys(annexError).length > 0) {
        annexErrors[annexIndex] = annexError;
      }
    });

    if (annexErrors.length > 0) {
      errors.annexes = annexErrors;
    }

    setErrorValidate(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        partner_id: formData.partner_id,
        start_date: formData.start_date?.toISOString(),
        end_date: formData.end_date?.toISOString(),
        items: formData.items.map((item) => ({
          ...item,
          medicine_id: item.medicine_id,
          unit_price: parseFloat(item.unit_price)
        })),
        annexes: formData.annexes.map((annex) => ({
          ...annex,
          signed_date: annex.signed_date?.toISOString(),
          end_date_change: annex.end_date_change?.new_end_date
            ? {
                new_end_date: annex.end_date_change.new_end_date.toISOString()
              }
            : null,
          medicine_changes: {
            add_items:
              annex.medicine_changes?.add_items?.map((item) => ({
                medicine_id: item.medicine_id,
                unit_price: parseFloat(item.unit_price)
              })) || [],
            remove_items:
              annex.medicine_changes?.remove_items?.map((item) => ({
                medicine_id: item.medicine_id
              })) || [],
            update_prices:
              annex.medicine_changes?.update_prices?.map((item) => ({
                medicine_id: item.medicine_id,
                unit_price: parseFloat(item.unit_price)
              })) || []
          }
        }))
      };

      await trigger(payload);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating contract:', error);
      setErrorApi(error.response?.data?.message || trans.common.errorUpdatingContract);
    }
  };

  const getPartners = () => {
    return formData.partner_type === 'Supplier' ? suppliers : retailers;
  };

  const getContractTypeLabel = (type) => {
    return type === 'economic' ? trans.common.economicContractFull : trans.common.principalContractFull;
  };

  const getPartnerTypeLabel = (type) => {
    return type === 'Supplier' ? 'Nhà cung cấp' : 'Nhà thuốc';
  };

  const getPartnerName = (partnerId) => {
    const partners = getPartners();
    const partner = partners.find((p) => p._id === partnerId);
    return partner ? partner.name : '';
  };

  const getMedicineName = (medicineId) => {
    const medicine = medicines.find((m) => m._id === medicineId);
    return medicine ? medicine.license_code : '';
  };

  const getMedicineUnit = (medicineId) => {
    const medicine = medicines.find((m) => m._id === medicineId);
    return medicine ? medicine.unit : '';
  };

  console.log('contract', contract);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ContractIcon />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {isViewMode ? 'Chi tiết hợp đồng nguyên tắc' : 'Chỉnh sửa hợp đồng nguyên tắc'}
            </Typography>
          </Box>
        </Box>
        <Tooltip title={trans.common.close}>
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

        {/* Card 1: {trans.common.basicInfo} */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContractIcon color="primary" /> Thông Tin Cơ Bản
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <InfoField
                  label={trans.common.contractCode}
                  value={formData.contract_code}
                  onChange={(e) => handleChange({ target: { name: 'contract_code', value: e.target.value } })}
                  icon={ContractIcon}
                  disabled={isViewMode}
                  error={!!errorValidate.contract_code}
                  helperText={errorValidate.contract_code}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <ContractIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Loại hợp đồng
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
                      alignItems: 'center'
                    }}
                  >
                    <Typography>Hợp đồng nguyên tắc</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <SupplierIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
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
                      minWidth: 200
                    }}
                  >
                    <FormControl fullWidth disabled={isViewMode}>
                      <Select
                        name="partner_type"
                        value={formData.partner_type}
                        onChange={handleChange}
                        variant="standard"
                        sx={{
                          '& .MuiSelect-select': { padding: 0 },
                          '& .MuiInputBase-input': { padding: 0 },
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                          '& .MuiInput-underline:before': { borderBottom: 'none' },
                          '& .MuiInput-underline:after': { borderBottom: 'none' },
                          '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
                        }}
                      >
                        <MenuItem value="Supplier">Nhà cung cấp</MenuItem>
                        <MenuItem value="Retailer">Nhà thuốc</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    {formData.partner_type === 'Supplier' ? (
                      <SupplierIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    ) : (
                      <RetailerIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {formData.partner_type === 'Supplier' ? 'Nhà cung cấp' : 'Nhà thuốc'}
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
                      minWidth: 200
                    }}
                  >
                    <Autocomplete
                      options={getPartners()}
                      getOptionLabel={(option) => option.name || ''}
                      value={getPartners().find((p) => p._id === formData.partner_id) || null}
                      onChange={(_, newValue) => handleChange({ target: { name: 'partner_id', value: newValue?._id || '' } })}
                      disabled={isViewMode}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          placeholder={`Chọn ${formData.partner_type === 'Supplier' ? 'nhà cung cấp' : 'nhà thuốc'}`}
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
                      disabled={isViewMode}
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
                      disabled={isViewMode}
                    />
                    {errorValidate.end_date && <FormHelperText sx={{ color: 'error.main' }}>{errorValidate.end_date}</FormHelperText>}
                  </FormControl>
                </Grid>
              </Grid>
            </LocalizationProvider>
          </CardContent>
        </Card>

        {/* Card 3: Danh sách thuốc */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon color="secondary" /> Danh Sách Thuốc
                <Chip label="Nguyên tắc" color="secondary" size="small" />
              </Typography>
              {!isViewMode && (
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addItem} size="small">
                  Thêm thuốc
                </Button>
              )}
            </Box>
            {formData.items.map((item, index) => (
              <Box key={index} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Thuốc #{index + 1}
                  </Typography>
                  {!isViewMode && formData.items.length > 1 && (
                    <Button size="small" color="error" onClick={() => removeItem(index)} sx={{ textTransform: 'none' }}>
                      Xóa
                    </Button>
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
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
                          getOptionLabel={(option) => `${option.license_code}`}
                          value={medicines.find((m) => m._id === item.medicine_id) || null}
                          onChange={(_, newValue) => handleItemChange(index, 'medicine_id', newValue ? newValue._id : '')}
                          disabled={isViewMode}
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
                          sx={{ width: '100%' }}
                        />
                      </Box>
                      {errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.medicine_id && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                          {errorValidate.items[index].medicine_id}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Đơn giá (VNĐ)
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
                          borderColor:
                            errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.unit_price
                              ? 'red'
                              : '#e0e0e0'
                        }}
                      >
                        <TextField
                          fullWidth
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          variant="standard"
                          placeholder="Nhập đơn giá"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          error={!!(errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.unit_price)}
                          InputProps={{
                            disableUnderline: true
                          }}
                        />
                      </Box>
                      {errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.unit_price && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                          {errorValidate.items[index].unit_price}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* Card 4: Phụ lục hợp đồng */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnnexIcon color="secondary" /> Phụ lục hợp đồng
                <Chip label="Nguyên tắc" color="secondary" size="small" />
              </Typography>
              {!isViewMode && (
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addAnnex} size="small">
                  Thêm phụ lục
                </Button>
              )}
            </Box>
            {formData.annexes.map((annex, annexIndex) => (
              <Box key={annexIndex} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                    Phụ lục #{annexIndex + 1}
                  </Typography>
                  {!isViewMode && (
                    <Button size="small" color="error" onClick={() => removeAnnex(annexIndex)} sx={{ textTransform: 'none' }}>
                      Xóa
                    </Button>
                  )}
                </Box>
                {/* Hàng 1: Mã phụ lục + Mô tả */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Mã phụ lục
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        value={annex.annex_code || ''}
                        onChange={(e) => handleAnnexChange(annexIndex, 'annex_code', e.target.value)}
                        variant="outlined"
                        size="small"
                        placeholder="VD: PL001"
                        disabled={isViewMode}
                        error={!!(errorValidate.annexes && errorValidate.annexes[annexIndex]?.annex_code)}
                        helperText={errorValidate.annexes && errorValidate.annexes[annexIndex]?.annex_code}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Mô tả
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        value={annex.description || ''}
                        onChange={(e) => handleAnnexChange(annexIndex, 'description', e.target.value)}
                        variant="outlined"
                        size="small"
                        placeholder="Mô tả chi tiết về phụ lục này..."
                        disabled={isViewMode}
                      />
                    </Box>
                  </Grid>
                </Grid>

                {/* Hàng 2: Ngày ký + Cập nhật ngày kết thúc */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Ngày ký
                        </Typography>
                      </Box>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                        <DatePicker
                          value={annex.signed_date || null}
                          onChange={(date) => handleAnnexChange(annexIndex, 'signed_date', date)}
                          format="dd/MM/yyyy"
                          slotProps={{
                            textField: {
                              variant: 'outlined',
                              size: 'small',
                              fullWidth: true,
                              placeholder: 'Chọn ngày ký',
                              error: !!(errorValidate.annexes && errorValidate.annexes[annexIndex]?.signed_date),
                              helperText: errorValidate.annexes && errorValidate.annexes[annexIndex]?.signed_date
                            }
                          }}
                          disabled={isViewMode}
                        />
                      </LocalizationProvider>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Cập nhật ngày kết thúc
                        </Typography>
                      </Box>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                        <DatePicker
                          value={annex.end_date_change?.new_end_date || null}
                          onChange={(date) => handleAnnexEndDateChange(annexIndex, date)}
                          format="dd/MM/yyyy"
                          slotProps={{
                            textField: {
                              variant: 'outlined',
                              size: 'small',
                              fullWidth: true,
                              placeholder: 'Chọn ngày kết thúc mới'
                            }
                          }}
                          disabled={isViewMode}
                        />
                      </LocalizationProvider>
                    </Box>
                  </Grid>
                </Grid>

                {/* Hàng 3: Thêm thuốc mới */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Thêm thuốc mới
                    </Typography>
                    {!isViewMode && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => addAnnexAddItem(annexIndex)}
                        size="small"
                        color="secondary"
                      >
                        Thêm thuốc
                      </Button>
                    )}
                  </Box>

                  {annex.medicine_changes?.add_items &&
                    annex.medicine_changes.add_items.map((item, itemIndex) => (
                      <Box key={itemIndex} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Thuốc #{itemIndex + 1}
                          </Typography>
                          {!isViewMode && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => removeAnnexAddItem(annexIndex, itemIndex)}
                              sx={{ textTransform: 'none' }}
                            >
                              Xóa
                            </Button>
                          )}
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={8}>
                            <Autocomplete
                              options={medicines}
                              getOptionLabel={(option) => `${option.license_code}`}
                              value={medicines.find((m) => m._id === item.medicine_id) || null}
                              onChange={(_, newValue) => {
                                handleAnnexAddItemChange(annexIndex, itemIndex, 'medicine_id', newValue ? newValue._id : '');
                              }}
                              disabled={isViewMode}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Chọn thuốc"
                                  variant="outlined"
                                  size="small"
                                  error={
                                    !!(
                                      errorValidate.annexes &&
                                      errorValidate.annexes[annexIndex]?.add_items &&
                                      errorValidate.annexes[annexIndex].add_items[itemIndex]?.medicine_id
                                    )
                                  }
                                  helperText={
                                    errorValidate.annexes &&
                                    errorValidate.annexes[annexIndex]?.add_items &&
                                    errorValidate.annexes[annexIndex].add_items[itemIndex]?.medicine_id
                                  }
                                  sx={{ minWidth: 200 }}
                                />
                              )}
                              sx={{ minWidth: 200 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Đơn giá"
                              type="number"
                              value={item.unit_price || ''}
                              onChange={(e) => handleAnnexAddItemChange(annexIndex, itemIndex, 'unit_price', e.target.value)}
                              variant="outlined"
                              size="small"
                              disabled={isViewMode}
                              error={
                                !!(
                                  errorValidate.annexes &&
                                  errorValidate.annexes[annexIndex]?.add_items &&
                                  errorValidate.annexes[annexIndex].add_items[itemIndex]?.unit_price
                                )
                              }
                              helperText={
                                errorValidate.annexes &&
                                errorValidate.annexes[annexIndex]?.add_items &&
                                errorValidate.annexes[annexIndex].add_items[itemIndex]?.unit_price
                              }
                              InputProps={{
                                endAdornment: <InputAdornment position="end">₫</InputAdornment>
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                </Box>

                {/* Hàng 4: Xóa thuốc */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Xóa thuốc
                    </Typography>
                    {!isViewMode && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => addAnnexRemoveItem(annexIndex)}
                        size="small"
                        color="secondary"
                      >
                        Thêm thuốc cần xóa
                      </Button>
                    )}
                  </Box>

                  {annex.medicine_changes?.remove_items &&
                    annex.medicine_changes.remove_items.map((item, itemIndex) => (
                      <Box key={itemIndex} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Thuốc #{itemIndex + 1}
                          </Typography>
                          {!isViewMode && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => removeAnnexRemoveItem(annexIndex, itemIndex)}
                              sx={{ textTransform: 'none' }}
                            >
                              Xóa
                            </Button>
                          )}
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Autocomplete
                              options={medicines}
                              getOptionLabel={(option) => `${option.license_code}`}
                              value={medicines.find((m) => m._id === item.medicine_id) || null}
                              onChange={(_, newValue) => {
                                handleAnnexRemoveItemChange(annexIndex, itemIndex, 'medicine_id', newValue ? newValue._id : '');
                              }}
                              disabled={isViewMode}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Chọn thuốc cần xóa"
                                  variant="outlined"
                                  size="small"
                                  error={
                                    !!(
                                      errorValidate.annexes &&
                                      errorValidate.annexes[annexIndex]?.remove_items &&
                                      errorValidate.annexes[annexIndex].remove_items[itemIndex]?.medicine_id
                                    )
                                  }
                                  helperText={
                                    errorValidate.annexes &&
                                    errorValidate.annexes[annexIndex]?.remove_items &&
                                    errorValidate.annexes[annexIndex].remove_items[itemIndex]?.medicine_id
                                  }
                                  sx={{ minWidth: 200 }}
                                />
                              )}
                              sx={{ minWidth: 200 }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                </Box>

                {/* Hàng 5: Cập nhật giá thuốc */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Cập nhật giá thuốc
                    </Typography>
                    {!isViewMode && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => addAnnexUpdatePrice(annexIndex)}
                        size="small"
                        color="secondary"
                      >
                        Thêm thuốc cần cập nhật giá
                      </Button>
                    )}
                  </Box>

                  {annex.medicine_changes?.update_prices &&
                    annex.medicine_changes.update_prices.map((item, itemIndex) => (
                      <Box key={itemIndex} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Thuốc #{itemIndex + 1}
                          </Typography>
                          {!isViewMode && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => removeAnnexUpdatePrice(annexIndex, itemIndex)}
                              sx={{ textTransform: 'none' }}
                            >
                              Xóa
                            </Button>
                          )}
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={8}>
                            <Autocomplete
                              options={medicines}
                              getOptionLabel={(option) => `${option.license_code}`}
                              value={medicines.find((m) => m._id === item.medicine_id) || null}
                              onChange={(_, newValue) => {
                                handleAnnexUpdatePriceChange(annexIndex, itemIndex, 'medicine_id', newValue ? newValue._id : '');
                              }}
                              disabled={isViewMode}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Chọn thuốc"
                                  variant="outlined"
                                  size="small"
                                  error={
                                    !!(
                                      errorValidate.annexes &&
                                      errorValidate.annexes[annexIndex]?.update_prices &&
                                      errorValidate.annexes[annexIndex].update_prices[itemIndex]?.medicine_id
                                    )
                                  }
                                  helperText={
                                    errorValidate.annexes &&
                                    errorValidate.annexes[annexIndex]?.update_prices &&
                                    errorValidate.annexes[annexIndex].update_prices[itemIndex]?.medicine_id
                                  }
                                  sx={{ minWidth: 200 }}
                                />
                              )}
                              sx={{ minWidth: 200 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Giá mới"
                              type="number"
                              value={item.unit_price || ''}
                              onChange={(e) => handleAnnexUpdatePriceChange(annexIndex, itemIndex, 'unit_price', e.target.value)}
                              variant="outlined"
                              size="small"
                              disabled={isViewMode}
                              error={
                                !!(
                                  errorValidate.annexes &&
                                  errorValidate.annexes[annexIndex]?.update_prices &&
                                  errorValidate.annexes[annexIndex].update_prices[itemIndex]?.unit_price
                                )
                              }
                              helperText={
                                errorValidate.annexes &&
                                errorValidate.annexes[annexIndex]?.update_prices &&
                                errorValidate.annexes[annexIndex].update_prices[itemIndex]?.unit_price
                              }
                              InputProps={{
                                endAdornment: <InputAdornment position="end">₫</InputAdornment>
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isMutating}>
          {isViewMode ? 'Đóng' : 'Hủy'}
        </Button>
        {!isViewMode && (
          <Button onClick={handleSubmit} variant="contained" disabled={isMutating} startIcon={isMutating ? null : <EditIcon />}>
            {isMutating ? 'Đang cập nhật...' : 'Cập nhật hợp đồng'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PrincipalContractEditDialog;
