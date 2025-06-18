'use client';

import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';

// Components
import WarehouseActivityTabs from '@/sections/warehouse/WarehouseActivityTabs';
import WarehouseOverviewCard from '@/sections/warehouse/WarehouseOverviewCard';
import WarehouseProcessChart from '@/sections/warehouse/WarehouseProcessChart';

/***************************  DASHBOARD - LAYOUT  ***************************/

export default function WarehouseDashboard() {
  const theme = useTheme();

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Hệ Thống Quản Lý Nhập Kho
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Theo dõi và quản lý toàn bộ quy trình nhập hàng vào kho
        </Typography>
      </Box>

      {/* Dashboard Grid Layout */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Overview Cards - Full Width */}
        <Grid size={12}>
          <WarehouseOverviewCard />
        </Grid>

        {/* Process Chart - Full Width */}
        <Grid size={12}>
          <WarehouseProcessChart />
        </Grid>

        {/* Activity Tabs - Full Width */}
        <Grid size={12}>
          <WarehouseActivityTabs />
        </Grid>
      </Grid>
    </Box>
  );
}
