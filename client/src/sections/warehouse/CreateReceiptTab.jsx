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
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Search, Visibility, Refresh, BugReport, ExpandMore } from '@mui/icons-material';
import EnhancedReceiptForm from '@/sections/warehouse/EnhancedReceiptForm';

export default function CreateReceiptTab() {
  // State để quản lý dữ liệu đơn hàng
  const [orderData, setOrderData] = useState({});

  // State cho API data
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiDebugInfo, setApiDebugInfo] = useState(null);

  // State để quản lý thông báo
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // State cho dialog chọn đơn hàng
  const [orderDialog, setOrderDialog] = useState({
    open: false,
    searchTerm: '',
    currentPage: 1
  });
  // Enhanced fetch function với debugging
  const fetchOrders = async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Build URL với parameters
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
        ...params.filters
      });

      const url = `/api/import-orders?${queryParams.toString()}`;

      console.log('🔍 Fetching from URL:', url);
      console.log('🔑 Auth token:', localStorage.getItem('auth-token') ? 'Present' : 'Missing');

      const token = localStorage.getItem('auth-token');
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log('📤 Request headers:', headers);

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);

      // Store debug info
      setApiDebugInfo({
        url,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        timestamp: new Date().toISOString()
      });

      // Kiểm tra cấu trúc response
      if (data.success) {
        const ordersData = data.data || [];
        console.log('📦 Orders received:', ordersData.length);

        setOrders(ordersData);

        // Nếu không có data, hiển thị thông báo debug
        if (ordersData.length === 0) {
          setNotification({
            open: true,
            message: `API trả về thành công nhưng không có đơn hàng nào. Total: ${data.pagination?.total || 0}`,
            severity: 'warning'
          });
        }
      } else {
        throw new Error(data.message || 'API response unsuccessful');
      }
    } catch (error) {
      console.error('💥 Fetch error:', error);
      setError(error.message);

      // Fallback to mock data trong development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Using mock data as fallback');
        setNotification({
          open: true,
          message: 'Lỗi API, đang sử dụng dữ liệu mẫu',
          severity: 'info'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Test API với các parameters khác nhau
  const testDifferentParams = async () => {
    console.log('🧪 Testing different API parameters...');

    const testCases = [
      { name: 'No params', params: {} },
      { name: 'All status', params: { status: '' } },
      { name: 'Pending only', params: { status: 'pending' } },
      { name: 'All statuses', params: { status: 'pending,confirmed,completed' } },
      { name: 'Large limit', params: { limit: 100 } },
      { name: 'No filters', params: { page: 1, limit: 50 } }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`🧪 Testing: ${testCase.name}`, testCase.params);

        const queryParams = new URLSearchParams({
          page: testCase.params.page || 1,
          limit: testCase.params.limit || 10,
          ...testCase.params
        });

        const response = await fetch(`/api/import-orders?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        console.log(`✅ ${testCase.name} result:`, {
          status: response.status,
          total: data.pagination?.total,
          dataLength: data.data?.length
        });
      } catch (error) {
        console.error(`❌ ${testCase.name} failed:`, error);
      }
    }
  };

  // Load danh sách đơn hàng khi mở dialog
  useEffect(() => {
    if (orderDialog.open) {
      fetchOrders({
        page: orderDialog.currentPage,
        limit: 10,
        filters: {
          status: 'pending,confirmed',
          search: orderDialog.searchTerm
        }
      });
    }
  }, [orderDialog.open, orderDialog.currentPage, orderDialog.searchTerm]);

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, []);

  // Lọc đơn hàng theo từ khóa tìm kiếm (local filter cho mock data)
  const filteredOrders = orders.filter((order) => {
    if (!orderDialog.searchTerm) return true;
    const searchLower = orderDialog.searchTerm.toLowerCase();
    return order.order_code?.toLowerCase().includes(searchLower) || order.supplier_name?.toLowerCase().includes(searchLower);
  });

  const handleOpenOrderDialog = () => {
    setOrderDialog((prev) => ({ ...prev, open: true, currentPage: 1 }));
  };

  const handleCloseOrderDialog = () => {
    setOrderDialog((prev) => ({
      ...prev,
      open: false,
      searchTerm: '',
      currentPage: 1
    }));
  };

  const handleSelectOrder = (selectedOrder) => {
    // Convert API response format to component format
    const convertedOrder = {
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
    };

    setOrderData(convertedOrder);
    handleCloseOrderDialog();

    setNotification({
      open: true,
      message: `Đã chọn đơn hàng ${selectedOrder.order_code} từ ${selectedOrder.supplier_name}`,
      severity: 'success'
    });
  };

  const handleSearchChange = (event) => {
    const searchValue = event.target.value;
    setOrderDialog((prev) => ({ ...prev, searchTerm: searchValue }));
  };

  const handleRefresh = () => {
    fetchOrders();
    setNotification({
      open: true,
      message: 'Đã làm mới danh sách đơn hàng',
      severity: 'info'
    });
  };

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

  // Debug panel
  const renderDebugPanel = () => (
    <Accordion sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugReport fontSize="small" />
          <Typography variant="caption">Debug Information (Orders: {orders.length})</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button size="small" onClick={testDifferentParams} variant="outlined">
            Test Different Params
          </Button>
          <Button size="small" onClick={handleRefresh} variant="outlined">
            Refresh Data
          </Button>
        </Box>

        <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem', overflow: 'auto' }}>
          {JSON.stringify(apiDebugInfo, null, 2)}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tạo Phiếu Kiểm Tra Đơn Nhập
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tạo phiếu nhập kho từ đơn đặt hàng hoặc nhập thủ công
      </Typography>

      {/* Debug Panel cho development */}
      {process.env.NODE_ENV === 'development' && renderDebugPanel()}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Lỗi khi tải danh sách đơn hàng:</Typography>
          <Typography variant="body2">{error}</Typography>
          <Button size="small" onClick={handleRefresh} sx={{ mt: 1 }}>
            Thử lại
          </Button>
        </Alert>
      )}

      {/* Empty Data Warning */}
      {!loading && !error && orders.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Không có đơn hàng nào</Typography>
          <Typography variant="body2">API trả về thành công nhưng danh sách đơn hàng trống. Có thể do:</Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Database chưa có dữ liệu</li>
            <li>Filters loại bỏ tất cả records</li>
            <li>Permissions không đủ để xem data</li>
          </ul>
        </Alert>
      )}

      {/* Nút chọn đơn hàng */}
      <Box sx={{ mb: 3 }}>
        <Button variant="outlined" onClick={handleOpenOrderDialog} sx={{ mr: 2 }} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Chọn Đơn Mua'}
        </Button>
        {orderData.orderId && (
          <Button variant="text" onClick={() => setOrderData({})} color="error">
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
      {orderData.orderId && (
        <EnhancedReceiptForm
          orderData={orderData}
          onReceiptCreate={(receiptData) => {
            console.log('Receipt created:', receiptData);
            setNotification({
              open: true,
              message: 'Tạo phiếu nhập thành công!',
              severity: 'success'
            });
          }}
        />
      )}

      {/* Dialog chọn đơn hàng */}
      <Dialog open={orderDialog.open} onClose={handleCloseOrderDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Chọn Đơn Nhập ({orders.length} đơn hàng)
            <IconButton onClick={handleRefresh} disabled={loading}>
              <Refresh />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
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

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
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
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
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
                          {orderDialog.searchTerm ? 'Không tìm thấy đơn hàng nào phù hợp' : 'Không có đơn hàng nào trong hệ thống'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
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
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
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
