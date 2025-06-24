// components/warehouse/DashboardLayout.jsx
import React from 'react';
import { Box, Fade } from '@mui/material';
import Grid from '@mui/material/Grid';
import DashboardHeader from './DashboardHeader';
import WarehouseOverviewCard from '../WarehouseOverviewCard';
import QuickActionsCard from './QuickActionsCard';
import WarehouseProcessChart from '../WarehouseProcessChart';
import RecentActivitiesCard from './RecentActivitiesCard';

// Components

export default function DashboardLayout({ isVisible, onStartInspection }) {
  return (
    <Fade in={isVisible}>
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <DashboardHeader title="Hệ Thống Quản Lý Nhập Kho" subtitle="Theo dõi và quản lý toàn bộ quy trình nhập hàng vào kho" />

        {/* Dashboard Grid Layout */}
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Overview Cards - Full Width */}
          <Grid size={12}>
            <WarehouseOverviewCard />
          </Grid>

          {/* Quick Actions Card */}
          <Grid size={12}>
            <QuickActionsCard onStartInspection={onStartInspection} />
          </Grid>

          {/* Process Chart - Full Width */}
          <Grid size={12}>
            <WarehouseProcessChart />
          </Grid>

          {/* Recent Activities */}
          <Grid size={12}>
            <RecentActivitiesCard />
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
}
