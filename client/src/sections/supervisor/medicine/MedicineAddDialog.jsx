import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Alert,
  Box,
  Chip,
  FormHelperText,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Medication as MedicationIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  Description as DescriptionIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon
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

const MedicineAddDialog = ({ open, onClose, onSuccess, filterOptions }) => {
  const trans = useTrans();
  const [formData, setFormData] = useState({
    medicine_name: '',
    license_code: '',
    category: '',
    storage_conditions: {
      temperature: '',
      humidity: '',
      light: ''
    },
    min_stock_threshold: '',
    max_stock_threshold: '',
    unit_of_measure: '',
    status: 'active',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // const [filterOptions, setFilterOptions] = useState({
  //   category: []
  // });

  // Fetch filter options
  // const fetchFilterOptions = async () => {
  //   try {
  //     const response = await axios.get(`${API_BASE_URL}/api/medicine/filter-options`);
  //     if (response.data.success) {
  //       setFilterOptions(response.data.data);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching filter options:', error);
  //   }
  // };

  // useEffect(() => {
  //   if (open) {
  //     fetchFilterOptions();
  //   }
  // }, [open]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        medicine_name: '',
        license_code: '',
        category: '',
        storage_conditions: {
          temperature: '',
          humidity: '',
          light: ''
        },
        min_stock_threshold: '',
        max_stock_threshold: '',
        unit_of_measure: '',
        status: 'active',
        description: ''
      });
      setErrors({});
      setError('');
    }
  }, [open]);

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.medicine_name.trim()) {
      newErrors.medicine_name = trans.medicineAdd.validation.medicineNameRequired;
    }

    if (!formData.license_code.trim()) {
      newErrors.license_code = trans.medicineAdd.validation.licenseCodeRequired;
    }

    if (!formData.category) {
      newErrors.category = trans.medicineAdd.validation.categoryRequired;
    }

    if (!formData.unit_of_measure) {
      newErrors.unit_of_measure = trans.medicineAdd.validation.unitOfMeasureRequired;
    }

    // Storage conditions validation (optional)
    if (formData.storage_conditions.temperature.trim()) {
      const tempValue = formData.storage_conditions.temperature.trim();
      if (!/^\d+-\d+$|^-\d+$|^\d+$/.test(tempValue)) {
        newErrors.storage_conditions = {
          ...newErrors.storage_conditions,
          temperature: trans.medicineAdd.validation.temperatureFormat
        };
      } else {
        // Validate temperature range logic
        if (tempValue.includes('-')) {
          const [min, max] = tempValue.split('-').map(Number);
          if (min > max) {
            newErrors.storage_conditions = {
              ...newErrors.storage_conditions,
              temperature: trans.medicineAdd.validation.temperatureRange
            };
          }
        }
      }
    }

    if (formData.storage_conditions.humidity.trim()) {
      const humidityValue = formData.storage_conditions.humidity.trim();
      if (!/^\d+$|^\d+-\d+$/.test(humidityValue)) {
        newErrors.storage_conditions = {
          ...newErrors.storage_conditions,
          humidity: trans.medicineAdd.validation.humidityFormat
        };
      } else {
        // Validate humidity range logic
        if (humidityValue.includes('-')) {
          const [min, max] = humidityValue.split('-').map(Number);
          if (min > max) {
            newErrors.storage_conditions = {
              ...newErrors.storage_conditions,
              humidity: trans.medicineAdd.validation.humidityRange
            };
          }
          if (max > 100) {
            newErrors.storage_conditions = {
              ...newErrors.storage_conditions,
              humidity: trans.medicineAdd.validation.humidityMax
            };
          }
        } else {
          const humidity = Number(humidityValue);
          if (humidity > 100) {
            newErrors.storage_conditions = {
              ...newErrors.storage_conditions,
              humidity: trans.medicineAdd.validation.humidityValue
            };
          }
        }
      }
    }

    // Numeric validation
    if (formData.min_stock_threshold !== '' && isNaN(formData.min_stock_threshold)) {
      newErrors.min_stock_threshold = trans.medicineAdd.validation.minThresholdNumber;
    }

    if (formData.max_stock_threshold !== '' && isNaN(formData.max_stock_threshold)) {
      newErrors.max_stock_threshold = trans.medicineAdd.validation.maxThresholdNumber;
    }

    // Threshold validation
    if (formData.min_stock_threshold !== '' && parseFloat(formData.min_stock_threshold) < 0) {
      newErrors.min_stock_threshold = 'Ngưỡng tối thiểu không được âm';
    }

    if (formData.max_stock_threshold !== '' && parseFloat(formData.max_stock_threshold) < 0) {
      newErrors.max_stock_threshold = 'Ngưỡng tối đa không được âm';
    }

    if (
      formData.min_stock_threshold !== '' &&
      formData.max_stock_threshold !== '' &&
      parseFloat(formData.max_stock_threshold) < parseFloat(formData.min_stock_threshold)
    ) {
      newErrors.max_stock_threshold = 'Ngưỡng tối đa phải lớn hơn hoặc bằng ngưỡng tối thiểu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare storage conditions - only include if they have values
      const storageConditions = {};
      if (formData.storage_conditions.temperature.trim()) {
        storageConditions.temperature = formData.storage_conditions.temperature.trim();
      }
      if (formData.storage_conditions.humidity.trim()) {
        storageConditions.humidity = formData.storage_conditions.humidity.trim();
      }
      if (formData.storage_conditions.light) {
        storageConditions.light = formData.storage_conditions.light;
      }

      const payload = {
        medicine_name: formData.medicine_name,
        license_code: formData.license_code,
        category: formData.category,
        unit_of_measure: formData.unit_of_measure,
        status: formData.status,
        storage_conditions: Object.keys(storageConditions).length > 0 ? storageConditions : null
      };

      // Only include threshold fields if they have values
      if (formData.min_stock_threshold) {
        payload.min_stock_threshold = parseFloat(formData.min_stock_threshold);
      }
      if (formData.max_stock_threshold) {
        payload.max_stock_threshold = parseFloat(formData.max_stock_threshold);
      }

      const response = await axiosInstance.post(`${API_BASE_URL}/api/medicine`, payload, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        onSuccess(response.data.data);
        onClose();
      } else {
        setError(response.data.message || trans.medicineAdd.messages.addError);
      }
    } catch (err) {
      console.error('Create medicine error:', err);
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || trans.medicineAdd.messages.addError);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      // Handle nested objects like storage_conditions.temperature
      const [parent, child] = field.split('.');

      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
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
            <AddIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {trans.medicineAdd.title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {trans.medicineAdd.subtitle}
            </Typography>
          </Box>
        </Box>
        <Tooltip title={trans.medicineAdd.close}>
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
        {error && (
          <Alert severity="error" sx={{ m: 3, mb: 0 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ p: 3 }}>
          {/* Basic Information Section */}
          <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                <MedicationIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {trans.medicineAdd.basicInfo.title}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {/* Medicine Name */}
                <Grid item sx={12} md={6}>
                  <TextField
                    fullWidth
                    label={trans.medicineAdd.basicInfo.medicineName + ' *'}
                    value={formData.medicine_name}
                    onChange={(e) => handleInputChange('medicine_name', e.target.value)}
                    error={!!errors.medicine_name}
                    helperText={errors.medicine_name}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: <MedicationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                {/* Unit of Measure */}
                <Grid item sx={12} md={6}>
                  <TextField
                    fullWidth
                    label={trans.medicineAdd.basicInfo.unitOfMeasure + ' *'}
                    value={formData.unit_of_measure}
                    onChange={(e) => handleInputChange('unit_of_measure', e.target.value)}
                    error={!!errors.unit_of_measure}
                    helperText={errors.unit_of_measure}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: <InventoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                {/* Category */}
                <Grid item sx={12} md={6}>
                  <FormControl fullWidth error={!!errors.category} size="medium" sx={{ maxWidth: 220 }}>
                    <InputLabel>{trans.medicineAdd.basicInfo.category + ' *'}</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      label={trans.medicineAdd.basicInfo.category + ' *'}
                      startAdornment={<CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                      MenuProps={{ variant: 'menu' }}
                      sx={{
                        width: 220
                      }}
                    >
                      {filterOptions.category.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
                  </FormControl>
                </Grid>

                {/* License Code */}
                <Grid item sx={12} md={6}>
                  <TextField
                    fullWidth
                    label={trans.medicineAdd.basicInfo.licenseCode + ' *'}
                    value={formData.license_code}
                    onChange={(e) => handleInputChange('license_code', e.target.value)}
                    error={!!errors.license_code}
                    helperText={errors.license_code}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
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
                  {trans.medicineAdd.storageConditions.title} ({trans.medicineAdd.optional})
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={trans.medicineAdd.storageConditions.temperature}
                    placeholder={trans.medicineAdd.storageConditions.temperaturePlaceholder}
                    value={formData.storage_conditions.temperature}
                    onChange={(e) => handleInputChange('storage_conditions.temperature', e.target.value)}
                    error={!!errors.storage_conditions?.temperature}
                    helperText={errors.storage_conditions?.temperature || trans.medicineAdd.storageConditions.temperatureHelper}
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
                    label={trans.medicineAdd.storageConditions.humidity}
                    placeholder={trans.medicineAdd.storageConditions.humidityPlaceholder}
                    value={formData.storage_conditions.humidity}
                    onChange={(e) => handleInputChange('storage_conditions.humidity', e.target.value)}
                    error={!!errors.storage_conditions?.humidity}
                    helperText={errors.storage_conditions?.humidity || trans.medicineAdd.storageConditions.humidityHelper}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: <StorageIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth error={!!errors.storage_conditions?.light} size="medium" sx={{ minWidth: '210px' }}>
                    <InputLabel>{trans.medicineAdd.storageConditions.light}</InputLabel>
                    <Select
                      value={formData.storage_conditions.light}
                      onChange={(e) => handleInputChange('storage_conditions.light', e.target.value)}
                      label={trans.medicineAdd.storageConditions.light}
                      startAdornment={<StorageIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                    >
                      <MenuItem value="">{trans.medicineAdd.storageConditions.notSelected}</MenuItem>
                      <MenuItem value="none">{trans.medicineAdd.storageConditions.lightOptions.none}</MenuItem>
                      <MenuItem value="low">{trans.medicineAdd.storageConditions.lightOptions.low}</MenuItem>
                      <MenuItem value="medium">{trans.medicineAdd.storageConditions.lightOptions.medium}</MenuItem>
                      <MenuItem value="high">{trans.medicineAdd.storageConditions.lightOptions.high}</MenuItem>
                    </Select>
                    {errors.storage_conditions?.light && <FormHelperText>{errors.storage_conditions.light}</FormHelperText>}
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Stock Management Section */}
          <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                <SettingsIcon sx={{ color: 'secondary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                  {trans.medicineAdd.stockManagement.title}
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {/* Min Stock Threshold */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={trans.medicineAdd.stockManagement.minThreshold}
                    type="number"
                    value={formData.min_stock_threshold}
                    onChange={(e) => handleInputChange('min_stock_threshold', e.target.value)}
                    error={!!errors.min_stock_threshold}
                    helperText={errors.min_stock_threshold || trans.medicineAdd.stockManagement.minThresholdHelper}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      inputProps: { min: 0 },
                      startAdornment: <InventoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                {/* Max Stock Threshold */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={trans.medicineAdd.stockManagement.maxThreshold}
                    type="number"
                    value={formData.max_stock_threshold}
                    onChange={(e) => handleInputChange('max_stock_threshold', e.target.value)}
                    error={!!errors.max_stock_threshold}
                    helperText={errors.max_stock_threshold || trans.medicineAdd.stockManagement.maxThresholdHelper}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      inputProps: { min: 0 },
                      startAdornment: <InventoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
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
              <strong>{trans.medicineAdd.requiredFieldsNote.title}:</strong> {trans.medicineAdd.requiredFieldsNote.description}
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
          {trans.medicineAdd.actions.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<AddIcon />}
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
          {loading ? trans.medicineAdd.actions.adding : trans.medicineAdd.actions.add}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MedicineAddDialog;
