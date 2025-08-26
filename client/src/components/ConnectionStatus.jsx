'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Wifi as IconWifi, WifiOff as IconWifiOff } from '@mui/icons-material';
import { Key as IconKey, KeyOff as IconKeyOff } from '@mui/icons-material';
import useTrans from '@/hooks/useTrans';

export default function ConnectionStatus() {
  const [status, setStatus] = useState('checking');
  const [lastCheck, setLastCheck] = useState(null);
  const [tokenStatus, setTokenStatus] = useState('unknown');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // ✅ Thêm: Kiểm tra token status
        const token = localStorage.getItem('auth-token');
        const user = localStorage.getItem('user');

        if (token) {
          setTokenStatus('exists');
          console.log('🔑 Token found on connection check:', token.substring(0, 20) + '...');
        } else {
          setTokenStatus('missing');
          console.log('❌ No token found on connection check');
        }

        if (user) {
          console.log('👤 User data found:', JSON.parse(user));
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/health`);
        if (response.ok) {
          setStatus('connected');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Connection check failed:', error);
        setStatus('error');
      } finally {
        setLastCheck(new Date());
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // ✅ Thêm: Debug info cho token
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getTokenColor = () => {
    switch (tokenStatus) {
      case 'exists':
        return 'success';
      case 'missing':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Connection Status */}
      <Chip
        label={status === 'connected' ? 'Connected' : status === 'error' ? 'Disconnected' : 'Checking...'}
        color={getStatusColor()}
        size="small"
        icon={status === 'connected' ? <IconWifi size={16} /> : <IconWifiOff size={16} />}
      />

      {/* ✅ Thêm: Token Status */}
      <Chip
        label={tokenStatus === 'exists' ? 'Token OK' : tokenStatus === 'missing' ? 'No Token' : 'Unknown'}
        color={getTokenColor()}
        size="small"
        icon={tokenStatus === 'exists' ? <IconKey size={16} /> : <IconKeyOff size={16} />}
      />

      {lastCheck && (
        <Typography variant="caption" color="text.secondary">
          Last: {lastCheck.toLocaleTimeString()}
        </Typography>
      )}
    </Box>
  );
}
