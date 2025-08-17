'use client';

import React, { useState, useEffect, Fragment } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Inventory as InventoryIcon,
  LocalShipping as PackageIcon,
  ViewList as ViewListIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
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

const LocationDetailDialog = ({ open, onClose, location }) => {
  const trans = useTrans();
  const { enqueueSnackbar } = useSnackbar();
  const [locationInfo, setLocationInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('package'); // 'package' or 'medicine'

  const fetchLocationInfo = async () => {
    if (!location?._id) return;

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/locations/v2/${location._id}/info`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setLocationInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching location info:', error);
      enqueueSnackbar(error.response?.data?.message || trans.common.cannotLoadLocationInfo, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && location) {
      fetchLocationInfo();
    }
  }, [open, location]);

  const handleClose = () => {
    setLocationInfo(null);
    onClose();
  };

  if (!location) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {trans.common.locationDetails}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Location Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  {trans.common.locationInfo}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      {trans.common.area}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {location.area_id?.name || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      {trans.common.status}
                    </Typography>
                    <Chip
                      label={location.available ? trans.common.available : trans.common.notAvailable}
                      color={location.available ? 'success' : 'error'}
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      {trans.common.bay}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {location.bay}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      {trans.common.row}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {location.row}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      {trans.common.column}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {location.column}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Medicine Inventory */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InventoryIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {trans.common.medicineStored}
                  </Typography>
                </Box>

                {locationInfo ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PackageIcon fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          {viewMode === 'package'
                            ? trans.common.totalPackages.replace('{count}', locationInfo.total_packages)
                            : trans.common.totalMedicineTypes.replace('{count}', locationInfo.medicine_summary.length)}
                        </Typography>
                      </Box>

                      <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(e, newMode) => {
                          if (newMode !== null) {
                            setViewMode(newMode);
                          }
                        }}
                        size="small"
                      >
                        <ToggleButton value="package" aria-label="view by package">
                          <ViewListIcon sx={{ mr: 1 }} />
                          {trans.common.viewByPackage}
                        </ToggleButton>
                        <ToggleButton value="medicine" aria-label="view by medicine">
                          <CategoryIcon sx={{ mr: 1 }} />
                          {trans.common.viewByMedicine}
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>

                    {locationInfo.total_packages > 0 ? (
                      <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              {viewMode === 'package' ? (
                                <>
                                  <TableCell>{trans.common.packageCode}</TableCell>
                                  <TableCell>{trans.common.batchCode}</TableCell>
                                  <TableCell>{trans.common.medicineCode}</TableCell>
                                  <TableCell align="right">{trans.common.quantity}</TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell>{trans.common.medicineCode}</TableCell>
                                  <TableCell align="right">{trans.common.quantity}</TableCell>
                                </>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {viewMode === 'package'
                              ? // Package view
                                locationInfo.packages.map((pkg, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {pkg.package_id}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {pkg.batch_code}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {pkg.medicine_license_code}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {pkg.quantity.toLocaleString()}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))
                              : // Medicine view
                                locationInfo.medicine_summary.map((medicine, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {medicine.medicine_license_code}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {medicine.total_quantity.toLocaleString()}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          {trans.common.noMedicineData}
                        </Typography>
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {trans.common.loadingInfo}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>{trans.common.close}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationDetailDialog;
