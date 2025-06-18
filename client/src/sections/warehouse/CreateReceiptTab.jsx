import React from 'react';
import { Box, Typography } from '@mui/material';
import EnhancedReceiptForm from '@/sections/warehouse/EnhancedReceiptForm';

export default function CreateReceiptTab() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tạo Phiếu Nhập Mới
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Chức năng tạo phiếu nhập kho sẽ được triển khai ở đây
      </Typography>
      {/* Có thể thêm EnhancedReceiptForm component ở đây */}
      {/* <EnhancedReceiptForm /> */}
    </Box>
  );
}
