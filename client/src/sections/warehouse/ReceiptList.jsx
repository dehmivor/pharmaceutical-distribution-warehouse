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

function ImportOrderList({ onOrderSelect, onSendForApproval }) {
  const mockImportOrders = [
    {
      _id: 'IO001',
      id: 'IO001',
      orderNumber: 'IO001',
      status: 'pending',
      createdAt: '2024-06-15T10:30:00Z',
      contract_id: 'Nhà cung cấp A',
      totalAmount: 5000000,
      items: [
        { product: { name: 'Sản phẩm A' }, quantity: 10, unitPrice: 250000 },
        { product: { name: 'Sản phẩm B' }, quantity: 5, unitPrice: 500000 }
      ]
    },
    {
      _id: 'IO002',
      id: 'IO002',
      orderNumber: 'IO002',
      status: 'approved',
      createdAt: '2024-06-14T14:20:00Z',
      contract_id: 'Nhà cung cấp B',
      totalAmount: 3500000,
      items: [{ product: { name: 'Sản phẩm C' }, quantity: 7, unitPrice: 500000 }]
    },
    {
      _id: 'IO003',
      id: 'IO003',
      orderNumber: 'IO003',
      status: 'shipped',
      createdAt: '2024-06-13T09:15:00Z',
      contract_id: 'Nhà cung cấp C',
      totalAmount: 7200000,
      items: [{ product: { name: 'Sản phẩm D' }, quantity: 12, unitPrice: 600000 }]
    },
    {
      _id: 'IO004',
      id: 'IO004',
      orderNumber: 'IO004',
      status: 'received',
      createdAt: '2024-06-12T16:45:00Z',
      contract_id: 'Nhà cung cấp D',
      totalAmount: 2800000,
      items: [{ product: { name: 'Sản phẩm E' }, quantity: 4, unitPrice: 700000 }]
    },
    {
      _id: 'IO005',
      id: 'IO005',
      orderNumber: 'IO005',
      status: 'verified',
      createdAt: '2024-06-11T11:30:00Z',
      contract_id: 'Nhà cung cấp E',
      totalAmount: 4100000,
      items: [{ product: { name: 'Sản phẩm F' }, quantity: 6, unitPrice: 683333 }]
    },
    {
      _id: 'IO006',
      id: 'IO006',
      orderNumber: 'IO006',
      status: 'completed',
      createdAt: '2024-06-10T08:15:00Z',
      contract_id: 'Nhà cung cấp F',
      totalAmount: 6300000,
      items: [{ product: { name: 'Sản phẩm G' }, quantity: 9, unitPrice: 700000 }]
    }
  ];

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
  }; // Mock functions thay thế cho API calls
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
  }; // Cleanup cho component lifecycle
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
  }, [selectedOrder]); // Event handlers - cập nhật để sử dụng mock data
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
        receivedBy: 'current_user'
      });
      setNotification({
        open: true,
        message: 'Xác nhận nhận hàng thành công!',
        severity: 'success'
      });
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
        verifiedBy: 'current_user'
      });
      setNotification({
        open: true,
        message: 'Xác minh hàng hóa thành công!',
        severity: 'success'
      });
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
        completedBy: 'current_user'
      });
      setNotification({
        open: true,
        message: 'Hoàn thành đơn hàng thành công!',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `Lỗi khi hoàn thành: ${error.message}`,
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
    } catch (error) {
      setNotification({
        open: true,
        message: `Lỗi khi cập nhật trạng thái: ${error.message}`,
        severity: 'error'
      });
    }
  }; // Filter mock data based on current filters
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
