'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

class NotificationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Notification Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    // Trigger a re-render of children
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            border: '1px solid',
            borderColor: 'error.main',
            borderRadius: 1,
            backgroundColor: 'error.50'
          }}
        >
          <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
            Notification system encountered an error
          </Typography>
          <Button size="small" startIcon={<RefreshIcon />} onClick={this.handleRetry} variant="outlined" color="error">
            Retry
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default NotificationErrorBoundary;
