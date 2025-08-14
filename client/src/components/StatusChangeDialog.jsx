'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { CheckCircle as ApproveIcon, Cancel as RejectIcon, Warning as WarningIcon } from '@mui/icons-material';
import useTrans from '@/hooks/useTrans';

const StatusChangeDialog = ({ open, onClose, onConfirm, currentStatus, orderId, userRole, loading, nextStatus }) => {
  const trans = useTrans();
  
  const getStatusInfo = () => {
    switch (nextStatus) {
      case 'approved':
        return {
          title: trans.actions.confirm,
          message: trans.messages.confirmDelete,
          icon: <ApproveIcon color="success" />,
          confirmText: trans.actions.confirm,
          confirmColor: 'success'
        };
      case 'cancelled':
        return {
          title: trans.actions.cancel,
          message: trans.messages.confirmDelete,
          icon: <RejectIcon color="error" />,
          confirmText: trans.actions.cancel,
          confirmColor: 'error'
        };
      default:
        return {
          title: trans.actions.edit,
          message: trans.messages.confirmDelete,
          icon: <WarningIcon color="warning" />,
          confirmText: trans.actions.confirm,
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
              <strong>{trans.form.name}:</strong> {orderId?.slice(-8)}
            </Typography>
            <Typography variant="body2">
              <strong>{trans.status.active}:</strong> {currentStatus?.toUpperCase()}
            </Typography>
            <Typography variant="body2">
              <strong>{trans.status.pending}:</strong> {nextStatus?.toUpperCase()}
            </Typography>
            <Typography variant="body2">
              <strong>{trans.form.role}:</strong> {userRole?.replace('_', ' ').toUpperCase()}
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {trans.actions.cancel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={statusInfo.confirmColor}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? trans.messages.loading : statusInfo.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusChangeDialog;
