'use client';

import React, { useState } from 'react';
import { Card, CardContent, Typography, Chip, Box, Grid, Alert } from '@mui/material';
import useTrans from '@/hooks/useTrans';

function OrderStatus({ orderId, status, onStatusChange }) {
  const trans = useTrans();

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
        return trans.common.pending;
      case 'received':
        return trans.common.received;
      case 'checking':
        return trans.common.checking;
      case 'completed':
        return trans.common.completed;
      case 'rejected':
        return trans.common.rejected;
      default:
        return status;
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {trans.common.orderStatus}
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              {trans.common.orderId}: <strong>{orderId}</strong>
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
            {trans.common.orderCheckingInProgress}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default OrderStatus;
