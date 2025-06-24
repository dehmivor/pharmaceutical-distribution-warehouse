'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Card,
  CircularProgress,
  Skeleton
} from '@mui/material';
import { Search, Visibility, Refresh } from '@mui/icons-material';
import EnhancedReceiptForm from '@/sections/warehouse/EnhancedReceiptForm';
import useImportOrders from '@/hooks/useImportOrders';

export default function CreateReceiptTab() {
  // Sử dụng useImportOrder hook thay vì mock data

  // State để quản lý dữ liệu đơn hàng đã chọn
  const [orderData, setOrderData] = useState({});
  const [selectedOrderId, setSelectedOrderId] = useState('');

  // State để quản lý thông báo
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // State để lưu trữ các phiếu nhập đã tạo
  const [createdReceipts, setCreatedReceipts] = useState([]);

  // State cho dialog chọn đơn hàng
  const [orderDialog, setOrderDialog] = useState({
    open: false,
    searchTerm: '',
    currentPage: 1
  });

  // Sử dụng hook để lấy danh sách đơn nhập
  const {
    importOrders,
    isLoading: loadingOrders,
    error: ordersError,
    mutate: refreshOrders,
    pagination
  } = useImportOrders({
    status: 'pending,confirmed', // Chỉ lấy đơn hàng chờ nhập và đã xác nhận
    page: orderDialog.currentPage,
    limit: 10,
    search: orderDialog.searchTerm
  });

  // Statistics state (có thể lấy từ API hoặc tính toán)
  const [statistics, setStatistics] = useState({
    totalExpected: 100,
    totalReceived: 50,
    totalReturned: 20,
    receivedPercentage: 50,
    totalValue: 50
  });

  // Mở dialog chọn đơn hàng
  const handleOpenOrderDialog = () => {
    setOrderDialog((prev) => ({ ...prev, open: true, currentPage: 1 }));
  };

  // Đóng dialog chọn đơn hàng
  const handleCloseOrderDialog = () => {
    setOrderDialog((prev) => ({
      ...prev,
      open: false,
      searchTerm: '',
      currentPage: 1
    }));
  };

  // Chọn đơn hàng
  const handleSelectOrder = (selectedOrder) => {
    setSelectedOrderId(selectedOrder._id);
    setOrderData({
      orderId: selectedOrder.order_code,
      supplier: selectedOrder.supplier_name,
      orderDate: selectedOrder.order_date,
      status: selectedOrder.status,
      totalItems: selectedOrder.details?.length || 0,
      totalAmount: selectedOrder.total_amount,
      items:
        selectedOrder.details?.map((detail) => ({
          id: detail._id,
          productCode: detail.medicine_id?.code || detail.medicine_code,
          productName: detail.medicine_id?.name || detail.medicine_name,
          orderedQuantity: detail.quantity,
          unit: detail.unit || 'cái'
        })) || []
    });

    handleCloseOrderDialog();

    setNotification({
      open: true,
      message: `Đã chọn đơn hàng ${selectedOrder.order_code} từ ${selectedOrder.supplier_name}`,
      severity: 'success'
    });
  };

  // Xử lý tìm kiếm đơn hàng với debounce
  const [searchTimeout, setSearchTimeout] = useState(null);
  const handleSearchChange = (event) => {
    const searchValue = event.target.value;

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout
    const newTimeout = setTimeout(() => {
      setOrderDialog((prev) => ({
        ...prev,
        searchTerm: searchValue,
        currentPage: 1
      }));
    }, 500); // Debounce 500ms

    setSearchTimeout(newTimeout);
  };

  // Xử lý phân trang
  const handlePageChange = (newPage) => {
    setOrderDialog((prev) => ({ ...prev, currentPage: newPage }));
  };

  // Refresh danh sách đơn hàng
  const handleRefreshOrders = () => {
    refreshOrders();
    setNotification({
      open: true,
      message: 'Đã làm mới danh sách đơn hàng',
      severity: 'info'
    });
  };

  // Xử lý khi tạo phiếu nhập thành công
  const handleReceiptCreate = (receiptData) => {
    try {
      // Validate dữ liệu cơ bản
      if (!receiptData.receiptId || !receiptData.receiver) {
        setNotification({
          open: true,
          message: 'Vui lòng điền đầy đủ thông tin bắt buộc (Số phiếu nhập, Người nhận hàng)',
          severity: 'error'
        });
        return;
      }

      // Kiểm tra có ít nhất một sản phẩm với số lượng > 0
      const hasValidItems = receiptData.items.some((item) => parseFloat(item.actualQuantity) > 0);

      if (!hasValidItems) {
        setNotification({
          open: true,
          message: 'Vui lòng nhập số lượng thực nhận cho ít nhất một sản phẩm',
          severity: 'error'
        });
        return;
      }

      // Lưu phiếu nhập (trong thực tế sẽ gọi API)
      const finalReceipt = {
        ...receiptData,
        id: Date.now(),
        status: 'completed',
        createdAt: new Date().toISOString(),
        createdBy: 'Current User',
        importOrderId: selectedOrderId
      };

      setCreatedReceipts((prev) => [...prev, finalReceipt]);

      // Hiển thị thông báo thành công
      setNotification({
        open: true,
        message: `Tạo phiếu nhập ${receiptData.receiptId} thành công!`,
        severity: 'success'
      });

      console.log('Phiếu nhập được tạo:', finalReceipt);

      // Reset form
      resetOrderData();

      // Refresh danh sách đơn hàng để cập nhật trạng thái
      refreshOrders();
    } catch (error) {
      console.error('Lỗi khi tạo phiếu nhập:', error);
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi tạo phiếu nhập. Vui lòng thử lại.',
        severity: 'error'
      });
    }
  };

  // Reset dữ liệu đơn hàng
  const resetOrderData = () => {
    setOrderData({});
    setSelectedOrderId('');
  };

  // Đóng thông báo
  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Render trạng thái đơn hàng
  const renderOrderStatus = (status) => {
    const statusConfig = {
      pending: { label: 'Chờ nhập', color: 'warning' },
      confirmed: { label: 'Đã xác nhận', color: 'info' },
      partial: { label: 'Nhập một phần', color: 'info' },
      completed: { label: 'Hoàn thành', color: 'success' },
      cancelled: { label: 'Đã hủy', color: 'error' }
    };

    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  // Render loading skeleton cho bảng
  const renderTableSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton variant="text" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" />
          </TableCell>
          <TableCell>
            <Skeleton variant="rectangular" width={80} height={24} />
          </TableCell>
          <TableCell align="right">
            <Skeleton variant="text" />
          </TableCell>
          <TableCell align="right">
            <Skeleton variant="text" />
          </TableCell>
          <TableCell align="center">
            <Skeleton variant="rectangular" width={60} height={32} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tạo Phiếu Kiểm Tra Đơn Nhập
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tạo phiếu nhập kho từ đơn đặt hàng hoặc nhập thủ công
      </Typography>

      {/* Hiển thị lỗi nếu có */}
      {ordersError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Lỗi khi tải danh sách đơn hàng: {ordersError.message}
        </Alert>
      )}

      {/* Nút chọn đơn hàng */}
      <Box sx={{ mb: 3 }}>
        <Button variant="outlined" onClick={handleOpenOrderDialog} sx={{ mr: 2 }} disabled={loadingOrders}>
          {loadingOrders ? <CircularProgress size={20} /> : 'Chọn Đơn Mua'}
        </Button>
        {orderData.orderId && (
          <Button variant="text" onClick={resetOrderData} color="error">
            Xóa Đơn Hàng Đã Chọn
          </Button>
        )}
      </Box>

      {/* Hiển thị thông tin đơn hàng đã chọn */}
      {orderData.orderId && orderData.supplier && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            Đang tạo phiếu nhập cho đơn hàng: <strong>{orderData.orderId}</strong>
          </Typography>
          <Typography variant="body2">
            Nhà cung cấp: {orderData.supplier} | Số sản phẩm: {orderData.items?.length || 0} | Ngày đặt:{' '}
            {new Date(orderData.orderDate).toLocaleDateString('vi-VN')}
          </Typography>
        </Alert>
      )}

      {/* Form tạo phiếu nhập */}
      {orderData.orderId && <EnhancedReceiptForm orderData={orderData} onReceiptCreate={handleReceiptCreate} />}

      {/* Dialog chọn đơn hàng */}
      <Dialog open={orderDialog.open} onClose={handleCloseOrderDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Chọn Đơn Nhập
            <IconButton onClick={handleRefreshOrders} disabled={loadingOrders}>
              <Refresh />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Tìm kiếm */}
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo mã đơn hàng hoặc nhà cung cấp..."
            onChange={handleSearchChange}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />

          {/* Bảng danh sách đơn hàng */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã Đơn Hàng</TableCell>
                  <TableCell>Nhà Cung Cấp</TableCell>
                  <TableCell>Ngày Đặt</TableCell>
                  <TableCell>Trạng Thái</TableCell>
                  <TableCell align="right">Số Sản Phẩm</TableCell>
                  <TableCell align="right">Tổng Tiền</TableCell>
                  <TableCell align="center">Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingOrders ? (
                  renderTableSkeleton()
                ) : importOrders && importOrders.length > 0 ? (
                  importOrders.map((order) => (
                    <TableRow key={order._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {order.order_code}
                        </Typography>
                      </TableCell>
                      <TableCell>{order.supplier_name}</TableCell>
                      <TableCell>{new Date(order.order_date).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>{renderOrderStatus(order.status)}</TableCell>
                      <TableCell align="right">{order.details?.length || 0}</TableCell>
                      <TableCell align="right">{order.total_amount?.toLocaleString('vi-VN') || 0} ₫</TableCell>
                      <TableCell align="center">
                        <Button variant="contained" size="small" onClick={() => handleSelectOrder(order)}>
                          Chọn
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        {orderDialog.searchTerm ? 'Không tìm thấy đơn hàng nào phù hợp' : 'Không có đơn hàng nào'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Phân trang */}
          {pagination && pagination.total_pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button disabled={!pagination.has_prev} onClick={() => handlePageChange(orderDialog.currentPage - 1)}>
                Trước
              </Button>
              <Typography sx={{ mx: 2, alignSelf: 'center' }}>
                Trang {pagination.current_page} / {pagination.total_pages}
              </Typography>
              <Button disabled={!pagination.has_next} onClick={() => handlePageChange(orderDialog.currentPage + 1)}>
                Sau
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDialog}>Hủy</Button>
        </DialogActions>
      </Dialog>

      {/* Thông báo */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
