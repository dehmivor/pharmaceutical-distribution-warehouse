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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip
} from '@mui/material';
import axios from 'axios';
import useNotifications from '@/hooks/useNotification';

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
  const [warehouseManagers, setWarehouseManagers] = useState([]);
  const [selectedWM, setSelectedWM] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignWMDialogOpen, setAssignWMDialogOpen] = useState(false);
  const [orderToAssignWM, setOrderToAssignWM] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [orderToView, setOrderToView] = useState(null);
  const { createNotification } = useNotifications();

  useEffect(() => {
    fetchOrders();
    fetchWarehouseManagers();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/export-orders`, { headers: getAuthHeaders() });
      setOrders(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseManagers = async () => {
    try {
      const response = await axiosInstance.get('/accounts?role=warehouse_manager', {
        headers: getAuthHeaders()
      });
      setWarehouseManagers(response.data.data || []);
    } catch (error) {
      setWarehouseManagers([]);
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

      if (newStatus === 'approved') {
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
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleOpenAssignWMDialog = (order) => {
    setOrderToAssignWM(order);
    fetchWarehouseManagers();
    setAssignWMDialogOpen(true);
  };
  const handleCloseAssignWMDialog = () => {
    setAssignWMDialogOpen(false);
    setOrderToAssignWM(null);
    setSelectedWM('');
  };
  const handleAssignWM = async () => {
    if (!selectedWM || !orderToAssignWM) return;
    setAssignLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/export-orders/${orderToAssignWM._id}/assign-warehouse-manager`,
        { warehouse_manager_id: selectedWM },
        { headers: getAuthHeaders() }
      );
      setSuccess('Warehouse manager assigned!');
      fetchOrders();
      handleCloseAssignWMDialog();
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setAssignLoading(false);
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
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2, mb: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Contract</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Created By</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Warehouse Manager</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id} hover sx={{ transition: 'background 0.2s', '&:hover': { backgroundColor: '#f0f4fa' } }}>
                <TableCell sx={{ textAlign: 'center' }}>{order.contract_id?.contract_code || 'N/A'}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{order.created_by?.email || 'N/A'}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Chip
                    label={order.status}
                    color={order.status === 'approved' ? 'success' : order.status === 'draft' ? 'default' : 'info'}
                    size="small"
                  />
                </TableCell>
                <TableCell
                  sx={{
                    textAlign: 'center',
                    fontWeight: order.warehouse_manager_id ? 600 : 400,
                    color: order.warehouse_manager_id ? 'text.primary' : 'text.disabled'
                  }}
                >
                  {order.warehouse_manager_id?.email || '-'}
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Box display="flex" gap={1} justifyContent="center">
                    {order.status === 'draft' ? (
                      <Button variant="contained" color="success" onClick={() => handleOpenApproveDialog(order)}>
                        Approve
                      </Button>
                    ) : order.status === 'approved' && !order.warehouse_manager_id ? (
                      <Button variant="contained" color="primary" onClick={() => handleOpenAssignWMDialog(order)}>
                        Gán WM
                      </Button>
                    ) : null}
                    <Button variant="outlined" color="info" onClick={() => handleOpenDetailsDialog(order)}>
                      Xem chi tiết
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No export orders to process.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
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
      <Dialog open={assignWMDialogOpen} onClose={handleCloseAssignWMDialog}>
        <DialogTitle>Gán Warehouse Manager</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Warehouse Manager</InputLabel>
            <Select value={selectedWM} onChange={(e) => setSelectedWM(e.target.value)} label="Warehouse Manager" required>
              {warehouseManagers.map((wm) => (
                <MenuItem key={wm._id} value={wm._id}>
                  {wm.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignWMDialog}>Cancel</Button>
          <Button onClick={handleAssignWM} variant="contained" disabled={assignLoading || !selectedWM}>
            {assignLoading ? 'Assigning...' : 'Assign WM'}
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
