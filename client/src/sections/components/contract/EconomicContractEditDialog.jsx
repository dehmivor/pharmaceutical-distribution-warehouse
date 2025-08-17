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
  Alert,
  Divider,
  Chip,
  Select,
  MenuItem
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Description as ContractIcon,
  LocalShipping as SupplierIcon,
  Event as EventIcon,
  Inventory as InventoryIcon,
  Store as RetailerIcon,
  Add as AddIcon,
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

// Update function for useSWRMutation
async function updateContract(url, { arg: payload }) {
  const response = await axiosInstance.put(url, payload, {
    headers: getAuthHeaders()
  });
  return response.data;
}

// Helper function để validate số nguyên strict
const isValidInteger = (value) => {
  const trimmed = value.toString().trim();
  if (!/^\d+$/.test(trimmed)) return false;
  const parsed = Number.parseInt(trimmed, 10);
  return !isNaN(parsed) && parsed > 0 && parsed.toString() === trimmed;
};

// Helper function để validate số thực strict
const isValidFloat = (value) => {
  const trimmed = value.toString().trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return false;
  const parsed = Number.parseFloat(trimmed);
  return !isNaN(parsed) && parsed >= 0;
};

const EconomicContractEditDialog = ({ open, onClose, contract, onSuccess, suppliers = [], retailers = [], isViewMode = false }) => {
  const trans = useTrans();
  const ANNEX_ACTION_LABELS = getAnnexActionLabels(trans);
  const [formData, setFormData] = useState({
    contract_code: '',
    contract_type: 'economic',
    partner_type: 'Supplier',
    partner_id: '',
    start_date: null,
    end_date: null,
    items: [{ medicine_id: '', quantity: '', min_order_quantity: '', unit_price: '', kpi_details: [] }],
    annexes: []
  });

  const [errorValidate, setErrorValidate] = useState({});
  const [errorApi, setErrorApi] = useState('');
  const [medicines, setMedicines] = useState([]);

  // useSWRMutation for update
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

  // Pre-fill form data when contract changes
  useEffect(() => {
    if (open && contract) {
      const isEconomic = contract.contract_type === 'economic';

      setFormData({
        contract_code: contract.contract_code || '',
        contract_type: contract.contract_type || 'economic',
        partner_type: contract.partner_type || 'Supplier',
        partner_id: contract.partner_id?._id || contract.partner_id || '',
        start_date: contract.start_date ? new Date(contract.start_date) : null,
        end_date: contract.end_date ? new Date(contract.end_date) : null,
        items:
          contract.items && contract.items.length > 0
            ? contract.items.map((item) => ({
                medicine_id: item.medicine_id?._id || item.medicine_id || '',
                ...(isEconomic && {
                  quantity: item.quantity?.toString() || '',
                  min_order_quantity: item.min_order_quantity?.toString() || ''
                }),
                unit_price: item.unit_price?.toString() || '',
                kpi_details: item.kpi_details || []
              }))
            : isEconomic
              ? [{ medicine_id: '', quantity: '', min_order_quantity: '', unit_price: '', kpi_details: [] }]
              : [{ medicine_id: '', unit_price: '' }],
        annexes: contract.annexes || []
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
    const isEconomic = formData.contract_type === 'economic';
    const newItem = isEconomic
      ? { medicine_id: '', quantity: '', min_order_quantity: '', unit_price: '', kpi_details: [] }
      : { medicine_id: '', unit_price: '' };

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
          if (newErrors.items.length === 0 || newErrors.items.every((item) => !item)) {
            delete newErrors.items;
          }
        }
        return newErrors;
      });
    }
  };

  // Annex management functions
  const addAnnex = () => {
    const newAnnex = {
      annex_code: '',
      description: '',
      action: ANNEX_ACTIONS.ADD,
      items: [{ medicine_id: '', unit_price: '' }],
      status: 'draft'
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
    newAnnexes[annexIndex][field] = value;

    // Reset items when action changes
    if (field === 'action') {
      if (value === ANNEX_ACTIONS.UPDATE_END_DATE) {
        newAnnexes[annexIndex].items = [];
      } else {
        newAnnexes[annexIndex].items = [{ medicine_id: '', unit_price: '' }];
      }
    }

    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  const handleAnnexItemChange = (annexIndex, itemIndex, field, value) => {
    const newAnnexes = [...formData.annexes];
    newAnnexes[annexIndex].items[itemIndex][field] = value;
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  const addAnnexItem = (annexIndex) => {
    const newAnnexes = [...formData.annexes];
    newAnnexes[annexIndex].items.push({ medicine_id: '', unit_price: '' });
    setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
  };

  const removeAnnexItem = (annexIndex, itemIndex) => {
    const newAnnexes = [...formData.annexes];
    if (newAnnexes[annexIndex].items.length > 1) {
      newAnnexes[annexIndex].items = newAnnexes[annexIndex].items.filter((_, i) => i !== itemIndex);
      setFormData((prev) => ({ ...prev, annexes: newAnnexes }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const isEconomic = formData.contract_type === 'economic';

    // Validate contract_code
    if (!formData.contract_code.trim()) {
      newErrors.contract_code = trans.common.contractCodeRequired;
    }

    // Validate partner_id
    if (!formData.partner_id) {
      newErrors.partner_id = trans.contractAdd.validation.partnerRequired;
    }

    // Validate start_date
    if (!formData.start_date) {
      newErrors.start_date = trans.common.startDateRequired;
    }

    // Validate end_date
    if (!formData.end_date) {
      newErrors.end_date = trans.common.endDateRequired;
    } else if (formData.start_date && formData.end_date <= formData.start_date) {
      newErrors.end_date = trans.common.endDateMustBeAfterStart;
    }

    // Validate items
    if (formData.items.length === 0) {
      newErrors.items = trans.contractAdd.validation.medicineRequired;
    } else {
      const itemErrors = [];
      formData.items.forEach((item, index) => {
        const itemError = {};

        // Validate medicine_id
        if (!item.medicine_id) {
          itemError.medicine_id = trans.contractAdd.validation.medicineRequired;
        }

        // Validate quantity for economic contracts
        if (isEconomic) {
          if (!item.quantity && item.quantity !== '0') {
            itemError.quantity = trans.contractAdd.validation.quantityRequiredEconomic;
          } else if (!isValidInteger(item.quantity)) {
            itemError.quantity = trans.contractAdd.validation.quantityInteger;
          }
        }

        // Validate unit_price
        if (!item.unit_price && item.unit_price !== '0') {
          itemError.unit_price = trans.contractAdd.validation.unitPriceRequired;
        } else if (!isValidFloat(item.unit_price)) {
          itemError.unit_price = trans.contractAdd.validation.unitPriceNonNegative;
        }

        itemErrors[index] = Object.keys(itemError).length > 0 ? itemError : null;
      });

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

    if (!contract?._id) {
      setErrorApi('Contract ID is missing');
      return;
    }

    setErrorApi('');
    try {
      const isEconomic = formData.contract_type === 'economic';

      // Clean and validate the payload data
      const payload = {
        contract_code: formData.contract_code?.trim(),
        contract_type: formData.contract_type,
        partner_type: formData.partner_type,
        partner_id: formData.partner_id,
        start_date: formData.start_date ? formData.start_date.toISOString() : null,
        end_date: formData.end_date ? formData.end_date.toISOString() : null,
        items: formData.items
          .filter((item) => item.medicine_id && item.medicine_id.trim()) // Only include items with medicine_id
          .map((item) => ({
            medicine_id: item.medicine_id,
            ...(isEconomic && {
              quantity: item.quantity ? Number.parseInt(item.quantity, 10) : 0
            }),
            unit_price: item.unit_price ? Number.parseFloat(item.unit_price) : 0
          })),
        ...(formData.contract_type === 'principal' && {
          annexes: formData.annexes
            .filter((annex) => annex.annex_code?.trim()) // Only include annexes with annex_code
            .map((annex) => ({
              annex_code: annex.annex_code?.trim(),
              description: annex.description?.trim() || '',
              signed_date: annex.signed_date ? annex.signed_date.toISOString() : null,
              action: annex.action,
              items:
                annex.items
                  ?.filter((item) => item.medicine_id && item.medicine_id.trim())
                  .map((item) => ({
                    medicine_id: item.medicine_id,
                    unit_price: item.unit_price ? Number.parseFloat(item.unit_price) : 0
                  })) || []
            }))
        })
      };

      // Final validation before sending
      if (!payload.contract_code || !payload.partner_id || !payload.start_date || !payload.end_date) {
        setErrorApi('Missing required fields');
        return;
      }

      if (payload.items.length === 0) {
        setErrorApi('At least one medicine item is required');
        return;
      }

      console.log('Sending payload:', payload);
      console.log('Contract ID:', contract?._id);
      console.log('Contract type:', formData.contract_type);

      const response = await trigger(payload, {
        onSuccess: (data) => {
          console.log('Success response:', data);
          if (data.success) {
            onSuccess(data.data);
            onClose();
          } else {
            setErrorApi(data.message || trans.common.contractUpdateFailed);
          }
        },
        onError: (err) => {
          console.error('Error response:', err);
          console.error('Error details:', err.response?.data);
          const serverMessage = err.response?.data?.message || err.message;
          setErrorApi(serverMessage || trans.common.contractUpdateFailed);
        }
      });
    } catch (err) {
      console.error('Update contract error:', err);
      const serverMessage = err.response?.data?.message;
      setErrorApi(serverMessage || trans.common.contractUpdateFailed);
    }
  };

  if (!contract) return null;

  const isEconomic = formData.contract_type === 'economic';
  const isPrincipal = formData.contract_type === 'principal';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          background: isViewMode
            ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
            : 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isViewMode ? <ViewIcon /> : <EditIcon />}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {isViewMode ? trans.common.contractDetails : trans.common.editContract}
              {isEconomic ? ` ${trans.common.economicContract}` : ` ${trans.common.principalContract}`}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {isViewMode ? `${trans.common.viewContractInfo}: ` : `${trans.common.updateContractInfo}: `}
              {contract.contract_code}
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
                  label={trans.common.contractCode}
                  value={formData.contract_code}
                  onChange={(e) => handleChange({ target: { name: 'contract_code', value: e.target.value } })}
                  error={!!errorValidate.contract_code}
                  helperText={errorValidate.contract_code}
                  disabled={isViewMode}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {trans.common.contractType}
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
                    <Chip
                      label={isEconomic ? trans.common.economicContractFull : trans.common.principalContractFull}
                      color={isEconomic ? 'primary' : 'secondary'}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {trans.common.partnerType}
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
                        { value: 'Supplier', label: trans.common.supplierLabel },
                        { value: 'Retailer', label: trans.common.retailerLabel }
                      ]}
                      getOptionLabel={(option) => option.label || ''}
                      value={
                        formData.partner_type
                          ? [
                              { value: 'Supplier', label: trans.common.supplierLabel },
                              { value: 'Retailer', label: trans.common.retailerLabel }
                            ].find((opt) => opt.value === formData.partner_type)
                          : { value: 'Supplier', label: trans.common.supplierLabel }
                      }
                      onChange={(event, newValue) => {
                        if (!isViewMode) {
                          setFormData((prev) => ({
                            ...prev,
                            partner_type: newValue ? newValue.value : 'Supplier',
                            partner_id: ''
                          }));
                        }
                      }}
                      disabled={isViewMode}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          placeholder={trans.common.selectPartnerType}
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
                      {trans.common.partner}
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
                        if (!isViewMode) {
                          setFormData((prev) => ({
                            ...prev,
                            partner_id: newValue ? newValue._id : ''
                          }));
                          setErrorValidate((prev) => ({ ...prev, partner_id: '' }));
                        }
                      }}
                      disabled={isViewMode}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          placeholder={formData.partner_type === 'Supplier' ? 'Chọn nhà cung cấp' : 'Chọn nhà bán lẻ'}
                          error={!isViewMode && !!errorValidate.partner_id}
                          helperText={!isViewMode ? errorValidate.partner_id : ''}
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
                      label={trans.common.startDate}
                      value={formData.start_date}
                      onChange={isViewMode ? () => {} : handleDateChange('start_date')}
                      format="dd/MM/yyyy"
                      disabled={isViewMode}
                      slotProps={{
                        textField: {
                          error: !isViewMode && !!errorValidate.start_date,
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
                      onChange={isViewMode ? () => {} : handleDateChange('end_date')}
                      format="dd/MM/yyyy"
                      disabled={isViewMode}
                      slotProps={{
                        textField: {
                          error: !isViewMode && !!errorValidate.end_date,
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
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
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
                  {formData.items.length > 1 && !isViewMode && (
                    <Button size="small" color="error" onClick={() => removeItem(index)} sx={{ textTransform: 'none' }}>
                      Xóa
                    </Button>
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={isEconomic ? 3 : 6}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <InventoryIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {trans.common.medicineLabel}
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
                            if (!isViewMode) {
                              handleItemChange(index, 'medicine_id', newValue ? newValue._id : '');
                            }
                          }}
                          disabled={isViewMode}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              placeholder={trans.common.selectMedicinePlaceholder}
                              error={
                                !isViewMode &&
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
                      {!isViewMode &&
                        errorValidate.items &&
                        Array.isArray(errorValidate.items) &&
                        errorValidate.items[index]?.medicine_id && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                            {errorValidate.items[index].medicine_id}
                          </Typography>
                        )}
                    </Box>
                  </Grid>

                  {/* Quantity field - only for economic contracts */}
                  {isEconomic && (
                    <Grid item xs={12} sm={6} md={3}>
                      <InfoField
                        label={trans.common.orderQuantity}
                        value={item.quantity}
                        onChange={(e) => !isViewMode && handleItemChange(index, 'quantity', e.target.value)}
                        disabled={isViewMode}
                        error={
                          !isViewMode &&
                          !!(errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.quantity)
                        }
                        helperText={
                          !isViewMode && errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.quantity
                            ? errorValidate.items[index].quantity
                            : ''
                        }
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} sm={6} md={isEconomic ? 3 : 6}>
                    <InfoField
                      label="Đơn giá"
                      value={item.unit_price}
                      onChange={(e) => !isViewMode && handleItemChange(index, 'unit_price', e.target.value)}
                      disabled={isViewMode}
                      error={
                        !isViewMode &&
                        !!(errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.unit_price)
                      }
                      helperText={
                        !isViewMode && errorValidate.items && Array.isArray(errorValidate.items) && errorValidate.items[index]?.unit_price
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

            {!isViewMode && (
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={addItem} sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Thêm thuốc
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Phụ lục - only for principal contracts */}
        {isPrincipal && (
          <Card sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnnexIcon color="info" /> Phụ Lục Hợp Đồng
              </Typography>

              {formData.annexes.map((annex, annexIndex) => (
                <Box key={annexIndex} sx={{ mb: 3, p: 2, border: '2px dashed #2196f3', borderRadius: 2, bgcolor: '#f3f8ff' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      Phụ lục #{annexIndex + 1}
                    </Typography>
                    {!isViewMode && (
                      <Button size="small" color="error" onClick={() => removeAnnex(annexIndex)} sx={{ textTransform: 'none' }}>
                        Xóa phụ lục
                      </Button>
                    )}
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={4}>
                      <InfoField
                        label="Mã phụ lục"
                        value={annex.annex_code}
                        onChange={(e) => !isViewMode && handleAnnexChange(annexIndex, 'annex_code', e.target.value)}
                        disabled={isViewMode}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            Loại thao tác
                          </Typography>
                        </Box>
                        <FormControl fullWidth disabled={isViewMode}>
                          <Select
                            value={annex.action}
                            onChange={(e) => !isViewMode && handleAnnexChange(annexIndex, 'action', e.target.value)}
                            size="small"
                          >
                            {Object.entries(ANNEX_ACTION_LABELS).map(([value, label]) => (
                              <MenuItem key={value} value={value}>
                                {label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            Trạng thái
                          </Typography>
                        </Box>
                        <Chip
                          label={annex.status === 'draft' ? 'Nháp' : annex.status}
                          color={annex.status === 'draft' ? 'default' : 'success'}
                          size="small"
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <InfoField
                        label="Mô tả"
                        value={annex.description}
                        onChange={(e) => !isViewMode && handleAnnexChange(annexIndex, 'description', e.target.value)}
                        disabled={isViewMode}
                      />
                    </Grid>
                  </Grid>

                  {/* Items for annex - only if not UPDATE_END_DATE */}
                  {annex.action !== ANNEX_ACTIONS.UPDATE_END_DATE && (
                    <Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        Danh sách thuốc trong phụ lục
                      </Typography>

                      {annex.items.map((annexItem, itemIndex) => (
                        <Box key={itemIndex} sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              Thuốc #{itemIndex + 1}
                            </Typography>
                            {annex.items.length > 1 && !isViewMode && (
                              <Button
                                size="small"
                                color="error"
                                onClick={() => removeAnnexItem(annexIndex, itemIndex)}
                                sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                              >
                                Xóa
                              </Button>
                            )}
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                  <InventoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                    Thuốc
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    padding: '6px 10px',
                                    backgroundColor: '#fafafa',
                                    minHeight: 35,
                                    display: 'flex',
                                    width: '100%',
                                    minWidth: 200,
                                    alignItems: 'center'
                                  }}
                                >
                                  <Autocomplete
                                    options={medicines}
                                    getOptionLabel={(option) => option.license_code || ''}
                                    value={medicines.find((m) => m._id === annexItem.medicine_id) || null}
                                    onChange={(event, newValue) => {
                                      if (!isViewMode) {
                                        handleAnnexItemChange(annexIndex, itemIndex, 'medicine_id', newValue ? newValue._id : '');
                                      }
                                    }}
                                    disabled={isViewMode}
                                    size="small"
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        variant="standard"
                                        placeholder={trans.common.selectMedicinePlaceholder}
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

                            <Grid item xs={12} md={6}>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                    Đơn giá
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    padding: '6px 10px',
                                    backgroundColor: isViewMode ? '#f5f5f5' : '#fafafa',
                                    minHeight: 35,
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <TextField
                                    fullWidth
                                    value={annexItem.unit_price}
                                    onChange={(e) =>
                                      !isViewMode && handleAnnexItemChange(annexIndex, itemIndex, 'unit_price', e.target.value)
                                    }
                                    disabled={isViewMode}
                                    variant="standard"
                                    size="small"
                                    sx={{
                                      '& .MuiInputBase-input': {
                                        color: isViewMode ? 'text.disabled' : 'text.primary'
                                      }
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      ))}

                      {!isViewMode && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => addAnnexItem(annexIndex)}
                          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                          Thêm thuốc vào phụ lục
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              ))}

              {!isViewMode && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={addAnnex}
                    startIcon={<AddIcon />}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Thêm phụ lục
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, bgcolor: 'grey.50', borderTop: '1px solid #e0e0e0' }}>
        <Button
          onClick={onClose}
          variant={isViewMode ? 'contained' : 'outlined'}
          sx={{
            px: 3,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            ...(isViewMode && {
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' }
            })
          }}
          disabled={!isViewMode && isMutating}
        >
          {isViewMode ? 'Đóng' : 'Hủy'}
        </Button>
        {!isViewMode && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #e65100 0%, #ed6c02 100%)' }
            }}
            disabled={isMutating}
          >
            {isMutating ? 'Đang cập nhật...' : 'Cập nhật hợp đồng'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EconomicContractEditDialog;
