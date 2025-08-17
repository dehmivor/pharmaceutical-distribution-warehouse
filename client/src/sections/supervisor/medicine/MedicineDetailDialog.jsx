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
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as ViewIcon,
  Medication as MedicationIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
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

const InfoField = ({ label, value, icon: Icon }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
      {Icon && <Icon sx={{ fontSize: 20, color: 'text.secondary' }} />}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
    <Box
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        padding: '8px 12px',
        backgroundColor: '#fafafa',
        minHeight: 40,
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Typography noWrap title={value || ''} variant="body2" sx={{ color: 'text.primary' }}>
        {value || '—'}
      </Typography>
    </Box>
  </Box>
);

const MedicineDetailDialog = ({ open, onClose, medicineId }) => {
  const trans = useTrans();
  const [medicine, setMedicine] = useState(null);
  const [amountInfo, setAmountInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        setMedicine(response.data.data.medicine);
        setAmountInfo(response.data.data.amount_info);
        setError('');
      }
    } catch (error) {
      console.error('Error fetching medicine data:', error);
      setError(trans.medicineManagement.messages.loadDetailError);
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
            <ViewIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {trans.medicineDetail.title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {trans.medicineDetail.subtitle}
            </Typography>
          </Box>
        </Box>
        <Tooltip title={trans.medicineDetail.close}>
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
              <Typography>{trans.medicineDetail.loading}</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {!loading && medicine && (
            <>
              {/* Basic Information Section */}
              <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                    <MedicationIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {trans.medicineDetail.basicInfo.title}
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <InfoField label={trans.medicineDetail.basicInfo.medicineName} value={medicine.medicine_name} icon={MedicationIcon} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <InfoField label={trans.medicineDetail.basicInfo.licenseCode} value={medicine.license_code} icon={CategoryIcon} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <InfoField label={trans.medicineDetail.basicInfo.category} value={medicine.category} icon={CategoryIcon} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <InfoField
                        label={trans.medicineDetail.basicInfo.unitOfMeasure}
                        value={medicine.unit_of_measure}
                        icon={InventoryIcon}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <InfoField
                        label={trans.medicineDetail.basicInfo.status}
                        value={
                          medicine.status === 'active' ? trans.medicineManagement.filters.active : trans.medicineManagement.filters.inactive
                        }
                        icon={SettingsIcon}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <InfoField
                        label={trans.medicineDetail.basicInfo.stockQuantity}
                        value={amountInfo ? `${amountInfo.total_amount} ${medicine.unit_of_measure}` : '—'}
                        icon={InventoryIcon}
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
                      {trans.medicineDetail.storageConditions.title}
                    </Typography>
                  </Box>

                  {medicine.storage_conditions ? (
                    <Grid container spacing={3}>
                      {Object.entries(medicine.storage_conditions)
                        .filter(([_, value]) => value !== undefined && value !== '')
                        .map(([key, value]) => (
                          <Grid item xs={12} md={4} key={key}>
                            <InfoField
                              label={trans.medicineDetail.storageConditions[key]}
                              value={key === 'light' ? trans.medicineDetail.storageConditions.lightOptions[value] || value : value}
                              icon={StorageIcon}
                            />
                          </Grid>
                        ))}
                    </Grid>
                  ) : (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        border: '1px dashed #ccc',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        {trans.medicineDetail.storageConditions.noInfo}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Stock Management Section */}
              <Card sx={{ border: '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                    <SettingsIcon sx={{ color: 'secondary.main', fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                      {trans.medicineDetail.stockManagement.title}
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <InfoField
                        label={trans.medicineDetail.stockManagement.minThreshold}
                        value={medicine.min_stock_threshold !== undefined ? medicine.min_stock_threshold : '—'}
                        icon={InventoryIcon}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <InfoField
                        label={trans.medicineDetail.stockManagement.maxThreshold}
                        value={medicine.max_stock_threshold !== undefined ? medicine.max_stock_threshold : '—'}
                        icon={InventoryIcon}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </>
          )}
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
          variant="contained"
          sx={{
            px: 3,
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
          {trans.medicineDetail.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MedicineDetailDialog;
