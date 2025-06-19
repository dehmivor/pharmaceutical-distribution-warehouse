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
  InputAdornment
} from '@mui/material';
import { Search, Visibility } from '@mui/icons-material';
import EnhancedReceiptForm from '@/sections/warehouse/EnhancedReceiptForm';

export default function CreateReceiptTab() {
  // State để quản lý dữ liệu đơn hàng mẫu
  const [orderData, setOrderData] = useState({});

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
    orders: [],
    filteredOrders: [],
    searchTerm: ''
  });

  // Mock data cho đơn hàng - trong thực tế sẽ lấy từ API
  const mockOrders = [
    {
      orderId: 'PO001',
      supplier: 'Công ty ABC',
      orderDate: '2025-06-15',
      status: 'pending',
      totalItems: 5,
      totalAmount: 15000000,
      items: [
        { id: 1, productCode: 'SP001', productName: 'Sản phẩm A', orderedQuantity: 100, unit: 'cái' },
        { id: 2, productCode: 'SP002', productName: 'Sản phẩm B', orderedQuantity: 50, unit: 'thùng' }
      ]
    },
    {
      orderId: 'PO002',
      supplier: 'Công ty XYZ',
      orderDate: '2025-06-16',
      status: 'pending',
      totalItems: 3,
      totalAmount: 8500000,
      items: [{ id: 3, productCode: 'SP003', productName: 'Sản phẩm C', orderedQuantity: 200, unit: 'kg' }]
    },
    {
      orderId: 'PO003',
      supplier: 'Công ty DEF',
      orderDate: '2025-06-17',
      status: 'partial',
      totalItems: 8,
      totalAmount: 25000000,
      items: [
        { id: 4, productCode: 'SP004', productName: 'Sản phẩm D', orderedQuantity: 75, unit: 'hộp' },
        { id: 5, productCode: 'SP005', productName: 'Sản phẩm E', orderedQuantity: 120, unit: 'chai' }
      ]
    }
  ];

  // Load danh sách đơn hàng khi mở dialog
  useEffect(() => {
    if (orderDialog.open) {
      // Trong thực tế sẽ gọi API để lấy danh sách đơn hàng
      setOrderDialog((prev) => ({
        ...prev,
        orders: mockOrders,
        filteredOrders: mockOrders
      }));
    }
  }, [orderDialog.open]);

  // Lọc đơn hàng theo từ khóa tìm kiếm
  useEffect(() => {
    const filtered = orderDialog.orders.filter(
      (order) =>
        order.orderId.toLowerCase().includes(orderDialog.searchTerm.toLowerCase()) ||
        order.supplier.toLowerCase().includes(orderDialog.searchTerm.toLowerCase())
    );
    setOrderDialog((prev) => ({ ...prev, filteredOrders: filtered }));
  }, [orderDialog.searchTerm, orderDialog.orders]);

  // Mở dialog chọn đơn hàng
  const handleOpenOrderDialog = () => {
    setOrderDialog((prev) => ({ ...prev, open: true }));
  };

  // Đóng dialog chọn đơn hàng
  const handleCloseOrderDialog = () => {
    setOrderDialog((prev) => ({
      ...prev,
      open: false,
      searchTerm: '',
      orders: [],
      filteredOrders: []
    }));
  };

  // Chọn đơn hàng
  const handleSelectOrder = (selectedOrder) => {
    setOrderData(selectedOrder);
    handleCloseOrderDialog();

    setNotification({
      open: true,
      message: `Đã chọn đơn hàng ${selectedOrder.orderId} từ ${selectedOrder.supplier}`,
      severity: 'success'
    });
  };

  // Xử lý tìm kiếm đơn hàng
  const handleSearchChange = (event) => {
    setOrderDialog((prev) => ({ ...prev, searchTerm: event.target.value }));
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
        createdBy: 'Current User' // Thay bằng user thực tế
      };

      setCreatedReceipts((prev) => [...prev, finalReceipt]);

      // Hiển thị thông báo thành công
      setNotification({
        open: true,
        message: `Tạo phiếu nhập ${receiptData.receiptId} thành công!`,
        severity: 'success'
      });

      // Log để debug (có thể xóa trong production)
      console.log('Phiếu nhập được tạo:', finalReceipt);

      // Reset form (tạo đơn hàng mới)
      resetOrderData();
    } catch (error) {
      console.error('Lỗi khi tạo phiếu nhập:', error);
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi tạo phiếu nhập. Vui lòng thử lại.',
        severity: 'error'
      });
    }
  };

  // Reset dữ liệu đơn hàng để tạo phiếu mới
  const resetOrderData = () => {
    setOrderData({});
  };

  // Đóng thông báo
  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Render trạng thái đơn hàng
  const renderOrderStatus = (status) => {
    const statusConfig = {
      pending: { label: 'Chờ nhập', color: 'warning' },
      partial: { label: 'Nhập một phần', color: 'info' },
      completed: { label: 'Hoàn thành', color: 'success' }
    };

    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tạo Phiếu Nhập Mới
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tạo phiếu nhập kho từ đơn đặt hàng hoặc nhập thủ công
      </Typography>

      {/* Nút chọn đơn hàng */}
      <Box sx={{ mb: 3 }}>
        <Button variant="outlined" onClick={handleOpenOrderDialog} sx={{ mr: 2 }}>
          Chọn Đơn Mua
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

      {/* Component tạo phiếu nhập */}
      <EnhancedReceiptForm
        orderData={orderData}
        onReceiptCreate={handleReceiptCreate}
        checkedItems={[]} // Có thể truyền danh sách items đã chọn nếu cần
      />

      {/* Dialog chọn đơn hàng */}
      <Dialog open={orderDialog.open} onClose={handleCloseOrderDialog} maxWidth="lg" fullWidth>
        <DialogTitle>Chọn Đơn Mua</DialogTitle>
        <DialogContent>
          {/* Tìm kiếm */}
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo mã đơn hàng hoặc nhà cung cấp..."
            value={orderDialog.searchTerm}
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
                {orderDialog.filteredOrders.map((order) => (
                  <TableRow key={order.orderId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {order.orderId}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>{renderOrderStatus(order.status)}</TableCell>
                    <TableCell align="right">{order.totalItems}</TableCell>
                    <TableCell align="right">{order.totalAmount.toLocaleString('vi-VN')} ₫</TableCell>
                    <TableCell align="center">
                      <Button variant="contained" size="small" onClick={() => handleSelectOrder(order)}>
                        Chọn
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {orderDialog.filteredOrders.length === 0 && orderDialog.searchTerm && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Không tìm thấy đơn hàng nào phù hợp
              </Typography>
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
