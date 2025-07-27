'use client';
import { FilterList as FilterIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import Menu from '@mui/material/Menu';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useEffect, useState } from 'react';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import { vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation'; // Nếu Next.js 13+, còn nếu khác hãy dùng react-router hoặc cách tương tự
import { orderColumns } from '@tanstack/react-table';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const statusOptions = ['pending', 'processing', 'completed', 'cancelled'];

const CheckOrders = () => {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOrder, setMenuOrder] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    warehouse_manager_id: '',
    startDate: null,
    endDate: null
  });

  const handleMenuOpen = (e, order) => {
    setAnchorEl(e.currentTarget);
    setMenuOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOrder(null);
  };

  // Fetch data
  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage)
      });
      if (filters.status) params.append('status', filters.status);
      if (filters.warehouse_manager_id) params.append('warehouse_manager_id', filters.warehouse_manager_id);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

      const res = await axiosInstance.get(`/api/inventory-check-orders?${params.toString()}`, {
        headers: getAuthHeaders()
      });

      if (res.data.success) {
        setOrders(res.data.data.inventoryCheckOrders || []);
        setTotalCount(res.data.data.pagination?.total || 0);
      } else {
        setError(res.data.message || 'Lỗi khi tải phiếu kiểm kê');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải phiếu kiểm kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, filters]);

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  // Pagination
  const handlePageChange = (event, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format date/time
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');
  const formatDateTime = (d) => (d ? new Date(d).toLocaleString('vi-VN', { hour12: false }) : '');

  // Status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" color="primary" fontWeight={600} gutterBottom>
        Danh Sách Phiếu Kiểm Kê Toàn Kho
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6" color="primary" fontWeight={600}>
              Bộ lọc tìm kiếm
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filters.status}
                  label=""
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  displayEmpty
                  renderValue={(selected) => (selected ? selected : <em>Chọn trạng thái</em>)}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                <DatePicker
                  label="Từ ngày"
                  value={filters.startDate}
                  onChange={(newValue) => handleFilterChange('startDate', newValue)}
                  slotProps={{
                    textField: { fullWidth: true, size: 'small' }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                <DatePicker
                  label="Đến ngày"
                  value={filters.endDate}
                  onChange={(newValue) => handleFilterChange('endDate', newValue)}
                  slotProps={{
                    textField: { fullWidth: true, size: 'small' }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Ngày kiểm kê</TableCell>
                <TableCell>Warehouse Manager</TableCell>
                <TableCell>Người tạo</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ghi chú</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Ngày cập nhật</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    Không có phiếu kiểm kê
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order._id} hover>
                    <TableCell>{formatDate(order.inventory_check_date)}</TableCell>
                    <TableCell>
                      <Typography>{order.warehouse_manager_id?.email || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography>{order.created_by?.email || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={order.status} size="small" color={getStatusColor(order.status)} variant="filled" />
                    </TableCell>
                    <TableCell>{order.notes || '-'}</TableCell>
                    <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                    <TableCell>{formatDateTime(order.updatedAt)}</TableCell>
                    <TableCell align="center" sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      <IconButton onClick={(e) => handleMenuOpen(e, order)}>
                        <MoreVertIcon />
                      </IconButton>
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
          labelRowsPerPage="Số hàng mỗi trang"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`}
        />
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            router.push(`/wh-inventory/check-orders/${menuOrder?._id}`);
            handleMenuClose();
          }}
        >
          View Detail
        </MenuItem>
        <MenuItem
          onClick={() => {
            router.push(`/wh-inventory/create-inspections/${menuOrder?._id}`);
            handleMenuClose();
          }}
        >
          Create Check Inspection
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CheckOrders;
