'use client';
import { useParams } from 'next/navigation';
import { useAlert } from '@/hooks/useAlert';
import { useEffect, useState } from 'react';
import EnhancedReceiptForm from '@/sections/warehouse/create-inspect/EnhancedReceiptForm';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export default function CreateInspectionWithExistImportOrderId() {
  const params = useParams();
  const importOrderId = params.importOrderId;
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showAlert } = useAlert();

  // Hàm fetch đơn hàng theo id
  const fetchOrderById = async (orderId) => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';

      const response = await fetch(`${backendUrl}/api/import-orders/${orderId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Lỗi khi tải đơn hàng');
      }

      return result.data;
    } catch (err) {
      setError(err.message);
      showAlert(`Lỗi: ${err.message}`, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Hàm convert đơn hàng
  const convertOrderData = (selectedOrder) => {
    const totalAmount = selectedOrder.details?.reduce((sum, detail) => sum + detail.quantity * detail.unit_price, 0) || 0;

    return {
      orderId: selectedOrder._id?.slice(-8).toUpperCase() || selectedOrder._id,
      orderCode: selectedOrder.supplier_contract_id?.contract_code || 'N/A',
      supplier: selectedOrder.supplier_contract_id?.supplier_id?.name || 'Unknown Supplier',
      orderDate: selectedOrder.order_date || selectedOrder.createdAt || new Date().toISOString(),
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
          unit: 'viên'
        })) || []
    };
  };

  useEffect(() => {
    if (importOrderId) {
      fetchOrderById(importOrderId).then((selectedOrder) => {
        if (selectedOrder) {
          const convertedOrder = convertOrderData(selectedOrder);
          setOrderData(convertedOrder);
          showAlert(`Đã tải đơn hàng ${convertedOrder.orderCode} từ ${convertedOrder.supplier}`, 'success');
        }
      });
    }
  }, [importOrderId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="subtitle2">Lỗi khi tải đơn hàng:</Typography>
        <Typography variant="body2">{error}</Typography>
      </Alert>
    );
  }

  if (!orderData) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Không tìm thấy đơn hàng với ID: {importOrderId}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tạo Phiếu Kiểm Tra Đơn Nhập
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tạo phiếu kiểm nhập từ đơn đặt hàng đã chọn
      </Typography>

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

      <EnhancedReceiptForm
        orderData={orderData}
        onReceiptCreate={(receiptData) => {
          console.log('Receipt created:', receiptData);
          showAlert('Tạo phiếu nhập thành công!', 'success');
        }}
      />
    </Box>
  );
}
