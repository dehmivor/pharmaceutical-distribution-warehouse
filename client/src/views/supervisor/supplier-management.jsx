'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Chip,
  Alert,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Refresh,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

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

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    name: '',
    status: ''
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    status: ['active', 'inactive', 'pending']
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    license: '',
    status: 'active'
  });

  // Validation states
  const [errors, setErrors] = useState({});

  // Phone number validation function
  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // Allow empty phone
    const phoneRegex = /^\+84 \d{2} \d{4} \d{4}$/;
    return phoneRegex.test(phone);
  };

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Remove all non-digits and non-plus
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // If starts with +84, format accordingly
    if (cleaned.startsWith('+84')) {
      const digits = cleaned.replace('+84', '').replace(/\D/g, '');
      
      // Limit to 10 digits after +84
      if (digits.length > 10) return value;
      
      // Format as +84 XX XXXX XXXX
      if (digits.length <= 2) return `+84 ${digits}`;
      if (digits.length <= 6) return `+84 ${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `+84 ${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
    } else {
      // If doesn't start with +84, add it
      const digits = cleaned.replace(/\D/g, '');
      
      // Limit to 10 digits
      if (digits.length > 10) return value;
      
      // Format as +84 XX XXXX XXXX
      if (digits.length <= 2) return `+84 ${digits}`;
      if (digits.length <= 6) return `+84 ${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `+84 ${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tên nhà cung cấp là bắt buộc';
    }
    
    if (!formData.license.trim()) {
      newErrors.license = 'Số giấy phép là bắt buộc';
    }
    
    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải có định dạng: +84 28 3999 1111';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch suppliers
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      });

      const response = await axiosInstance.get(`/api/supplier/management?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setSuppliers(response.data.data.suppliers);
        setTotalCount(response.data.data.pagination.total);
      }
    } catch (error) {
      setError('Lỗi khi tải danh sách nhà cung cấp');
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0); // Reset về trang đầu khi filter
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      active: 'success',
      inactive: 'error',
      pending: 'warning'
    };
    return statusColors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      active: 'Hoạt động',
      inactive: 'Không hoạt động',
      pending: 'Chờ duyệt'
    };
    return statusLabels[status] || status;
  };

  const handleViewDetail = (supplier) => {
    setSelectedSupplier(supplier);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedSupplier(null);
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      address: '',
      phone: '',
      license: '',
      status: 'active'
    });
    setErrors({});
    setOpenFormDialog(true);
  };

  const handleEdit = (supplier) => {
    setIsEditing(true);
    setFormData({
      name: supplier.name,
      address: supplier.address || '',
      phone: supplier.phone || '',
      license: supplier.license,
      status: supplier.status
    });
    setSelectedSupplier(supplier);
    setErrors({});
    setOpenFormDialog(true);
  };

  const handleCloseFormDialog = () => {
    setOpenFormDialog(false);
    setSelectedSupplier(null);
    setIsEditing(false);
    setErrors({});
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing) {
        const response = await axiosInstance.put(`/api/supplier/${selectedSupplier._id}`, formData, {
          headers: getAuthHeaders()
        });
        if (response.data.success) {
          setSuccess('Cập nhật nhà cung cấp thành công');
          handleCloseFormDialog();
          fetchSuppliers();
        }
      } else {
        const response = await axiosInstance.post('/api/supplier', formData, {
          headers: getAuthHeaders()
        });
        if (response.data.success) {
          setSuccess('Thêm nhà cung cấp thành công');
          handleCloseFormDialog();
          fetchSuppliers();
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra');
      console.error('Error submitting form:', error);
    }
  };

  const handleDelete = async (supplier) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) {
      try {
        const response = await axiosInstance.delete(`/api/supplier/${supplier._id}`, {
          headers: getAuthHeaders()
        });
        if (response.data.success) {
          setSuccess('Xóa nhà cung cấp thành công');
          fetchSuppliers();
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa');
        console.error('Error deleting supplier:', error);
      }
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page, rowsPerPage, filters]);

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Quản lý Nhà cung cấp
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Thêm, sửa, xóa và quản lý thông tin nhà cung cấp
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddNew}
        >
          Thêm mới
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tên nhà cung cấp"
                value={filters.name || ''}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Trạng thái"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  sx={{ minWidth: '140px' }}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {filterOptions.status?.map((status) => (
                    <MenuItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchSuppliers} disabled={loading} fullWidth>
                Làm mới
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Tên nhà cung cấp</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Địa chỉ</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Số điện thoại</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Số giấy phép</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier._id} hover>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.address || 'N/A'}</TableCell>
                    <TableCell>{supplier.phone || 'N/A'}</TableCell>
                    <TableCell>{supplier.license}</TableCell>
                    <TableCell>
                      <Chip label={getStatusLabel(supplier.status)} color={getStatusColor(supplier.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Xem chi tiết">
                        <IconButton size="small" color="primary" onClick={() => handleViewDetail(supplier)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sửa">
                        <IconButton size="small" color="warning" onClick={() => handleEdit(supplier)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton size="small" color="error" onClick={() => handleDelete(supplier)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`}
        />
      </Paper>

      {/* Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết nhà cung cấp</DialogTitle>
        <DialogContent>
          {selectedSupplier && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Tên nhà cung cấp</Typography>
                <Typography variant="body1">{selectedSupplier.name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Trạng thái</Typography>
                <Chip label={getStatusLabel(selectedSupplier.status)} color={getStatusColor(selectedSupplier.status)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Địa chỉ</Typography>
                <Typography variant="body1">{selectedSupplier.address || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Số điện thoại</Typography>
                <Typography variant="body1">{selectedSupplier.phone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Số giấy phép</Typography>
                <Typography variant="body1">{selectedSupplier.license}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={openFormDialog} onClose={handleCloseFormDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tên nhà cung cấp"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={formData.status}
                  label="Trạng thái"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  sx={{ minWidth: '140px' }}
                >
                  <MenuItem value="active">Hoạt động</MenuItem>
                  <MenuItem value="inactive">Không hoạt động</MenuItem>
                  <MenuItem value="pending">Chờ duyệt</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Địa chỉ"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Số điện thoại (VD: +84 28 3999 1111)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                error={!!errors.phone}
                helperText={errors.phone || 'Định dạng: +84 XX XXXX XXXX'}
                placeholder="+84 28 3999 1111"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Số giấy phép"
                value={formData.license}
                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                error={!!errors.license}
                helperText={errors.license}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog}>Hủy</Button>
          <Button onClick={handleFormSubmit} variant="contained">
            {isEditing ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierManagement;
