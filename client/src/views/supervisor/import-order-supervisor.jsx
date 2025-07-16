'use client';
import React, { useState, useEffect } from 'react';
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import { Info as InfoIcon, Edit as EditIcon, ForkLeft as ForwardIcon } from '@mui/icons-material';
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

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function ImportOrderSupervisor() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [warehouseManagers, setWarehouseManagers] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusTransitions, setStatusTransitions] = useState({});
  const { createNotification } = useNotifications('685c2c032aaf8fe6edb3a26f');

  // Edit form states
  const [editForm, setEditForm] = useState({
    status: '',
    warehouse_manager_id: ''
  });

  // Thêm state cho inline status edit
  const [editingStatusOrderId, setEditingStatusOrderId] = useState(null);
  const [editStatusValue, setEditStatusValue] = useState('');

  // Thêm state cho dialog xác nhận đổi status
  const [confirmDialog, setConfirmDialog] = useState({ open: false, orderId: null, newStatus: '' });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/import-orders');
      setOrders(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseManagers = async () => {
    try {
      const response = await axiosInstance.get('/accounts?role=warehouse_manager');
      setWarehouseManagers(response.data.data || []);
    } catch (error) {
      setWarehouseManagers([]);
    }
  };

  const fetchStatusTransitions = async () => {
    try {
      console.log('Fetching status transitions...');
      const response = await axiosInstance.get('/import-orders/status-transitions');
      console.log('Status transitions response:', response.data);
      setStatusTransitions(response.data.data || {});
    } catch (error) {
      console.error('Error fetching status transitions:', error);
      setStatusTransitions({});
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchWarehouseManagers();
    fetchStatusTransitions();
  }, []);

  const handleOpenEditDialog = (order) => {
    setSelectedOrder(order);
    setEditForm({
      status: order.status || '',
      warehouse_manager_id: order.warehouse_manager_id?._id || ''
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setSelectedOrder(null);
    setEditForm({
      status: '',
      warehouse_manager_id: ''
    });
    setOpenEditDialog(false);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    try {
      setActionLoading(true);

      // Update status if changed
      if (editForm.status !== selectedOrder.status) {
        await axiosInstance.patch(`/import-orders/${selectedOrder._id}/status`, { status: editForm.status });
      }

      // Update warehouse manager if changed
      if (editForm.warehouse_manager_id !== (selectedOrder.warehouse_manager_id?._id || '')) {
        await axiosInstance.patch(`/import-orders/${selectedOrder._id}/assign-warehouse-manager`, {
          warehouse_manager_id: editForm.warehouse_manager_id
        });
      }

      setSuccess('Order updated successfully');
      handleCloseEditDialog();
      fetchOrders();
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetails = async (order) => {
    setSelectedOrder(order);
    setOpenDetails(true);

    // Tạo thông báo mới cho warehouse_manager
    try {
      // Lấy thông tin user từ localStorage hoặc context
      const userInfo = JSON.parse(localStorage.getItem('user-info') || '{}');

      await createNotification({
        recipient_id: order.warehouse_manager_id?._id, // id của warehouse_manager nhận thông báo
        sender_id: userInfo._id, // id của supervisor (người gửi)
        type: 'import_order_assigned', // loại thông báo, bạn có thể đặt tên phù hợp
        title: `Phiếu nhập số ${order.import_order_code || order._id} đã được giao`,
        content: `Supervisor đã giao phiếu nhập số ${order.import_order_code || order._id} cho bạn.`,
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'approved':
        return 'success';
      case 'delivered':
        return 'info';
      case 'checked':
        return 'warning';
      case 'arranged':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Import order statuses from constants
  const IMPORT_ORDER_STATUSES = {
    DRAFT: 'draft',
    APPROVED: 'approved',
    DELIVERED: 'delivered',
    CHECKED: 'checked',
    ARRANGED: 'arranged',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    try {
      return `${Number(value).toLocaleString('en-US')} VND`;
    } catch (error) {
      return '-';
    }
  };

  const paginatedOrders = orders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Thêm hàm handleStatusChange
  const handleStatusChange = (orderId, newStatus) => {
    setConfirmDialog({ open: true, orderId, newStatus });
  };

  // Hàm xác nhận đổi status (chỉ gọi khi Yes)
  const handleConfirmStatusChange = async () => {
    const { orderId, newStatus } = confirmDialog;
    try {
      setActionLoading(true);
      await axiosInstance.patch(`/import-orders/${orderId}/status`, { status: newStatus });
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

  // Hàm hủy xác nhận
  const handleCancelStatusChange = () => {
    setConfirmDialog({ open: false, orderId: null, newStatus: '' });
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Supervisor - Import Orders Management</Typography>
      </Box>

      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <TableContainer component={Paper} sx={{ minWidth: 900 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 120, maxWidth: 180, whiteSpace: 'nowrap' }}>Order Code</TableCell>
                <TableCell sx={{ minWidth: 100, maxWidth: 120, whiteSpace: 'nowrap' }}>Contract Code</TableCell>
                <TableCell sx={{ minWidth: 120, maxWidth: 180, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Supplier</TableCell>
                <TableCell sx={{ minWidth: 120, maxWidth: 180, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Created By</TableCell>
                <TableCell align="right" sx={{ minWidth: 100, maxWidth: 120, whiteSpace: 'nowrap' }}>
                  Total Amount
                </TableCell>
                <TableCell sx={{ minWidth: 90, maxWidth: 100, whiteSpace: 'nowrap' }}>Status</TableCell>
                <TableCell sx={{ minWidth: 150, maxWidth: 200, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Warehouse Manager</TableCell>
                <TableCell sx={{ minWidth: 90, maxWidth: 120, whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell sx={{ maxWidth: 180, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {/* Rút gọn Order Code: 6 ký tự đầu ... 4 ký tự cuối */}
                    {order._id ? `${order._id.slice(0, 6)}...${order._id.slice(-4)}` : 'N/A'}
                  </TableCell>
                  <TableCell>{order.contract_id?.contract_code || 'N/A'}</TableCell>
                  <TableCell>{order.contract_id?.partner_id?.name || 'N/A'}</TableCell>
                  <TableCell>{order.created_by?.email || 'N/A'}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(order.details?.reduce((total, detail) => total + detail.quantity * detail.unit_price, 0) || 0)}
                  </TableCell>
                  <TableCell>
                    {editingStatusOrderId === order._id ? (
                      <FormControl size="small" fullWidth>
                        <Select
                          value={editStatusValue}
                          onChange={(e) => {
                            if (
                              order.status === IMPORT_ORDER_STATUSES.APPROVED &&
                              e.target.value === IMPORT_ORDER_STATUSES.DELIVERED
                            ) {
                              handleStatusChange(order._id, e.target.value);
                            }
                          }}
                          onBlur={() => setEditingStatusOrderId(null)}
                          autoFocus
                        >
                          {order.status === IMPORT_ORDER_STATUSES.APPROVED && (
                            <MenuItem value={IMPORT_ORDER_STATUSES.DELIVERED}>Delivered</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                        onClick={() => {
                          // Chỉ cho phép edit nếu đang ở trạng thái approved
                          if (order.status === IMPORT_ORDER_STATUSES.APPROVED) {
                            setEditingStatusOrderId(order._id);
                            setEditStatusValue(order.status);
                          }
                        }}
                        style={{ cursor: order.status === IMPORT_ORDER_STATUSES.APPROVED ? 'pointer' : 'default' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{order.warehouse_manager_id?.email || 'Not Assigned'}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {/* Chỉ hiện nút giao warehouse manager khi đã delivered */}
                      {order.status === IMPORT_ORDER_STATUSES.DELIVERED && (
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenEditDialog(order)}
                          disabled={actionLoading}
                          title="Assign warehouse manager"
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                      <IconButton color="info" onClick={() => handleOpenDetails(order)}>
                        <InfoIcon />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => window.location.href('https://localhost:3000/manage-bills')}
                        title="Tạo công nợ"
                      >
                        <ForwardIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={orders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Box>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Warehouse Manager</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Warehouse Manager</InputLabel>
              <Select
                value={editForm.warehouse_manager_id}
                onChange={(e) => handleEditFormChange('warehouse_manager_id', e.target.value)}
                label="Warehouse Manager"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {warehouseManagers.map((manager) => (
                  <MenuItem key={manager._id} value={manager._id}>
                    {manager.name} ({manager.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={handleUpdateOrder} variant="contained" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="lg" fullWidth>
        <DialogTitle>Import Order Details</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Basic, Contract, Warehouse: mỗi cái 12 trên mobile, 4 trên desktop */}
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
                        <Typography variant="body1">{selectedOrder.import_order_code || 'N/A'}</Typography>
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

                {/* User Info & Order Details: mỗi cái 12 trên mobile, 6 trên desktop */}
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
                          {selectedOrder.details?.map((detail, index) => (
                            <TableRow key={index}>
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

      {/* Dialog xác nhận đổi status */}
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

      {/* Error Snackbar */}
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

      {/* Success Snackbar */}
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

export default ImportOrderSupervisor;
