'use client';

import React, { useState } from 'react';
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
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  LinearGradient
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';

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

const AreaAddDialog = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    storage_conditions: {
      temperature: '',
      humidity: '',
      light: ''
    },
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Tên khu vực là bắt buộc';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Tên khu vực không được quá 100 ký tự';
    }

    // Validate temperature format and logic
    if (formData.storage_conditions.temperature) {
      const tempValue = formData.storage_conditions.temperature.trim();
      if (!/^\d+-\d+$|^-\d+$|^\d+$/.test(tempValue)) {
        newErrors.temperature = 'Nhiệt độ phải có định dạng "X-Y", "-X", hoặc "X" (°C)';
      } else {
        // Validate temperature range logic
        if (tempValue.includes('-')) {
          const [min, max] = tempValue.split('-').map(Number);
          if (min > max) {
            newErrors.temperature = 'Nhiệt độ tối thiểu phải nhỏ hơn hoặc bằng nhiệt độ tối đa';
          }
        }
      }
    }

    // Validate humidity format and logic
    if (formData.storage_conditions.humidity) {
      const humidityValue = formData.storage_conditions.humidity.trim();
      if (!/^\d+$|^\d+-\d+$/.test(humidityValue)) {
        newErrors.humidity = 'Độ ẩm phải có định dạng "X" hoặc "X-Y" (%)';
      } else {
        // Validate humidity range logic
        if (humidityValue.includes('-')) {
          const [min, max] = humidityValue.split('-').map(Number);
          if (min > max) {
            newErrors.humidity = 'Độ ẩm tối thiểu phải nhỏ hơn hoặc bằng độ ẩm tối đa';
          }
          if (max > 100) {
            newErrors.humidity = 'Độ ẩm tối đa không được vượt quá 100%';
          }
        } else {
          const humidity = Number(humidityValue);
          if (humidity > 100) {
            newErrors.humidity = 'Độ ẩm không được vượt quá 100%';
          }
        }
      }
    }

    // Validate description length
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Mô tả không được quá 1000 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/areas', formData, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        handleClose();
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating area:', error);
      const errorMessage = error.response?.data?.message || 'Không thể tạo khu vực';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      storage_conditions: {
        temperature: '',
        humidity: '',
        light: ''
      },
      description: ''
    });
    setErrors({});
    setLoading(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '60vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Thêm Khu Vực Mới
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Information */}
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Thông Tin Cơ Bản
              </Typography>
              
              <TextField
                fullWidth
                label="Tên Khu Vực *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>

          {/* Storage Conditions */}
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Điều Kiện Bảo Quản
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <TextField
                  label="Nhiệt Độ"
                  placeholder="VD: 2-8, -20, 25"
                  value={formData.storage_conditions.temperature}
                  onChange={(e) => handleInputChange('storage_conditions.temperature', e.target.value)}
                  error={!!errors.temperature}
                  helperText={errors.temperature}
                />
                
                <TextField
                  label="Độ Ẩm"
                  placeholder="VD: 60, 40-70"
                  value={formData.storage_conditions.humidity}
                  onChange={(e) => handleInputChange('storage_conditions.humidity', e.target.value)}
                  error={!!errors.humidity}
                  helperText={errors.humidity}
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel>Ánh Sáng</InputLabel>
                <Select
                  value={formData.storage_conditions.light}
                  onChange={(e) => handleInputChange('storage_conditions.light', e.target.value)}
                  label="Ánh Sáng"
                >
                  <MenuItem value="">Không xác định</MenuItem>
                  <MenuItem value="none">none</MenuItem>
                  <MenuItem value="low">low</MenuItem>
                  <MenuItem value="medium">medium</MenuItem>
                  <MenuItem value="high">high</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          {/* Description */}
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Mô Tả
              </Typography>
              
              <TextField
                fullWidth
                label="Mô Tả"
                multiline
                rows={4}
                placeholder="Nhập mô tả chi tiết về khu vực..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={!!errors.description}
                helperText={errors.description || `${formData.description.length}/1000`}
                inputProps={{ maxLength: 1000 }}
              />
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          {loading ? <CircularProgress size={20} /> : 'Tạo Khu Vực'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AreaAddDialog; 