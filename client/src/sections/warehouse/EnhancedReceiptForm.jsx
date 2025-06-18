'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import ReceiptStatistics from './ReceiptStatistics';

// Danh sách đơn vị chuyển đổi
const UNIT_CONVERSIONS = {
  kg: { g: 1000, tấn: 0.001 },
  g: { kg: 0.001, tấn: 0.000001 },
  tấn: { kg: 1000, g: 1000000 },
  thùng: { hộp: 12, cái: 144 },
  hộp: { thùng: 1 / 12, cái: 12 },
  cái: { hộp: 1 / 12, thùng: 1 / 144 },
  lít: { ml: 1000, gallon: 0.264172 },
  ml: { lít: 0.001, gallon: 0.000264172 },
  gallon: { lít: 3.78541, ml: 3785.41 }
};

function EnhancedReceiptForm({ orderData, checkedItems = [], onReceiptCreate }) {
  const [receiptData, setReceiptData] = useState({
    receiptId: `PN${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    orderId: orderData.orderId || '',
    supplier: orderData.supplier || '',
    warehouse: 'Kho chính',
    receiver: '',
    notes: ''
  });

  // Danh sách hàng hóa từ đơn mua với thông tin nhập kho
  const [receiptItems, setReceiptItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  // Tính toán thống kê
  const [statistics, setStatistics] = useState({
    totalExpected: 0,
    totalReceived: 0,
    totalReturned: 0,
    receivedPercentage: 0,
    totalValue: 0
  });

  // Khởi tạo danh sách hàng từ đơn mua
  useEffect(() => {
    if (orderData && orderData.items) {
      const initialItems = orderData.items.map((item, index) => ({
        id: index + 1,
        productCode: item.productCode || '',
        productName: item.productName || '',
        expectedQuantity: parseFloat(item.quantity) || 0,
        expectedUnit: item.unit || 'cái',
        actualQuantity: 0,
        actualUnit: item.unit || 'cái',
        unitPrice: parseFloat(item.unitPrice) || 0,
        lotNumber: '',
        expiryDate: '',
        notes: '',
        status: 'pending' // pending, received, partial, shortage
      }));
      setReceiptItems(initialItems);
    } else if (checkedItems.length > 0) {
      setReceiptItems(
        checkedItems.map((item, index) => ({
          ...item,
          id: index + 1,
          actualUnit: item.expectedUnit || item.unit || 'cái',
          status: 'pending'
        }))
      );
    }
  }, [orderData, checkedItems]);

  // Hàm chuyển đổi đơn vị
  const convertUnit = (quantity, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return quantity;

    const conversions = UNIT_CONVERSIONS[fromUnit];
    if (conversions && conversions[toUnit]) {
      return quantity * conversions[toUnit];
    }
    return quantity; // Không thể chuyển đổi
  };

  // Tính toán thống kê khi danh sách thay đổi
  useEffect(() => {
    const totalExpected = receiptItems.reduce((sum, item) => sum + (parseFloat(item.expectedQuantity) || 0), 0);
    const totalReceived = receiptItems.reduce((sum, item) => {
      const actualQty = parseFloat(item.actualQuantity) || 0;
      // Chuyển đổi về đơn vị gốc để tính tổng
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

    setStatistics({
      totalExpected,
      totalReceived,
      totalReturned,
      receivedPercentage,
      totalValue
    });
  }, [receiptItems]);

  // Cập nhật thông tin sản phẩm
  const updateReceiptItem = (id, field, value) => {
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
            } else {
              updatedItem.status = 'partial';
            }

            if (convertedQty < expectedQty) {
              updatedItem.status = 'shortage';
            }
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  // Thêm sản phẩm mới
  const addNewItem = () => {
    const newItem = {
      id: receiptItems.length + 1,
      productCode: '',
      productName: '',
      expectedQuantity: 0,
      expectedUnit: 'cái',
      actualQuantity: 0,
      actualUnit: 'cái',
      unitPrice: 0,
      lotNumber: '',
      expiryDate: '',
      notes: '',
      status: 'pending'
    };
    setReceiptItems((prev) => [...prev, newItem]);
  };

  // Xóa sản phẩm
  const removeItem = (id) => {
    setReceiptItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Lấy màu sắc cho trạng thái
  const getStatusColor = (status) => {
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
  };

  // Lấy text cho trạng thái
  const getStatusText = (status) => {
    switch (status) {
      case 'received':
        return 'Đã nhận đủ';
      case 'partial':
        return 'Nhận một phần';
      case 'shortage':
        return 'Thiếu hàng';
      default:
        return 'Chờ nhận';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const receipt = {
      ...receiptData,
      items: receiptItems,
      statistics,
      totalItems: receiptItems.length,
      createdAt: new Date().toISOString(),
      status: 'draft'
    };
    onReceiptCreate(receipt);
  };

  return (
    <Box>
      {/* Form tạo phiếu */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tạo Phiếu Nhập Kho
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Người nhận hàng"
                  value={receiptData.receiver}
                  onChange={(e) => setReceiptData((prev) => ({ ...prev, receiver: e.target.value }))}
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
                  <TableCell>Đơn giá</TableCell>
                  <TableCell>Số lô</TableCell>
                  <TableCell>HSD</TableCell>
                  <TableCell>Trạng thái</TableCell>
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
                            <MenuItem value="cái">cái</MenuItem>
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
                            <MenuItem value="cái">cái</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateReceiptItem(item.id, 'unitPrice', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={item.lotNumber}
                        onChange={(e) => updateReceiptItem(item.id, 'lotNumber', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) => updateReceiptItem(item.id, 'expiryDate', e.target.value)}
                        sx={{ width: 130 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={getStatusText(item.status)} color={getStatusColor(item.status)} size="small" />
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
      <ReceiptStatistics statistics={statistics} />

      {/* Nút tạo phiếu */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Button variant="contained" color="primary" size="large" onClick={handleSubmit} disabled={receiptItems.length === 0}>
          Tạo Phiếu Nhập Kho
        </Button>
      </Box>
    </Box>
  );
}

export default EnhancedReceiptForm;
