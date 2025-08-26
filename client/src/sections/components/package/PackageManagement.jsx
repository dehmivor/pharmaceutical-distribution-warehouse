'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Filter
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useRole } from '@/contexts/RoleContext';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';
import PackageDetailDialog from './PackageDetailDialog';
import PackageLocationUpdateDialog from './PackageLocationUpdateDialog';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('auth-token')}`
});
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const PackageManagement = () => {
  const { userRole } = useRole();
  const { enqueueSnackbar } = useSnackbar();
  const trans = useTrans();

  const [packages, setPackages] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const [filterMedicineId, setFilterMedicineId] = useState('');
  const [filterAreaId, setFilterAreaId] = useState('');

  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openLocationUpdateDialog, setOpenLocationUpdateDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Fetch medicines for filter
  const fetchMedicines = async () => {
    try {
      const response = await axiosInstance.get('/api/medicine/all/v1', {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        const medicineData = response.data.data || [];
        setMedicines(medicineData);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  // Fetch areas for filter
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

  // Fetch packages
  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1, // API pages are 1-based
        limit: rowsPerPage
      };

      if (filterMedicineId) {
        params.medicine_id = filterMedicineId;
      }
      if (filterAreaId) {
        params.area_id = filterAreaId;
      }

      const response = await axiosInstance.get('/api/packages/v2', {
        headers: getAuthHeaders(),
        params
      });

      if (response.data.success) {
        setPackages(response.data.data);
        setTotalCount(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      enqueueSnackbar(trans.common.errorLoadingPackages, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle view detail
  const handleViewDetail = (pkg) => {
    setSelectedPackage(pkg);
    setOpenDetailDialog(true);
  };

  // Handle update location
  const handleUpdateLocation = (pkg) => {
    setSelectedPackage(pkg);
    setOpenLocationUpdateDialog(true);
  };

  // Handle location update success
  const handleLocationUpdateSuccess = () => {
    setOpenLocationUpdateDialog(false);
    setSelectedPackage(null);
    fetchPackages();
    enqueueSnackbar(trans.common.locationUpdateSuccess, { variant: 'success' });
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchPackages();
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter change (button filter)
  const handleFilterChange = () => {
    setPage(0);
    fetchPackages();
  };

  // Initial fetch medicines and areas on mount
  useEffect(() => {
    fetchMedicines();
    fetchAreas();
  }, []);

  // Fetch packages when page or rowsPerPage changes
  useEffect(() => {
    fetchPackages();
  }, [page, rowsPerPage]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          {userRole === 'supervisor' ? trans.common.packageManagement : trans.viewPackage}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {userRole === 'supervisor' ? trans.common.packageListDescription : trans.viewPackageDescription}
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <FilterIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {trans.common.searchFilter}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small">
              <InputLabel>{trans.common.medicine}</InputLabel>
              <Select
                value={filterMedicineId}
                label={trans.common.medicine}
                onChange={(e) => setFilterMedicineId(e.target.value)}
                size="small"
                sx={{ width: 200 }}
              >
                <MenuItem value="">{trans.common.all}</MenuItem>
                {medicines.map((medicine) => (
                  <MenuItem key={medicine._id} value={medicine._id}>
                    {trans.medicineDisplayFormat.replace('{name}', medicine.medicine_name).replace('{license}', medicine.license_code)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 200 }}>
              <InputLabel>{trans.common.area}</InputLabel>
              <Select value={filterAreaId} label={trans.common.area} onChange={(e) => setFilterAreaId(e.target.value)} size="small">
                <MenuItem value="">{trans.common.all}</MenuItem>
                {areas.map((area) => (
                  <MenuItem key={area._id} value={area._id}>
                    {area.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button size="small" variant="contained" onClick={handleFilterChange} startIcon={<Filter />}>
              {trans.common.filter}
            </Button>

            <Button size="small" variant="outlined" onClick={handleRefresh} startIcon={<RefreshIcon />}>
              {trans.common.refresh}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>{trans.common.packageId}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>{trans.common.location}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>{trans.common.licenseCode}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                {trans.common.medicineName}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>{trans.common.quantity}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>{trans.common.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography>{trans.common.loading}</Typography>
                </TableCell>
              </TableRow>
            ) : packages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography>{trans.common.noData}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              packages.map((pkg) => (
                <TableRow key={pkg.full_id} hover>
                  <TableCell>
                    <Chip label={pkg._id} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{pkg.location}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {pkg.license_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{pkg.medicine_name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={pkg.quantity} size="small" color="secondary" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title={trans.common.viewDetails}>
                        <IconButton size="small" onClick={() => handleViewDetail(pkg)} color="primary">
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {userRole === 'supervisor' && (
                        <Tooltip title={trans.common.updateLocation}>
                          <IconButton size="small" onClick={() => handleUpdateLocation(pkg)} color="secondary">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage={trans?.common?.rowsPerPage || 'Rows per page:'}
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`}
      />

      {/* Detail Dialog */}
      {selectedPackage && (
        <PackageDetailDialog
          open={openDetailDialog}
          onClose={() => {
            setOpenDetailDialog(false);
            setSelectedPackage(null);
          }}
          package={selectedPackage}
        />
      )}

      {/* Location Update Dialog */}
      {selectedPackage && (
        <PackageLocationUpdateDialog
          open={openLocationUpdateDialog}
          onClose={() => {
            setOpenLocationUpdateDialog(false);
            setSelectedPackage(null);
          }}
          package={selectedPackage}
          onSuccess={handleLocationUpdateSuccess}
        />
      )}
    </Box>
  );
};

export default PackageManagement;
