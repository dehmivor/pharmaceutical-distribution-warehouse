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
import { Info as InfoIcon, Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import useNotifications from '@/hooks/useNotification';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
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
  const { createNotification } = useNotifications(order.warehouse_manager_id);

  // Edit form states
  const [editForm, setEditForm] = useState({
    status: '',
    warehouse_manager_id: ''
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log('Fetching orders...');
      const response = await axiosInstance.get('/import-orders', {
        headers: getAuthHeaders(),
      });
      console.log('Orders response:', response.data);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseManagers = async () => {
    try {
      console.log('Fetching warehouse managers...');
      const response = await axiosInstance.get('/users?role=warehouse_manager', {
        headers: getAuthHeaders(),
      });
      console.log('Warehouse managers response:', response.data);
      setWarehouseManagers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching warehouse managers:', error);
      setWarehouseManagers([]);
    }
  };

  const fetchStatusTransitions = async () => {
    try {
      console.log('Fetching status transitions...');
      const response = await axiosInstance.get('/import-orders/status-transitions', {
        headers: getAuthHeaders(),
      });
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
    setEditForm(prev => ({
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
        await axiosInstance.patch(`/import-orders/${selectedOrder._id}/status`, 
          { status: editForm.status },
          { headers: getAuthHeaders() }
        );
      }

      // Update warehouse manager if changed
      if (editForm.warehouse_manager_id !== (selectedOrder.warehouse_manager_id?._id || '')) {
        await axiosInstance.put(`/import-orders/${selectedOrder._id}`, 
          { warehouse_manager_id: editForm.warehouse_manager_id },
          { headers: getAuthHeaders() }
        );
      }

      setSuccess('Order updated successfully');
      handleCloseEditDialog();
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
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
      await createNotification({
        recipient_id: order.warehouse_manager_id, // id của warehouse_manager nhận thông báo
        sender_id: currentUser.id, // id của supervisor (người gửi)
        type: 'import_order_assigned', // loại thông báo, bạn có thể đặt tên phù hợp
        title: `Phiếu nhập số ${order.importOrderId} đã được giao`,
        content: `Supervisor đã giao phiếu nhập số ${order.importOrderId} cho bạn.`,
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
      case 'draft': return 'default';
      case 'approved': return 'success';
      case 'delivered': return 'info';
      case 'checked': return 'warning';
      case 'arranged': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
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
    CANCELLED: 'cancelled',
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 120 }}>Order Code</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Contract Code</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Supplier</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Warehouse</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Created By</TableCell>
              <TableCell align="right" sx={{ minWidth: 120 }}>Total Amount</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Warehouse Manager</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order._id} hover>
                <TableCell>{order.import_order_code || 'N/A'}</TableCell>
                <TableCell>{order.supplier_contract_id?.contract_code || 'N/A'}</TableCell>
                <TableCell>{order.supplier_contract_id?.supplier_id?.name || 'N/A'}</TableCell>
                <TableCell>{order.warehouse_id?.name || 'N/A'}</TableCell>
                <TableCell>{order.created_by?.name || 'N/A'}</TableCell>
                <TableCell align="right">
                  {formatCurrency(order.details?.reduce((total, detail) => 
                    total + (detail.quantity * detail.unit_price), 0
                  ) || 0)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{order.warehouse_manager_id?.name || 'Not Assigned'}</TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenEditDialog(order)}
                      disabled={actionLoading}
                      title="Edit order"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton color="info" onClick={() => handleOpenDetails(order)}>
                      <InfoIcon />
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

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Import Order</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Order Code: {selectedOrder?.import_order_code}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editForm.status}
                    onChange={(e) => handleEditFormChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value={IMPORT_ORDER_STATUSES.DRAFT}>Draft</MenuItem>
                    <MenuItem value={IMPORT_ORDER_STATUSES.APPROVED}>Approved</MenuItem>
                    <MenuItem value={IMPORT_ORDER_STATUSES.DELIVERED}>Delivered</MenuItem>
                    <MenuItem value={IMPORT_ORDER_STATUSES.CHECKED}>Checked</MenuItem>
                    <MenuItem value={IMPORT_ORDER_STATUSES.ARRANGED}>Arranged</MenuItem>
                    <MenuItem value={IMPORT_ORDER_STATUSES.COMPLETED}>Completed</MenuItem>
                    <MenuItem value={IMPORT_ORDER_STATUSES.CANCELLED}>Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Warehouse Manager</InputLabel>
                  <Select
                    value={editForm.warehouse_manager_id}
                    onChange={(e) => handleEditFormChange('warehouse_manager_id', e.target.value)}
                    label="Warehouse Manager"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {warehouseManagers.map((manager) => (
                      <MenuItem key={manager._id} value={manager._id}>
                        {manager.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateOrder} 
            variant="contained" 
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Update'}
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
                  <Typography variant="h6" gutterBottom>Basic Information</Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">Order Code</Typography>
                        <Typography variant="body1">{selectedOrder.import_order_code || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                        <Chip
                          label={selectedOrder.status}
                          color={getStatusColor(selectedOrder.status)}
                          size="small"
                        />
                      </Grid>
                      
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>Contract Information</Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">Contract Code</Typography>
                        <Typography variant="body1">{selectedOrder.supplier_contract_id?.contract_code || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">Supplier</Typography>
                        <Typography variant="body1">{selectedOrder.supplier_contract_id?.supplier_id?.name || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">Contract Status</Typography>
                        <Typography variant="body1">{selectedOrder.supplier_contract_id?.status || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>Warehouse Information</Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">Warehouse</Typography>
                        <Typography variant="body1">{selectedOrder.warehouse_id?.name || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">Warehouse Manager</Typography>
                        <Typography variant="body1">{selectedOrder.warehouse_manager_id?.name || 'Not Assigned'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">Manager Email</Typography>
                        <Typography variant="body1">{selectedOrder.warehouse_manager_id?.email || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* User Info & Order Details: mỗi cái 12 trên mobile, 6 trên desktop */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>User Information</Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">Created By</Typography>
                        <Typography variant="body1">{selectedOrder.created_by?.name || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">Creator Email</Typography>
                        <Typography variant="body1">{selectedOrder.created_by?.email || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">Approved By</Typography>
                        <Typography variant="body1">{selectedOrder.approval_by?.name || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Order Details</Typography>
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
                              <TableCell align="right">
                                {formatCurrency((detail.quantity || 0) * (detail.unit_price || 0))}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={4}>
                              <Typography variant="subtitle1" fontWeight="bold">Total Amount</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle1" fontWeight="bold">
                                {formatCurrency(selectedOrder.details?.reduce((total, detail) => 
                                  total + (detail.quantity * detail.unit_price), 0
                                ) || 0)}
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
                    <Typography variant="h6" gutterBottom>Notes</Typography>
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