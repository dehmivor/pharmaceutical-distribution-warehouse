import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Box,
  Typography,
  Alert,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import { Visibility, Edit, Delete, CheckCircle, LabelImportantOutlineSharp, LocalShipping, Inventory } from '@mui/icons-material';
import useTrans from '@/hooks/useTrans';

function ImportOrderList({ onOrderSelect, onSendForApproval }) {
  const trans = useTrans();

  // State declarations
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    supplierId: '',
    page: 1,
    limit: 10
  });

  // Form states
  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: ''
  });

  // State cho mock data
  const [importOrders, setImportOrders] = useState(mockImportOrders);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isError, setIsError] = useState(null);

  // Mock pagination
  const pagination = {
    totalPages: Math.ceil(importOrders.length / filters.limit)
  };

  // Mock functions thay thế cho API calls
  const updateStatus = async (orderId, status, notes) => {
    console.log(`Updating order ${orderId} to status ${status} with notes: ${notes}`);
    setImportOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const deleteImportOrder = async (orderId) => {
    console.log(`Deleting order ${orderId}`);
    setImportOrders((prev) => prev.filter((order) => order.id !== orderId));
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const receiveImportOrder = async (orderId, data) => {
    console.log(`Receiving order ${orderId}`, data);
    setImportOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: 'received' } : order)));
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const verifyImportOrder = async (orderId, data) => {
    console.log(`Verifying order ${orderId}`, data);
    setImportOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: 'verified' } : order)));
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const completeImportOrder = async (orderId, data) => {
    console.log(`Completing order ${orderId}`, data);
    setImportOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: 'completed' } : order)));
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const performQualityCheck = async (orderId, data) => {
    console.log(`Quality checking order ${orderId}`, data);
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const mutate = () => {
    console.log('Refreshing data...');
    // Không cần làm gì vì đã có mock data
  };

  const mutateDetails = () => {
    console.log('Refreshing order details...');
    // Không cần làm gì
  };

  // Add missing functions
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (event, newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage
    }));
  };

  // Cleanup cho component lifecycle
  useEffect(() => {
    let isMounted = true;

    // Simulate loading mock data
    setIsLoading(true);
    setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      isMounted = false;
      setSelectedOrder(null);
      setViewDialogOpen(false);
      setEditDialogOpen(false);
      setStatusDialogOpen(false);
      setNotification({ open: false, message: '', severity: 'success' });
    };
  }, []);

  // Load selected order details khi cần
  useEffect(() => {
    if (selectedOrder) {
      setIsLoadingDetails(true);
      setTimeout(() => {
        const orderDetails = mockImportOrders.find((order) => order.id === selectedOrder.id);
        setSelectedOrderDetails(orderDetails);
        setIsLoadingDetails(false);
      }, 300);
    }
  }, [selectedOrder]);

  // Event handlers - cập nhật để sử dụng mock data
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
    if (onOrderSelect) {
      onOrderSelect(order);
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setEditDialogOpen(true);
  };

  const handleStatusChange = (order) => {
    setSelectedOrder(order);
    setStatusForm({
      status: order.status,
      notes: ''
    });
    setStatusDialogOpen(true);
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm(trans.common.confirmDeleteOrder)) {
      try {
        await deleteImportOrder(orderId);
        setNotification({
          open: true,
          message: trans.common.deleteOrderSuccess,
          severity: 'success'
        });
      } catch (error) {
        setNotification({
          open: true,
          message: `${trans.common.errorDeletingOrder}: ${error.message}`,
          severity: 'error'
        });
      }
    }
  };

  const handleReceiveOrder = async (orderId) => {
    try {
      await receiveImportOrder(orderId, {
        receivedAt: new Date().toISOString(),
        receivedBy: 'current_user'
      });
      setNotification({
        open: true,
        message: trans.common.receiveOrderSuccess,
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `${trans.common.errorReceivingOrder}: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleVerifyOrder = async (orderId) => {
    try {
      await verifyImportOrder(orderId, {
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'current_user'
      });
      setNotification({
        open: true,
        message: trans.common.verifyOrderSuccess,
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `${trans.common.errorVerifyingOrder}: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await completeImportOrder(orderId, {
        completedAt: new Date().toISOString(),
        completedBy: 'current_user'
      });
      setNotification({
        open: true,
        message: trans.common.completeOrderSuccess,
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `${trans.common.errorCompletingOrder}: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await updateStatus(selectedOrder.id, statusForm.status, statusForm.notes);
      setNotification({
        open: true,
        message: trans.common.updateStatusSuccess,
        severity: 'success'
      });
      setStatusDialogOpen(false);
    } catch (error) {
      setNotification({
        open: true,
        message: `${trans.common.errorUpdatingStatus}: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Filter mock data based on current filters
  const filteredOrders = importOrders.filter((order) => {
    const statusMatch = filters.status === 'all' || order.status === filters.status;
    const supplierMatch = !filters.supplierId || order.contract_id.toLowerCase().includes(filters.supplierId.toLowerCase());
    return statusMatch && supplierMatch;
  });

  // Paginate filtered results
  const startIndex = (filters.page - 1) * filters.limit;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + filters.limit);

  // Update pagination info
  const updatedPagination = {
    totalPages: Math.ceil(filteredOrders.length / filters.limit)
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'warning',
      approved: 'info',
      shipped: 'primary',
      received: 'secondary',
      verified: 'success',
      completed: 'success',
      cancelled: 'error'
    };
    return statusColors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: trans.common.pending,
      approved: trans.common.approved,
      shipped: trans.common.shipped,
      received: trans.common.received,
      verified: trans.common.verified,
      completed: trans.common.completed,
      cancelled: trans.common.cancelled
    };
    return statusTexts[status] || status;
  };

  if (isError) {
    return (
      <Alert severity="error">
        {trans.common.errorLoadingData}: {isError.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{trans.common.status}</InputLabel>
          <Select value={filters.status} label={trans.common.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <MenuItem value="all">{trans.common.allStatuses}</MenuItem>
            <MenuItem value="pending">{trans.common.pending}</MenuItem>
            <MenuItem value="approved">{trans.common.approved}</MenuItem>
            <MenuItem value="shipped">{trans.common.shipped}</MenuItem>
            <MenuItem value="received">{trans.common.received}</MenuItem>
            <MenuItem value="verified">{trans.common.verified}</MenuItem>
            <MenuItem value="completed">{trans.common.completed}</MenuItem>
            <MenuItem value="cancelled">{trans.common.cancelled}</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          label={trans.common.supplierCode}
          value={filters.supplierId}
          onChange={(e) => handleFilterChange('supplierId', e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{trans.common.orderCode}</TableCell>
              <TableCell>{trans.common.importDate}</TableCell>
              <TableCell>{trans.common.status}</TableCell>
              <TableCell align="center">{trans.common.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography>{trans.common.loading}</Typography>
                </TableCell>
              </TableRow>
            ) : importOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography>{trans.common.noData}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              importOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order._id}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell>
                    <Chip label={getStatusText(order.status)} color={getStatusColor(order.status)} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title={trans.common.viewDetails}>
                        <IconButton size="small" onClick={() => handleViewOrder(order)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>

                      {order.status === 'pending' && (
                        <Tooltip title={trans.common.edit}>
                          <IconButton size="small" onClick={() => handleEditOrder(order)}>
                            <LabelImportantOutlineSharp />
                          </IconButton>
                        </Tooltip>
                      )}

                      {order.status === 'shipped' && (
                        <Tooltip title={trans.common.receiveOrder}>
                          <IconButton size="small" color="primary" onClick={() => handleReceiveOrder(order.id)}>
                            <LocalShipping />
                          </IconButton>
                        </Tooltip>
                      )}

                      {order.status === 'received' && (
                        <Tooltip title={trans.common.verify}>
                          <IconButton size="small" color="secondary" onClick={() => handleVerifyOrder(order.id)}>
                            <Inventory />
                          </IconButton>
                        </Tooltip>
                      )}

                      {order.status === 'verified' && (
                        <Tooltip title={trans.common.complete}>
                          <IconButton size="small" color="success" onClick={() => handleCompleteOrder(order.id)}>
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title={trans.common.updateStatus}>
                        <IconButton size="small" onClick={() => handleStatusChange(order)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      {order.status === 'pending' && (
                        <Tooltip title={trans.common.delete}>
                          <IconButton size="small" color="error" onClick={() => handleDeleteOrder(order.id)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={pagination.totalPages} page={filters.page} onChange={handlePageChange} color="primary" />
        </Box>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{trans.common.importOrderDetails}</DialogTitle>
        <DialogContent>
          {isLoadingDetails ? (
            <Typography>{trans.common.loading}</Typography>
          ) : selectedOrderDetails ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                {trans.common.orderInformation}
              </Typography>
              <Typography>
                <strong>{trans.common.orderCode}:</strong> {selectedOrderDetails.orderNumber}
              </Typography>
              <Typography>
                <strong>{trans.common.supplier}:</strong> {selectedOrderDetails.contract_id}
              </Typography>
              <Typography>
                <strong>{trans.common.createdDate}:</strong> {new Date(selectedOrderDetails.createdAt).toLocaleString('vi-VN')}
              </Typography>
              <Typography>
                <strong>{trans.common.status}:</strong> {getStatusText(selectedOrderDetails.status)}
              </Typography>
              <Typography>
                <strong>{trans.common.totalAmount}:</strong>{' '}
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(selectedOrderDetails.totalAmount)}
              </Typography>

              {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {trans.common.productDetails}
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{trans.common.product}</TableCell>
                        <TableCell>{trans.common.quantity}</TableCell>
                        <TableCell>{trans.common.unitPrice}</TableCell>
                        <TableCell>{trans.common.total}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrderDetails.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product?.name || trans.common.na}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(item.unitPrice)}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(item.quantity * item.unitPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          ) : (
            <Typography>{trans.common.noData}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>{trans.common.close}</Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{trans.common.updateStatus}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>{trans.common.status}</InputLabel>
              <Select
                value={statusForm.status}
                label={trans.common.status}
                onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="pending">{trans.common.pending}</MenuItem>
                <MenuItem value="approved">{trans.common.approved}</MenuItem>
                <MenuItem value="shipped">{trans.common.shipped}</MenuItem>
                <MenuItem value="received">{trans.common.received}</MenuItem>
                <MenuItem value="verified">{trans.common.verified}</MenuItem>
                <MenuItem value="completed">{trans.common.completed}</MenuItem>
                <MenuItem value="cancelled">{trans.common.cancelled}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label={trans.common.notes}
              value={statusForm.notes}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>{trans.common.cancel}</Button>
          <Button onClick={handleStatusUpdate} variant="contained">
            {trans.common.update}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar open={notification.open} autoHideDuration={6000} onClose={() => setNotification((prev) => ({ ...prev, open: false }))}>
        <Alert
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ImportOrderList;
