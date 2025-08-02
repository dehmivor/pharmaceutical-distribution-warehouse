'use client';

import { Box, Typography, Paper } from '@mui/material';

export default function WarehouseManagerHomePage() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
          Warehouse Manager Dashboard
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
          Welcome to the warehouse manager management section.
        </Typography>
      </Paper>

      <Typography variant="body1" color="text.secondary">
        Warehouse Manager dashboard content will be implemented here.
      </Typography>
    </Box>
  );
}
