"use client";

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
  ToggleButtonGroup,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Inventory as InventoryIcon,
  LocalShipping as PackageIcon,
  ViewList as ViewListIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
});
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const LocationDetailDialog = ({ open, onClose, location }) => {
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
      enqueueSnackbar(error.response?.data?.message || 'Không thể tải thông tin vị trí', { variant: 'error' });
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
            Chi Tiết Vị Trí
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
                  Thông Tin Vị Trí
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Khu vực
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {location.area_id?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Trạng thái
                    </Typography>
                    <Chip
                      label={location.available ? 'Có sẵn' : 'Không có sẵn'}
                      color={location.available ? 'success' : 'error'}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Bay
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {location.bay}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Row
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {location.row}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Column
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
                    Thuốc Được Lưu Trữ
                  </Typography>
                </Box>

                {locationInfo ? (
                  <>
                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <PackageIcon fontSize="small" />
                         <Typography variant="body2" color="text.secondary">
                           {viewMode === 'package' 
                             ? `Tổng số các thùng: ${locationInfo.total_packages}`
                             : `Tổng số loại thuốc: ${locationInfo.medicine_summary.length}`
                           }
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
                           View by Package
                         </ToggleButton>
                         <ToggleButton value="medicine" aria-label="view by medicine">
                           <CategoryIcon sx={{ mr: 1 }} />
                           View by Medicine
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
                                   <TableCell>Mã thùng</TableCell>
                                   <TableCell>Mã lô</TableCell>
                                   <TableCell>Mã thuốc</TableCell>
                                   <TableCell align="right">Số lượng</TableCell>
                                 </>
                               ) : (
                                 <>
                                   <TableCell>Mã thuốc</TableCell>
                                   <TableCell align="right">Số lượng</TableCell>
                                 </>
                               )}
                             </TableRow>
                           </TableHead>
                           <TableBody>
                             {viewMode === 'package' ? (
                               // Package view
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
                             ) : (
                               // Medicine view
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
                               ))
                             )}
                           </TableBody>
                         </Table>
                       </TableContainer>
                     ) : (
                       <Box sx={{ textAlign: 'center', py: 4 }}>
                         <Typography variant="body1" color="text.secondary">
                           Không có thuốc nào được lưu trữ tại vị trí này
                         </Typography>
                       </Box>
                     )}
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Đang tải thông tin...
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationDetailDialog; 