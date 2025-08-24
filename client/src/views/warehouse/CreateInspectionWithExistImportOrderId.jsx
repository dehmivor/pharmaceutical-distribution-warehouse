'use client';
import { useParams, useRouter } from 'next/navigation';
import { useAlert } from '@/hooks/useAlert';
import { useEffect, useState } from 'react';
import EnhancedReceiptForm from '@/sections/warehouse/create-inspect/EnhancedReceiptForm';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import useTrans from '@/hooks/useTrans';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export default function CreateInspectionWithExistImportOrderId() {
  const params = useParams();
  const trans = useTrans();
  const importOrderId = params.importOrderId;
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showAlert } = useAlert();
  const router = useRouter();

  // Hàm fetch đơn hàng theo id
  const fetchOrderById = async (orderId) => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';

      const response = await fetch(`${backendUrl}/api/import-orders/${orderId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(trans.common.orderNotFound);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || trans.common.errorLoadingOrder);
      }

      return result.data;
    } catch (err) {
      setError(err.message);
      showAlert(`${trans.common.error}: ${err.message}`, 'error');
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
      orderCode: selectedOrder.contract_id?.contract_code || 'N/A',
      supplier: selectedOrder.contract_id?.partner_id?.name || trans.common.unknownSupplier,
      orderDate: selectedOrder.createdAt || new Date().toISOString(),
      status: selectedOrder.status,
      totalItems: selectedOrder.details?.length || 0,
      totalAmount: totalAmount,
      contractInfo: {
        contractCode: selectedOrder.contract_id?.contract_code,
        startDate: selectedOrder.contract_id?.start_date,
        endDate: selectedOrder.contract_id?.end_date
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
          unit: trans.common.unit
        })) || []
    };
  };

  useEffect(() => {
    if (importOrderId) {
      fetchOrderById(importOrderId).then((selectedOrder) => {
        if (selectedOrder) {
          const convertedOrder = convertOrderData(selectedOrder);
          setOrderData(convertedOrder);
          showAlert(
            `${trans.common.orderLoadedSuccessfully} ${convertedOrder.orderCode} ${trans.common.from} ${convertedOrder.supplier}`,
            'success'
          );
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
        <Typography variant="subtitle2">{trans.common.errorLoadingOrderDetails}:</Typography>
        <Typography variant="body2">{error}</Typography>
      </Alert>
    );
  }

  if (!orderData) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        {trans.common.orderNotFoundWithId}: {importOrderId}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">{trans.common.createInspectionReceiptFromOrder}</Typography>
        <Box display="flex" gap={2}>
          <Button variant="contained" className="p-4" onClick={() => router.push(`/wh-import-orders/${importOrderId}`)}>
            Start Allocation
          </Button>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {trans.common.createInspectionFromSelectedOrder}
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2">
          {trans.common.creatingReceiptForOrder}: <strong>{orderData.orderCode}</strong>
        </Typography>
        <Typography variant="body2">
          {trans.common.supplier}: {orderData.supplier} | {trans.common.numberOfProducts}: {orderData.items?.length || 0} |{' '}
          {trans.common.totalAmount}: {orderData.totalAmount?.toLocaleString('vi-VN')} ₫ | {trans.common.status}:{' '}
          {orderData.status === 'approved'
            ? trans.common.approved
            : orderData.status === 'delivered'
              ? trans.common.delivered
              : orderData.status}
        </Typography>
        {orderData.contractInfo?.contractCode && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {trans.common.contract}: {orderData.contractInfo.contractCode} | {trans.common.validity}:{' '}
            {new Date(orderData.contractInfo.startDate).toLocaleDateString('vi-VN')} -{' '}
            {new Date(orderData.contractInfo.endDate).toLocaleDateString('vi-VN')}
          </Typography>
        )}
      </Alert>

      <EnhancedReceiptForm
        orderData={orderData}
        onReceiptCreate={(receiptData) => {
          console.log('Receipt created:', receiptData);
          showAlert(trans.common.receiptCreatedSuccessfully, 'success');
        }}
      />
    </Box>
  );
}
