'use client';
// @next
import NextLink from 'next/link';
import { useState } from 'react';

// @mui
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import ActiveAccount from '@/sections/auth/ActiveAccount';
import Copyright from '@/sections/auth/Copyright';

export default function Login() {
  // State cho notification messages
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info' // 'success', 'error', 'warning', 'info'
  });

  // Handler để hiển thị messages
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Handler để đóng notification
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Stack sx={{ height: 1, alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
        <Box sx={{ width: 1, maxWidth: 458 }}>
          <Stack sx={{ gap: { xs: 1, sm: 1.5 }, textAlign: 'center', mb: { xs: 3, sm: 8 } }}>
            <Typography variant="h1">Activate Account</Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your OTP and new password to activate your account.
            </Typography>
          </Stack>

          {/* Pass notification handler to ActiveAccount */}
          <ActiveAccount onShowNotification={showNotification} />

          <Stack direction="row" justifyContent="start" alignItems="center" spacing={1} sx={{ mt: { xs: 2, sm: 3 } }}>
            <Typography variant="body2" color="text.secondary">
              Need help?
            </Typography>
            <Link
              component={NextLink}
              underline="hover"
              variant="subtitle2"
              href="/auth/forgot-password"
              sx={{ '&:hover': { color: 'primary.dark' } }}
            >
              Forgot password
            </Link>
            <Typography variant="body2" color="text.secondary">
              |
            </Typography>
            <Link
              component={NextLink}
              underline="hover"
              variant="subtitle2"
              href="/contact-support"
              sx={{ '&:hover': { color: 'primary.dark' } }}
            >
              Contact support
            </Link>
          </Stack>
        </Box>

        <Copyright />
      </Stack>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} variant="filled" sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}
