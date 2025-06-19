import React from 'react';
import PurchaseOrderTable from '@/app/(representative)/manage-purchase-orders/components/PurchaseOrderTable';
import { Box, Typography } from '@mui/material';

export default function PurchaseOrderPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Quản lý Purchase Orders
      </Typography>
      <PurchaseOrderTable />
    </Box>
  );
} 