'use client';

import React, { useState } from 'react';
import { Card, CardContent, Typography, Chip, Box, Grid, Alert } from '@mui/material';

function OrderStatus({ orderId, status, onStatusChange }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'received':
        return 'info';
      case 'checking':
        return 'primary';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ nhận hàng';
      case 'received':
        return 'Đã nhận hàng';
      case 'checking':
        return 'Đang kiểm kê';
      case 'completed':
        return 'Hoàn thành';
      case 'rejected':
        return 'Từ chối';
      default:
        return status;
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Trạng Thái Đơn Hàng
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              Mã đơn hàng: <strong>{orderId}</strong>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" justifyContent="flex-end">
              <Chip label={getStatusText(status)} color={getStatusColor(status)} size="medium" />
            </Box>
          </Grid>
        </Grid>

        {status === 'checking' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Đơn hàng đang trong quá trình kiểm kê. Vui lòng hoàn thành kiểm tra số lượng.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default OrderStatus;
