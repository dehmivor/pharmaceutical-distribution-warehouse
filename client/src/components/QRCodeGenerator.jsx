'use client';

import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Stack } from '@mui/material';
import { QrCode as QrCodeIcon } from '@mui/icons-material';

const QRCodeGenerator = () => {
  const [text, setText] = useState('https://example.com');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const generateQRCode = () => {
    if (text.trim()) {
      // Sử dụng Google Charts API để tạo QR code
      const url = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(text)}`;
      setQrCodeUrl(url);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h6" align="center">
          Generate QR Code for Testing
        </Typography>

        <TextField
          fullWidth
          label="Enter text or URL"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to encode in QR code"
        />

        <Button variant="contained" onClick={generateQRCode} startIcon={<QrCodeIcon />} fullWidth>
          Generate QR Code
        </Button>

        {qrCodeUrl && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Scan this QR code with the mobile scanner:
            </Typography>
            <img
              src={qrCodeUrl}
              alt="Generated QR Code"
              style={{
                maxWidth: '100%',
                height: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: '8px'
              }}
            />
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default QRCodeGenerator;
