'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Wifi as WifiIcon, WifiOff as WifiOffIcon } from '@mui/icons-material';
import useTrans from '@/hooks/useTrans';

const ConnectionStatus = () => {
  const trans = useTrans();
  // Mock connection status for UI demonstration
  const isConnected = true;

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
        {isConnected ? trans.status.active : trans.status.inactive}
      </Typography>
    </Box>
  );
};

export default ConnectionStatus;
