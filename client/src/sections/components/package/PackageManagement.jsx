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
  Button,
  Alert
} from '@mui/material';
import { Visibility as VisibilityIcon, Edit as EditIcon, FilterList as FilterIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useRole } from '@/contexts/RoleContext';
import axios from 'axios';
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
        page: page + 1,
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
      enqueueSnackbar('Lỗi khi tải danh sách packages', { variant: 'error' });
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
    enqueueSnackbar('Cập nhật vị trí thành công', { variant: 'success' });
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

  // Handle filter change
  const handleFilterChange = () => {
    setPage(0);
    fetchPackages();
  };

  // Effect to fetch data
  useEffect(() => {
    fetchMedicines();
    fetchAreas();
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [page, rowsPerPage]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          {userRole === 'supervisor' ? 'Quản Lý Package' : 'Xem Package'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {userRole === 'supervisor' ? 'Quản lý danh sách các package và vị trí lưu trữ' : 'Xem danh sách các package và vị trí lưu trữ'}
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <FilterIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Bộ Lọc Tìm Kiếm
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Thuốc</InputLabel>
              <Select value={filterMedicineId} label="Thuốc" onChange={(e) => setFilterMedicineId(e.target.value)} size="small">
                <MenuItem value="">Tất cả</MenuItem>
                {medicines.map((medicine) => (
                  <MenuItem key={medicine._id} value={medicine._id}>
                    {medicine.medicine_name + ' - ' + medicine.license_code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Khu vực</InputLabel>
              <Select value={filterAreaId} label="Khu vực" onChange={(e) => setFilterAreaId(e.target.value)} size="small">
                <MenuItem value="">Tất cả</MenuItem>
                {areas.map((area) => (
                  <MenuItem key={area._id} value={area._id}>
                    {area.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button size="small" variant="contained" onClick={handleFilterChange} sx={{ minWidth: 100 }}>
              Lọc
            </Button>

            <Button size="small" variant="outlined" onClick={handleRefresh} startIcon={<RefreshIcon />}>
              Làm mới
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>ID Package</TableCell>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>Vị Trí</TableCell>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>Mã License</TableCell>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>Tên Thuốc</TableCell>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>Số Lượng</TableCell>
            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>Thao Tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography>Đang tải...</Typography>
              </TableCell>
            </TableRow>
          ) : packages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography>Không có dữ liệu</Typography>
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
                    <Tooltip title="Xem chi tiết">
                      <IconButton size="small" onClick={() => handleViewDetail(pkg)} color="primary">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    {userRole === 'supervisor' && (
                      <Tooltip title="Cập nhật vị trí">
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

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Số hàng mỗi trang:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`}
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
