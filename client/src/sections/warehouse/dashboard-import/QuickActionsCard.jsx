// components/warehouse/QuickActionsCard.jsx
import React from 'react';
import { Box, Typography, Button, Card, CardContent, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconPackageImport, IconClipboardCheck, IconArrowRight } from '@tabler/icons-react';

const PROCESS_STEPS = ['Kiểm tra đơn hàng', 'Kiểm kê số lượng', 'Quy đổi đơn vị', 'Tạo phiếu nhập'];

export default function QuickActionsCard({ onStartInspection }) {
  const theme = useTheme();

  return (
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
              {PROCESS_STEPS.map((step, index) => (
                <Typography
                  key={index}
                  variant="caption"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'success.main'
                  }}
                >
                  <IconClipboardCheck size={16} />
                  {step}
                </Typography>
              ))}
            </Stack>
          </Box>

          <Box>
            <Button
              variant="contained"
              size="large"
              onClick={onStartInspection}
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
  );
}
