'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { CheckCircle as ApproveIcon, Cancel as RejectIcon, Warning as WarningIcon } from '@mui/icons-material';

const StatusChangeDialog = ({ open, onClose, onConfirm, currentStatus, orderId, userRole, loading, nextStatus }) => {
  const getStatusInfo = () => {
    switch (nextStatus) {
      case 'approved':
        return {
          title: 'Approve Import Order',
          message: 'Are you sure you want to approve this import order? This will allow the order to proceed to the warehouse.',
          icon: <ApproveIcon color="success" />,
          confirmText: 'Approve',
          confirmColor: 'success'
        };
      case 'cancelled':
        return {
          title: 'Cancel Import Order',
          message: 'Are you sure you want to cancel this import order? This action cannot be undone.',
          icon: <RejectIcon color="error" />,
          confirmText: 'Cancel Order',
          confirmColor: 'error'
        };
      default:
        return {
          title: 'Change Order Status',
          message: `Are you sure you want to change the status from "${currentStatus}" to "${nextStatus}"?`,
          icon: <WarningIcon color="warning" />,
          confirmText: 'Confirm',
          confirmColor: 'primary'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {statusInfo.icon}
          <Typography variant="h6">{statusInfo.title}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body1" gutterBottom>
            {statusInfo.message}
          </Typography>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Order ID:</strong> {orderId?.slice(-8)}
            </Typography>
            <Typography variant="body2">
              <strong>Current Status:</strong> {currentStatus?.toUpperCase()}
            </Typography>
            <Typography variant="body2">
              <strong>New Status:</strong> {nextStatus?.toUpperCase()}
            </Typography>
            <Typography variant="body2">
              <strong>User Role:</strong> {userRole?.replace('_', ' ').toUpperCase()}
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={statusInfo.confirmColor}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Processing...' : statusInfo.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusChangeDialog;
