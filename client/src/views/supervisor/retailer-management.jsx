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

const RetailerManagement = () => {
  const trans = useTrans();
  const [retailers, setRetailers] = useState([]);
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
  const [selectedRetailer, setSelectedRetailer] = useState(null);
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
    const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Limit to 11 digits
    if (digits.length > 11) return value;

    // Format as XXX-XXXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = trans.retailers.nameRequired;
    }

    if (!formData.license.trim()) {
      newErrors.license = trans.retailers.licenseRequired;
    }

    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      newErrors.phone = trans.retailers.phoneFormat;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch retailers
  const fetchRetailers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      });

      const response = await axiosInstance.get(`/api/retailer/management?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setRetailers(response.data.data.retailers);
        setTotalCount(response.data.data.pagination.total);
      }
    } catch (error) {
      setError(trans.retailers.errorLoading);
      console.error('Error fetching retailers:', error);
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
      active: trans.common.active,
      inactive: trans.common.inactive,
      pending: trans.common.pending
    };
    return statusLabels[status] || status;
  };

  const handleViewDetail = (retailer) => {
    setSelectedRetailer(retailer);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedRetailer(null);
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

  const handleEdit = (retailer) => {
    setIsEditing(true);
    setFormData({
      name: retailer.name,
      address: retailer.address || '',
      phone: retailer.phone || '',
      license: retailer.license,
      status: retailer.status
    });
    setSelectedRetailer(retailer);
    setErrors({});
    setOpenFormDialog(true);
  };

  const handleCloseFormDialog = () => {
    setOpenFormDialog(false);
    setSelectedRetailer(null);
    setIsEditing(false);
    setErrors({});
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing) {
        const response = await axiosInstance.put(`/api/retailer/${selectedRetailer._id}`, formData, {
          headers: getAuthHeaders()
        });
        if (response.data.success) {
          setSuccess(trans.common.updateSuccess.replace('{item}', trans.retailers.title.toLowerCase()));
          handleCloseFormDialog();
          fetchRetailers();
        }
      } else {
        const response = await axiosInstance.post('/api/retailer', formData, {
          headers: getAuthHeaders()
        });
        if (response.data.success) {
          setSuccess(trans.common.addSuccess.replace('{item}', trans.retailers.title.toLowerCase()));
          handleCloseFormDialog();
          fetchRetailers();
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || trans.retailers.errorOccurred);
      console.error('Error submitting form:', error);
    }
  };

  const handleDelete = async (retailer) => {
    if (window.confirm(trans.common.confirmDelete.replace('{item}', trans.retailers.title.toLowerCase()))) {
      try {
        const response = await axiosInstance.delete(`/api/retailer/${retailer._id}`, {
          headers: getAuthHeaders()
        });
        if (response.data.success) {
          setSuccess(trans.common.deleteSuccess.replace('{item}', trans.retailers.title.toLowerCase()));
          fetchRetailers();
        }
      } catch (error) {
        setError(error.response?.data?.message || trans.retailers.errorDeleting);
        console.error('Error deleting retailer:', error);
      }
    }
  };

  useEffect(() => {
    fetchRetailers();
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
            {trans.retailers.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {trans.retailers.description}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
          {trans.common.addNew}
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
                label={trans.common.retailerName}
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
              <FormControl fullWidth size="small">
                <InputLabel>{trans.common.status}</InputLabel>
                <Select
                  value={filters.status || ''}
                  label={trans.common.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  sx={{ minWidth: '140px' }}
                >
                  <MenuItem value="">{trans.common.all}</MenuItem>
                  {filterOptions.status?.map((status) => (
                    <MenuItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={fetchRetailers} disabled={loading} fullWidth>
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
                <TableCell sx={{ fontWeight: 'bold' }}>{trans.retailers.name}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{trans.retailers.address}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{trans.retailers.phone}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{trans.retailers.license}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{trans.retailers.status}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{trans.common.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {trans.common.loading}
                  </TableCell>
                </TableRow>
              ) : retailers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {trans.common.noData}
                  </TableCell>
                </TableRow>
              ) : (
                retailers.map((retailer) => (
                  <TableRow key={retailer._id} hover>
                    <TableCell>{retailer.name}</TableCell>
                    <TableCell>{retailer.address || 'N/A'}</TableCell>
                    <TableCell>{retailer.phone || 'N/A'}</TableCell>
                    <TableCell>{retailer.license}</TableCell>
                    <TableCell>
                      <Chip label={getStatusLabel(retailer.status)} color={getStatusColor(retailer.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={trans.common.viewDetail}>
                        <IconButton size="small" color="primary" onClick={() => handleViewDetail(retailer)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={trans.common.edit}>
                        <IconButton size="small" color="warning" onClick={() => handleEdit(retailer)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={trans.common.delete}>
                        <IconButton size="small" color="error" onClick={() => handleDelete(retailer)}>
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
          labelRowsPerPage={trans.common.rowsPerPage}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${trans.common.of} ${count !== -1 ? count : `hơn ${to}`}`}
        />
      </Paper>

      {/* Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog} maxWidth="md" fullWidth>
        <DialogTitle>{trans.retailers.detailTitle}</DialogTitle>
        <DialogContent>
          {selectedRetailer && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.retailers.name}
                </Typography>
                <Typography variant="body1">{selectedRetailer.name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.retailers.status}
                </Typography>
                <Chip label={getStatusLabel(selectedRetailer.status)} color={getStatusColor(selectedRetailer.status)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.retailers.address}
                </Typography>
                <Typography variant="body1">{selectedRetailer.address || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.retailers.phone}
                </Typography>
                <Typography variant="body1">{selectedRetailer.phone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.retailers.license}
                </Typography>
                <Typography variant="body1">{selectedRetailer.license}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>{trans.common.close}</Button>
        </DialogActions>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={openFormDialog} onClose={handleCloseFormDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? trans.common.update : trans.common.addNew} {trans.retailers.title.toLowerCase()}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={trans.common.retailerName}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{trans.common.status}</InputLabel>
                <Select
                  value={formData.status}
                  label={trans.common.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  sx={{ minWidth: '140px' }}
                >
                  <MenuItem value="active">{trans.retailers.active}</MenuItem>
                  <MenuItem value="inactive">{trans.retailers.inactive}</MenuItem>
                  <MenuItem value="pending">{trans.common.pending}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={trans.retailers.address}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={trans.retailers.phone}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                error={!!errors.phone}
                helperText={errors.phone || trans.retailers.phoneFormat}
                placeholder={trans.retailers.phonePlaceholder}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={trans.retailers.license}
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
          <Button onClick={handleCloseFormDialog}>{trans.common.cancel}</Button>
          <Button onClick={handleFormSubmit} variant="contained">
            {isEditing ? trans.common.update : trans.common.addNew}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RetailerManagement;
