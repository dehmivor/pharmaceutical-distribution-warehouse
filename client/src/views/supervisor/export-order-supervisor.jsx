'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Snackbar,
  Alert,
  Chip,
  TextField,
  Grid,
  Button,
  CircularProgress,
  Stack,
  MenuItem,
  FormControl,
  Select
} from '@mui/material';
import {
  Info as InfoIcon,
  ForkLeft as ForwardIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';
import useNotifications from '@/hooks/useNotification';

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

axiosInstance.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const getStatusColor = (status) =>
  ({
    draft: 'default',
    approved: 'success',
    delivered: 'info',
    checked: 'warning',
    arranged: 'primary',
    completed: 'success',
    cancelled: 'error'
  })[status] || 'default';

const EXPORT_ORDER_STATUSES = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  RETURNED: 'returned',
  CANCELLED: 'cancelled'
};

export default function ExportOrderSupervisor() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [openDetails, setOpenDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Pagination and filtering
  const [page, setPage] = useState(1); // 1-based page
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [filterDate, setFilterDate] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('all'); // 'all', 'assigned', 'unassigned'
  const [filterStatus, setFilterStatus] = useState('All Status');

  const [actionLoading, setActionLoading] = useState(false);
  const { createNotification } = useNotifications('685c2c032aaf8fe6edb3a26f');

  // Inline status edit
  const [editingStatusOrderId, setEditingStatusOrderId] = useState(null);
  const [editStatusValue, setEditStatusValue] = useState('');

  // Confirm dialog for status change
  const [confirmDialog, setConfirmDialog] = useState({ open: false, orderId: null, newStatus: '' });

  // Fetch orders with filter, pagination
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: rowsPerPage
      };

      if (filterDate) params.createdAt = filterDate;
      if (filterStatus && filterStatus !== 'All Status') params.status = filterStatus;

      if (filterAssigned === 'unassigned') {
        params.warehouse_manager_id = '0'; // backend should interpret as "unassigned"
      } else if (filterAssigned === 'assigned') {
        params.warehouse_manager_id = 'nonzero'; // example placeholder, backend support needed
      }
      // 'all' means no filter on assign

      const response = await axiosInstance.get('/export-orders', { params });
      if (response.data.success || response.data.data) {
        setOrders(response.data.data || []);
        setTotalCount(response.data.pagination?.total || response.data.data?.length || 0);
      } else {
        throw new Error(response.data.error || 'Failed to fetch orders');
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);



  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleChangePage = (_e, newPage) => {
    setPage(newPage + 1); // TablePagination is zero-based; API is 1-based
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(1);
  };

  const handleSearchClick = () => {
    setPage(1);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setFilterDate('');
    setFilterAssigned('all');
    setFilterStatus('All Status');
    setPage(1);
  };

  // Edit dialog open/close and form change handlers




  // Details dialog open/close
  const handleOpenDetails = async (order) => {
    setSelectedOrder(order);
    setOpenDetails(true);

    try {
      const userInfo = JSON.parse(localStorage.getItem('user-info') || '{}');

      await createNotification({
        recipient_id: order.warehouse_manager_id?._id,
        sender_id: userInfo._id,
        type: 'export_order_assigned',
        title: `Phiếu xuất số ${order.export_order_code || order._id} đã được giao`,
        content: `Supervisor đã giao phiếu xuất số ${order.export_order_code || order._id} cho bạn.`,
        status: 'unread',
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Lỗi khi tạo thông báo:', error);
    }
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setOpenDetails(false);
  };

  // Inline status change with confirm dialog
  const handleStatusChange = (orderId, newStatus) => {
    setConfirmDialog({ open: true, orderId, newStatus });
  };

  const handleConfirmStatusChange = async () => {
    const { orderId, newStatus } = confirmDialog;
    try {
      setActionLoading(true);
      await axiosInstance.patch(`/export-orders/${orderId}/status`, { status: newStatus });
      setEditingStatusOrderId(null);
      setSuccess('Status updated successfully');
      fetchOrders();
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, orderId: null, newStatus: '' });
    }
  };

  const handleCancelStatusChange = () => {
    setConfirmDialog({ open: false, orderId: null, newStatus: '' });
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    try {
      return `${Number(value).toLocaleString('en-US')} VND`;
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Export Orders Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Supervisor can view, approve and reject export order
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchOrders()} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Box component={Paper} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Created Date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField select label="Assigned" value={filterAssigned} onChange={(e) => setFilterAssigned(e.target.value)} size="small">
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="assigned">Assigned</MenuItem>
            <MenuItem value="unassigned">Unassigned</MenuItem>
          </TextField>
          <TextField select label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} size="small">
            <MenuItem value="All Status">All Status</MenuItem>
            {Object.values(EXPORT_ORDER_STATUSES).map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>

          <Button size="small" variant="contained" startIcon={<SearchIcon />} onClick={handleSearchClick}>
            Search
          </Button>
          <Button size="small" variant="outlined" onClick={handleResetFilters}>
            Reset
          </Button>
        </Stack>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 120 }}>Order Code</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Contract Code</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Supplier</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Created By</TableCell>
              <TableCell align="right" sx={{ minWidth: 120 }}>
                Total Amount
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Warehouse Manager</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No orders found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const totalAmount = order.details?.reduce((acc, d) => acc + (d.quantity || 0) * (d.unit_price || 0), 0) || 0;
                return (
                  <TableRow hover key={order._id}>
                    <TableCell title={order._id}>{order._id ? `${order._id.slice(0, 6)}...${order._id.slice(-4)}` : 'N/A'}</TableCell>
                    <TableCell>{order.contract_id?.contract_code || 'N/A'}</TableCell>
                    <TableCell>{order.contract_id?.partner_id?.name || 'N/A'}</TableCell>
                    <TableCell>{order.created_by?.email || 'N/A'}</TableCell>
                    <TableCell align="right">{formatCurrency(totalAmount)}</TableCell>
                    <TableCell>
                      {editingStatusOrderId === order._id ? (
                        <FormControl size="small" fullWidth>
                          <Select
                            value={editStatusValue}
                            onChange={(e) => {
                              if (order.status === EXPORT_ORDER_STATUSES.APPROVED && e.target.value === EXPORT_ORDER_STATUSES.COMPLETED) {
                                handleStatusChange(order._id, e.target.value);
                              }
                            }}
                            onBlur={() => setEditingStatusOrderId(null)}
                            autoFocus
                          >
                            {order.status === EXPORT_ORDER_STATUSES.APPROVED && (
                              <MenuItem value={EXPORT_ORDER_STATUSES.COMPLETED}>Completed</MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status)}
                          size="small"
                          onClick={() => {
                            if (order.status === EXPORT_ORDER_STATUSES.APPROVED) {
                              setEditingStatusOrderId(order._id);
                              setEditStatusValue(order.status);
                            }
                          }}
                          style={{ cursor: order.status === EXPORT_ORDER_STATUSES.APPROVED ? 'pointer' : 'default' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{order.warehouse_manager_id?.email || 'Not Assigned'}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton color="info" onClick={() => handleOpenDetails(order)}>
                          <InfoIcon />
                        </IconButton>
                        <IconButton
                          color="secondary"
                          onClick={() => (window.location.href = 'https://localhost:3000/manage-bills')}
                          title="Tạo công nợ"
                        >
                          <ForwardIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>



      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="lg" fullWidth>
        <DialogTitle>Export Order Details</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Order ID
                        </Typography>
                        <Typography variant="body1">{selectedOrder._id}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Order Code
                        </Typography>
                        <Typography variant="body1">{selectedOrder.export_order_code || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Status
                        </Typography>
                        <Chip label={selectedOrder.status} color={getStatusColor(selectedOrder.status)} size="small" />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Contract Information
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Contract Code
                        </Typography>
                        <Typography variant="body1">{selectedOrder.contract_id?.contract_code || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Supplier
                        </Typography>
                        <Typography variant="body1">{selectedOrder.contract_id?.partner_id?.name || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Contract Status
                        </Typography>
                        <Typography variant="body1">{selectedOrder.supplier_contract_id?.status || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Warehouse Information
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Warehouse
                        </Typography>
                        <Typography variant="body1">{selectedOrder.warehouse_id?.email || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Warehouse Manager
                        </Typography>
                        <Typography variant="body1">{selectedOrder.warehouse_manager_id?.email || 'Not Assigned'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Manager Email
                        </Typography>
                        <Typography variant="body1">{selectedOrder.warehouse_manager_id?.email || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* User Info & Order Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    User Information
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Created By
                        </Typography>
                        <Typography variant="body1">{selectedOrder.created_by?.email || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Creator Email
                        </Typography>
                        <Typography variant="body1">{selectedOrder.created_by?.email || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Approved By
                        </Typography>
                        <Typography variant="body1">{selectedOrder.approval_by?.name || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Order Details
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Medicine Name</TableCell>
                            <TableCell>License Code</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Unit Price</TableCell>
                            <TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedOrder.details?.map((detail, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{detail.medicine_id?.medicine_name || 'N/A'}</TableCell>
                              <TableCell>{detail.medicine_id?.license_code || 'N/A'}</TableCell>
                              <TableCell align="right">{detail.quantity || 0}</TableCell>
                              <TableCell align="right">{formatCurrency(detail.unit_price)}</TableCell>
                              <TableCell align="right">{formatCurrency((detail.quantity || 0) * (detail.unit_price || 0))}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={4}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                Total Amount
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle1" fontWeight="bold">
                                {formatCurrency(
                                  selectedOrder.details?.reduce((total, detail) => total + detail.quantity * detail.unit_price, 0) || 0
                                )}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>

                {/* Notes */}
                {selectedOrder.notes && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Notes
                    </Typography>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="body1">{selectedOrder.notes}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Status Change Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCancelStatusChange}>
        <DialogTitle>Xác nhận đổi trạng thái</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn đổi trạng thái đơn hàng này? <br />
          <b>Hành động này không thể hoàn tác.</b>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelStatusChange} color="secondary">
            No
          </Button>
          <Button onClick={handleConfirmStatusChange} color="primary" autoFocus disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar: Error */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Snackbar: Success */}
      <Snackbar
        open={!!success}
        autoHideDuration={1500}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
