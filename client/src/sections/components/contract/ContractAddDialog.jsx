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
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  FormHelperText,
  Alert,
  Chip,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  ViewList as ViewIcon,
  Description as ContractIcon,
  LocalShipping as SupplierIcon,
  Event as EventIcon,
  Inventory as InventoryIcon,
  Store as RetailerIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon
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

const ANNEX_ACTIONS = {
  ADD: 'add',
  REMOVE: 'remove',
  UPDATE_PRICE: 'update_price',
  UPDATE_END_DATE: 'update_end_date'
};

const getAnnexActionLabels = (trans) => ({
  [ANNEX_ACTIONS.ADD]: trans.common.addNewMedicine,
  [ANNEX_ACTIONS.REMOVE]: trans.common.removeMedicine,
  [ANNEX_ACTIONS.UPDATE_PRICE]: trans.common.updateMedicinePrice,
  [ANNEX_ACTIONS.UPDATE_END_DATE]: trans.common.updateContractEndDate
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

async function createContract(url, { arg: payload }) {
  const response = await axiosInstance.post(url, payload, {
    headers: getAuthHeaders()
  });
  return response.data;
}

// Helper function to validate strict integer
const isValidInteger = (value) => {
  const trimmed = value.toString().trim();
  if (!/^\d+$/.test(trimmed)) return false;
  const parsed = Number.parseInt(trimmed, 10);
  return !isNaN(parsed) && parsed > 0 && parsed.toString() === trimmed;
};

// Helper function to validate strict float
const isValidFloat = (value) => {
  const trimmed = value.toString().trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return false;
  const parsed = Number.parseFloat(trimmed);
  return !isNaN(parsed) && parsed >= 0;
};

const ContractAddDialog = ({ open, onClose, onSuccess, suppliers = [], retailers = [] }) => {
  const trans = useTrans();
  const ANNEX_ACTION_LABELS = getAnnexActionLabels(trans);
  const [formData, setFormData] = useState({
    contract_code: '',
    contract_type: 'economic',
    partner_type: 'Supplier',
    partner_id: '',
    start_date: null,
    end_date: null,
    items: [{ medicine_id: '', quantity: '', unit_price: '' }],
    annexes: []
  });

  const [errorValidate, setErrorValidate] = useState({});
  const [errorApi, setErrorApi] = useState('');
  const [medicines, setMedicines] = useState([]);

  const { trigger, isMutating } = useSWRMutation('/api/contract', createContract);

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
    if (open) {
      setFormData({
        contract_code: '',
        contract_type: 'economic',
        partner_type: 'Supplier',
        partner_id: '',
        start_date: null,
        end_date: null,
        items: [{ medicine_id: '', quantity: '', unit_price: '' }],
        annexes: []
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
      ...(name === 'partner_type' && { partner_id: '' }),
      ...(name === 'contract_type' && {
        items: [{ medicine_id: '', quantity: '', unit_price: '' }],
        annexes: []
      })
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
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { medicine_id: '', quantity: '', unit_price: '' }]
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
    setFormData((prev) => ({
      ...prev,
      annexes: [
        ...(prev.annexes || []),
        {
          annex_code: '',
          signed_date: null,
          description: '',
          medicine_changes: {
            add_items: [],
            remove_items: [],
            update_prices: []
          },
          end_date_change: {
            new_end_date: null
          }
        }
      ]
    }));
  };

  const removeAnnex = (index) => {
    setFormData((prev) => ({
      ...prev,
      annexes: prev.annexes.filter((_, i) => i !== index)
    }));
  };

  const handleAnnexChange = (index, field, value) => {
    const newAnnexes = [...formData.annexes];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (!newAnnexes[index][parent]) {
        newAnnexes[index][parent] = {};
      }
      newAnnexes[index][parent][child] = value;
    } else {
      newAnnexes[index][field] = value;
    }
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

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

    if (!formData.contract_code.trim()) {
      errors.contract_code = trans.common.contractCodeRequired;
    }

    if (!formData.partner_id) {
      errors.partner_id = trans.contractAdd.validation.partnerRequired;
    }

    if (!formData.start_date) {
      errors.start_date = trans.common.startDateRequired;
    }
    if (!formData.end_date) {
      errors.end_date = trans.common.endDateRequired;
    } else if (formData.start_date && formData.end_date && formData.end_date <= formData.start_date) {
      errors.end_date = trans.common.endDateMustBeAfterStart;
    }

    const itemErrors = [];
    formData.items.forEach((item, index) => {
      const itemError = {};

      if (!item.medicine_id) {
        itemError.medicine_id = trans.contractAdd.validation.medicineRequired;
      }

      if (formData.contract_type === 'economic') {
        if (!item.quantity) {
          itemError.quantity = trans.contractAdd.validation.quantityRequiredEconomic;
        } else if (!isValidInteger(item.quantity)) {
          itemError.quantity = trans.contractAdd.validation.quantityInteger;
        }
      } else if (formData.contract_type === 'principal') {
        if (item.quantity) {
          itemError.quantity = trans.contractAdd.validation.quantityNotAllowedPrincipal;
        }
      }

      if (!item.unit_price) {
        itemError.unit_price = trans.contractAdd.validation.unitPriceRequired;
      } else if (!isValidFloat(item.unit_price)) {
        itemError.unit_price = trans.contractAdd.validation.unitPriceNonNegative;
      }

      if (Object.keys(itemError).length > 0) {
        itemErrors[index] = itemError;
      }
    });

    if (itemErrors.length > 0) {
      errors.items = itemErrors;
    }

    // Validate annexes for principal contracts
    if (formData.contract_type === 'principal' && formData.annexes && formData.annexes.length > 0) {
      const annexErrors = [];
      formData.annexes.forEach((annex, annexIndex) => {
        const annexError = {};

        if (!annex.annex_code?.trim()) {
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
              itemError.medicine_id = trans.contractAdd.validation.medicineRequired;
            }
            if (!item.unit_price) {
              itemError.unit_price = trans.contractAdd.validation.unitPriceRequired;
            } else if (!isValidFloat(item.unit_price)) {
              itemError.unit_price = trans.contractAdd.validation.unitPriceNonNegative;
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
              itemError.medicine_id = trans.contractAdd.validation.medicineRequired;
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
              itemError.medicine_id = trans.contractAdd.validation.medicineRequired;
            }
            if (!item.unit_price) {
              itemError.unit_price = trans.contractAdd.validation.unitPriceRequired;
            } else if (!isValidFloat(item.unit_price)) {
              itemError.unit_price = trans.contractAdd.validation.unitPriceNonNegative;
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
    }

    setErrorValidate(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const isEconomic = formData.contract_type === 'economic';

      const payload = {
        ...formData,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date.toISOString(),
        items: formData.items.map((item) => ({
          medicine_id: item.medicine_id,
          ...(isEconomic && { quantity: parseInt(item.quantity) }),
          unit_price: parseFloat(item.unit_price)
        })),
        ...(formData.contract_type === 'principal' && {
          annexes: formData.annexes.map((annex) => ({
            annex_code: annex.annex_code,
            signed_date: annex.signed_date ? annex.signed_date.toISOString() : null,
            description: annex.description,
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
            },
            end_date_change: annex.end_date_change?.new_end_date
              ? {
                  new_end_date: annex.end_date_change.new_end_date.toISOString()
                }
              : null
          }))
        })
      };

      const result = await trigger(payload);
      if (result.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      setErrorApi(error.response?.data?.message || trans.common.errorCreatingContract);
    }
  };

  const getPartners = () => {
    return formData.partner_type === 'Supplier' ? suppliers : retailers;
  };

  const getContractTypeLabel = (type) => {
    return type === 'economic' ? trans.common.economicContract : trans.common.principalContract;
  };

  const isEconomic = formData.contract_type === 'economic';
  const isPrincipal = formData.contract_type === 'principal';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
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
              {trans.common.addNewContract}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {trans.contractAdd.subtitle}
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

        {/* Card 1: General Information */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContractIcon color="primary" /> {trans.contractAdd.generalInfo}
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <InfoField
                  label={trans.contractAdd.contractCode}
                  value={formData.contract_code}
                  onChange={(e) => handleChange({ target: { name: 'contract_code', value: e.target.value } })}
                  icon={ContractIcon}
                  error={!!errorValidate.contract_code}
                  helperText={errorValidate.contract_code}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <BusinessIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {trans.contractAdd.contractType}
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
                    <FormControl fullWidth>
                      <Select
                        name="contract_type"
                        value={formData.contract_type}
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
                        <MenuItem value="economic">
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {trans.common.economicContract}
                          </Typography>
                        </MenuItem>
                        <MenuItem value="principal">
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {trans.common.principalContract}
                          </Typography>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <SupplierIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {trans.contractAdd.partnerType}
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
                      options={[
                        { value: 'Supplier', label: trans.contractAdd.supplier },
                        { value: 'Retailer', label: trans.contractAdd.retailer }
                      ]}
                      getOptionLabel={(option) => option.label || ''}
                      value={
                        formData.partner_type
                          ? [
                              { value: 'Supplier', label: trans.contractAdd.supplier },
                              { value: 'Retailer', label: trans.contractAdd.retailer }
                            ].find((opt) => opt.value === formData.partner_type)
                          : { value: 'Supplier', label: trans.contractAdd.supplier }
                      }
                      onChange={(event, newValue) => {
                        setFormData((prev) => ({
                          ...prev,
                          partner_type: newValue ? newValue.value : 'Supplier',
                          partner_id: ''
                        }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          placeholder={trans.contractAdd.selectPartner}
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
                      {trans.contractAdd.partner}
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
                      options={getPartners()}
                      getOptionLabel={(option) => option.name || ''}
                      value={getPartners().find((p) => p._id === formData.partner_id) || null}
                      onChange={(_, newValue) => {
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
                          placeholder={
                            formData.partner_type === 'Supplier' ? trans.contractAdd.selectSupplier : trans.contractAdd.selectRetailer
                          }
                          error={!!errorValidate.partner_id}
                          helperText={errorValidate.partner_id}
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

        {/* Card 2: Validity Period */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon color="success" /> {trans.contractAdd.validityPeriod}
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errorValidate.start_date}>
                    <DatePicker
                      label={trans.contractAdd.startDate}
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
                      label={trans.contractAdd.endDate}
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

        {/* Card 3: Medicine List */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon color="secondary" /> {trans.contractAdd.medicineList}
                <Chip
                  label={getContractTypeLabel(formData.contract_type)}
                  color={formData.contract_type === 'economic' ? 'primary' : 'secondary'}
                  size="small"
                />
              </Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addItem} size="small">
                {trans.contractAdd.addMedicine}
              </Button>
            </Box>

            {formData.items.map((item, index) => (
              <Box key={index} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {trans.contractAdd.medicine} #{index + 1}
                  </Typography>
                  {formData.items.length > 1 && (
                    <Button size="small" color="error" onClick={() => removeItem(index)} sx={{ textTransform: 'none' }}>
                      {trans.contractAdd.actions.delete}
                    </Button>
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={isEconomic ? 3 : 6}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <InventoryIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {trans.contractAdd.medicine}
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
                          onChange={(event, newValue) => {
                            handleItemChange(index, 'medicine_id', newValue ? newValue._id : '');
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              placeholder={trans.contractAdd.selectMedicine}
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
                            options.filter((option) => `${option.license_code}`.toLowerCase().includes(inputValue.toLowerCase()))
                          }
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

                  {isEconomic && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {trans.contractAdd.quantity}
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
                              errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.quantity
                                ? 'red'
                                : '#e0e0e0'
                          }}
                        >
                          <TextField
                            fullWidth
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            variant="standard"
                            placeholder={trans.contractAdd.enterQuantity}
                            type="number"
                            inputProps={{ min: 1 }}
                            error={!!(errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.quantity)}
                            InputProps={{
                              disableUnderline: true
                            }}
                          />
                        </Box>
                        {errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.quantity && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                            {errorValidate.items[index].quantity}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12} sm={6} md={isEconomic ? 3 : 6}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {trans.contractAdd.unitPrice}
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
                          placeholder={trans.contractAdd.enterUnitPrice}
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

        {/* Card 4: Annexes for Principal Contract */}
        {isPrincipal && (
          <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon color="secondary" /> {trans.contractAdd.annexes}
                  <Chip label={trans.common.principalContract} color="secondary" size="small" />
                </Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addAnnex} size="small" color="secondary">
                  {trans.contractAdd.addAnnex}
                </Button>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {trans.contractAdd.annexDescription}
              </Typography>

              {formData.annexes &&
                formData.annexes.map((annex, index) => (
                  <Box key={index} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                        {trans.contractAdd.annex} #{index + 1}
                      </Typography>
                      <Button size="small" color="error" onClick={() => removeAnnex(index)} sx={{ textTransform: 'none' }}>
                        {trans.contractAdd.actions.delete}
                      </Button>
                    </Box>

                    {/* Row 1: Annex Code + Description */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              {trans.contractAdd.annexCode}
                            </Typography>
                          </Box>
                          <TextField
                            fullWidth
                            value={annex.annex_code || ''}
                            onChange={(e) => handleAnnexChange(index, 'annex_code', e.target.value)}
                            variant="outlined"
                            size="small"
                            placeholder={trans.contractAdd.enterAnnexCode}
                            error={!!(errorValidate.annexes && errorValidate.annexes[index]?.annex_code)}
                            helperText={errorValidate.annexes && errorValidate.annexes[index]?.annex_code}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              {trans.contractAdd.description}
                            </Typography>
                          </Box>
                          <TextField
                            fullWidth
                            value={annex.description || ''}
                            onChange={(e) => handleAnnexChange(index, 'description', e.target.value)}
                            variant="outlined"
                            size="small"
                            placeholder={trans.contractAdd.enterDescription}
                          />
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Row 2: Signed Date + Update End Date */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              {trans.contractAdd.signedDate}
                            </Typography>
                          </Box>
                          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                            <DatePicker
                              value={annex.signed_date || null}
                              onChange={(date) => handleAnnexChange(index, 'signed_date', date)}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  placeholder={trans.contractAdd.selectSignedDate}
                                  error={!!(errorValidate.annexes && errorValidate.annexes[index]?.signed_date)}
                                  helperText={errorValidate.annexes && errorValidate.annexes[index]?.signed_date}
                                />
                              )}
                            />
                          </LocalizationProvider>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              {trans.contractAdd.updateEndDate}
                            </Typography>
                          </Box>
                          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                            <DatePicker
                              value={annex.end_date_change?.new_end_date || null}
                              onChange={(date) => handleAnnexEndDateChange(index, date)}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  placeholder={trans.contractAdd.selectNewEndDate}
                                />
                              )}
                            />
                          </LocalizationProvider>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Row 3: Add New Medicine */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {trans.contractAdd.addNewMedicine}
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => addAnnexAddItem(index)}
                          size="small"
                          color="secondary"
                        >
                          {trans.contractAdd.addMedicineToAnnex}
                        </Button>
                      </Box>

                      {annex.medicine_changes?.add_items &&
                        annex.medicine_changes.add_items.map((item, itemIndex) => (
                          <Box key={itemIndex} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {trans.contractAdd.medicine} #{itemIndex + 1}
                              </Typography>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => removeAnnexAddItem(index, itemIndex)}
                                sx={{ textTransform: 'none' }}
                              >
                                {trans.contractAdd.actions.delete}
                              </Button>
                            </Box>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Autocomplete
                                  options={medicines}
                                  getOptionLabel={(option) => `${option.license_code}`}
                                  value={medicines.find((m) => m._id === item.medicine_id) || null}
                                  onChange={(event, newValue) => {
                                    handleAnnexAddItemChange(index, itemIndex, 'medicine_id', newValue ? newValue._id : '');
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label={trans.contractAdd.selectMedicine}
                                      variant="outlined"
                                      size="small"
                                      error={
                                        !!(
                                          errorValidate.annexes &&
                                          errorValidate.annexes[index]?.add_items &&
                                          errorValidate.annexes[index].add_items[itemIndex]?.medicine_id
                                        )
                                      }
                                      helperText={
                                        errorValidate.annexes &&
                                        errorValidate.annexes[index]?.add_items &&
                                        errorValidate.annexes[index].add_items[itemIndex]?.medicine_id
                                      }
                                      sx={{ minWidth: 200 }}
                                    />
                                  )}
                                  sx={{ minWidth: 200 }}
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label={trans.contractAdd.unitPrice}
                                  type="number"
                                  value={item.unit_price || ''}
                                  onChange={(e) => handleAnnexAddItemChange(index, itemIndex, 'unit_price', e.target.value)}
                                  variant="outlined"
                                  size="small"
                                  error={
                                    !!(
                                      errorValidate.annexes &&
                                      errorValidate.annexes[index]?.add_items &&
                                      errorValidate.annexes[index].add_items[itemIndex]?.unit_price
                                    )
                                  }
                                  helperText={
                                    errorValidate.annexes &&
                                    errorValidate.annexes[index]?.add_items &&
                                    errorValidate.annexes[index].add_items[itemIndex]?.unit_price
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

                    {/* Row 4: Remove Medicine */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {trans.contractAdd.removeMedicine}
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => addAnnexRemoveItem(index)}
                          size="small"
                          color="secondary"
                        >
                          {trans.contractAdd.removeMedicineFromAnnex}
                        </Button>
                      </Box>

                      {annex.medicine_changes?.remove_items &&
                        annex.medicine_changes.remove_items.map((item, itemIndex) => (
                          <Box key={itemIndex} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {trans.contractAdd.medicine} #{itemIndex + 1}
                              </Typography>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => removeAnnexRemoveItem(index, itemIndex)}
                                sx={{ textTransform: 'none' }}
                              >
                                {trans.contractAdd.actions.delete}
                              </Button>
                            </Box>
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Autocomplete
                                  options={medicines}
                                  getOptionLabel={(option) => `${option.license_code}`}
                                  value={medicines.find((m) => m._id === item.medicine_id) || null}
                                  onChange={(event, newValue) => {
                                    handleAnnexRemoveItemChange(index, itemIndex, 'medicine_id', newValue ? newValue._id : '');
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label={trans.contractAdd.removeMedicineFromAnnex}
                                      variant="outlined"
                                      size="small"
                                      error={
                                        !!(
                                          errorValidate.annexes &&
                                          errorValidate.annexes[index]?.remove_items &&
                                          errorValidate.annexes[index].remove_items[itemIndex]?.medicine_id
                                        )
                                      }
                                      helperText={
                                        errorValidate.annexes &&
                                        errorValidate.annexes[index]?.remove_items &&
                                        errorValidate.annexes[index].remove_items[itemIndex]?.medicine_id
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

                    {/* Row 5: Update Medicine Price */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {trans.contractAdd.updateMedicinePrice}
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => addAnnexUpdatePrice(index)}
                          size="small"
                          color="secondary"
                        >
                          {trans.contractAdd.updateMedicinePriceInAnnex}
                        </Button>
                      </Box>

                      {annex.medicine_changes?.update_prices &&
                        annex.medicine_changes.update_prices.map((item, itemIndex) => (
                          <Box key={itemIndex} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {trans.contractAdd.medicine} #{itemIndex + 1}
                              </Typography>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => removeAnnexUpdatePrice(index, itemIndex)}
                                sx={{ textTransform: 'none' }}
                              >
                                {trans.contractAdd.actions.delete}
                              </Button>
                            </Box>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Autocomplete
                                  options={medicines}
                                  getOptionLabel={(option) => `${option.license_code}`}
                                  value={medicines.find((m) => m._id === item.medicine_id) || null}
                                  onChange={(event, newValue) => {
                                    handleAnnexUpdatePriceChange(index, itemIndex, 'medicine_id', newValue ? newValue._id : '');
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label={trans.contractAdd.selectMedicine}
                                      variant="outlined"
                                      size="small"
                                      error={
                                        !!(
                                          errorValidate.annexes &&
                                          errorValidate.annexes[index]?.update_prices &&
                                          errorValidate.annexes[index].update_prices[itemIndex]?.medicine_id
                                        )
                                      }
                                      helperText={
                                        errorValidate.annexes &&
                                        errorValidate.annexes[index]?.update_prices &&
                                        errorValidate.annexes[index].update_prices[itemIndex]?.medicine_id
                                      }
                                      sx={{ minWidth: 200 }}
                                    />
                                  )}
                                  sx={{ minWidth: 200 }}
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label={trans.contractAdd.newPrice}
                                  type="number"
                                  value={item.unit_price || ''}
                                  onChange={(e) => handleAnnexUpdatePriceChange(index, itemIndex, 'unit_price', e.target.value)}
                                  variant="outlined"
                                  size="small"
                                  error={
                                    !!(
                                      errorValidate.annexes &&
                                      errorValidate.annexes[index]?.update_prices &&
                                      errorValidate.annexes[index].update_prices[itemIndex]?.unit_price
                                    )
                                  }
                                  helperText={
                                    errorValidate.annexes &&
                                    errorValidate.annexes[index]?.update_prices &&
                                    errorValidate.annexes[index].update_prices[itemIndex]?.unit_price
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
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} variant="outlined">
          {trans.contractAdd.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isMutating}
          sx={{
            bgcolor: 'success.main',
            '&:hover': { bgcolor: 'success.dark' }
          }}
        >
          {isMutating ? trans.contractAdd.creating : trans.contractAdd.createContract}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractAddDialog;
