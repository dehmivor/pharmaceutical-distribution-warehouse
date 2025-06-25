'use client';
import { useAlert } from '@/hooks/useAlert';
import useImportOrders from '@/hooks/useImportOrders';
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

  const { orders, loading, error, fetchOrders } = useImportOrders();
  const { alert, showAlert, hideAlert } = useAlert();

  // Load orders when dialog opens
  useEffect(() => {
    if (orderDialog.open) {
      fetchOrders({
        page: orderDialog.currentPage,
        limit: 10,
        filters: {
          status: 'delivered', // Updated to match actual statuses from data
          search: orderDialog.searchTerm
        }
      });
    }
  }, [orderDialog.open, orderDialog.currentPage, orderDialog.searchTerm]);

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
    // Calculate total amount from details
    const totalAmount = selectedOrder.details?.reduce((sum, detail) => sum + detail.quantity * detail.unit_price, 0) || 0;

    const convertedOrder = {
      orderId: selectedOrder._id?.slice(-8).toUpperCase() || selectedOrder._id, // Use last 8 chars of _id
      orderCode: selectedOrder.supplier_contract_id?.contract_code || 'N/A',
      supplier: selectedOrder.supplier_contract_id?.supplier_id?.name || 'Unknown Supplier',
      orderDate: new Date().toISOString(), // Use current date as no order_date in data
      status: selectedOrder.status,
      totalItems: selectedOrder.details?.length || 0,
      totalAmount: totalAmount,
      contractInfo: {
        contractCode: selectedOrder.supplier_contract_id?.contract_code,
        startDate: selectedOrder.supplier_contract_id?.start_date,
        endDate: selectedOrder.supplier_contract_id?.end_date
      },
      items:
        selectedOrder.details?.map((detail) => ({
          id: detail._id,
          productCode: detail.medicine_id?.license_code || detail.medicine_id?._id?.slice(-6),
          productName: detail.medicine_id?.medicine_name || `Medicine ${detail.medicine_id?.license_code}`,
          medicineId: detail.medicine_id?._id,
          orderedQuantity: detail.quantity,
          unitPrice: detail.unit_price,
          totalPrice: detail.quantity * detail.unit_price,
          unit: 'viên' // Default unit as not specified in data
        })) || []
    };

    setOrderData(convertedOrder);
    handleCloseOrderDialog();
    showAlert(`Đã chọn đơn hàng ${convertedOrder.orderCode} từ ${convertedOrder.supplier}`, 'success');
  };

  const handleRefresh = () => {
    fetchOrders();
    showAlert('Đã làm mới danh sách đơn hàng', 'info');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tạo Phiếu Kiểm Tra Đơn Nhập
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tạo phiếu nhập kho từ đơn đặt hàng hoặc nhập thủ công
      </Typography>

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
          {loading ? <CircularProgress size={20} /> : 'Chọn Đơn Nhập'}
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
            Đang tạo phiếu nhập cho đơn hàng: <strong>{orderData.orderCode}</strong>
          </Typography>
          <Typography variant="body2">
            Nhà cung cấp: {orderData.supplier} | Số sản phẩm: {orderData.items?.length || 0} | Tổng tiền:{' '}
            {orderData.totalAmount?.toLocaleString('vi-VN')} ₫ | Trạng thái:{' '}
            {orderData.status === 'approved' ? 'Đã duyệt' : orderData.status === 'delivered' ? 'Đã giao' : orderData.status}
          </Typography>
          {orderData.contractInfo?.contractCode && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Hợp đồng: {orderData.contractInfo.contractCode} | Hiệu lực:{' '}
              {new Date(orderData.contractInfo.startDate).toLocaleDateString('vi-VN')} -{' '}
              {new Date(orderData.contractInfo.endDate).toLocaleDateString('vi-VN')}
            </Typography>
          )}
        </Alert>
      )}

      {orderData.orderId && (
        <EnhancedReceiptForm
          orderData={orderData}
          onReceiptCreate={(receiptData) => {
            console.log('Receipt created:', receiptData);
            showAlert('Tạo phiếu nhập thành công!', 'success');
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
