import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Autocomplete,
  Chip
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import useSWRMutation from 'swr/mutation';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useRole } from '@/contexts/RoleContext';

import axios from 'axios';
import useTrans from '@/hooks/useTrans';

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

// API functions
const createAnnex = async (url, { arg: payload }) => {
  const response = await axiosInstance.post(url, payload, {
    headers: getAuthHeaders()
  });
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to create annex');
  }
  return response.data;
};

const updateAnnex = async (url, { arg: payload }) => {
  const response = await axiosInstance.put(url, payload, {
    headers: getAuthHeaders()
  });
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to update annex');
  }
  return response.data;
};

const updateAnnexStatus = async (url, { arg: payload }) => {
  const response = await axiosInstance.put(url, payload, {
    headers: getAuthHeaders()
  });
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to update annex status');
  }
  return response.data;
};

const AnnexDialog = ({ open, onClose, contractId, onSuccess }) => {
  const trans = useTrans();
  const { userRole, user } = useRole();
  const { enqueueSnackbar } = useSnackbar();
  const [contract, setContract] = useState(null);
  const [annex, setAnnex] = useState(null);
  const [medicines, setMedicines] = useState([]);

  const [formData, setFormData] = useState({
    annex_code: '',
    description: '',
    signed_date: null,
    medicine_changes: {
      add_items: [],
      remove_items: [],
      update_prices: []
    },
    end_date_change: {
      new_end_date: null
    }
  });
  const [errorValidate, setErrorValidate] = useState({});

  // Fetch contract detail and annex data
  const fetchContractDetail = async () => {
    if (!contractId) return;

    try {
      const response = await axiosInstance.get(`/api/contract/${contractId}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        const contractData = response.data.data;
        setContract(contractData);

        // Find the annex that can be edited (draft or rejected)
        if (contractData.annexes) {
          const existingAnnex = contractData.annexes.find((annex) => annex.status === 'draft' || annex.status === 'rejected');
          if (existingAnnex) {
            setAnnex(existingAnnex);
          } else {
            setAnnex(null);
          }
        } else {
          setAnnex(null);
        }
      }
    } catch (error) {
      console.error('Error fetching contract detail:', error);
      enqueueSnackbar(trans.common.cannotLoadContractInfo, { variant: 'error' });
    }
  };

  // Fetch all medicines for representative
  const fetchAllMedicines = async () => {
    try {
      const response = await axiosInstance.get('/api/medicine/all/v1', {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        const medicinesData = response.data.data || [];
        setMedicines(medicinesData);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      enqueueSnackbar(trans.common.cannotLoadMedicineList, { variant: 'error' });
    }
  };

  // SWR mutations
  const { trigger: createAnnexTrigger, isMutating: isCreating } = useSWRMutation(
    contractId ? `/api/contract/${contractId}/annexes` : null,
    createAnnex
  );

  const { trigger: updateAnnexTrigger, isMutating: isUpdating } = useSWRMutation(
    contractId && annex ? `/api/contract/${contractId}/annexes/${annex.annex_code}` : null,
    updateAnnex
  );

  const { trigger: updateStatusTrigger, isMutating: isUpdatingStatus } = useSWRMutation(
    contractId && annex ? `/api/contract/${contractId}/annexes/${annex.annex_code}/status` : null,
    updateAnnexStatus
  );

  const { trigger: deleteAnnexTrigger, isMutating: isDeleting } = useSWRMutation(
    contractId && annex ? `/api/contract/${contractId}/annexes/${annex.annex_code}` : null,
    async (url) => {
      const response = await axiosInstance.delete(url, {
        headers: getAuthHeaders()
      });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete annex');
      }
      return response.data;
    }
  );

  // Determine mode based on annex data and user role
  const determineMode = (annexData, userRoleData) => {
    if (!annexData) return 'create';
    if (userRoleData === 'representative_manager') {
      return annexData.status === 'draft' ? 'approve' : 'view';
    }
    if (annexData.status === 'rejected') return 'resubmit';
    if (annexData.status === 'draft') return 'edit';
    return 'view';
  };

  // Calculate current mode with useMemo to ensure consistency
  const currentMode = useMemo(() => {
    return determineMode(annex, userRole);
  }, [annex, userRole]);

  const isReadOnly = currentMode === 'approve' || currentMode === 'view';

  // Initialize form data and fetch data based on role
  useEffect(() => {
    if (open && contractId) {
      fetchContractDetail();

      // For representative: fetch all medicines for selection
      if (userRole === 'representative') {
        fetchAllMedicines();
      }
    }
  }, [open, contractId, userRole]);

  // Handle medicines for representative_manager when annex changes
  useEffect(() => {
    if (userRole === 'representative_manager' && annex) {
      // Get medicines from annex only - use the populated medicine objects
      let annexMedicines = [];
      if (annex && annex.medicine_changes) {
        const addItems = annex.medicine_changes.add_items || [];
        const removeItems = annex.medicine_changes.remove_items || [];
        const updateItems = annex.medicine_changes.update_prices || [];

        // Extract medicine objects (already populated from backend)
        annexMedicines = [
          ...addItems.map((item) => item.medicine_id),
          ...removeItems.map((item) => item.medicine_id),
          ...updateItems.map((item) => item.medicine_id)
        ].filter((medicine) => medicine && typeof medicine === 'object'); // Filter out string IDs
      }

      setMedicines(annexMedicines);
    }
  }, [annex, userRole]);

  useEffect(() => {
    if (annex) {
      const parsedFormData = {
        annex_code: annex.annex_code || '',
        description: annex.description || '',
        signed_date: annex.signed_date ? new Date(annex.signed_date) : null,
        medicine_changes: {
          add_items: (annex.medicine_changes?.add_items || []).map((item) => {
            const medicineId = typeof item.medicine_id === 'object' ? item.medicine_id._id : item.medicine_id;
            return {
              medicine_id: medicineId,
              unit_price: item.unit_price
            };
          }),
          remove_items: (annex.medicine_changes?.remove_items || []).map((item) => {
            const medicineId = typeof item.medicine_id === 'object' ? item.medicine_id._id : item.medicine_id;
            return {
              medicine_id: medicineId,
              unit_price: item.unit_price
            };
          }),
          update_prices: (annex.medicine_changes?.update_prices || []).map((item) => {
            const medicineId = typeof item.medicine_id === 'object' ? item.medicine_id._id : item.medicine_id;
            return {
              medicine_id: medicineId,
              unit_price: item.unit_price
            };
          })
        },
        end_date_change: {
          new_end_date: annex.end_date_change?.new_end_date ? new Date(annex.end_date_change.new_end_date) : null
        }
      };

      setFormData(parsedFormData);
    } else {
      setFormData({
        annex_code: '',
        description: '',
        signed_date: null,
        medicine_changes: {
          add_items: [],
          remove_items: [],
          update_prices: []
        },
        end_date_change: {
          new_end_date: null
        }
      });
    }
    setErrorValidate({});
  }, [annex, open, medicines]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    // Clear validation error
    if (errorValidate[field]) {
      setErrorValidate((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
    // Clear general error when any field changes
    if (errorValidate.general) {
      setErrorValidate((prev) => ({
        ...prev,
        general: ''
      }));
    }
  };

  const handleAnnexChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      end_date_change: {
        ...prev.end_date_change,
        [field]: value
      }
    }));
    // Clear validation error
    if (errorValidate.end_date) {
      setErrorValidate((prev) => ({
        ...prev,
        end_date: ''
      }));
    }
    // Clear general error when end date changes
    if (errorValidate.general) {
      setErrorValidate((prev) => ({
        ...prev,
        general: ''
      }));
    }
  };

  const handleItemChange = (section, index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      medicine_changes: {
        ...prev.medicine_changes,
        [section]: prev.medicine_changes[section].map((item, i) => (i === index ? { ...item, [field]: value } : item))
      }
    }));
    // Clear validation error
    if (errorValidate[section] && errorValidate[section][index] && errorValidate[section][index][field]) {
      setErrorValidate((prev) => ({
        ...prev,
        [section]: prev[section].map((item, i) => (i === index ? { ...item, [field]: '' } : item))
      }));
    }
    // Clear general error when any item changes
    if (errorValidate.general) {
      setErrorValidate((prev) => ({
        ...prev,
        general: ''
      }));
    }
  };

  const addItem = (section) => {
    setFormData((prev) => ({
      ...prev,
      medicine_changes: {
        ...prev.medicine_changes,
        [section]: [...prev.medicine_changes[section], { medicine_id: '', unit_price: '' }]
      }
    }));
    // Clear general error when adding items
    if (errorValidate.general) {
      setErrorValidate((prev) => ({
        ...prev,
        general: ''
      }));
    }
  };

  const removeItem = (section, index) => {
    setFormData((prev) => ({
      ...prev,
      medicine_changes: {
        ...prev.medicine_changes,
        [section]: prev.medicine_changes[section].filter((_, i) => i !== index)
      }
    }));
  };

  const validateForm = () => {
    const errors = {};

    // Validate basic fields
    if (!formData.annex_code.trim()) {
      errors.annex_code = trans.common.annexCodeRequired;
    }

    if (!formData.signed_date) {
      errors.signed_date = trans.common.signedDateRequired;
    }

    // Validate end date if provided
    if (formData.end_date_change.new_end_date) {
      if (formData.end_date_change.new_end_date <= new Date()) {
        errors.end_date = trans.common.endDateMustBeAfterToday;
      }
    }

    // Validate that annex has at least one meaningful change
    const hasAddItems = formData.medicine_changes.add_items.some((item) => item.medicine_id && item.medicine_id !== '');
    const hasRemoveItems = formData.medicine_changes.remove_items.some((item) => item.medicine_id && item.medicine_id !== '');
    const hasUpdatePrices = formData.medicine_changes.update_prices.some((item) => item.medicine_id && item.medicine_id !== '');
    const hasEndDateChange = formData.end_date_change.new_end_date;

    if (!hasAddItems && !hasRemoveItems && !hasUpdatePrices && !hasEndDateChange) {
      errors.general = trans.common.annexMustHaveChanges;
    }

    // Validate medicine items
    ['add_items', 'remove_items', 'update_prices'].forEach((section) => {
      if (formData.medicine_changes[section].length > 0) {
        errors[section] = formData.medicine_changes[section].map((item, index) => {
          // Only validate items that have medicine_id
          if (!item.medicine_id || item.medicine_id === '') {
            return null; // Skip validation for empty items
          }

          const itemErrors = {};
          if (section !== 'remove_items' && (!item.unit_price || item.unit_price === '')) {
            itemErrors.unit_price = 'Đơn giá là bắt buộc';
          }
          if (section !== 'remove_items' && item.unit_price && parseFloat(item.unit_price) <= 0) {
            itemErrors.unit_price = 'Đơn giá phải lớn hơn 0';
          }
          return Object.keys(itemErrors).length > 0 ? itemErrors : null;
        });
      }
    });

    setErrorValidate(errors);

    // Check if there are any actual errors (not just empty arrays or null values)
    const hasErrors = Object.keys(errors).some((key) => {
      const value = errors[key];
      if (typeof value === 'string' && value) return true;
      if (Array.isArray(value) && value.some((item) => item !== null)) return true;
      return false;
    });

    return !hasErrors;
  };

  const buildAnnexPayload = () => {
    const payload = {
      annex_code: formData.annex_code,
      description: formData.description,
      signed_date: formData.signed_date ? format(formData.signed_date, 'yyyy-MM-dd') : null
    };

    // Initialize medicine_changes object
    const medicine_changes = {};

    // Medicine changes
    const add_items = formData.medicine_changes.add_items
      .filter((item) => item.medicine_id)
      .map((item) => ({
        medicine_id: item.medicine_id,
        unit_price: item.unit_price
      }));
    if (add_items.length > 0) medicine_changes.add_items = add_items;

    const remove_items = formData.medicine_changes.remove_items
      .filter((item) => item.medicine_id)
      .map((item) => ({ medicine_id: item.medicine_id }));
    if (remove_items.length > 0) medicine_changes.remove_items = remove_items;

    const update_prices = formData.medicine_changes.update_prices
      .filter((item) => item.medicine_id)
      .map((item) => ({
        medicine_id: item.medicine_id,
        unit_price: item.unit_price
      }));
    if (update_prices.length > 0) medicine_changes.update_prices = update_prices;

    // Only add medicine_changes if it has at least one key
    if (Object.keys(medicine_changes).length > 0) {
      payload.medicine_changes = medicine_changes;
    }

    // End date change
    if (formData.end_date_change && formData.end_date_change.new_end_date) {
      payload.end_date_change = {
        new_end_date: format(formData.end_date_change.new_end_date, 'yyyy-MM-dd')
      };
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = buildAnnexPayload();

      let result;
      if (currentMode === 'create') {
        result = await createAnnexTrigger(payload);
      } else if (currentMode === 'edit' || currentMode === 'resubmit') {
        result = await updateAnnexTrigger(payload);
      } else if (currentMode === 'approve') {
        result = await updateStatusTrigger({ status: 'active' });
      }

      if (result) {
        enqueueSnackbar(trans.common.annexActionSuccess, { variant: 'success' });
        onSuccess(result);
        onClose();
      }
    } catch (error) {
      let errorMessage;
      if (error.response?.data?.message) {
        // Backend error message
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Custom error message from our API functions
        errorMessage = error.message;
      } else {
        // Generic error
        errorMessage = trans.common.errorInAnnexAction;
      }
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleReject = async () => {
    try {
      const result = await updateStatusTrigger({ status: 'rejected' });
      if (result) {
        enqueueSnackbar(trans.common.rejectAnnexSuccess, { variant: 'success' });
        onSuccess(result);
        onClose();
      }
    } catch (error) {
      let errorMessage;
      if (error.response?.data?.message) {
        // Backend error message
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Custom error message from our API functions
        errorMessage = error.message;
      } else {
        // Generic error
        errorMessage = trans.common.errorRejectingAnnex;
      }
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phụ lục này?')) {
      return;
    }

    try {
      const result = await deleteAnnexTrigger();
      if (result) {
        enqueueSnackbar(trans.common.deleteAnnexSuccess, { variant: 'success' });
        onSuccess(result);
        onClose();
      }
    } catch (error) {
      let errorMessage;
      if (error.response?.data?.message) {
        // Backend error message
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Custom error message from our API functions
        errorMessage = error.message;
      } else {
        // Generic error
        errorMessage = trans.common.errorDeletingAnnex;
      }
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const getDialogTitle = () => {
    switch (currentMode) {
      case 'create':
        return 'Tạo Phụ Lục Mới';
      case 'edit':
        return trans.common.editAnnex;
      case 'resubmit':
        return 'Gửi Lại Phụ Lục';
      case 'approve':
        return 'Duyệt Phụ Lục';
      case 'view':
        return 'Xem Phụ Lục';
      default:
        return 'Phụ Lục';
    }
  };

  const getSubmitButtonText = () => {
    switch (currentMode) {
      case 'create':
        return 'Tạo';
      case 'edit':
        return 'Cập Nhật';
      case 'resubmit':
        return 'Gửi Duyệt Lại';
      case 'approve':
        return 'Duyệt';
      default:
        return 'Xác Nhận';
    }
  };

  const canDeleteAnnex = () => {
    return userRole === 'representative' && annex && (annex.status === 'draft' || annex.status === 'rejected');
  };

  const isLoading = isCreating || isUpdating || isUpdatingStatus || isDeleting;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AttachFileIcon color="primary" />
        {getDialogTitle()}
      </DialogTitle>

      <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto', paddingTop: '10px !important' }}>
        {errorValidate.general && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
            <Typography variant="body2">{errorValidate.general}</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Hàng 1: Mã phụ lục + Mô tả */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mã phụ lục"
                value={formData.annex_code}
                onChange={(e) => handleChange('annex_code', e.target.value)}
                disabled={isReadOnly}
                error={!!errorValidate.annex_code}
                helperText={errorValidate.annex_code}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mô tả"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={isReadOnly}
                error={!!errorValidate.description}
                helperText={errorValidate.description}
                size="small"
              />
            </Grid>
          </Grid>

          {/* Hàng 2: Ngày ký + Ngày kết thúc mới */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                <DatePicker
                  label="Ngày ký phụ lục"
                  value={formData.signed_date}
                  onChange={(date) => handleChange('signed_date', date)}
                  disabled={isReadOnly}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      error: !!errorValidate.signed_date,
                      helperText: errorValidate.signed_date
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                <DatePicker
                  label="Ngày kết thúc mới"
                  value={formData.end_date_change.new_end_date}
                  onChange={(date) => handleAnnexChange('new_end_date', date)}
                  disabled={isReadOnly}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      error: !!errorValidate.end_date,
                      helperText: errorValidate.end_date
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>

          {/* Hàng 3: Thêm thuốc mới */}
          <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AddIcon color="success" />
                Thêm Thuốc Mới
              </Typography>
              {!isReadOnly && (
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addItem('add_items')} size="small" color="success">
                  Thêm thuốc
                </Button>
              )}
            </Box>

            {formData.medicine_changes.add_items.map((item, itemIndex) => (
              <Box key={itemIndex} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Thuốc #{itemIndex + 1}
                  </Typography>
                  {!isReadOnly && (
                    <Button size="small" color="error" onClick={() => removeItem('add_items', itemIndex)} sx={{ textTransform: 'none' }}>
                      Xóa
                    </Button>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={Array.isArray(medicines) ? medicines : []}
                      getOptionLabel={(option) => `${option.license_code}`}
                      value={(() => {
                        if (!Array.isArray(medicines)) return null;
                        const found = medicines.find((m) => m._id.toString() === item.medicine_id.toString());

                        return found || null;
                      })()}
                      onChange={(_, newValue) => {
                        handleItemChange('add_items', itemIndex, 'medicine_id', newValue ? newValue._id : '');
                      }}
                      disabled={isReadOnly}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Chọn thuốc"
                          variant="outlined"
                          size="small"
                          error={!!(errorValidate.add_items && errorValidate.add_items[itemIndex]?.medicine_id)}
                          helperText={errorValidate.add_items && errorValidate.add_items[itemIndex]?.medicine_id}
                        />
                      )}
                      sx={{ minWidth: 200 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Đơn giá"
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange('add_items', itemIndex, 'unit_price', e.target.value)}
                      disabled={isReadOnly}
                      error={!!(errorValidate.add_items && errorValidate.add_items[itemIndex]?.unit_price)}
                      helperText={errorValidate.add_items && errorValidate.add_items[itemIndex]?.unit_price}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">₫</InputAdornment>
                      }}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>

          {/* Hàng 4: Loại bỏ thuốc */}
          <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <RemoveIcon color="error" />
                Loại Bỏ Thuốc
              </Typography>
              {!isReadOnly && (
                <Button variant="outlined" startIcon={<RemoveIcon />} onClick={() => addItem('remove_items')} size="small" color="error">
                  Thêm thuốc
                </Button>
              )}
            </Box>

            {formData.medicine_changes.remove_items.map((item, itemIndex) => (
              <Box key={itemIndex} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Thuốc #{itemIndex + 1}
                  </Typography>
                  {!isReadOnly && (
                    <Button size="small" color="error" onClick={() => removeItem('remove_items', itemIndex)} sx={{ textTransform: 'none' }}>
                      Xóa
                    </Button>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={Array.isArray(medicines) ? medicines : []}
                      getOptionLabel={(option) => `${option.license_code}`}
                      value={
                        Array.isArray(medicines) ? medicines.find((m) => m._id.toString() === item.medicine_id.toString()) || null : null
                      }
                      onChange={(_, newValue) => {
                        handleItemChange('remove_items', itemIndex, 'medicine_id', newValue ? newValue._id : '');
                      }}
                      disabled={isReadOnly}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Chọn thuốc"
                          variant="outlined"
                          size="small"
                          error={!!(errorValidate.remove_items && errorValidate.remove_items[itemIndex]?.medicine_id)}
                          helperText={errorValidate.remove_items && errorValidate.remove_items[itemIndex]?.medicine_id}
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
          <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon color="warning" />
                Cập Nhật Giá Thuốc
              </Typography>
              {!isReadOnly && (
                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => addItem('update_prices')} size="small" color="warning">
                  Thêm thuốc
                </Button>
              )}
            </Box>

            {formData.medicine_changes.update_prices.map((item, itemIndex) => (
              <Box key={itemIndex} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Thuốc #{itemIndex + 1}
                  </Typography>
                  {!isReadOnly && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeItem('update_prices', itemIndex)}
                      sx={{ textTransform: 'none' }}
                    >
                      Xóa
                    </Button>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={Array.isArray(medicines) ? medicines : []}
                      getOptionLabel={(option) => `${option.license_code}`}
                      value={
                        Array.isArray(medicines) ? medicines.find((m) => m._id.toString() === item.medicine_id.toString()) || null : null
                      }
                      onChange={(_, newValue) => {
                        handleItemChange('update_prices', itemIndex, 'medicine_id', newValue ? newValue._id : '');
                      }}
                      disabled={isReadOnly}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Chọn thuốc"
                          variant="outlined"
                          size="small"
                          error={!!(errorValidate.update_prices && errorValidate.update_prices[itemIndex]?.medicine_id)}
                          helperText={errorValidate.update_prices && errorValidate.update_prices[itemIndex]?.medicine_id}
                        />
                      )}
                      sx={{ minWidth: 200 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Đơn giá mới"
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange('update_prices', itemIndex, 'unit_price', e.target.value)}
                      disabled={isReadOnly}
                      error={!!(errorValidate.update_prices && errorValidate.update_prices[itemIndex]?.unit_price)}
                      helperText={errorValidate.update_prices && errorValidate.update_prices[itemIndex]?.unit_price}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">₫</InputAdornment>
                      }}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Hủy
        </Button>

        {canDeleteAnnex() && (
          <Button onClick={handleDelete} variant="outlined" color="error" disabled={isLoading}>
            Xóa Phụ Lục
          </Button>
        )}

        {currentMode === 'approve' && (
          <Button onClick={handleReject} variant="outlined" color="error" disabled={isLoading}>
            Từ Chối
          </Button>
        )}

        <Button onClick={handleSubmit} variant="contained" disabled={isLoading}>
          {getSubmitButtonText()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnnexDialog;
