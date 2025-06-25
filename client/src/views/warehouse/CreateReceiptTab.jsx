'use client';
import useImportOrders from '@/hooks/useImportOrders';
import useNotifications from '@/hooks/useNotification';
import DebugPanel from '@/sections/warehouse/create-inspect/DebugPanel';
import OrderSelectionDialog from '@/sections/warehouse/create-inspect/OrderSelectionDialog';
import EnhancedReceiptForm from '@/sections/warehouse/EnhancedReceiptForm';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
export default function CreateReceiptTab() {
  const [orderData, setOrderData] = useState({});
  const [orderDialog, setOrderDialog] = useState({
    open: false,
    searchTerm: '',
    currentPage: 1
  });

  const { orders, loading, error, apiDebugInfo, fetchOrders } = useImportOrders();
  const { notification, showNotification, hideNotification } = useNotifications();

  // Load orders when dialog opens
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
    showNotification(`Đã chọn đơn hàng ${selectedOrder.order_code} từ ${selectedOrder.supplier_name}`);
  };

  const handleRefresh = () => {
    fetchOrders();
    showNotification('Đã làm mới danh sách đơn hàng', 'info');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tạo Phiếu Kiểm Tra Đơn Nhập
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tạo phiếu nhập kho từ đơn đặt hàng hoặc nhập thủ công
      </Typography>

      <DebugPanel orders={orders} apiDebugInfo={apiDebugInfo} onRefresh={handleRefresh} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Lỗi khi tải danh sách đơn hàng:</Typography>
          <Typography variant="body2">{error}</Typography>
          <Button size="small" onClick={handleRefresh} sx={{ mt: 1 }}>
            Thử lại
          </Button>
        </Alert>
      )}

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

      {orderData.orderId && (
        <EnhancedReceiptForm
          orderData={orderData}
          onReceiptCreate={(receiptData) => {
            console.log('Receipt created:', receiptData);
            showNotification('Tạo phiếu nhập thành công!');
          }}
        />
      )}

      <OrderSelectionDialog
        open={orderDialog.open}
        onClose={handleCloseOrderDialog}
        orders={orders}
        loading={loading}
        searchTerm={orderDialog.searchTerm}
        onSearchChange={(e) => setOrderDialog((prev) => ({ ...prev, searchTerm: e.target.value }))}
        onSelectOrder={handleSelectOrder}
        onRefresh={handleRefresh}
      />
    </Box>
  );
}
