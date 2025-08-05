'use client';

import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, Box, Typography, IconButton, Chip, Stack } from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNotificationContext } from '@/contexts/NotificationContext';

const getNotificationIcon = (priority) => {
  switch (priority) {
    case 'high':
      return <ErrorIcon color="error" />;
    case 'medium':
      return <WarningIcon color="warning" />;
    case 'low':
      return <InfoIcon color="info" />;
    default:
      return <CheckCircleIcon color="success" />;
  }
};

const getNotificationColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'success';
  }
};

const NotificationToast = () => {
  const { notifications, isRealTimeConnected } = useNotificationContext();
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [lastNotificationId, setLastNotificationId] = useState(null);

  // Kiểm tra notification mới
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];

      // Chỉ hiển thị toast cho notification mới và chưa đọc
      if (latestNotification.id !== lastNotificationId && latestNotification.status === 'unread') {
        setCurrentNotification(latestNotification);
        setLastNotificationId(latestNotification.id);
        setOpen(true);
      }
    }
  }, [notifications, lastNotificationId]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleActionClick = () => {
    if (currentNotification?.action_url) {
      window.location.href = currentNotification.action_url;
    }
    setOpen(false);
  };

  if (!currentNotification) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{
        '& .MuiSnackbar-root': {
          top: 80
        }
      }}
    >
      <Alert
        onClose={handleClose}
        severity={getNotificationColor(currentNotification.priority)}
        variant="filled"
        sx={{
          width: '100%',
          minWidth: 350,
          maxWidth: 450,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
        action={
          <IconButton aria-label="close" color="inherit" size="small" onClick={handleClose}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      >
        <Box sx={{ width: '100%' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            {getNotificationIcon(currentNotification.priority)}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, flexGrow: 1 }}>
              {currentNotification.title}
            </Typography>
            <Chip
              label={currentNotification.priority}
              size="small"
              color={getNotificationColor(currentNotification.priority)}
              variant="outlined"
            />
          </Stack>

          <Typography variant="body2" sx={{ mb: 1 }}>
            {currentNotification.message}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              {new Date(currentNotification.createdAt).toLocaleString('vi-VN')}
            </Typography>

            {currentNotification.action_url && (
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.light',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: 'primary.main'
                  }
                }}
                onClick={handleActionClick}
              >
                Xem chi tiết
              </Typography>
            )}
          </Stack>

          {!isRealTimeConnected && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: 'warning.main'
                }}
              />
              <Typography variant="caption" color="warning.main">
                Kết nối bị gián đoạn
              </Typography>
            </Box>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default NotificationToast;
