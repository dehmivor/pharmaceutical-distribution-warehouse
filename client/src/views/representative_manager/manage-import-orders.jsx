'use client';
import {
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
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon
} from '@mui/icons-material';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import StatusChangeDialog from '@/components/StatusChangeDialog';
import { useRole } from '@/contexts/RoleContext';
import useNotifications from '@/hooks/useNotification';
import { sendError } from 'next/dist/server/api-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const RepresentativeManagerImportOrders = () => {
  const { user, userRole, isLoading } = useRole();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusDialog, setStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [contracts, setContracts] = useState([]);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const { createNotification } = useNotifications();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/import-orders`, {
        headers: getAuthHeaders(),
        timeout: 10000 // 10 seconds timeout
      });

      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      let errorMsg = 'Failed to fetch orders';

      if (error.code === 'ECONNABORTED') {
        errorMsg = 'Request timeout. Please try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMsg = 'Network error. Please check your connection.';
      } else if (error.response) {
        errorMsg = error.response.data?.error || error.response.statusText;
      } else if (error.message) {
        errorMsg = error.message;
      }

      setError(errorMsg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContracts = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/contract?partner_type=Supplier&status=active`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setContracts(response.data.data.contracts || []);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchContracts();
  }, [fetchOrders, fetchContracts]);

  const handleStatusChange = useCallback(async () => {
    if (!selectedOrder || !selectedOrder._id || !selectedOrder.nextStatus) return;

    const newStatus = selectedOrder.nextStatus;

    try {
      setUpdatingStatus(true);
      setError('');

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.patch(
        `${backendUrl}/api/import-orders/${selectedOrder._id}/status`,
        { status: newStatus },
        {
          headers: getAuthHeaders(),
          timeout: 10000 // 10 seconds timeout
        }
      );

      if (response.data.success) {
        setSuccess(`Order status updated to ${newStatus}`);
        setStatusDialog(false);
        setSelectedOrder(null);
        fetchOrders(); // Refresh the list

        if (newStatus === 'approved' || newStatus === 'rejected') {
          try {
            await createNotification({
              sender_id: user.userId,
              type: 'import_order_status',
              status: 'unread',
              priority: 'high',
              title: newStatus === 'approved' ? 'Import order approved' : 'Import order rejected',
              message: `Import Order ${selectedOrder._id} has been ${newStatus}.`
            });
          } catch (notifError) {
            console.error('Failed to create notification:', notifError);
          }
        }
      } else {
        throw new Error(response.data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      let errorMsg = 'Failed to update status';

      if (error.code === 'ECONNABORTED') {
        errorMsg = 'Request timeout. Please try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMsg = 'Network error. Please check your connection.';
      } else if (error.response) {
        errorMsg = error.response.data?.error || error.response.statusText;
      } else if (error.message) {
        errorMsg = error.message;
      }

      setError(errorMsg);
    } finally {
      setUpdatingStatus(false);
    }
  }, [selectedOrder, fetchOrders]);

  const handleOpenStatusDialog = useCallback((orderWithNextStatus) => {
    setSelectedOrder(orderWithNextStatus);
    setStatusDialog(true);
  }, []);

  const handleCloseStatusDialog = useCallback(() => {
    setStatusDialog(false);
    setSelectedOrder(null);
  }, []);

  const handleViewDetails = useCallback((order) => {
    setSelectedOrderForDetails(order);
    setDetailsDialog(true);
  }, []);

  const handleCloseDetailsDialog = useCallback(() => {
    setDetailsDialog(false);
    setSelectedOrderForDetails(null);
  }, []);

  // Check if order can be edited by representative manager
  const canEditOrder = (order) => {
    // Representative Manager chỉ có thể edit draft orders
    return order.status === 'draft';
  };

  // Check if order is locked (cannot be edited)
  const isOrderLocked = (order) => {
    // Orders bị khóa sau khi chuyển thành delivered hoặc các status sau đó
    const lockedStatuses = ['delivered', 'checked', 'arranged', 'completed'];
    return lockedStatuses.includes(order.status);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
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

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchTerm === '' ||
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.contract_id?.partner_id?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  console.log('user.role:', user.role);
  console.log(
    'orders:',
    orders.map((o) => ({ id: o._id, status: o.status }))
  );

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 600 }}>
        Import Orders Management
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
        Approve or reject draft import orders
      </Typography>
      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
        <TextField
          label="Search Orders"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status Filter">
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="checked">Checked</MenuItem>
            <MenuItem value="arranged">Arranged</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchOrders} disabled={loading} sx={{ height: 40 }}>
          Refresh
        </Button>
      </Paper>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {/* Orders Table */}
      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Order ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Supplier</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Created By</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Created Date</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Total Amount</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">{loading ? 'Loading orders...' : 'No orders found'}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    console.log(order._id, order.status, user.role, canEditOrder(order));
                    return (
                      <TableRow key={order._id} hover>
                        <TableCell>{order._id}</TableCell>
                        <TableCell>{order.contract_id?.partner_id?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip label={order.status?.toUpperCase()} color={getStatusColor(order.status)} size="small" />
                        </TableCell>
                        <TableCell>{order.created_by?.email || 'N/A'}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            {/* Chỉ representative_manager mới thấy nút Approve/Cancel khi order là draft */}
                            {userRole === 'representative_manager' && canEditOrder(order) && (
                              <>
                                <Button
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  onClick={() =>
                                    handleOpenStatusDialog({
                                      _id: order._id,
                                      status: order.status,
                                      nextStatus: 'approved'
                                    })
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onClick={() =>
                                    handleOpenStatusDialog({
                                      _id: order._id,
                                      status: order.status,
                                      nextStatus: 'rejected' // Đảm bảo luôn là 'rejected'
                                    })
                                  }
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {isOrderLocked(order) && <Chip label="LOCKED" color="error" size="small" variant="outlined" />}
                            <IconButton size="small" color="info" title="View Details" onClick={() => handleViewDetails(order)}>
                              <ViewIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      {/* Status Change Dialog */}
      <StatusChangeDialog
        open={statusDialog}
        onClose={handleCloseStatusDialog}
        onConfirm={handleStatusChange}
        currentStatus={selectedOrder?.status}
        orderId={selectedOrder?._id}
        userRole={userRole}
        loading={updatingStatus}
        nextStatus={selectedOrder?.nextStatus}
      />

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onClose={handleCloseDetailsDialog} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>Import Order Details</DialogTitle>
        <DialogContent>
          {selectedOrderForDetails && (
            <Box sx={{ mt: 2 }}>
              {/* Basic Info */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Order ID
                    </Typography>
                    <Typography variant="body2">{selectedOrderForDetails._id}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Contract
                    </Typography>
                    <Typography variant="body2">{selectedOrderForDetails.contract_id?.contract_code}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedOrderForDetails.status?.toUpperCase()}
                      color={getStatusColor(selectedOrderForDetails.status)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="body2">{formatCurrency(selectedOrderForDetails.total_amount)}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Comparison Tables */}
              <Grid container spacing={3}>
                {/* Import Order Table */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Import Order Items
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Medicine</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrderForDetails.details?.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {detail.medicine_id?.medicine_name || 'N/A'}
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                {detail.medicine_id?.license_code || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{detail.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(detail.unit_price)}</TableCell>
                            <TableCell align="right">{formatCurrency((detail.quantity || 0) * (detail.unit_price || 0))}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: 'grey.100' }}>
                          <TableCell colSpan={3}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              Total
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(
                                selectedOrderForDetails.details?.reduce(
                                  (sum, detail) => sum + (detail.quantity || 0) * (detail.unit_price || 0),
                                  0
                                )
                              )}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Contract Table */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Contract Items
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Medicine</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrderForDetails.contract_id?.items?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {item.medicine_id?.medicine_name || 'N/A'}
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                {item.medicine_id?.license_code || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{item.quantity || 'N/A'}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell align="center">
                              <Chip label="ACTIVE" color="success" size="small" variant="outlined" />
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!selectedOrderForDetails.contract_id?.items || selectedOrderForDetails.contract_id?.items.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography color="text.secondary">No contract items found</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>

              {/* Validation Summary */}
              <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Validation Summary
                </Typography>
                <Grid container spacing={2}>
                  {selectedOrderForDetails.details?.map((detail, index) => {
                    const contractItem = selectedOrderForDetails.contract_id?.items?.find(
                      (item) => item.medicine_id?._id === detail.medicine_id?._id
                    );

                    const isQuantityValid = contractItem ? detail.quantity >= contractItem.quantity : false;
                    const isPriceValid = contractItem ? detail.unit_price === contractItem.unit_price : false;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Box sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {detail.medicine_id?.medicine_name}
                          </Typography>
                          <Typography variant="body2">
                            Quantity: {detail.quantity}
                            <span style={{ color: isQuantityValid ? 'green' : 'red', marginLeft: 8 }}>
                              {isQuantityValid ? '✓ Valid' : `✗ Contract: ${contractItem?.quantity || 'N/A'}`}
                            </span>
                          </Typography>
                          <Typography variant="body2">
                            Price: {formatCurrency(detail.unit_price)}
                            <span style={{ color: isPriceValid ? 'green' : 'red', marginLeft: 8 }}>
                              {isPriceValid ? '✓ Match' : '✗ Mismatch'}
                            </span>
                          </Typography>
                          {!contractItem && (
                            <Typography variant="body2" color="error">
                              ⚠️ Not in contract
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
          <Button onClick={handleCloseDetailsDialog} variant="outlined" sx={{ minWidth: 120 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RepresentativeManagerImportOrders;
