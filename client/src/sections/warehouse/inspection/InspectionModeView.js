// components/warehouse/InspectionModeView.jsx
import React from 'react';
import { Box, Typography, Slide } from '@mui/material';
import WarehouseActivityTabs from '../WarehouseActivityTabs';

export default function InspectionModeView({ isVisible, onBackToDashboard }) {
  return (
    <Slide direction="left" in={isVisible} mountOnEnter unmountOnExit>
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1">
              Kiểm Nhập Hàng Hóa
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Thực hiện quy trình kiểm tra và nhập hàng vào kho
            </Typography>
          </Box>
        </Box>

        {/* Activity Tabs */}
        <WarehouseActivityTabs onBackToDashboard={onBackToDashboard} />
      </Box>
    </Slide>
  );
}
