'use client';

import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import MainCard from '@/components/MainCard';
import Legend from '@/components/third-party/chart/Legend';
import { TabsType } from '@/enum';

/***************************  CHART - DATA  ***************************/

const dailyData = {
  receipts: [12, 8, 15, 10, 18, 14, 20],
  approved: [10, 7, 13, 9, 16, 12, 18],
  pending: [2, 1, 2, 1, 2, 2, 2]
};

const weeklyData = {
  receipts: [85, 92, 78, 88, 95, 82, 90, 87],
  approved: [78, 85, 70, 82, 88, 75, 85, 80],
  pending: [7, 7, 8, 6, 7, 7, 5, 7]
};

const monthlyData = {
  receipts: [320, 285, 310, 295, 340, 315, 330, 305, 325, 290, 315, 335],
  approved: [295, 260, 285, 270, 315, 290, 305, 280, 300, 265, 290, 310],
  pending: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25]
};

const timeLabels = {
  daily: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  weekly: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'],
  monthly: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
};

const timeFilter = ['Hàng ngày', 'Hàng tuần', 'Hàng tháng'];

/***************************  CHART - COMPONENT  ***************************/

export default function WarehouseProcessChart() {
  const theme = useTheme();
  const [view, setView] = useState('daily');
  const [visibilityOption, setVisibilityOption] = useState({
    receipts: true,
    approved: true,
    pending: true
  });

  const handleViewChange = (_event, newValue) => {
    const viewMap = { 0: 'daily', 1: 'weekly', 2: 'monthly' };
    setView(viewMap[newValue]);
  };

  const toggleVisibility = (id) => {
    setVisibilityOption((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentData = view === 'daily' ? dailyData : view === 'weekly' ? weeklyData : monthlyData;

  const seriesData = [
    {
      id: 'receipts',
      data: currentData.receipts,
      color: theme.palette.primary.main,
      visible: visibilityOption.receipts,
      label: 'Tổng phiếu nhập'
    },
    {
      id: 'approved',
      data: currentData.approved,
      color: theme.palette.success.main,
      visible: visibilityOption.approved,
      label: 'Đã duyệt'
    },
    {
      id: 'pending',
      data: currentData.pending,
      color: theme.palette.warning.main,
      visible: visibilityOption.pending,
      label: 'Chờ duyệt'
    }
  ];

  const visibleSeries = seriesData.filter((s) => s.visible);
  const legendItems = seriesData.map((series) => ({
    label: series.label,
    color: series.color,
    visible: series.visible,
    id: series.id
  }));

  return (
    <MainCard>
      <Stack sx={{ gap: 3 }}>
        <Stack direction="row" sx={{ alignItems: 'end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Stack sx={{ gap: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              Thống Kê Quy Trình Nhập Kho
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.700' }}>
              Theo dõi tiến độ xử lý phiếu nhập kho theo thời gian
            </Typography>
          </Stack>
          <Tabs
            value={timeFilter.indexOf(timeFilter.find((_, i) => Object.keys({ daily: 0, weekly: 1, monthly: 2 })[view] === i))}
            onChange={handleViewChange}
            aria-label="filter tabs"
            type={TabsType.SEGMENTED}
            sx={{ width: 'fit-content' }}
          >
            {timeFilter.map((filter, index) => (
              <Tab label={filter} key={index} />
            ))}
          </Tabs>
        </Stack>

        <Legend items={legendItems} onToggle={toggleVisibility} />
      </Stack>

      <BarChart
        series={visibleSeries.map((series) => ({
          ...series,
          type: 'bar'
        }))}
        height={300}
        xAxis={[
          {
            data: timeLabels[view],
            scaleType: 'band'
          }
        ]}
        margin={{ top: 25, right: 20, bottom: 50, left: 60 }}
        slotProps={{ legend: { hidden: true } }}
      />
    </MainCard>
  );
}
