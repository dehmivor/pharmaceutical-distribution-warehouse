'use client';

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
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Chip
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Edit as EditIcon, 
  Save as SaveIcon,
  Cancel as CancelIcon,
  Info as InfoIcon
} from '@mui/icons-material';
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

const AreaDetailDialog = ({ open, onClose, area, onSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
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

  useEffect(() => {
    if (area) {
      setFormData({
        name: area.name || '',
        storage_conditions: {
          temperature: area.storage_conditions?.temperature || '',
          humidity: area.storage_conditions?.humidity || '',
          light: area.storage_conditions?.light || ''
        },
        description: area.description || ''
      });
      setIsEditing(false);
      setErrors({});
    }
  }, [area]);

  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Tên khu vực là bắt buộc';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Tên khu vực không được quá 100 ký tự';
    }

    // Validate temperature format
    if (formData.storage_conditions.temperature && 
        !/^\d+-\d+$|^-\d+$|^\d+$/.test(formData.storage_conditions.temperature)) {
      newErrors.temperature = 'Nhiệt độ phải có định dạng "X-Y", "-X", hoặc "X" (chỉ số)';
    }

    // Validate humidity format
    if (formData.storage_conditions.humidity && 
        !/^\d+$|^\d+-\d+$/.test(formData.storage_conditions.humidity)) {
      newErrors.humidity = 'Độ ẩm phải có định dạng "X" hoặc "X-Y" (chỉ số)';
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

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.put(`/api/areas/${area._id}`, formData, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        enqueueSnackbar('Cập nhật khu vực thành công', { variant: 'success' });
        setIsEditing(false);
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating area:', error);
      const errorMessage = error.response?.data?.message || 'Không thể cập nhật khu vực';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: area.name || '',
      storage_conditions: {
        temperature: area.storage_conditions?.temperature || '',
        humidity: area.storage_conditions?.humidity || '',
        light: area.storage_conditions?.light || ''
      },
      description: area.description || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleClose = () => {
    setIsEditing(false);
    setErrors({});
    setLoading(false);
    onClose();
  };

  const getLightColor = (light) => {
    switch (light) {
      case 'none': return 'default';
      case 'low': return 'warning';
      case 'medium': return 'info';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getLightLabel = (light) => {
    switch (light) {
      case 'none': return 'none';
      case 'low': return 'low';
      case 'medium': return 'medium';
      case 'high': return 'high';
      default: return 'Không xác định';
    }
  };

  if (!area) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '70vh'
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
          <InfoIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {isEditing ? 'Chỉnh Sửa Khu Vực' : 'Chi Tiết Khu Vực'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isEditing && (
            <IconButton onClick={() => setIsEditing(true)} sx={{ color: 'white' }}>
              <EditIcon />
            </IconButton>
          )}
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Information */}
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Thông Tin Cơ Bản
              </Typography>
              
              {isEditing ? (
                <TextField
                  fullWidth
                  label="Tên Khu Vực *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                />
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Tên Khu Vực
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {area.name}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Storage Conditions */}
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Điều Kiện Bảo Quản
              </Typography>
              
              {isEditing ? (
                <>
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
                </>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Nhiệt Độ
                    </Typography>
                    <Typography variant="body1">
                      {area.storage_conditions?.temperature ? `${area.storage_conditions.temperature}°C` : 'Không xác định'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Độ Ẩm
                    </Typography>
                    <Typography variant="body1">
                      {area.storage_conditions?.humidity ? `${area.storage_conditions.humidity}%` : 'Không xác định'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Ánh Sáng
                    </Typography>
                    {area.storage_conditions?.light ? (
                      <Chip
                        label={getLightLabel(area.storage_conditions.light)}
                        color={getLightColor(area.storage_conditions.light)}
                        size="small"
                      />
                    ) : (
                      <Typography variant="body1">Không xác định</Typography>
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Mô Tả
              </Typography>
              
              {isEditing ? (
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
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Mô Tả
                  </Typography>
                  <Typography variant="body1">
                    {area.description || 'Không có mô tả'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {isEditing ? (
          <>
            <Button onClick={handleCancel} disabled={loading}>
              <CancelIcon sx={{ mr: 1 }} />
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={20} /> : (
                <>
                  <SaveIcon sx={{ mr: 1 }} />
                  Lưu Thay Đổi
                </>
              )}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose}>
            Đóng
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AreaDetailDialog; 