'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Grid,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  TablePagination
} from '@mui/material';
import axios from 'axios';
import useNotifications from '@/hooks/useNotification';
import {
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// Đảm bảo API_BASE_URL không lặp /api, và mọi endpoint đều có /api/export-orders
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};
const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true
});

function ManageExportOrdersApproval() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [orderToApprove, setOrderToApprove] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [orderToView, setOrderToView] = useState(null);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    contract_type: '',
    created_by: ''
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    status: [],
    contract_type: [],
    created_by: []
  });
  
  const { createNotification } = useNotifications();

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, filters]);

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
    setPage(0); // Reset to first page when filtering
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

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      contract_type: '',
      created_by: ''
    });
    setPage(0);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log('Fetching from:', `${API_BASE_URL}/api/export-orders`);
      console.log('Auth headers:', getAuthHeaders());
      
      const response = await axios.get(`${API_BASE_URL}/api/export-orders`, { headers: getAuthHeaders() });
      
      console.log('API Response:', response.data);
      if (response.data.success) {
        const allOrders = response.data.data || [];
        console.log('All export orders:', allOrders);
        
        // Client-side filtering
        let filteredOrders = allOrders.filter((order) => {
          const matchesSearch = !filters.search || 
            order._id?.toLowerCase().includes(filters.search.toLowerCase()) ||
            order.contract_id?.contract_code?.toLowerCase().includes(filters.search.toLowerCase());
          
          const matchesStatus = !filters.status || order.status === filters.status;
          const matchesContractType = !filters.contract_type || order.contract_id?.contract_type === filters.contract_type;
          const matchesCreatedBy = !filters.created_by || order.created_by?.email === filters.created_by;
          
          return matchesSearch && matchesStatus && matchesContractType && matchesCreatedBy;
        });

        // Client-side pagination
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
        
        setOrders(paginatedOrders);
        setTotalCount(filteredOrders.length);
        
        // Generate filter options from data
        const statusOptions = [...new Set(allOrders.map(order => order.status))];
        const contractTypeOptions = [...new Set(allOrders.map(order => order.contract_id?.contract_type).filter(Boolean))];
        const createdByOptions = [...new Set(allOrders.map(order => order.created_by?.email).filter(Boolean))];
        
        setFilterOptions({
          status: statusOptions,
          contract_type: contractTypeOptions,
          created_by: createdByOptions.map(email => ({ email }))
        });
      } else {
        setOrders([]);
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApproveDialog = (order) => {
    setOrderToApprove(order);
    setApproveDialogOpen(true);
  };
  const handleCloseApproveDialog = () => {
    setApproveDialogOpen(false);
    setOrderToApprove(null);
  };
  const handleApprove = async () => {
    if (!orderToApprove) return;
    setApproveLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/export-orders/${orderToApprove._id}/approve`,
        {}, // Không gửi status nữa, chỉ gửi body rỗng
        { headers: getAuthHeaders() }
      );
      setSuccess('Order approved!');
      fetchOrders();
      handleCloseApproveDialog();

      // Create notification for approved order
      try {
        await createNotification({
          type: 'export_order_status',
          status: 'unread',
          priority: 'high',
          title: 'Export order approved',
          message: `Export Order ${orderToApprove._id} has been approved.`
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleOpenDetailsDialog = (order) => {
    setOrderToView(order);
    setDetailsDialogOpen(true);
  };
  const handleCloseDetailsDialog = () => {
    setOrderToView(null);
    setDetailsDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Approve Export Orders
      </Typography>
      
      {/* Filters */}
      <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <FilterIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Bộ Lọc Tìm Kiếm
            </Typography>
          </Box>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Tìm kiếm"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                variant="outlined"
                size="medium"
                placeholder="Order ID, Contract code..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="medium">
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Trạng thái"
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {filterOptions?.status?.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="medium">
                <InputLabel>Loại hợp đồng</InputLabel>
                <Select
                  value={filters.contract_type}
                  onChange={(e) => handleFilterChange('contract_type', e.target.value)}
                  label="Loại hợp đồng"
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {filterOptions?.contract_type?.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type === 'economic' ? 'Kinh tế' : type === 'principal' ? 'Nguyên tắc' : type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="medium">
                <InputLabel>Người tạo</InputLabel>
                <Select
                  value={filters.created_by}
                  onChange={(e) => handleFilterChange('created_by', e.target.value)}
                  label="Người tạo"
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {filterOptions?.created_by?.map((user) => (
                    <MenuItem key={user.email} value={user.email}>
                      {user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={fetchOrders}
                disabled={loading}
                sx={{ px: 3, py: 1.2, borderRadius: 2 }}
              >
                Làm mới
              </Button>
              <Button
                variant="outlined"
                onClick={clearFilters}
                sx={{ px: 3, py: 1.2, borderRadius: 2 }}
              >
                Xóa bộ lọc
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ border: '1px solid #e0e0e0' }}>
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid #e0e0e0',
            bgcolor: 'grey.50'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Danh Sách Export Orders
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tổng cộng {totalCount} orders
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Contract</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id} hover sx={{ transition: 'background 0.2s', '&:hover': { backgroundColor: '#f0f4fa' } }}>
                  <TableCell>{order.contract_id?.contract_code || 'N/A'}</TableCell>
                  <TableCell>{order.created_by?.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={order.status === 'approved' ? 'success' : order.status === 'draft' ? 'default' : 'info'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} justifyContent="center">
                      {order.status === 'draft' && (
                        <Button variant="contained" color="success" onClick={() => handleOpenApproveDialog(order)}>
                          Approve
                        </Button>
                      )}
                      <Button variant="outlined" color="info" onClick={() => handleOpenDetailsDialog(order)}>
                        Xem chi tiết
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary">{loading ? 'Loading orders...' : 'No export orders to process.'}</Typography>
                  </TableCell>
                </TableRow>
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
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
          sx={{
            borderTop: '1px solid #e0e0e0',
            bgcolor: 'grey.50'
          }}
        />
      </Card>
      {/* Dialog chi tiết order */}
      <Dialog open={approveDialogOpen} onClose={handleCloseApproveDialog}>
        <DialogTitle>Approve Export Order</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc chắn muốn duyệt đơn xuất này?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApproveDialog}>Cancel</Button>
          <Button onClick={handleApprove} color="success" variant="contained" disabled={approveLoading}>
            {approveLoading ? 'Approving...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={detailsDialogOpen} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600, fontSize: 22, pb: 1 }}>Chi tiết Export Order</DialogTitle>
        <DialogContent>
          {orderToView && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Thông tin cơ bản
                    </Typography>
                    <Typography variant="body2">
                      <b>Contract:</b> {orderToView.contract_id?.contract_code || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <b>Created By:</b> {orderToView.created_by?.email || 'N/A'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" component="span">
                        <b>Status:</b>
                      </Typography>
                      <Chip label={orderToView.status} color="info" size="small" sx={{ ml: 1 }} />
                    </Box>
                    <Typography variant="body2">
                      <b>Warehouse Manager:</b> {orderToView.warehouse_manager_id?.email || '-'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Tổng quan đơn hàng
                    </Typography>
                    <Typography variant="body2">
                      <b>Số lượng loại thuốc:</b> {orderToView.details?.length || 0}
                    </Typography>
                    <Typography variant="body2">
                      <b>Tổng tiền:</b>{' '}
                      {orderToView.details
                        ? orderToView.details.reduce((sum, d) => sum + d.expected_quantity * d.unit_price, 0).toLocaleString() + ' VND'
                        : '0 VND'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                Danh sách thuốc
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>
                        <b>Medicine</b>
                      </TableCell>
                      <TableCell align="right">
                        <b>Quantity</b>
                      </TableCell>
                      <TableCell align="right">
                        <b>Unit Price</b>
                      </TableCell>
                      <TableCell align="right">
                        <b>Total</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderToView.details?.map((d, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{d.medicine_id?.medicine_name || d.medicine_id || 'N/A'}</TableCell>
                        <TableCell align="right">{d.expected_quantity}</TableCell>
                        <TableCell align="right">{d.unit_price?.toLocaleString() || 0}</TableCell>
                        <TableCell align="right">{(d.expected_quantity * d.unit_price).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {/* Tổng tiền cuối bảng */}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <b>Tổng cộng</b>
                      </TableCell>
                      <TableCell align="right">
                        {orderToView.details
                          ? orderToView.details.reduce((sum, d) => sum + d.expected_quantity * d.unit_price, 0).toLocaleString() + ' VND'
                          : '0 VND'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', pr: 3, pb: 2 }}>
          <Button onClick={handleCloseDetailsDialog} variant="contained" color="primary" sx={{ minWidth: 120 }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ManageExportOrdersApproval;
