'use client';

import useInspection from '@/hooks/useInspection';
import useTrans from '@/hooks/useTrans';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReceiptStatistics from '../dashboard-import/ReceiptStatistics';

const UNIT_CONVERSIONS = {
  kg: { g: 1000, tấn: 0.001 },
  g: { kg: 0.001, tấn: 0.000001 },
  tấn: { kg: 1000, g: 1000000 },
  thùng: { hộp: 12, cái: 144 },
  hộp: { thùng: 1 / 12, cái: 12 },
  cái: { hộp: 1 / 12, thùng: 1 / 144 },
  lít: { ml: 1000, gallon: 0.264172 },
  ml: { lít: 0.001, gallon: 0.000264172 },
  gallon: { lít: 3.78541, ml: 3785.41 },
  viên: { gói: 10, hộp: 100 }
};

function EnhancedReceiptForm({ checkedItems, onReceiptCreate }) {
  const router = useRouter();
  const params = useParams();
  const trans = useTrans();
  const importOrderId = params.importOrderId;
  const [inspections, setInspections] = useState([]);
  const [loadingInspections, setLoadingInspections] = useState(false);
  const [inspectionsError, setInspectionsError] = useState(null);

  const [orderData, setOrderData] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [receiptData, setReceiptData] = useState({
    receiptId: `PN${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    orderId: '',
    supplier: '',
    warehouse: 'Kho chính',
    notes: ''
  });

  const [receiptItems, setReceiptItems] = useState([]);
  const [statistics, setStatistics] = useState({
    totalExpected: 0,
    totalReceived: 0,
    totalReturned: 0,
    receivedPercentage: 0,
    totalValue: 0
  });

  const isInitialized = useRef(false);
  const lastOrderId = useRef(null);
  const lastCheckedItemsLength = useRef(0);

  const convertUnit = useCallback((quantity, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return quantity;
    const conversions = UNIT_CONVERSIONS[fromUnit];
    if (conversions && conversions[toUnit]) {
      return quantity * conversions[toUnit];
    }
    return quantity;
  }, []);

  const [isCreating, setIsCreating] = useState(false);
  const { createInspection, loading, error } = useInspection();

  // Fetch import order data
  useEffect(() => {
    if (!importOrderId) return;

    const fetchImportOrder = async () => {
      try {
        setLoadingOrder(true);
        setLoadError(null);

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${backendUrl}/api/import-orders/${importOrderId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth-token') || ''}`
          }
        });

        const order = response.data.data || response.data;
        console.log('🔍 Fetched import order:', order);

        if (!order?._id) throw new Error(trans.common.noValidOrderData);

        setOrderData(order);

        setReceiptData((prev) => ({
          ...prev,
          orderId: order._id,
          supplier: order?.contract_id?.partner_id?.name || order?.partner_id?.name || ''
        }));

        let items = [];
        if (Array.isArray(order.details)) {
          items = order.details.map((item, i) => ({
            id: i + 1,
            medicineId: item.medicine_id?._id || item.medicine_id || null,
            productCode: item.medicine_id?.license_code || '',
            productName: item.medicine_id?.medicine_name || '',
            expectedQuantity: parseFloat(item.quantity) || 0,
            expectedUnit: item.medicine_id?.unit_of_measure || 'viên',
            actualQuantity: 0,
            actualUnit: item.medicine_id?.unit_of_measure || 'viên',
            rejectedQuantity: 0,
            unitPrice: parseFloat(item.unit_price) || 0,
            notes: '',
            status: 'pending'
          }));
        }
        setReceiptItems(items);
      } catch (e) {
        setLoadError(e.message || trans.common.errorLoadingOrder);
        enqueueSnackbar(e.message || trans.common.errorLoadingOrder, { variant: 'error' });
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchImportOrder();
  }, [importOrderId, inspections, setInspections, enqueueSnackbar, checkedItems, trans]);

  // Initialize receiptItems when orderData or checkedItems changes
  useEffect(() => {
    const currentOrderId = orderData?._id;
    const currentCheckedItemsLength = checkedItems?.length || 0;

    if (!isInitialized.current || lastOrderId.current !== currentOrderId || lastCheckedItemsLength.current !== currentCheckedItemsLength) {
      let initialItems = [];

      if (Array.isArray(orderData?.details) && orderData.details.length > 0) {
        initialItems = orderData.details.map((item, index) => ({
          id: index + 1,
          productCode: item.medicine_id?.license_code || '',
          productName: item.medicine_id?.medicine_name || '',
          expectedQuantity: parseFloat(item.quantity) || 0,
          expectedUnit: item.medicine_id?.unit_of_measure || 'viên',
          actualQuantity: 0,
          actualUnit: item.medicine_id?.unit_of_measure || 'viên',
          rejectedQuantity: 0,
          unitPrice: parseFloat(item.unit_price) || 0,
          lotNumber: '',
          expiryDate: '',
          notes: '',
          status: 'pending',
          medicineId: item.medicine_id?._id || item.medicine_id || null
        }));
      } else if (checkedItems?.length > 0) {
        initialItems = checkedItems.map((item, index) => ({
          ...item,
          id: index + 1,
          actualUnit: item.expectedUnit || item.unit || 'viên',
          status: 'pending'
        }));
      }

      if (initialItems.length > 0 || receiptItems.length !== initialItems.length) {
        setReceiptItems(initialItems);
      }

      isInitialized.current = true;
      lastOrderId.current = currentOrderId;
      lastCheckedItemsLength.current = currentCheckedItemsLength;

      if (currentOrderId !== receiptData.orderId) {
        setReceiptData((prev) => ({
          ...prev,
          orderId: orderData?._id || '',
          supplier: orderData?.contract_id?.partner_id?.name || orderData?.partner_id?.name || ''
        }));
      }
    }
  }, [orderData, checkedItems, inspections, trans]);

  // Fetch inspections for this order
  useEffect(() => {
    if (!importOrderId) return;

    const fetchInspections = async () => {
      setLoadingInspections(true);
      setInspectionsError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${backendUrl}/api/inspections/by-import-ord/${importOrderId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth-token') || ''}`
          }
        });

        setInspections(response.data || []);
        console.log('🔍 Fetched inspections:', response.data);
      } catch (error) {
        setInspectionsError(error.message || trans.common.errorLoadingInspections);
      } finally {
        setLoadingInspections(false);
      }
    };

    fetchInspections();
  }, [importOrderId, trans]);

  // Calculate statistics
  const calculateStatistics = useCallback(() => {
    const totalExpected = receiptItems.reduce((sum, item) => sum + (parseFloat(item.expectedQuantity) || 0), 0);

    const totalReceived = receiptItems.reduce((sum, item) => {
      const actualQty = parseFloat(item.actualQuantity) || 0;
      const convertedQty = convertUnit(actualQty, item.actualUnit, item.expectedUnit);
      return sum + convertedQty;
    }, 0);

    const totalReturned = receiptItems.reduce((sum, item) => {
      const rejectedQty = parseFloat(item.rejectedQuantity) || 0;
      const convertedRejectedQty = convertUnit(rejectedQty, item.expectedUnit, item.expectedUnit);
      return sum + convertedRejectedQty;
    }, 0);

    const receivedPercentage = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;

    const totalValue = receiptItems.reduce((sum, item) => {
      return sum + (parseFloat(item.actualQuantity) || 0) * (parseFloat(item.unitPrice) || 0);
    }, 0);

    return { totalExpected, totalReceived, totalReturned, receivedPercentage, totalValue };
  }, [receiptItems, convertUnit]);

  useEffect(() => {
    const newStats = calculateStatistics();
    setStatistics((prevStats) => {
      if (
        prevStats.totalExpected !== newStats.totalExpected ||
        prevStats.totalReceived !== newStats.totalReceived ||
        prevStats.totalReturned !== newStats.totalReturned ||
        prevStats.receivedPercentage !== newStats.receivedPercentage ||
        prevStats.totalValue !== newStats.totalValue
      ) {
        return newStats;
      }
      return prevStats;
    });
  }, [calculateStatistics]);

  // Update a single item property
  const updateReceiptItem = useCallback(
    (id, field, value) => {
      setReceiptItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            let newValue = value;
            if (['actualQuantity', 'rejectedQuantity', 'expectedQuantity'].includes(field)) {
              newValue = parseFloat(value);
              if (isNaN(newValue) || newValue < 0) {
                enqueueSnackbar(trans.common.quantityMustBeGreaterThanZero, { variant: 'warning' });
                return item;
              }
            }

            const updatedItem = { ...item, [field]: newValue };

            const currentActualQty = field === 'actualQuantity' ? newValue : parseFloat(item.actualQuantity) || 0;
            const currentRejectedQty = field === 'rejectedQuantity' ? newValue : parseFloat(item.rejectedQuantity) || 0;
            const expectedQty = parseFloat(item.expectedQuantity) || 0;

            updatedItem.actualQuantity = currentActualQty;
            updatedItem.rejectedQuantity = currentRejectedQty;

            const convertedActualQty = convertUnit(currentActualQty, updatedItem.actualUnit, updatedItem.expectedUnit);
            const convertedRejectedQty = convertUnit(currentRejectedQty, updatedItem.expectedUnit, updatedItem.expectedUnit);

            if (convertedActualQty === 0 && convertedRejectedQty === 0) {
              updatedItem.status = 'pending';
            } else if (convertedActualQty + convertedRejectedQty >= expectedQty) {
              updatedItem.status = 'received';
            } else if (convertedActualQty > 0 && convertedActualQty < expectedQty) {
              updatedItem.status = 'partial';
            } else if (convertedActualQty === 0 && convertedRejectedQty > 0) {
              updatedItem.status = 'shortage';
            }

            return updatedItem;
          }
          return item;
        })
      );
    },
    [convertUnit, trans]
  );

  // Remove item (only for unchecked items)
  const removeItem = useCallback((id) => {
    setReceiptItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Get chip color and text for status
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'received':
        return 'success';
      case 'partial':
        return 'warning';
      case 'shortage':
        return 'error';
      default:
        return 'default';
    }
  }, []);

  const getStatusText = useCallback(
    (status) => {
      switch (status) {
        case 'received':
          return trans.common.receivedEnough;
        case 'partial':
          return trans.common.partialReceived;
        case 'shortage':
          return trans.common.shortage;
        default:
          return trans.common.waiting;
      }
    },
    [trans]
  );

  // Get current user ID (simplified)
  const getCurrentUserId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return 'defaultUserIdMongoObjectId';

      const userObj = JSON.parse(userStr);
      return userObj.userId || userObj.id || 'defaultUserIdMongoObjectId';
    } catch (err) {
      return 'defaultUserIdMongoObjectId';
    }
  };

  // Handle create receipt submit
  const handleCreateReceipt = useCallback(async () => {
    if (receiptItems.length === 0) {
      enqueueSnackbar(trans.common.pleaseAddAtLeastOneProduct, { variant: 'warning' });
      return;
    }

    if (!orderData?._id) {
      enqueueSnackbar(trans.common.noValidOrderData, { variant: 'error' });
      return;
    }

    // LỌC: Chỉ lấy những items có actual_quantity > 0 để tạo inspection
    const validItems = receiptItems.filter((item) => parseFloat(item.actualQuantity) > 0);

    // Kiểm tra có ít nhất 1 item hợp lệ
    if (validItems.length === 0) {
      enqueueSnackbar('Vui lòng nhập số lượng thực nhập cho ít nhất một sản phẩm', { variant: 'warning' });
      return;
    }

    setIsCreating(true);

    try {
      // TẠO inspection chỉ cho những items có actual_quantity > 0
      const inspectionsPayload = validItems.map((item) => ({
        import_order_id: orderData._id,
        medicine_id: item.medicineId,
        actual_quantity: parseFloat(item.actualQuantity),
        rejected_quantity: parseFloat(item.rejectedQuantity) || 0,
        note: item.notes || receiptData.notes || '',
        created_by: getCurrentUserId()
      }));

      console.log(
        '✅ Tạo inspection cho items:',
        validItems.map((item) => ({
          productName: item.productName,
          actualQuantity: item.actualQuantity
        }))
      );
      console.log(
        '❌ Bỏ qua items:',
        receiptItems
          .filter((item) => parseFloat(item.actualQuantity) === 0)
          .map((item) => ({
            productName: item.productName,
            actualQuantity: item.actualQuantity
          }))
      );

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await axios.post(
        `${backendUrl}/api/inspections`,
        { inspections: inspectionsPayload },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth-token') || ''}`
          }
        }
      );

      enqueueSnackbar(`Tạo thành công ${validItems.length} phiếu kiểm nhập`, { variant: 'success' });
      if (onReceiptCreate) onReceiptCreate(res.data);

      // Reload trang sau khi tạo thành công
      window.location.reload();
    } catch (error) {
      enqueueSnackbar(trans.common.cannotCreateInspectionReceipt, { variant: 'error' });
    } finally {
      setIsCreating(false);
    }
  }, [receiptItems, orderData, receiptData.notes, onReceiptCreate, trans]);

  // Loading and error states
  if (loadingOrder) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ m: 2 }}>
        <Typography color="error">{loadError}</Typography>
      </Box>
    );
  }
  const inspectedMedicineIds = new Set(
    inspections.map((i) => {
      if (typeof i.medicine_id === 'object' && i.medicine_id !== null && '_id' in i.medicine_id) {
        return i.medicine_id._id;
      }
      return i.medicine_id;
    })
  );

  const uncheckedItems = receiptItems.filter((item) => !inspectedMedicineIds.has(item.medicineId));

  checkedItems = receiptItems.filter((item) => inspectedMedicineIds.has(item.medicineId));

  return (
    <Box>
      {/* Form tạo phiếu */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {trans.common.createInspectionReceipt}
          </Typography>
          <form onSubmit={(e) => e.preventDefault()}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={12}>
                <TextField
                  fullWidth
                  label="Created by"
                  value={orderData?.created_by?.name || orderData?.created_by?.email.split('@')[0] || 'Chưa có thông tin'}
                  InputProps={{
                    readOnly: true,
                    disabled: true
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={trans.common.importDate}
                  type="date"
                  value={receiptData.date}
                  InputProps={{
                    readOnly: true,
                    disabled: true
                  }}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    disabled: true
                  }}
                  label={trans.common.orderCode}
                  value={receiptData.orderId}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    disabled: true
                  }}
                  label={trans.common.supplier}
                  value={receiptData.supplier}
                />
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Danh sách hàng hóa chưa kiểm */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              {trans.common.uncheckedItems} ({uncheckedItems?.length} {trans.common.products})
            </Typography>
          </Box>
          {uncheckedItems.length === 0 && (
            <Typography variant="body2" color="textPrimary" mb={2}>
              {trans.common.noItemsToCheck}
            </Typography>
          )}
          {uncheckedItems.length !== 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{trans.common.productCode}</TableCell>
                    <TableCell>{trans.common.productName}</TableCell>
                    <TableCell>{trans.common.expectedQuantity}</TableCell>
                    <TableCell>{trans.common.actualQuantity}</TableCell>
                    <TableCell>{trans.common.rejectedQuantity}</TableCell>
                    <TableCell>{trans.common.status}</TableCell>
                    <TableCell>{trans.common.notes}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uncheckedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ minWidth: 100 }}>
                          {item.productCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ minWidth: 100 }}>
                          {item.productName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TextField
                            size="small"
                            type="number"
                            value={item.expectedQuantity}
                            onChange={(e) => updateReceiptItem(item.id, 'expectedQuantity', e.target.value)}
                            sx={{ width: 80 }}
                            disabled
                          />
                          <Box sx={{ minWidth: 60, pl: 1 }}>
                            <Typography variant="body2">{item.expectedUnit}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TextField
                            size="small"
                            type="number"
                            value={item.actualQuantity}
                            onChange={(e) => updateReceiptItem(item.id, 'actualQuantity', e.target.value)}
                            sx={{ width: 80 }}
                          />
                          <Box sx={{ minWidth: 60, pl: 1 }}>
                            <Typography variant="body2">{item.expectedUnit}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TextField
                            size="small"
                            type="number"
                            value={item.rejectedQuantity || 0}
                            onChange={(e) => updateReceiptItem(item.id, 'rejectedQuantity', e.target.value)}
                            sx={{ width: 80 }}
                          />
                          <Box sx={{ minWidth: 60, pl: 1 }}>
                            <Typography variant="body2">{item.expectedUnit}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={getStatusText(item.status)} color={getStatusColor(item.status)} size="small" />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.notes}
                          onChange={(e) => updateReceiptItem(item.id, 'notes', e.target.value)}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Thống kê */}
      {!loadingInspections && (
        <ReceiptStatistics statistics={statistics} items={receiptItems} inspections={inspections} setInspections={setInspections} />
      )}

      {loadingInspections && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Nút tạo phiếu */}
      <Box display="flex" justifyContent="center" gap={2} mt={3}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleCreateReceipt}
          disabled={
            uncheckedItems?.length === 0 ||
            isCreating ||
            loadingOrder ||
            // ENABLE khi có ít nhất 1 item có actual quantity > 0
            !receiptItems.some((item) => parseFloat(item.actualQuantity) > 0)
          }
          startIcon={isCreating ? <CircularProgress size={20} /> : null}
          sx={{ minWidth: 200 }}
        >
          {isCreating ? trans.common.creatingReceipt : trans.common.createWarehouseReceipt}
        </Button>
      </Box>
    </Box>
  );
}

export default EnhancedReceiptForm;
