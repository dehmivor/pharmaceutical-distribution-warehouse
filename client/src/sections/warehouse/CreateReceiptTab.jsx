import React, { useState } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import EnhancedReceiptForm from '@/sections/warehouse/EnhancedReceiptForm';

export default function CreateReceiptTab() {
  // State để quản lý dữ liệu đơn hàng mẫu
  const [orderData, setOrderData] = useState({
    orderId: 'PO2024001',
    supplier: 'Công ty TNHH ABC',
    items: [
      {
        productCode: 'SP001',
        productName: 'Sản phẩm A',
        quantity: 100,
        unit: 'cái',
        unitPrice: 15000
      },
      {
        productCode: 'SP002',
        productName: 'Sản phẩm B',
        quantity: 50,
        unit: 'kg',
        unitPrice: 25000
      }
    ]
  });

  // State để quản lý thông báo
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // State để lưu trữ các phiếu nhập đã tạo
  const [createdReceipts, setCreatedReceipts] = useState([]);

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
    setOrderData({
      orderId: `PO${Date.now()}`,
      supplier: '',
      items: []
    });
  };

  // Đóng thông báo
  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Tạo dữ liệu đơn hàng mẫu cho demo
  const createSampleOrder = () => {
    setOrderData({
      orderId: `PO${Date.now()}`,
      supplier: 'Nhà cung cấp mẫu',
      items: [
        {
          productCode: 'DEMO001',
          productName: 'Sản phẩm Demo 1',
          quantity: 20,
          unit: 'cái',
          unitPrice: 50000
        },
        {
          productCode: 'DEMO002',
          productName: 'Sản phẩm Demo 2',
          quantity: 10,
          unit: 'kg',
          unitPrice: 75000
        }
      ]
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tạo Phiếu Nhập Mới
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tạo phiếu nhập kho từ đơn đặt hàng hoặc nhập thủ công
      </Typography>

      {/* Hiển thị thông tin tóm tắt nếu có đơn hàng */}
      {orderData.orderId && orderData.supplier && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            Đang tạo phiếu nhập cho đơn hàng: <strong>{orderData.orderId}</strong>
          </Typography>
          <Typography variant="body2">
            Nhà cung cấp: {orderData.supplier} | Số sản phẩm: {orderData.items?.length || 0}
          </Typography>
        </Alert>
      )}

      {/* Component tạo phiếu nhập */}
      <EnhancedReceiptForm
        orderData={orderData}
        onReceiptCreate={handleReceiptCreate}
        checkedItems={[]} // Có thể truyền danh sách items đã chọn nếu cần
      />

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

      {/* Debug info - có thể xóa trong production */}
      {process.env.NODE_ENV === 'development' && createdReceipts.length > 0 && (
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Debug: Phiếu nhập đã tạo ({createdReceipts.length})
          </Typography>
          {createdReceipts.map((receipt, index) => (
            <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace' }}>
              {receipt.receiptId} - {receipt.statistics.totalReceived} sản phẩm -{new Date(receipt.createdAt).toLocaleString('vi-VN')}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}
