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
  Chip,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Inventory as InventoryIcon,
  Medication as MedicationIcon
} from '@mui/icons-material';
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

const PackageDetailDialog = ({ open, onClose, package: pkg }) => {
  const [packageDetail, setPackageDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch package detail
  const fetchPackageDetail = async () => {
    if (!pkg?.full_id) return;

    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get(`/api/packages/v2/${pkg.full_id}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setPackageDetail(response.data.data);
      } else {
        setError('Không thể tải thông tin chi tiết package');
      }
    } catch (error) {
      console.error('Error fetching package detail:', error);
      setError('Lỗi khi tải thông tin chi tiết package');
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch detail when dialog opens
  useEffect(() => {
    if (open && pkg) {
      fetchPackageDetail();
    }
  }, [open, pkg]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setPackageDetail(null);
      setError('');
    }
  }, [open]);

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
        Chi Tiết Package
        <Button onClick={handleClose} sx={{ color: 'white', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : packageDetail ? (
          <Box>
            {/* Package ID */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                Thông Tin Package
              </Typography>
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <InventoryIcon color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      ID Package:
                    </Typography>
                  </Box>
                  <Chip label={packageDetail._id} color="primary" variant="outlined" size="small" />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <InventoryIcon color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Số lượng:
                    </Typography>
                  </Box>
                  <Chip label={packageDetail.quantity} color="secondary" size="small" />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Medicine Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                Thông Tin Thuốc
              </Typography>
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <MedicationIcon color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Tên thuốc:
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {packageDetail.medicine_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <InventoryIcon color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Mã batch:
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {packageDetail.batch_code || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Location Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                Thông Tin Vị Trí
              </Typography>
              {packageDetail.location ? (
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationIcon color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        Khu vực:
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {packageDetail.location.area_name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationIcon color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        Bay:
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {packageDetail.location.bay || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationIcon color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        Hàng:
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {packageDetail.location.row || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationIcon color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        Cột:
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {packageDetail.location.column || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Package chưa được gán vị trí
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose} variant="contained" color="primary">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PackageDetailDialog;
