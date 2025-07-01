'use client';

import { useAlert, alert, hideAlert, showAlert } from '@/hooks/useAlert';
import useInspection from '@/hooks/useInspection';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  Alert,
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
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
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
function EnhancedReceiptForm({ orderData, checkedItems = [], onReceiptCreate }) {
  const [receiptData, setReceiptData] = useState({
    receiptId: `PN${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    orderId: orderData?.orderId || '',
    supplier: orderData?.supplier || '',
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

  const { alert, showAlert, hideAlert } = useAlert();

  useEffect(() => {
    const currentOrderId = orderData?.orderId;
    const currentCheckedItemsLength = checkedItems.length;

    if (!isInitialized.current || lastOrderId.current !== currentOrderId || lastCheckedItemsLength.current !== currentCheckedItemsLength) {
      let initialItems = [];

      if (orderData?.items?.length > 0) {
        initialItems = orderData.items.map((item, index) => ({
          id: index + 1,
          productCode: item.productCode || '',
          productName: item.productName || '',
          expectedQuantity: parseFloat(item.orderedQuantity) || 0, // Fix: sử dụng orderedQuantity
          expectedUnit: item.unit || 'viên',
          actualQuantity: 0,
          actualUnit: item.unit || 'viên',
          unitPrice: parseFloat(item.unitPrice) || 0,
          lotNumber: '',
          expiryDate: '',
          notes: '',
          status: 'pending'
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

      // Update refs
      isInitialized.current = true;
      lastOrderId.current = currentOrderId;
      lastCheckedItemsLength.current = currentCheckedItemsLength;

      // Update receipt data khi orderData thay đổi
      if (currentOrderId !== receiptData.orderId) {
        setReceiptData((prev) => ({
          ...prev,
          orderId: orderData?.orderId || '',
          supplier: orderData?.supplier || ''
        }));
      }
    }
  }, [
    orderData?.orderId, // Chỉ phụ thuộc vào orderId thay vì toàn bộ orderData object
    orderData?.supplier,
    orderData?.items?.length, // Chỉ phụ thuộc vào length thay vì toàn bộ items array
    checkedItems.length, // Chỉ phụ thuộc vào length
    receiptData.orderId
  ]);

  // Tính toán thống kê - FIX: Sử dụng useCallback và tối ưu dependencies
  const calculateStatistics = useCallback(() => {
    const totalExpected = receiptItems.reduce((sum, item) => sum + (parseFloat(item.expectedQuantity) || 0), 0);

    const totalReceived = receiptItems.reduce((sum, item) => {
      const actualQty = parseFloat(item.actualQuantity) || 0;
      const convertedQty = convertUnit(actualQty, item.actualUnit, item.expectedUnit);
      return sum + convertedQty;
    }, 0);

    const totalReturned = receiptItems.reduce((sum, item) => {
      const expected = parseFloat(item.expectedQuantity) || 0;
      const actualQty = parseFloat(item.actualQuantity) || 0;
      const convertedQty = convertUnit(actualQty, item.actualUnit, item.expectedUnit);
      return sum + Math.max(0, expected - convertedQty);
    }, 0);

    const receivedPercentage = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;
    const totalValue = receiptItems.reduce((sum, item) => {
      return sum + (parseFloat(item.actualQuantity) || 0) * (parseFloat(item.unitPrice) || 0);
    }, 0);

    return {
      totalExpected,
      totalReceived,
      totalReturned,
      receivedPercentage,
      totalValue
    };
  }, [receiptItems, convertUnit]);

  // Update statistics khi receiptItems thay đổi - FIX: Sử dụng functional update
  useEffect(() => {
    const newStats = calculateStatistics();

    // Chỉ update khi statistics thực sự thay đổi
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
  }, [calculateStatistics]); // Chỉ phụ thuộc vào memoized function

  // Cập nhật thông tin sản phẩm - FIX: Sử dụng useCallback
  const updateReceiptItem = useCallback(
    (id, field, value) => {
      setReceiptItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updatedItem = { ...item, [field]: value };

            // Cập nhật trạng thái dựa trên số lượng nhận
            if (field === 'actualQuantity' || field === 'actualUnit') {
              const actualQty = parseFloat(field === 'actualQuantity' ? value : updatedItem.actualQuantity) || 0;
              const expectedQty = parseFloat(updatedItem.expectedQuantity) || 0;
              const convertedQty = convertUnit(actualQty, updatedItem.actualUnit, updatedItem.expectedUnit);

              if (convertedQty === 0) {
                updatedItem.status = 'pending';
              } else if (convertedQty >= expectedQty) {
                updatedItem.status = 'received';
              } else if (convertedQty < expectedQty) {
                updatedItem.status = 'shortage';
              }

              if (convertedQty > 0 && convertedQty < expectedQty) {
                updatedItem.status = 'partial';
              }
            }

            return updatedItem;
          }
          return item;
        })
      );
    },
    [convertUnit]
  );

  // Thêm sản phẩm mới - FIX: Sử dụng useCallback
  const addNewItem = useCallback(() => {
    setReceiptItems((prev) => {
      const newItem = {
        id: prev.length + 1,
        productCode: '',
        productName: '',
        expectedQuantity: 0,
        expectedUnit: 'viên',
        actualQuantity: 0,
        actualUnit: 'viên',
        unitPrice: 0,
        lotNumber: '',
        expiryDate: '',
        notes: '',
        status: 'pending'
      };
      return [...prev, newItem];
    });
  }, []);

  // Xóa sản phẩm - FIX: Sử dụng useCallback
  const removeItem = useCallback((id) => {
    setReceiptItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Lấy màu sắc cho trạng thái
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

  // Lấy text cho trạng thái
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

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const receipt = {
        ...receiptData,
        items: receiptItems,
        statistics,
        totalItems: receiptItems.length,
        createdAt: new Date().toISOString(),
        status: 'draft'
      };
      onReceiptCreate?.(receipt);
    },
    [receiptData, receiptItems, statistics, onReceiptCreate]
  );

  const handleCreateReceipt = useCallback(async () => {
    if (receiptItems.length === 0) {
      showAlert('Vui lòng thêm ít nhất một sản phẩm', 'warning');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      console.log('📦 Order data:', orderData);

      const inspectionData = {
        import_order_id: '6859812162c95723b56b32a9',
        batch_id: null,
        actual_quantity: statistics.totalReceived,
        rejected_quantity: statistics.totalReturned,
        note: receiptData.notes || '',
        created_by: '685aba038d7e1e2eb3d86bd1'
      };

      console.log('📝 Tạo phiếu nhập kho:', inspectionData);

      const response = await createInspection(inspectionData);

      console.log('✅ Tạo phiếu thành công:', response);
      showAlert(`Tạo phiếu kiểm nhập ${response.receipt_id || receiptData.receiptId} thành công!`, 'success');

      if (onReceiptCreate) {
        onReceiptCreate({
          ...response,
          receiptData,
          items: receiptItems,
          statistics
        });
      }
    } catch (error) {
      console.error('❌ Lỗi tạo phiếu:', error);
      const errorMessage = error?.message || 'Có lỗi xảy ra khi tạo phiếu nhập kho';
      setCreateError(errorMessage);
      showAlert(errorMessage, 'error');
    } finally {
      setIsCreating(false);
    }
  }, [receiptItems, receiptData, orderData, statistics, createInspection, showAlert, onReceiptCreate]);

  // Hàm reset form (tùy chọn)
  const resetForm = useCallback(() => {
    setReceiptData({
      receiptId: `PN${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      orderId: '',
      supplier: '',
      warehouse: 'Kho chính',
      receiver: '',
      notes: ''
    });
    setReceiptItems([]);
    setCreateError(null);
  }, []);

  return (
    <Box>
      {/* Form tạo phiếu */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tạo Phiếu Kiểm Tra Nhập
          </Typography>
          <form onSubmit={handleSubmit}>
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Kho nhập"
                  value={receiptData.warehouse}
                  onChange={(e) => setReceiptData((prev) => ({ ...prev, warehouse: e.target.value }))}
                  required
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Ghi chú"
              multiline
              rows={3}
              value={receiptData.notes}
              onChange={(e) => setReceiptData((prev) => ({ ...prev, notes: e.target.value }))}
              sx={{ my: 3 }}
            />
          </form>
        </CardContent>
      </Card>

      {/* Danh sách hàng hóa */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Danh Sách Hàng Hóa ({receiptItems.length} sản phẩm)</Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={addNewItem}>
              Thêm sản phẩm
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mã SP</TableCell>
                  <TableCell>Tên sản phẩm</TableCell>
                  <TableCell>SL dự kiến</TableCell>
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
                        />
                        <FormControl size="small" sx={{ minWidth: 60 }}>
                          <Select value={item.expectedUnit} onChange={(e) => updateReceiptItem(item.id, 'expectedUnit', e.target.value)}>
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
                          <Select value={item.actualUnit} onChange={(e) => updateReceiptItem(item.id, 'actualUnit', e.target.value)}>
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
                        value={item.notes}
                        onChange={(e) => updateReceiptItem(item.id, 'notes', e.target.value)}
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

      {/* Hiển thị lỗi nếu có */}
      {createError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Lỗi tạo phiếu nhập kho:</Typography>
          <Typography variant="body2">{createError}</Typography>
          <Button size="small" onClick={() => setCreateError(null)} sx={{ mt: 1 }} color="inherit">
            Đóng
          </Button>
        </Alert>
      )}

      {/* Nút tạo phiếu - UPDATED */}
      <Box display="flex" justifyContent="center" gap={2} mt={3}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleCreateReceipt}
          disabled={receiptItems.length === 0 || isCreating}
          startIcon={isCreating ? <CircularProgress size={20} /> : null}
          sx={{ minWidth: 200 }}
        >
          {isCreating ? 'Đang tạo phiếu...' : 'Tạo Phiếu Nhập Kho'}
        </Button>

        {/* Nút reset form (tùy chọn) */}
        <Button variant="outlined" color="secondary" size="large" onClick={resetForm} disabled={isCreating}>
          Làm mới
        </Button>

        <Snackbar open={alert.open} autoHideDuration={6000} onClose={hideAlert} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert onClose={hideAlert} severity={alert.severity} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

export default EnhancedReceiptForm;
