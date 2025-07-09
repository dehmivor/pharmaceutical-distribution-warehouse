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
  Settings as SettingsIcon
} from '@mui/icons-material';

const MedicineEditDialog = ({ open, onClose, medicine, onSubmit, categoryOptions }) => {
  const [formValues, setFormValues] = useState({
    medicine_name: '',
    license_code: '',
    category: '',
    unit_of_measure: '',
    min_stock_threshold: '',
    max_stock_threshold: '',
    storage_conditions: {
      temperature: '',
      humidity: '',
      light: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (medicine) {
      setFormValues({
        ...medicine,
        min_stock_threshold: medicine.min_stock_threshold || '',
        max_stock_threshold: medicine.max_stock_threshold || '',
        storage_conditions: {
          temperature: medicine.storage_conditions?.temperature || '',
          humidity: medicine.storage_conditions?.humidity || '',
          light: medicine.storage_conditions?.light || ''
        }
      });
      setErrors({});
    }
  }, [medicine]);

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
      newErrors.medicine_name = 'Tên thuốc là bắt buộc';
    }

    if (!formValues.license_code.trim()) {
      newErrors.license_code = 'Mã thuốc là bắt buộc';
    }

    if (!formValues.category) {
      newErrors.category = 'Danh mục là bắt buộc';
    }

    if (!formValues.unit_of_measure) {
      newErrors.unit_of_measure = 'Đơn vị đo là bắt buộc';
    }

    // Storage conditions validation (optional)
    if (formValues.storage_conditions.temperature.trim()) {
      if (!/^\d+-\d+°C$|^-\d+°C$|^\d+°C$/.test(formValues.storage_conditions.temperature)) {
        newErrors.storage_conditions = {
          ...newErrors.storage_conditions,
          temperature: 'Nhiệt độ phải có định dạng "X-Y°C", "-X°C" hoặc "X°C"'
        };
      }
    }

    if (formValues.storage_conditions.humidity.trim()) {
      if (!/^\d+%$|^\d+-\d+%$/.test(formValues.storage_conditions.humidity)) {
        newErrors.storage_conditions = { ...newErrors.storage_conditions, humidity: 'Độ ẩm phải có định dạng "X%" hoặc "X-Y%"' };
      }
    }

    // Numeric validation
    if (formValues.min_stock_threshold !== '' && isNaN(formValues.min_stock_threshold)) {
      newErrors.min_stock_threshold = 'Ngưỡng tối thiểu phải là số';
    }

    if (formValues.max_stock_threshold !== '' && isNaN(formValues.max_stock_threshold)) {
      newErrors.max_stock_threshold = 'Ngưỡng tối đa phải là số';
    }

    // Threshold validation
    if (formValues.min_stock_threshold !== '' && parseFloat(formValues.min_stock_threshold) < 0) {
      newErrors.min_stock_threshold = 'Ngưỡng tối thiểu không được âm';
    }

    if (formValues.max_stock_threshold !== '' && parseFloat(formValues.max_stock_threshold) < 0) {
      newErrors.max_stock_threshold = 'Ngưỡng tối đa không được âm';
    }

    if (
      formValues.min_stock_threshold !== '' &&
      formValues.max_stock_threshold !== '' &&
      parseFloat(formValues.max_stock_threshold) < parseFloat(formValues.min_stock_threshold)
    ) {
      newErrors.max_stock_threshold = 'Ngưỡng tối đa phải lớn hơn hoặc bằng ngưỡng tối thiểu';
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
        ...formValues,
        min_stock_threshold: formValues.min_stock_threshold ? parseFloat(formValues.min_stock_threshold) : 0,
        max_stock_threshold: formValues.max_stock_threshold ? parseFloat(formValues.max_stock_threshold) : 0,
        storage_conditions: Object.keys(storageConditions).length > 0 ? storageConditions : null
      };

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
              Cập Nhật Thuốc
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Chỉnh sửa thông tin thuốc
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Đóng">
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
          {/* Basic Information Section */}
          <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                <MedicationIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Thông Tin Cơ Bản
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tên thuốc *"
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
                    label="Số đăng ký *"
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
                    <InputLabel>Danh mục *</InputLabel>
                    <Select
                      value={formValues.category}
                      label="Danh mục *"
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
                    label="Đơn vị đo *"
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
                  Điều Kiện Bảo Quản (Tùy chọn)
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Nhiệt độ"
                    placeholder="VD: 2-8°C hoặc -20°C"
                    value={formValues.storage_conditions.temperature}
                    onChange={(e) => handleStorageChange('temperature', e.target.value)}
                    error={!!errors.storage_conditions?.temperature}
                    helperText={errors.storage_conditions?.temperature || 'Định dạng: X-Y°C, -X°C hoặc X°C (không bắt buộc)'}
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
                    label="Độ ẩm"
                    placeholder="VD: 60% hoặc 50-70%"
                    value={formValues.storage_conditions.humidity}
                    onChange={(e) => handleStorageChange('humidity', e.target.value)}
                    error={!!errors.storage_conditions?.humidity}
                    helperText={errors.storage_conditions?.humidity || 'Định dạng: X% hoặc X-Y% (không bắt buộc)'}
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: <StorageIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth error={!!errors.storage_conditions?.light} size="medium">
                    <InputLabel>Điều kiện ánh sáng</InputLabel>
                    <Select
                      value={formValues.storage_conditions.light}
                      label="Điều kiện ánh sáng"
                      onChange={(e) => handleStorageChange('light', e.target.value)}
                      startAdornment={<StorageIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                    >
                      <MenuItem value="">Không chọn</MenuItem>
                      <MenuItem value="none">Không ánh sáng</MenuItem>
                      <MenuItem value="low">Ánh sáng yếu</MenuItem>
                      <MenuItem value="medium">Ánh sáng trung bình</MenuItem>
                      <MenuItem value="high">Ánh sáng mạnh</MenuItem>
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
                  Quản Lý Tồn Kho
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Ngưỡng tồn kho tối thiểu"
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
                    label="Ngưỡng tồn kho tối đa"
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
              <strong>Lưu ý:</strong> Các trường có dấu * là bắt buộc phải nhập.
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
          Hủy
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
          {loading ? 'Đang cập nhật...' : 'Cập nhật'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MedicineEditDialog;
