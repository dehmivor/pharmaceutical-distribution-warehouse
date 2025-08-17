'use client';
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Medication as MedicationIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
  ToggleOn as ToggleOnIcon
} from '@mui/icons-material';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';

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

const MedicineEditDialog = ({ open, onClose, medicineId, onSubmit, categoryOptions }) => {
  const trans = useTrans();
  const [formValues, setFormValues] = useState({
    medicine_name: '',
    license_code: '',
    category: '',
    unit_of_measure: '',
    min_stock_threshold: '',
    max_stock_threshold: '',
    status: 'active',
    storage_conditions: {
      temperature: '',
      humidity: '',
      light: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [medicine, setMedicine] = useState(null);

  // Fetch medicine data when dialog opens
  useEffect(() => {
    if (open && medicineId) {
      fetchMedicineData();
    }
  }, [open, medicineId]);

  const fetchMedicineData = async () => {
    if (!medicineId) return;

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/medicine/detail/${medicineId}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        const medicineData = response.data.data.medicine;
        setMedicine(medicineData);
        setFormValues({
          ...medicineData,
          min_stock_threshold: medicineData.min_stock_threshold || '',
          max_stock_threshold: medicineData.max_stock_threshold || '',
          status: medicineData.status || 'active',
          storage_conditions: {
            temperature: medicineData.storage_conditions?.temperature || '',
            humidity: medicineData.storage_conditions?.humidity || '',
            light: medicineData.storage_conditions?.light || ''
          }
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Error fetching medicine data:', error);
      setErrors({ general: trans.medicineEdit.messages.loadError });
    } finally {
      setLoading(false);
    }
  };

  // Reset errors when dialog closes
  useEffect(() => {
    if (!open) {
      setErrors({});
    }
  }, [open]);

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleStorageChange = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      storage_conditions: {
        ...prev.storage_conditions,
        [field]: value
      }
    }));
    // Clear error when user starts typing
    if (errors.storage_conditions?.[field]) {
      setErrors((prev) => ({
        ...prev,
        storage_conditions: {
          ...prev.storage_conditions,
          [field]: ''
        }
      }));
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formValues.medicine_name.trim()) {
      newErrors.medicine_name = trans.medicineEdit.validation.medicineNameRequired;
    }

    if (!formValues.license_code.trim()) {
      newErrors.license_code = trans.medicineEdit.validation.licenseCodeRequired;
    }

    if (!formValues.category) {
      newErrors.category = trans.medicineEdit.validation.categoryRequired;
    }

    if (!formValues.unit_of_measure) {
      newErrors.unit_of_measure = trans.medicineEdit.validation.unitOfMeasureRequired;
    }

    if (!formValues.status) {
      newErrors.status = trans.medicineEdit.validation.statusRequired;
    }

    // Storage conditions validation (optional)
    if (formValues.storage_conditions.temperature.trim()) {
      const tempValue = formValues.storage_conditions.temperature.trim();
      if (!/^\d+-\d+$|^-\d+$|^\d+$/.test(tempValue)) {
        newErrors.storage_conditions = {
          ...newErrors.storage_conditions,
          temperature: trans.medicineEdit.validation.temperatureFormatError
        };
      } else {
        // Validate temperature range logic
        if (tempValue.includes('-')) {
          const [min, max] = tempValue.split('-').map(Number);
          if (min > max) {
            newErrors.storage_conditions = {
              ...newErrors.storage_conditions,
              temperature: trans.medicineEdit.validation.temperatureRangeError
            };
          }
        }
      }
    }

    if (formValues.storage_conditions.humidity.trim()) {
      const humidityValue = formValues.storage_conditions.humidity.trim();
      if (!/^\d+$|^\d+-\d+$/.test(humidityValue)) {
        newErrors.storage_conditions = {
          ...newErrors.storage_conditions,
          humidity: trans.medicineEdit.validation.humidityFormatError
        };
      } else {
        // Validate humidity range logic
        if (humidityValue.includes('-')) {
          const [min, max] = humidityValue.split('-').map(Number);
          if (min > max) {
            newErrors.storage_conditions = {
              ...newErrors.storage_conditions,
              humidity: trans.medicineEdit.validation.humidityRangeError
            };
          }
          if (max > 100) {
            newErrors.storage_conditions = {
              ...newErrors.storage_conditions,
              humidity: trans.medicineEdit.validation.humidityMaxError
            };
          }
        } else {
          const humidity = Number(humidityValue);
          if (humidity > 100) {
            newErrors.storage_conditions = {
              ...newErrors.storage_conditions,
              humidity: trans.medicineEdit.validation.humidityMaxError
            };
          }
        }
      }
    }

    // Numeric validation
    if (formValues.min_stock_threshold !== '' && isNaN(formValues.min_stock_threshold)) {
      newErrors.min_stock_threshold = trans.medicineEdit.validation.minStockThresholdNumeric;
    }

    if (formValues.max_stock_threshold !== '' && isNaN(formValues.max_stock_threshold)) {
      newErrors.max_stock_threshold = trans.medicineEdit.validation.maxStockThresholdNumeric;
    }

    // Threshold validation
    if (formValues.min_stock_threshold !== '' && parseFloat(formValues.min_stock_threshold) < 0) {
      newErrors.min_stock_threshold = trans.medicineEdit.validation.minStockThresholdNegative;
    }

    if (formValues.max_stock_threshold !== '' && parseFloat(formValues.max_stock_threshold) < 0) {
      newErrors.max_stock_threshold = trans.medicineEdit.validation.maxStockThresholdNegative;
    }

    if (
      formValues.min_stock_threshold !== '' &&
      formValues.max_stock_threshold !== '' &&
      parseFloat(formValues.max_stock_threshold) < parseFloat(formValues.min_stock_threshold)
    ) {
      newErrors.max_stock_threshold = trans.medicineEdit.validation.maxStockThresholdGreaterThanMin;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare storage conditions - only include if they have values
      const storageConditions = {};
      if (formValues.storage_conditions.temperature.trim()) {
        storageConditions.temperature = formValues.storage_conditions.temperature.trim();
      }
      if (formValues.storage_conditions.humidity.trim()) {
        storageConditions.humidity = formValues.storage_conditions.humidity.trim();
      }
      if (formValues.storage_conditions.light) {
        storageConditions.light = formValues.storage_conditions.light;
      }

      const payload = {
        _id: medicineId, // Use medicineId from props
        medicine_name: formValues.medicine_name,
        license_code: formValues.license_code,
        category: formValues.category,
        unit_of_measure: formValues.unit_of_measure,
        status: formValues.status,
        storage_conditions: Object.keys(storageConditions).length > 0 ? storageConditions : null
      };

      // Always include threshold fields - null if empty, parsed number if has value
      payload.min_stock_threshold = formValues.min_stock_threshold ? parseFloat(formValues.min_stock_threshold) : null;
      payload.max_stock_threshold = formValues.max_stock_threshold ? parseFloat(formValues.max_stock_threshold) : null;

      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <EditIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {trans.medicineEdit.title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {trans.medicineEdit.subtitle}
            </Typography>
          </Box>
        </Box>
        <Tooltip title={trans.medicineEdit.close}>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Loading and Error States */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography>{trans.medicineEdit.messages.loadError}</Typography>
            </Box>
          )}

          {errors.general && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrors({})}>
              {errors.general}
            </Alert>
          )}

          {/* Basic Information Section */}
          <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                <MedicationIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {trans.medicineEdit.basicInfo.title}
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={trans.medicineEdit.basicInfo.medicineName + ' *'}
                    value={formValues.medicine_name}
                    onChange={(e) => handleChange('medicine_name', e.target.value)}
                    error={!!errors.medicine_name}
                    helperText={errors.medicine_name}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: <MedicationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={trans.medicineEdit.basicInfo.licenseCode + ' *'}
                    value={formValues.license_code}
                    onChange={(e) => handleChange('license_code', e.target.value)}
                    error={!!errors.license_code}
                    helperText={errors.license_code}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.category} size="medium">
                    <InputLabel>{trans.medicineEdit.basicInfo.category + ' *'}</InputLabel>
                    <Select
                      value={formValues.category}
                      label={trans.medicineEdit.basicInfo.category + ' *'}
                      onChange={(e) => handleChange('category', e.target.value)}
                      startAdornment={<CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                      MenuProps={{ variant: 'menu' }}
                      sx={{
                        width: 220
                      }}
                    >
                      {categoryOptions?.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.category && (
                      <Typography variant="caption" color="error">
                        {errors.category}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={trans.medicineEdit.basicInfo.unitOfMeasure + ' *'}
                    value={formValues.unit_of_measure}
                    onChange={(e) => handleChange('unit_of_measure', e.target.value)}
                    error={!!errors.unit_of_measure}
                    helperText={errors.unit_of_measure}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: <InventoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Storage Conditions Section */}
          <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                <StorageIcon sx={{ color: 'info.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'info.main' }}>
                  {trans.medicineEdit.storageConditions.title} ({trans.medicineEdit.optional})
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={trans.medicineEdit.storageConditions.temperature}
                    placeholder={trans.medicineEdit.storageConditions.temperaturePlaceholder}
                    value={formValues.storage_conditions.temperature}
                    onChange={(e) => handleStorageChange('temperature', e.target.value)}
                    error={!!errors.storage_conditions?.temperature}
                    helperText={errors.storage_conditions?.temperature || 'Format: X-Y, -X or X'}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: <StorageIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={trans.medicineEdit.storageConditions.humidity}
                    placeholder={trans.medicineEdit.storageConditions.humidityPlaceholder}
                    value={formValues.storage_conditions.humidity}
                    onChange={(e) => handleStorageChange('humidity', e.target.value)}
                    error={!!errors.storage_conditions?.humidity}
                    helperText={errors.storage_conditions?.humidity || 'Format: X or X-Y'}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: <StorageIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth error={!!errors.storage_conditions?.light} size="medium" sx={{ width: 200 }}>
                    <InputLabel>{trans.medicineEdit.storageConditions.light}</InputLabel>
                    <Select
                      value={formValues.storage_conditions.light}
                      label={trans.medicineEdit.storageConditions.light}
                      onChange={(e) => handleStorageChange('light', e.target.value)}
                      startAdornment={<StorageIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                    >
                      <MenuItem value="">Not selected</MenuItem>
                      <MenuItem value="none">{trans.medicineEdit.storageConditions.lightOptions.none}</MenuItem>
                      <MenuItem value="low">{trans.medicineEdit.storageConditions.lightOptions.low}</MenuItem>
                      <MenuItem value="medium">{trans.medicineEdit.storageConditions.lightOptions.medium}</MenuItem>
                      <MenuItem value="high">{trans.medicineEdit.storageConditions.lightOptions.high}</MenuItem>
                    </Select>
                    {errors.storage_conditions?.light && (
                      <Typography variant="caption" color="error">
                        {errors.storage_conditions.light}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Stock Management Section */}
          <Card sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                <SettingsIcon sx={{ color: 'secondary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                  {trans.medicineEdit.stockManagement.title}
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={trans.medicineEdit.stockManagement.minThreshold}
                    type="number"
                    value={formValues.min_stock_threshold}
                    onChange={(e) => handleChange('min_stock_threshold', e.target.value)}
                    error={!!errors.min_stock_threshold}
                    helperText={errors.min_stock_threshold || 'Để trống nếu không cần thiết'}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      inputProps: { min: 0 },
                      startAdornment: <InventoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={trans.medicineEdit.stockManagement.maxThreshold}
                    type="number"
                    value={formValues.max_stock_threshold}
                    onChange={(e) => handleChange('max_stock_threshold', e.target.value)}
                    error={!!errors.max_stock_threshold}
                    helperText={errors.max_stock_threshold || 'Để trống nếu không cần thiết'}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      inputProps: { min: 0 },
                      startAdornment: <InventoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.status} size="medium">
                    <InputLabel>{trans.medicineEdit.basicInfo.status + ' *'}</InputLabel>
                    <Select
                      value={formValues.status}
                      label={trans.medicineEdit.basicInfo.status + ' *'}
                      onChange={(e) => handleChange('status', e.target.value)}
                      startAdornment={<ToggleOnIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                    >
                      <MenuItem value="active">{trans.medicineEdit.basicInfo.active}</MenuItem>
                      <MenuItem value="inactive">{trans.medicineEdit.basicInfo.inactive}</MenuItem>
                    </Select>
                    {errors.status && (
                      <Typography variant="caption" color="error">
                        {errors.status}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Required fields note */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: 'primary.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'primary.200'
            }}
          >
            <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
              <strong>Note: Fields marked with * are required.</strong>
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          pt: 2,
          borderTop: '1px solid #e0e0e0',
          bgcolor: 'grey.50'
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            px: 3,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          {trans.medicineEdit.actions.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<EditIcon />}
          disabled={loading}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)'
            }
          }}
        >
          {loading ? trans.medicineEdit.actions.updating : trans.medicineEdit.actions.update}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MedicineEditDialog;
