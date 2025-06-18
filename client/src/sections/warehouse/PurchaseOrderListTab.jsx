import React from 'react';
import { Box, Typography } from '@mui/material';

export default function PurchaseOrderListTab() {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Danh sách đơn mua
      </Typography>

      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Danh sách đơn mua sẽ được hiển thị ở đây
        </Typography>
      </Box>
    </Box>
  );
}
