'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Stack, Fade, Slide } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import { IconPackageImport, IconClipboardCheck, IconArrowRight } from '@tabler/icons-react';

// Components
import WarehouseActivityTabs from '@/sections/warehouse/WarehouseActivityTabs';
import WarehouseOverviewCard from '@/sections/warehouse/WarehouseOverviewCard';
import WarehouseProcessChart from '@/sections/warehouse/WarehouseProcessChart';

/***************************  DASHBOARD - LAYOUT  ***************************/

export default function WarehouseDashboard() {
  const theme = useTheme();
  const [showActivityTabs, setShowActivityTabs] = useState(false);

  const handleStartInspection = () => {
    setShowActivityTabs(true);
  };

  const handleBackToDashboard = () => {
    setShowActivityTabs(false);
  };

  // Nếu đang ở chế độ kiểm nhập, hiển thị WarehouseActivityTabs
  if (showActivityTabs) {
    return (
      <Slide direction="left" in={showActivityTabs} mountOnEnter unmountOnExit>
        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          {/* Header với nút quay lại */}
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
          <WarehouseActivityTabs onBackToDashboard={handleBackToDashboard} />
        </Box>
      </Slide>
    );
  }

  // Dashboard chính
  return (
    <Fade in={!showActivityTabs}>
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

          {/* Quick Actions Card */}
          <Grid size={12}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 4,
                boxShadow: theme.customShadows.section,
                background: `linear-gradient(135deg, ${theme.palette.primary.light}15, ${theme.palette.primary.main}08)`
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <IconPackageImport size={32} color={theme.palette.primary.main} />
                      <Typography variant="h5" color="primary">
                        Thực Hiện Kiểm Nhập
                      </Typography>
                    </Stack>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      Bắt đầu quy trình kiểm tra và nhập hàng hóa vào kho. Hệ thống sẽ hướng dẫn bạn qua từng bước một cách chi tiết.
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: 'success.main'
                        }}
                      >
                        <IconClipboardCheck size={16} />
                        Kiểm tra đơn hàng
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: 'success.main'
                        }}
                      >
                        <IconClipboardCheck size={16} />
                        Kiểm kê số lượng
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: 'success.main'
                        }}
                      >
                        <IconClipboardCheck size={16} />
                        Quy đổi đơn vị
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: 'success.main'
                        }}
                      >
                        <IconClipboardCheck size={16} />
                        Tạo phiếu nhập
                      </Typography>
                    </Stack>
                  </Box>

                  <Box>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleStartInspection}
                      endIcon={<IconArrowRight />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        borderRadius: 3,
                        boxShadow: theme.customShadows.primary,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.customShadows.primaryButton
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Bắt Đầu Kiểm Nhập
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Process Chart - Full Width */}
          <Grid size={12}>
            <WarehouseProcessChart />
          </Grid>

          {/* Recent Activities or Summary */}
          <Grid size={12}>
            <Card variant="outlined" sx={{ borderRadius: 4, boxShadow: theme.customShadows.section }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Hoạt Động Gần Đây
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Phiếu nhập PN001 đã được duyệt</Typography>
                    <Typography variant="caption" color="text.secondary">
                      2 giờ trước
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Hoàn thành kiểm kê đơn hàng DH002</Typography>
                    <Typography variant="caption" color="text.secondary">
                      4 giờ trước
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Tạo phiếu nhập PN003 cho nhà cung cấp ABC</Typography>
                    <Typography variant="caption" color="text.secondary">
                      1 ngày trước
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
}
