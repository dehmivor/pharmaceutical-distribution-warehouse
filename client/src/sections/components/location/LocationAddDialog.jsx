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
  Grid,
  Typography,
  Box
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('auth-token')}`
});
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const LocationAddDialog = ({ open, onClose, onSuccess }) => {
  const trans = useTrans();
  const { enqueueSnackbar } = useSnackbar();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    area_id: '',
    bay: '',
    row: '',
    column: ''
  });
  const [errors, setErrors] = useState({});

  // Fetch areas for dropdown
  const fetchAreas = async () => {
    try {
      const response = await axiosInstance.get('/api/areas', {
        headers: getAuthHeaders(),
        params: { page: 1, limit: 1000 }
      });
      if (response.data.success) {
        setAreas(response.data.data.areas);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.area_id) {
      newErrors.area_id = trans.common.areaRequired;
    }

    if (!formData.bay) {
      newErrors.bay = trans.common.bayRequired;
    } else if (formData.bay.length > 50) {
      newErrors.bay = trans.common.bayTooLong;
    }

    if (!formData.row) {
      newErrors.row = trans.common.rowRequired;
    } else if (formData.row.length > 50) {
      newErrors.row = trans.common.rowTooLong;
    }

    if (!formData.column) {
      newErrors.column = trans.common.columnRequired;
    } else if (formData.column.length > 50) {
      newErrors.column = trans.common.columnTooLong;
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
    try {
      const response = await axiosInstance.post('/api/locations/v2', formData, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        enqueueSnackbar(response.data.message, { variant: 'success' });
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || trans.common.cannotCreateLocation;
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    setFormData({
      area_id: '',
      bay: '',
      row: '',
      column: ''
    });
    setErrors({});
    onClose();
  };

  useEffect(() => {
    if (open) {
      fetchAreas();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {trans.common.addNewLocation}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.area_id} sx={{ minWidth: 100 }}>
              <InputLabel>{trans.common.areaRequired}</InputLabel>
              <Select
                value={formData.area_id}
                onChange={(e) => handleInputChange('area_id', e.target.value)}
                label={trans.common.areaRequired}
              >
                {areas.map((area) => (
                  <MenuItem key={area._id} value={area._id}>
                    {area.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.area_id && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.area_id}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={trans.common.bayRequired}
              value={formData.bay}
              onChange={(e) => handleInputChange('bay', e.target.value)}
              error={!!errors.bay}
              helperText={errors.bay}
              placeholder="VD: A1"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={trans.common.rowRequired}
              value={formData.row}
              onChange={(e) => handleInputChange('row', e.target.value)}
              error={!!errors.row}
              helperText={errors.row}
              placeholder="VD: 01"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={trans.common.columnRequired}
              value={formData.column}
              onChange={(e) => handleInputChange('column', e.target.value)}
              error={!!errors.column}
              helperText={errors.column}
              placeholder="VD: 01"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {trans.common.cancel}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading} startIcon={<AddIcon />}>
          {loading ? trans.common.creating : trans.common.createLocation}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationAddDialog;
