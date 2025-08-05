'use client';

import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Wifi as WifiIcon, WifiOff as WifiOffIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNotificationContext } from '@/contexts/NotificationContext';

const ConnectionStatus = () => {
  const { isConnected, refreshNotifications, loading } = useNotificationContext();

  const handleRefresh = () => {
    refreshNotifications();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        backgroundColor: isConnected ? 'success.50' : 'warning.50',
        color: isConnected ? 'success.main' : 'warning.main',
        fontSize: '0.75rem',
        border: `1px solid ${isConnected ? 'success.200' : 'warning.200'}`
      }}
    >
      {isConnected ? <WifiIcon sx={{ fontSize: 16 }} /> : <WifiOffIcon sx={{ fontSize: 16 }} />}

      <Typography variant="caption" sx={{ fontWeight: 500 }}>
        {isConnected ? 'Live' : 'Offline'}
      </Typography>

      <Tooltip title="Refresh notifications">
        <IconButton
          size="small"
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            color: 'inherit',
            p: 0.5,
            '&:hover': {
              backgroundColor: isConnected ? 'success.100' : 'warning.100'
            }
          }}
        >
          <RefreshIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ConnectionStatus;
