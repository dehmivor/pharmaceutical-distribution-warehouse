'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { QrCodeScanner as QrCodeScannerIcon, Close as CloseIcon } from '@mui/icons-material';
import { BrowserMultiFormatReader } from '@zxing/library';

const QRScanner = ({ open, onClose, onScan, title = 'Scan QR Code' }) => {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const videoRef = useRef(null);
  const readerRef = useRef(null);

  useEffect(() => {
    if (open) {
      initializeScanner();
    }

    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, [open]);

  const initializeScanner = async () => {
    try {
      readerRef.current = new BrowserMultiFormatReader();

      // Lấy danh sách camera
      const videoInputDevices = await readerRef.current.listVideoInputDevices();
      setDevices(videoInputDevices);

      if (videoInputDevices.length > 0) {
        setSelectedDeviceId(videoInputDevices[0].deviceId);
      }
    } catch (err) {
      setError('Failed to initialize camera. Please check camera permissions.');
      console.error('Scanner initialization error:', err);
    }
  };

  const startScan = async () => {
    if (!selectedDeviceId || !videoRef.current) return;

    try {
      setScanning(true);
      setError('');
      setResult('');

      await readerRef.current.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
        if (result) {
          handleScan(result.text);
        }
        if (err && err.name !== 'NotFoundException') {
          console.error('Scan error:', err);
        }
      });
    } catch (err) {
      setError('Failed to start camera. Please try again.');
      console.error('Start scan error:', err);
      setScanning(false);
    }
  };

  const stopScan = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setScanning(false);
  };

  const handleScan = (data) => {
    if (data) {
      setResult(data);
      setScanning(false);
      onScan(data);
      onClose();
    }
  };

  const handleClose = () => {
    stopScan();
    setError('');
    setResult('');
    onClose();
  };

  const handleDeviceChange = (event) => {
    setSelectedDeviceId(event.target.value);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 400
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeScannerIcon color="primary" />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', py: 2 }}>
        {!scanning ? (
          <Box sx={{ py: 4 }}>
            <QrCodeScannerIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />

            {devices.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Select Camera:
                </Typography>
                <select
                  value={selectedDeviceId}
                  onChange={handleDeviceChange}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    minWidth: '200px'
                  }}
                >
                  {devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                    </option>
                  ))}
                </select>
              </Box>
            )}

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Click Start Scan to begin scanning QR codes
            </Typography>

            <Button variant="contained" size="large" onClick={startScan} startIcon={<QrCodeScannerIcon />} disabled={devices.length === 0}>
              Start Scan
            </Button>

            {devices.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No camera devices found. Please check camera permissions.
              </Alert>
            )}
          </Box>
        ) : (
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                width: '100%',
                height: 300,
                border: '2px solid #e0e0e0',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#f5f5f5'
              }}
            >
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                autoPlay
                muted
                playsInline
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
              }}
            >
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  border: '2px solid #1976d2',
                  borderRadius: 2,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    left: -2,
                    right: -2,
                    bottom: -2,
                    border: '2px solid rgba(25, 118, 210, 0.3)',
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          </Box>
        )}

        {result && (
          <Alert severity="success" sx={{ mt: 2 }}>
            QR Code scanned successfully!
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        {scanning && (
          <Button onClick={stopScan} variant="outlined">
            Stop Scan
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QRScanner;
