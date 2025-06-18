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
import { useImportOrders, useImportOrder, useImportOrderActions } from '@/hooks/useImportOrders';

function ImportOrderList({ onOrderSelect, onSendForApproval }) {
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

  // Hooks
  const { importOrders, pagination, isLoading, isError, mutate } = useImportOrders(filters);

  const { importOrder: selectedOrderDetails, isLoading: isLoadingDetails, mutate: mutateDetails } = useImportOrder(selectedOrder?.id);

  const {
    updateStatus,
    createImportOrder,
    updateImportOrder,
    updateImportOrderDetails,
    deleteImportOrder,
    receiveImportOrder,
    verifyImportOrder,
    completeImportOrder,
    updateInventory,
    performQualityCheck
  } = useImportOrderActions();

  // Cleanup cho component lifecycle
  useEffect(() => {
    let isMounted = true;

    return () => {
      isMounted = false;
      setSelectedOrder(null);
      setViewDialogOpen(false);
      setEditDialogOpen(false);
      setStatusDialogOpen(false);
      setNotification({ open: false, message: '', severity: 'success' });
    };
  }, []);

  // Cleanup cho notification timeout
  useEffect(() => {
    let timeoutId;

    if (notification.open) {
      timeoutId = setTimeout(() => {
        setNotification((prev) => ({ ...prev, open: false }));
      }, 6000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [notification.open]);

  // Cleanup cho keyboard events
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape') {
        if (viewDialogOpen) {
          setViewDialogOpen(false);
        }
        if (editDialogOpen) {
          setEditDialogOpen(false);
        }
        if (statusDialogOpen) {
          setStatusDialogOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [viewDialogOpen, editDialogOpen, statusDialogOpen]);

  // Event handlers
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
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      try {
        await deleteImportOrder(orderId);
        setNotification({
          open: true,
          message: 'Xóa đơn hàng thành công!',
          severity: 'success'
        });
        mutate();
      } catch (error) {
        setNotification({
          open: true,
          message: `Lỗi khi xóa đơn hàng: ${error.message}`,
          severity: 'error'
        });
      }
    }
  };

  const handleReceiveOrder = async (orderId) => {
    try {
      await receiveImportOrder(orderId, {
        receivedAt: new Date().toISOString(),
        receivedBy: 'current_user' // Replace with actual user
      });
      setNotification({
        open: true,
        message: 'Xác nhận nhận hàng thành công!',
        severity: 'success'
      });
      mutate();
    } catch (error) {
      setNotification({
        open: true,
        message: `Lỗi khi nhận hàng: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleVerifyOrder = async (orderId) => {
    try {
      await verifyImportOrder(orderId, {
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'current_user' // Replace with actual user
      });
      setNotification({
        open: true,
        message: 'Xác minh hàng hóa thành công!',
        severity: 'success'
      });
      mutate();
    } catch (error) {
      setNotification({
        open: true,
        message: `Lỗi khi xác minh: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await completeImportOrder(orderId, {
        completedAt: new Date().toISOString(),
        completedBy: 'current_user' // Replace with actual user
      });
      setNotification({
        open: true,
        message: 'Hoàn thành đơn hàng thành công!',
        severity: 'success'
      });
      mutate();
    } catch (error) {
      setNotification({
        open: true,
        message: `Lỗi khi hoàn thành: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleQualityCheck = async (orderId) => {
    try {
      await performQualityCheck(orderId, {
        checkedAt: new Date().toISOString(),
        checkedBy: 'current_user', // Replace with actual user
        status: 'passed'
      });
      setNotification({
        open: true,
        message: 'Kiểm tra chất lượng thành công!',
        severity: 'success'
      });
      mutate();
    } catch (error) {
      setNotification({
        open: true,
        message: `Lỗi khi kiểm tra chất lượng: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await updateStatus(selectedOrder.id, statusForm.status, statusForm.notes);
      setNotification({
        open: true,
        message: 'Cập nhật trạng thái thành công!',
        severity: 'success'
      });
      setStatusDialogOpen(false);
      mutate();
    } catch (error) {
      setNotification({
        open: true,
        message: `Lỗi khi cập nhật trạng thái: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1 // Reset page when filter changes
    }));
  };

  const handlePageChange = (event, newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage
    }));
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
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      shipped: 'Đang vận chuyển',
      received: 'Đã nhận',
      verified: 'Đã xác minh',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return statusTexts[status] || status;
  };

  if (isError) {
    return <Alert severity="error">Có lỗi xảy ra khi tải dữ liệu: {isError.message}</Alert>;
  }

  return (
    <Box>
      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select value={filters.status} label="Trạng thái" onChange={(e) => handleFilterChange('status', e.target.value)}>
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="pending">Chờ duyệt</MenuItem>
            <MenuItem value="approved">Đã duyệt</MenuItem>
            <MenuItem value="shipped">Đang vận chuyển</MenuItem>
            <MenuItem value="received">Đã nhận</MenuItem>
            <MenuItem value="verified">Đã xác minh</MenuItem>
            <MenuItem value="completed">Hoàn thành</MenuItem>
            <MenuItem value="cancelled">Đã hủy</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Mã nhà cung cấp"
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
              <TableCell>Mã đơn hàng</TableCell>
              {/* <TableCell>Nhà cung cấp</TableCell> */}
              <TableCell>Ngày nhập</TableCell>
              {/* <TableCell>Liên kết với đơn mua</TableCell> */}
              {/* <TableCell>Số mặt hàng đã nhập</TableCell> */}
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography>Đang tải...</Typography>
                </TableCell>
              </TableRow>
            ) : importOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography>Không có dữ liệu</Typography>
                </TableCell>
              </TableRow>
            ) : (
              importOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order._id}</TableCell>
                  {/* <TableCell>{order.contract_id || 'N/A'}</TableCell> */}
                  <TableCell>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  {/* <TableCell>{order.purchase_order_id || 'N/A'}</TableCell> */}
                  {/* <TableCell>{order.import_content.length || 'N/A'}</TableCell> */}
                  <TableCell>
                    <Chip label={getStatusText(order.status)} color={getStatusColor(order.status)} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Xem chi tiết">
                        <IconButton size="small" onClick={() => handleViewOrder(order)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>

                      {order.status === 'pending' && (
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small" onClick={() => handleEditOrder(order)}>
                            <LabelImportantOutlineSharp />
                          </IconButton>
                        </Tooltip>
                      )}

                      {order.status === 'shipped' && (
                        <Tooltip title="Nhận hàng">
                          <IconButton size="small" color="primary" onClick={() => handleReceiveOrder(order.id)}>
                            <LocalShipping />
                          </IconButton>
                        </Tooltip>
                      )}

                      {order.status === 'received' && (
                        <Tooltip title="Xác minh">
                          <IconButton size="small" color="secondary" onClick={() => handleVerifyOrder(order.id)}>
                            <Inventory />
                          </IconButton>
                        </Tooltip>
                      )}

                      {(order.status === 'received' || order.status === 'verified') && (
                        <Tooltip title="Kiểm tra chất lượng">
                          <IconButton size="small" color="info" onClick={() => handleQualityCheck(order.id)}>
                            {/* <QualityCheck /> */}
                          </IconButton>
                        </Tooltip>
                      )}

                      {order.status === 'verified' && (
                        <Tooltip title="Hoàn thành">
                          <IconButton size="small" color="success" onClick={() => handleCompleteOrder(order.id)}>
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Cập nhật trạng thái">
                        <IconButton size="small" onClick={() => handleStatusChange(order)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      {order.status === 'pending' && (
                        <Tooltip title="Xóa">
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
        <DialogTitle>Chi tiết đơn hàng nhập</DialogTitle>
        <DialogContent>
          {isLoadingDetails ? (
            <Typography>Đang tải...</Typography>
          ) : selectedOrderDetails ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Thông tin đơn hàng
              </Typography>
              <Typography>
                <strong>Mã đơn:</strong> {selectedOrderDetails.orderNumber}
              </Typography>
              <Typography>
                <strong>Nhà cung cấp:</strong> {selectedOrderDetails.contract_id}
              </Typography>
              <Typography>
                <strong>Ngày tạo:</strong> {new Date(selectedOrderDetails.createdAt).toLocaleString('vi-VN')}
              </Typography>
              <Typography>
                <strong>Trạng thái:</strong> {getStatusText(selectedOrderDetails.status)}
              </Typography>
              <Typography>
                <strong>Tổng tiền:</strong>{' '}
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(selectedOrderDetails.totalAmount)}
              </Typography>

              {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Chi tiết sản phẩm
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell>Số lượng</TableCell>
                        <TableCell>Đơn giá</TableCell>
                        <TableCell>Thành tiền</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrderDetails.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product?.name || 'N/A'}</TableCell>
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
            <Typography>Không có dữ liệu</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cập nhật trạng thái</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusForm.status}
                label="Trạng thái"
                onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="pending">Chờ duyệt</MenuItem>
                <MenuItem value="approved">Đã duyệt</MenuItem>
                <MenuItem value="shipped">Đang vận chuyển</MenuItem>
                <MenuItem value="received">Đã nhận</MenuItem>
                <MenuItem value="verified">Đã xác minh</MenuItem>
                <MenuItem value="completed">Hoàn thành</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Ghi chú"
              value={statusForm.notes}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleStatusUpdate} variant="contained">
            Cập nhật
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
