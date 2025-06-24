// components/warehouse/DashboardHeader.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

export default function DashboardHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
  );
}
