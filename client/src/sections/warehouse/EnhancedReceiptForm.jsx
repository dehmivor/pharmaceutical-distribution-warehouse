'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, TextField, Button, Grid, Divider, Box, Alert } from '@mui/material';
import ReceiptStatistics from './ReceiptStatistics';

function EnhancedReceiptForm({ orderData, checkedItems, onReceiptCreate }) {
  const [receiptData, setReceiptData] = useState({
    receiptId: `PN${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    orderId: orderData.orderId || '',
    supplier: orderData.supplier || '',
    warehouse: 'Kho chính',
    receiver: '',
    notes: ''
  });

  // Tính toán thống kê
  const [statistics, setStatistics] = useState({
    totalExpected: 0,
    totalReceived: 0,
    totalReturned: 0,
    receivedPercentage: 0,
    totalValue: 0
  });

  useEffect(() => {
    const totalExpected = checkedItems.reduce((sum, item) => sum + (parseFloat(item.expectedQuantity) || 0), 0);
    const totalReceived = checkedItems.reduce((sum, item) => sum + (parseFloat(item.actualQuantity) || 0), 0);
    const totalReturned = checkedItems.reduce((sum, item) => {
      const expected = parseFloat(item.expectedQuantity) || 0;
      const actual = parseFloat(item.actualQuantity) || 0;
      return sum + Math.max(0, expected - actual);
    }, 0);

    const receivedPercentage = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;
    const totalValue = checkedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.actualQuantity) || 0) * (parseFloat(item.unitPrice) || 0);
    }, 0);

    setStatistics({
      totalExpected,
      totalReceived,
      totalReturned,
      receivedPercentage,
      totalValue
    });
  }, [checkedItems]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const receipt = {
      ...receiptData,
      items: checkedItems,
      statistics,
      totalItems: checkedItems.length,
      createdAt: new Date().toISOString(),
      status: 'draft'
    };
    onReceiptCreate(receipt);
  };

  return (
    <Box>
      {/* Thống kê tổng quan */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Thống Kê Nhập Kho
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {statistics.totalReceived}
                </Typography>
                <Typography variant="caption">Đã nhận</Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="error">
                  {statistics.totalReturned}
                </Typography>
                <Typography variant="caption">Hoàn trả</Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {statistics.receivedPercentage}%
                </Typography>
                <Typography variant="caption">Tỷ lệ nhận</Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {statistics.totalValue.toLocaleString()}
                </Typography>
                <Typography variant="caption">Tổng giá trị (VNĐ)</Typography>
              </Box>
            </Grid>
          </Grid>

          {statistics.receivedPercentage < 100 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Chỉ nhận được {statistics.receivedPercentage}% tổng hàng dự kiến. Đã hoàn trả {statistics.totalReturned} đơn vị.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Form tạo phiếu */}
      <Card variant="outlined">
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

            <Grid container justifyContent="center">
              <Button type="submit" variant="contained" color="primary" size="large">
                Tạo Phiếu Nhập Kho
              </Button>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default EnhancedReceiptForm;
