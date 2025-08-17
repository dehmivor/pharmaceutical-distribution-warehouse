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
import { Close as CloseIcon, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon, Info as InfoIcon } from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
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

const AreaDetailDialog = ({ open, onClose, area, onSuccess }) => {
  const trans = useTrans();
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
      newErrors.name = trans.common.areaNameRequired;
    } else if (formData.name.trim().length > 100) {
      newErrors.name = trans.common.areaNameTooLong;
    }

    // Validate temperature format and logic
    if (formData.storage_conditions.temperature) {
      const tempValue = formData.storage_conditions.temperature.trim();
      if (!/^\d+-\d+$|^-\d+$|^\d+$/.test(tempValue)) {
        newErrors.temperature = trans.common.temperatureFormatError;
      } else {
        // Validate temperature range logic
        if (tempValue.includes('-')) {
          const [min, max] = tempValue.split('-').map(Number);
          if (min > max) {
            newErrors.temperature = trans.common.temperatureRangeError;
          }
        }
      }
    }

    // Validate humidity format and logic
    if (formData.storage_conditions.humidity) {
      const humidityValue = formData.storage_conditions.humidity.trim();
      if (!/^\d+$|^\d+-\d+$/.test(humidityValue)) {
        newErrors.humidity = trans.common.humidityFormatError;
      } else {
        // Validate humidity range logic
        if (humidityValue.includes('-')) {
          const [min, max] = humidityValue.split('-').map(Number);
          if (min > max) {
            newErrors.humidity = trans.common.humidityRangeError;
          }
          if (max > 100) {
            newErrors.humidity = trans.common.humidityMaxError;
          }
        } else {
          const humidity = Number(humidityValue);
          if (humidity > 100) {
            newErrors.humidity = trans.common.humidityMaxError;
          }
        }
      }
    }

    // Validate description length
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = trans.common.descriptionTooLong;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
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
      setErrors((prev) => ({ ...prev, [field]: '' }));
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
        enqueueSnackbar(trans.common.updateAreaSuccess, { variant: 'success' });
        setIsEditing(false);
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating area:', error);
      const errorMessage = error.response?.data?.message || trans.common.cannotUpdateArea;
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
      case 'none':
        return 'default';
      case 'low':
        return 'warning';
      case 'medium':
        return 'info';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  const getLightLabel = (light) => {
    switch (light) {
      case 'none':
        return trans.common.lightNone;
      case 'low':
        return trans.common.lightLow;
      case 'medium':
        return trans.common.lightMedium;
      case 'high':
        return trans.common.lightHigh;
      default:
        return trans.common.unknown;
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
            {isEditing ? trans.common.editArea : trans.common.areaDetails}
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
                {trans.common.basicInfo}
              </Typography>

              {isEditing ? (
                <TextField
                  fullWidth
                  label={trans.common.areaNameRequired}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                />
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {trans.common.areaName}
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
                {trans.common.storageConditions}
              </Typography>

              {isEditing ? (
                <>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                    <TextField
                      label={trans.common.temperature}
                      placeholder={trans.common.temperaturePlaceholder}
                      value={formData.storage_conditions.temperature}
                      onChange={(e) => handleInputChange('storage_conditions.temperature', e.target.value)}
                      error={!!errors.temperature}
                      helperText={errors.temperature}
                    />

                    <TextField
                      label={trans.common.humidity}
                      placeholder={trans.common.humidityPlaceholder}
                      value={formData.storage_conditions.humidity}
                      onChange={(e) => handleInputChange('storage_conditions.humidity', e.target.value)}
                      error={!!errors.humidity}
                      helperText={errors.humidity}
                    />
                  </Box>

                  <FormControl fullWidth>
                    <InputLabel>{trans.common.light}</InputLabel>
                    <Select
                      value={formData.storage_conditions.light}
                      onChange={(e) => handleInputChange('storage_conditions.light', e.target.value)}
                      label={trans.common.light}
                    >
                      <MenuItem value="">{trans.common.unknown}</MenuItem>
                      <MenuItem value="none">{trans.common.lightNone}</MenuItem>
                      <MenuItem value="low">{trans.common.lightLow}</MenuItem>
                      <MenuItem value="medium">{trans.common.lightMedium}</MenuItem>
                      <MenuItem value="high">{trans.common.lightHigh}</MenuItem>
                    </Select>
                  </FormControl>
                </>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {trans.common.temperature}
                    </Typography>
                    <Typography variant="body1">
                      {area.storage_conditions?.temperature ? `${area.storage_conditions.temperature}°C` : trans.common.unknown}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {trans.common.humidity}
                    </Typography>
                    <Typography variant="body1">
                      {area.storage_conditions?.humidity ? `${area.storage_conditions.humidity}%` : trans.common.unknown}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {trans.common.light}
                    </Typography>
                    {area.storage_conditions?.light ? (
                      <Chip
                        label={getLightLabel(area.storage_conditions.light)}
                        color={getLightColor(area.storage_conditions.light)}
                        size="small"
                      />
                    ) : (
                      <Typography variant="body1">{trans.common.unknown}</Typography>
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
                {trans.common.description}
              </Typography>

              {isEditing ? (
                <TextField
                  fullWidth
                  label={trans.common.description}
                  multiline
                  rows={4}
                  placeholder={trans.common.descriptionPlaceholder}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  error={!!errors.description}
                  helperText={errors.description || `${formData.description.length}/1000`}
                  inputProps={{ maxLength: 1000 }}
                />
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {trans.common.description}
                  </Typography>
                  <Typography variant="body1">{area.description || trans.common.noDescription}</Typography>
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
              {trans.common.cancel}
            </Button>
            <Button onClick={handleSave} variant="contained" disabled={loading} sx={{ borderRadius: 2 }}>
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <>
                  <SaveIcon sx={{ mr: 1 }} />
                  {trans.common.saveChanges}
                </>
              )}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose}>{trans.common.close}</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AreaDetailDialog;
