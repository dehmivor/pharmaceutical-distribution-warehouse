'use client';

import { useAlert } from '@/hooks/useAlert';
import useImportOrders from '@/hooks/useImportOrders';
import OrderSelectionDialog from '@/sections/warehouse/create-inspect/OrderSelectionDialog';
import PaymentVoucherForm from '@/sections/representative/debt-manage/PaymentVoucherForm';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function CreateDebtNoteTab() {
  const [orderData, setOrderData] = useState({});
  const [orderDialog, setOrderDialog] = useState({
    open: false,
    searchTerm: '',
    currentPage: 1
  });

  const { orders, loading, error, fetchOrders } = useImportOrders();
  const { alert, showAlert, hideAlert } = useAlert();

  // Load orders only when dialog opens or params change
  useEffect(() => {
    if (orderDialog.open) {
      fetchOrders({
        page: orderDialog.currentPage,
        limit: 10,
        filters: {
          status: 'delivered',
          search: orderDialog.searchTerm
        }
      });
    }
  }, [orderDialog.open, orderDialog.currentPage, orderDialog.searchTerm]);

  // Initial fetch for orders list (can be optional)
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
    const totalAmount = selectedOrder.details?.reduce((sum, detail) => sum + detail.quantity * detail.unit_price, 0) || 0;

    const convertedOrder = {
      _id: selectedOrder._id, // giữ _id để PaymentVoucherForm lấy import_order_id
      orderId: selectedOrder._id?.slice(-8).toUpperCase() || selectedOrder._id,
      orderCode: selectedOrder.supplier_contract_id?.contract_code || 'N/A',
      supplier: selectedOrder.supplier_contract_id?.supplier_id?.name || 'Nhà cung cấp chưa rõ',
      orderDate: new Date().toISOString(),
      status: selectedOrder.status,
      totalItems: selectedOrder.details?.length || 0,
      totalAmount,
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
          unit: 'viên'
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
        Tạo Phiếu Công Nợ
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tạo phiếu công nợ từ đơn đặt hàng đã giao hoặc nhập thủ công
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
          {loading ? <CircularProgress size={20} /> : 'Chọn Đơn Hàng'}
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
            Đang tạo phiếu công nợ cho đơn hàng: <strong>{orderData.orderCode}</strong>
          </Typography>
          <Typography variant="body2">
            Nhà cung cấp: {orderData.supplier} | Số sản phẩm: {orderData.items?.length || 0} | Tổng tiền:{' '}
            {orderData.totalAmount?.toLocaleString('vi-VN', {
              style: 'currency',
              currency: 'VND'
            })}{' '}
            | Trạng thái: {orderData.status === 'delivered' ? 'Đã giao' : orderData.status === 'approved' ? 'Đã duyệt' : orderData.status}
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

      {orderData._id && (
        <PaymentVoucherForm
          orderData={orderData}
          onSubmit={(billData) => {
            console.log('Phiếu công nợ được tạo:', billData);
            showAlert('Tạo phiếu công nợ thành công!', 'success');
          }}
        />
      )}

      <OrderSelectionDialog
        open={orderDialog.open}
        onClose={handleCloseOrderDialog}
        orders={orders}
        loading={loading}
        searchTerm={orderDialog.searchTerm}
        onSearchChange={(e) =>
          setOrderDialog((prev) => ({
            ...prev,
            searchTerm: e.target.value
          }))
        }
        onSelectOrder={handleSelectOrder}
        onRefresh={handleRefresh}
      />

      {alert.open && (
        <Alert severity={alert.severity} sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          {alert.message}
          <Button color="inherit" size="small" onClick={hideAlert}>
            Đóng
          </Button>
        </Alert>
      )}
    </Box>
  );
}
