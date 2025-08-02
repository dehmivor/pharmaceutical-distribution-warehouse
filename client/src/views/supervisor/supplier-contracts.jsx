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
  Paper
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';
import ContractDetailDialog from './ContractDetailDialog';

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

const SupplierContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    contract_code: '',
    status: '',
    partner_id: ''
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    status: [],
    contract_type: []
  });

  // Suppliers list for filter
  const [suppliers, setSuppliers] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  // Fetch suppliers for filter
  const fetchSuppliers = async () => {
    try {
      const response = await axiosInstance.get('/api/supplier/all/v1', {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setSuppliers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  // Fetch contracts
  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        partner_type: 'Supplier', // Chỉ lấy hợp đồng với supplier
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      });

      const response = await axiosInstance.get(`/api/contract?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setContracts(response.data.data.contracts);
        setFilterOptions(response.data.filterOptions);
        setTotalCount(response.data.data.pagination.total);
      }
    } catch (error) {
      setError('Lỗi khi tải danh sách hợp đồng');
      console.error('Error fetching contracts:', error);
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
      draft: 'default',
      pending: 'warning',
      active: 'success',
      completed: 'info',
      cancelled: 'error',
      expired: 'error'
    };
    return statusColors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      draft: 'Nháp',
      pending: 'Chờ duyệt',
      active: 'Đang hoạt động',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      expired: 'Hết hạn'
    };
    return statusLabels[status] || status;
  };

  const getContractTypeLabel = (type) => {
    const typeLabels = {
      economic: 'Kinh tế',
      principal: 'Chính'
    };
    return typeLabels[type] || type;
  };

  const handleViewDetail = (contract) => {
    setSelectedContract(contract);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedContract(null);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchContracts();
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
            Supplier Contract Management
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Update, add and remove supplier contract
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />}>
          Refresh
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
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Mã hợp đồng"
                value={filters.contract_code || ''}
                onChange={(e) => handleFilterChange('contract_code', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Trạng thái"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  sx={{ minWidth: 200 }}
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
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tên supplier</InputLabel>
                <Select
                  value={filters.partner_id || ''}
                  label="Tên supplier"
                  onChange={(e) => handleFilterChange('partner_id', e.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchContracts} disabled={loading} fullWidth>
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
                <TableCell sx={{ fontWeight: 'bold' }}>Mã hợp đồng</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Loại hợp đồng</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ngày bắt đầu</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ngày kết thúc</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => (
                  <TableRow key={contract._id} hover>
                    <TableCell>{contract.contract_code}</TableCell>
                    <TableCell>{getContractTypeLabel(contract.contract_type)}</TableCell>
                    <TableCell>{contract.partner_id?.name || 'N/A'}</TableCell>
                    <TableCell>{new Date(contract.start_date).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>{new Date(contract.end_date).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>
                      <Chip label={getStatusLabel(contract.status)} color={getStatusColor(contract.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Xem chi tiết">
                        <IconButton size="small" color="primary" onClick={() => handleViewDetail(contract)}>
                          <ViewIcon />
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

      {/* Contract Detail Dialog */}
      <ContractDetailDialog open={openDetailDialog} onClose={handleCloseDetailDialog} contract={selectedContract} />
    </Box>
  );
};

export default SupplierContracts;
