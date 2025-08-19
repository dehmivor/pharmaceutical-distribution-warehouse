'use client';

import React, { useState } from 'react';
import { Box, Container, Typography, Button, Paper, Stack, Alert } from '@mui/material';
import { QrCodeScanner as QrCodeScannerIcon } from '@mui/icons-material';
import QRScanner from '@/components/QRScanner';
import QRCodeGenerator from '@/components/QRCodeGenerator';

export default function QRScannerDemo() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedData, setScannedData] = useState('');

  const handleScan = (data) => {
    setScannedData(data);
    console.log('Scanned data:', data);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            QR Scanner Demo
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Test the QR scanner functionality for mobile mode
          </Typography>

          <Button variant="contained" size="large" onClick={() => setScannerOpen(true)} startIcon={<QrCodeScannerIcon />} sx={{ mb: 3 }}>
            Open QR Scanner
          </Button>

          {scannedData && (
            <Alert severity="success" sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                Scanned Data:
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontSize: '12px',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  p: 1,
                  borderRadius: 1
                }}
              >
                {scannedData}
              </Typography>
            </Alert>
          )}
        </Paper>

        <QRCodeGenerator />
      </Stack>

      <QRScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} title="QR Scanner Demo" />
    </Container>
  );
}
