'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import useInspection from '@/hooks/useInspection';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import ReceiptStatistics from '../dashboard-import/ReceiptStatistics';
import { Delete as DeleteIcon } from '@mui/icons-material';

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

function EnhancedReceiptForm({ checkedItems = [], onReceiptCreate }) {
  const router = useRouter();
  const params = useParams();
  const importOrderId = params.importOrderId;

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
  const [createError, setCreateError] = useState(null);
  const { createInspection, loading, error } = useInspection();

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

        if (!order?._id) throw new Error('Không tìm thấy đơn hàng hợp lệ');

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
        setLoadError(e.message || 'Lỗi khi tải đơn hàng');
        enqueueSnackbar(e.message || 'Lỗi khi tải đơn hàng', { variant: 'error' });
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchImportOrder();
  }, [importOrderId]);

  useEffect(() => {
    const currentOrderId = orderData?._id;
    const currentCheckedItemsLength = checkedItems.length;

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
      } else if (checkedItems.length > 0) {
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
  }, [orderData, checkedItems]);

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

  const updateReceiptItem = useCallback(
    (id, field, value) => {
      setReceiptItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            let newValue = value;
            if (['actualQuantity', 'rejectedQuantity', 'expectedQuantity'].includes(field)) {
              newValue = parseFloat(value);
              if (isNaN(newValue) || newValue < 0) {
                enqueueSnackbar('Số lượng phải lớn hơn hoặc bằng 0', { variant: 'warning' });
                return item;
              }
            }

            const updatedItem = { ...item, [field]: newValue };

            const currentActualQty = field === 'actualQuantity' ? newValue : parseFloat(item.actualQuantity) || 0;
            const currentRejectedQty = field === 'rejectedQuantity' ? newValue : parseFloat(item.rejectedQuantity) || 0;
            const expectedQty = parseFloat(item.expectedQuantity) || 0;

            if (currentActualQty + currentRejectedQty > expectedQty) {
              enqueueSnackbar('Tổng số lượng thực nhận và từ chối không được vượt quá số lượng dự kiến', { variant: 'error' });
              return item;
            }

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
    [convertUnit]
  );

  const removeItem = useCallback((id) => {
    setReceiptItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

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

  const getStatusText = useCallback((status) => {
    switch (status) {
      case 'received':
        return 'Đã nhận đủ';
      case 'partial':
        return 'Nhận một phần';
      case 'shortage':
        return 'Thiếu hàng';
      default:
        return 'Đang chờ';
    }
  }, []);

  const getCurrentUserId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return 'defaultUserIdMongoObjectId';

      const userObj = JSON.parse(userStr);
      return userObj.userId || userObj.id || 'defaultUserIdMongoObjectId';
    } catch (err) {
      // Nếu parse lỗi hoặc không có userId
      return 'defaultUserIdMongoObjectId';
    }
  };

  const handleCreateReceipt = useCallback(async () => {
    if (receiptItems.length === 0) {
      enqueueSnackbar('Vui lòng thêm ít nhất một sản phẩm', { variant: 'warning' });
      return;
    }
    if (!orderData?._id) {
      enqueueSnackbar('Chưa có dữ liệu đơn hàng hợp lệ.', { variant: 'error' });
      return;
    }
    setIsCreating(true);

    try {
      const inspectionsPayload = receiptItems.map((item) => ({
        import_order_id: orderData._id,
        medicine_id: item.medicineId,
        actual_quantity: parseFloat(item.actualQuantity) || 0,
        rejected_quantity: parseFloat(item.rejectedQuantity) || 0,
        note: item.notes || receiptData.notes || '',
        created_by: getCurrentUserId()
      }));

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

      enqueueSnackbar(res.data.message, { variant: 'success' });
      if (onReceiptCreate) onReceiptCreate(res.data);
      router.push('/wh-import-orders');
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || error.message || 'Lỗi khi tạo phiếu kiểm nhập', { variant: 'error' });
    } finally {
      setIsCreating(false);
    }
  }, [receiptItems, orderData, receiptData.notes, onReceiptCreate, router]);

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

  return (
    <Box>
      {/* Form tạo phiếu */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tạo Phiếu Kiểm Tra Nhập
          </Typography>
          <form onSubmit={(e) => e.preventDefault()}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số phiếu nhập"
                  value={receiptData.receiptId}
                  onChange={(e) => setReceiptData((prev) => ({ ...prev, receiptId: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ngày nhập"
                  type="date"
                  value={receiptData.date}
                  onChange={(e) => setReceiptData((prev) => ({ ...prev, date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Mã đơn hàng" value={receiptData.orderId} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Nhà cung cấp" value={receiptData.supplier} InputProps={{ readOnly: true }} />
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Danh sách hàng hóa */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Danh Sách Hàng Hóa ({receiptItems.length} sản phẩm)</Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mã SP</TableCell>
                  <TableCell>Tên sản phẩm</TableCell>
                  <TableCell>SL dự kiến</TableCell>
                  <TableCell>SL từ chối</TableCell>
                  <TableCell>SL thực nhận</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Ghi chú</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receiptItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <TextField
                        size="small"
                        value={item.productCode}
                        onChange={(e) => updateReceiptItem(item.id, 'productCode', e.target.value)}
                        sx={{ minWidth: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={item.productName}
                        onChange={(e) => updateReceiptItem(item.id, 'productName', e.target.value)}
                        sx={{ minWidth: 150 }}
                      />
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
                        <FormControl size="small" sx={{ minWidth: 60 }}>
                          <Select
                            disabled
                            value={item.expectedUnit}
                            onChange={(e) => updateReceiptItem(item.id, 'expectedUnit', e.target.value)}
                          >
                            {Object.keys(UNIT_CONVERSIONS).map((unit) => (
                              <MenuItem key={unit} value={unit}>
                                {unit}
                              </MenuItem>
                            ))}
                            <MenuItem value="viên">viên</MenuItem>
                          </Select>
                        </FormControl>
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
                        <FormControl size="small" sx={{ minWidth: 60 }}>
                          <Select
                            disabled
                            value={item.expectedUnit}
                            onChange={(e) => updateReceiptItem(item.id, 'expectedUnit', e.target.value)}
                          >
                            {Object.keys(UNIT_CONVERSIONS).map((unit) => (
                              <MenuItem key={unit} value={unit}>
                                {unit}
                              </MenuItem>
                            ))}
                            <MenuItem value="viên">viên</MenuItem>
                          </Select>
                        </FormControl>
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
                        <FormControl size="small" sx={{ minWidth: 60 }}>
                          <Select
                            disabled
                            value={item.actualUnit}
                            onChange={(e) => updateReceiptItem(item.id, 'actualUnit', e.target.value)}
                          >
                            {Object.keys(UNIT_CONVERSIONS).map((unit) => (
                              <MenuItem key={unit} value={unit}>
                                {unit}
                              </MenuItem>
                            ))}
                            <MenuItem value="viên">viên</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={getStatusText(item.status)} color={getStatusColor(item.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={receiptData.notes}
                        onChange={(e) => setReceiptData((prev) => ({ ...prev, notes: e.target.value }))}
                        sx={{ minWidth: 150 }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => removeItem(item.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Thống kê */}
      <ReceiptStatistics statistics={statistics} items={receiptItems} />

      {/* Nút tạo phiếu */}
      <Box display="flex" justifyContent="center" gap={2} mt={3}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleCreateReceipt}
          disabled={receiptItems.length === 0 || isCreating || loadingOrder}
          startIcon={isCreating ? <CircularProgress size={20} /> : null}
          sx={{ minWidth: 200 }}
        >
          {isCreating ? 'Đang tạo phiếu...' : 'Tạo Phiếu Nhập Kho'}
        </Button>
      </Box>
    </Box>
  );
}

export default EnhancedReceiptForm;
