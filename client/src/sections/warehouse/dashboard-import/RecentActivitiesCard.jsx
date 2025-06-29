// components/warehouse/RecentActivitiesCard.jsx
import React from 'react';
import { Box, Typography, Card, CardContent, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const MOCK_ACTIVITIES = [
  {
    id: 1,
    message: 'Phiếu nhập PN001 đã được duyệt',
    time: '2 giờ trước'
  },
  {
    id: 2,
    message: 'Hoàn thành kiểm kê đơn hàng DH002',
    time: '4 giờ trước'
  },
  {
    id: 3,
    message: 'Tạo phiếu nhập PN003 cho nhà cung cấp ABC',
    time: '1 ngày trước'
  }
];

export default function RecentActivitiesCard({ activities = MOCK_ACTIVITIES }) {
  const theme = useTheme();

  return (
    <Card variant="outlined" sx={{ borderRadius: 4, boxShadow: theme.customShadows.section }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Hoạt Động Gần Đây
        </Typography>

        <Stack spacing={2}>
          {activities.map((activity) => (
            <Box
              key={activity.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography variant="body2">{activity.message}</Typography>
              <Typography variant="caption" color="text.secondary">
                {activity.time}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
