'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  TextField
} from '@mui/material';
import { Close as CloseIcon, LocationOn as LocationIcon, Inventory as InventoryIcon, Save as SaveIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('auth-token')}`
});
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const PackageLocationUpdateDialog = ({ open, onClose, package: pkg, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [areas, setAreas] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch areas
  const fetchAreas = async () => {
    try {
      const response = await axiosInstance.get('/api/areas', {
        headers: getAuthHeaders(),
        params: { page: 1, limit: 1000 }
      });
      if (response.data.success) {
        setAreas(response.data.data.areas || []);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
      setError('Lỗi khi tải danh sách khu vực');
    }
  };

  // Fetch locations by area
  const fetchLocationsByArea = async (areaId) => {
    if (!areaId) {
      setLocations([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/locations/v2', {
        headers: getAuthHeaders(),
        params: {
          page: 1,
          limit: 1000,
          areaId: areaId,
          available: 'true'
        }
      });
      if (response.data.success) {
        setLocations(response.data.data.locations || []);
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Lỗi khi tải danh sách vị trí');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle area change
  const handleAreaChange = (areaId) => {
    setSelectedAreaId(areaId);
    setSelectedLocationId('');
    if (areaId) {
      fetchLocationsByArea(areaId);
    } else {
      setLocations([]);
    }
  };

  // Handle quantity change with validation
  const handleQuantityChange = (e) => {
    const value = e.target.value;
    // Only allow positive integers or empty string
    if (value === '' || (parseInt(value) >= 0 && Number.isInteger(parseFloat(value)))) {
      setNewQuantity(value);
    }
  };

  // Handle save
  const handleSave = async () => {
    // Check if there are actual changes
    if (!hasActualChanges()) {
      enqueueSnackbar('Không có thay đổi nào để cập nhật', { variant: 'warning' });
      return;
    }

    // Validate quantity
    if (newQuantity && parseInt(newQuantity) < 0) {
      enqueueSnackbar('Số lượng không được âm', { variant: 'error' });
      return;
    }

    setSaving(true);
    try {
      const updateData = {};

      if (selectedLocationId) {
        updateData.newLocationId = selectedLocationId;
      }

      if (newQuantity && parseInt(newQuantity) !== pkg.quantity) {
        updateData.quantity = parseInt(newQuantity);
      }

      const response = await axiosInstance.put(`/api/packages/v2/${pkg.full_id}`, updateData, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        enqueueSnackbar('Cập nhật thông tin package thành công', { variant: 'success' });
        onSuccess();
      } else {
        setError(response.data.message || 'Lỗi khi cập nhật thông tin package');
      }
    } catch (error) {
      console.error('Error updating package:', error);
      setError('Lỗi khi cập nhật thông tin package');
    } finally {
      setSaving(false);
    }
  };

  // Helper function to check if there are actual changes
  const hasActualChanges = () => {
    // For location change, check if selected location is different from current location
    const hasLocationChange = selectedLocationId && selectedLocationId !== pkg.location_id;

    // For quantity change, check if it's different and valid (not negative)
    const quantityValue = newQuantity ? parseInt(newQuantity) : null;
    const hasQuantityChange = quantityValue !== null && quantityValue >= 0 && quantityValue !== pkg.quantity;

    return hasLocationChange || hasQuantityChange;
  };

  // Effect to fetch areas when dialog opens
  useEffect(() => {
    if (open) {
      fetchAreas();
      setSelectedAreaId('');
      setSelectedLocationId('');
      setNewQuantity(pkg?.quantity?.toString() || '');
      setError('');
      setLocations([]);
    }
  }, [open, pkg]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'primary.main',
          color: 'white'
        }}
      >
        Cập Nhật Thông Tin Package
        <Button onClick={handleClose} sx={{ color: 'white', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Current Package Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
            Thông Tin Package Hiện Tại
          </Typography>
          <Grid container spacing={2}>
            <Grid xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InventoryIcon color="primary" />
                <Typography variant="body2" color="text.secondary">
                  ID Package:
                </Typography>
              </Box>
              <Chip label={pkg?._id} color="primary" variant="outlined" size="small" />
            </Grid>
            <Grid xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationIcon color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Vị trí hiện tại:
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {pkg?.location || 'Chưa có vị trí'}
              </Typography>
            </Grid>
            <Grid xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InventoryIcon color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Số lượng hiện tại:
                </Typography>
              </Box>
              <Chip label={pkg?.quantity || 0} color="secondary" size="small" />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Update Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
            Cập Nhật Thông Tin
          </Typography>

          <Grid container spacing={3}>
            {/* Location Selection */}
            <Grid xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
                Cập Nhật Vị Trí
              </Typography>
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <FormControl fullWidth sx={{ minWidth: 250 }}>
                    <InputLabel>Khu vực</InputLabel>
                    <Select value={selectedAreaId} label="Khu vực" onChange={(e) => handleAreaChange(e.target.value)} size="small">
                      <MenuItem value="">Chọn khu vực</MenuItem>
                      {areas.map((area) => (
                        <MenuItem key={area._id} value={area._id}>
                          {area.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid xs={12} sm={6}>
                  <FormControl fullWidth sx={{ minWidth: 250 }}>
                    <InputLabel>Vị trí</InputLabel>
                    <Select
                      value={selectedLocationId}
                      label="Vị trí"
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                      size="small"
                      disabled={!selectedAreaId || loading}
                    >
                      <MenuItem value="">Chọn vị trí</MenuItem>
                      {Array.isArray(locations) &&
                        locations.map((location) => (
                          <MenuItem key={location._id} value={location._id}>
                            {`${location.bay} - ${location.row} - ${location.column}`}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Đang tải danh sách vị trí...
                  </Typography>
                </Box>
              )}

              {selectedLocationId && Array.isArray(locations) && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'success.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                    Vị trí đã chọn: {locations.find((loc) => loc._id === selectedLocationId)?.bay} -{' '}
                    {locations.find((loc) => loc._id === selectedLocationId)?.row} -{' '}
                    {locations.find((loc) => loc._id === selectedLocationId)?.column}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Quantity Update */}
            <Grid xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
                Cập Nhật Số Lượng
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Số lượng mới"
                    type="number"
                    value={newQuantity}
                    onChange={handleQuantityChange}
                    size="small"
                    sx={{ minWidth: 200 }}
                    InputProps={{
                      inputProps: {
                        min: 0,
                        step: 1
                      }
                    }}
                    helperText="Nhập số lượng mới cho package (tối thiểu: 0)"
                    error={newQuantity && parseInt(newQuantity) < 0}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose} variant="outlined" disabled={saving}>
          Hủy
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          disabled={!hasActualChanges() || saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PackageLocationUpdateDialog;
