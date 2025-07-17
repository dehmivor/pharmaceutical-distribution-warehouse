'use client';
import { useState } from 'react';

// @mui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import { LineChart } from '@mui/x-charts/LineChart';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Utility function for radius styles
const getRadiusStyles = (radius, ...corners) => {
  const styles = {};
  corners.forEach((corner) => {
    switch (corner) {
      case 'topLeft':
        styles.borderTopLeftRadius = radius;
        break;
      case 'topRight':
        styles.borderTopRightRadius = radius;
        break;
      case 'bottomLeft':
        styles.borderBottomLeftRadius = radius;
        break;
      case 'bottomRight':
        styles.borderBottomRightRadius = radius;
        break;
    }
  });
  return styles;
};

// Border with radius utility
const applyBorderWithRadius = (radius, theme) => {
  return {
    overflow: 'hidden',
    '--Grid-borderWidth': '1px',
    borderTop: 'var(--Grid-borderWidth) solid',
    borderLeft: 'var(--Grid-borderWidth) solid',
    borderColor: 'divider',
    '& > div': {
      overflow: 'hidden',
      borderRight: 'var(--Grid-borderWidth) solid',
      borderBottom: 'var(--Grid-borderWidth) solid',
      borderColor: 'divider',
      [theme.breakpoints.down('md')]: {
        '&:nth-of-type(1)': getRadiusStyles(radius, 'topLeft'),
        '&:nth-of-type(2)': getRadiusStyles(radius, 'topRight'),
        '&:nth-of-type(3)': getRadiusStyles(radius, 'bottomLeft'),
        '&:nth-of-type(4)': getRadiusStyles(radius, 'bottomRight')
      },
      [theme.breakpoints.up('md')]: {
        '&:first-of-type': getRadiusStyles(radius, 'topLeft', 'bottomLeft'),
        '&:last-of-type': getRadiusStyles(radius, 'topRight', 'bottomRight')
      }
    }
  };
};

// Overview Card Component
const OverviewCard = ({ title, value, compare, chip, icon, cardProps = {} }) => {
  const theme = useTheme();

  return (
    <Card {...cardProps}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
            {icon && <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>{icon}</Avatar>}
          </Stack>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {compare}
            </Typography>
            <Chip label={chip.label} color={chip.color || 'success'} size="small" avatar={chip.avatar} variant="filled" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Progress Card Component
const ProgressCard = ({ title, value, progress }) => {
  const theme = useTheme();

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
      <Stack spacing={0.5}>
        <Typography variant="body2" fontWeight="medium">
          {title}
        </Typography>
        <Typography variant="h6" color="primary.main">
          {value}
        </Typography>
      </Stack>
      <Stack alignItems="flex-end" spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          {progress.value}%
        </Typography>
        <Box
          sx={{
            width: 60,
            height: 4,
            bgcolor: 'grey.200',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              width: `${progress.value}%`,
              height: '100%',
              bgcolor: progress.value > 70 ? 'success.main' : progress.value > 40 ? 'warning.main' : 'error.main',
              transition: 'width 0.3s ease'
            }}
          />
        </Box>
      </Stack>
    </Stack>
  );
};

// Main Card Component
const MainCard = ({ children, ...props }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: theme.shadows[1],
        ...props.sx
      }}
      {...props}
    >
      <CardContent sx={{ p: 3 }}>{children}</CardContent>
    </Card>
  );
};

// Mock data for debt overview
const debtOverview = [
  {
    title: 'Tổng Công Nợ',
    value: '₫2,450,000',
    compare: 'So với tuần trước',
    chip: {
      label: '8.2%',
      color: 'error',
      avatar: <TrendingUp size={16} />
    },
    icon: <CreditCard size={24} />
  },
  {
    title: 'Công Nợ Quá Hạn',
    value: '₫890,000',
    compare: 'So với tuần trước',
    chip: {
      label: '12.5%',
      color: 'error',
      avatar: <TrendingUp size={16} />
    },
    icon: <Warning size={24} />
  },
  {
    title: 'Đã Thanh Toán',
    value: '₫1,560,000',
    compare: 'So với tuần trước',
    chip: {
      label: '15.3%',
      color: 'success',
      avatar: <TrendingUp size={16} />
    },
    icon: <CheckCircle size={24} />
  },
  {
    title: 'Sắp Đến Hạn',
    value: '₫340,000',
    compare: 'So với tuần trước',
    chip: {
      label: '5.1%',
      color: 'warning',
      avatar: <TrendingDown size={16} />
    },
    icon: <AccessTime size={24} />
  }
];

// Chart data
const monthlyPoints = [
  new Date(2024, 0, 1),
  new Date(2024, 1, 1),
  new Date(2024, 2, 1),
  new Date(2024, 3, 1),
  new Date(2024, 4, 1),
  new Date(2024, 5, 1),
  new Date(2024, 6, 1),
  new Date(2024, 7, 1),
  new Date(2024, 8, 1),
  new Date(2024, 9, 1),
  new Date(2024, 10, 1),
  new Date(2024, 11, 1)
];

const quarterlyPoints = [new Date(2024, 0, 1), new Date(2024, 3, 1), new Date(2024, 6, 1), new Date(2024, 9, 1)];

const monthlyData = {
  totalDebt: [2450, 2380, 2520, 2680, 2590, 2450, 2320, 2180, 2090, 2150, 2280, 2450],
  overdue: [890, 920, 950, 1020, 980, 890, 850, 800, 750, 780, 820, 890],
  paid: [1560, 1460, 1570, 1660, 1610, 1560, 1470, 1380, 1340, 1370, 1460, 1560]
};

const quarterlyData = {
  totalDebt: [2450, 2590, 2180, 2450],
  overdue: [890, 980, 800, 890],
  paid: [1560, 1610, 1380, 1560]
};

// Debt analysis data
const debtAnalysisData = {
  monthly: [
    { title: 'Khách hàng A', value: '₫450,000', progress: { value: 75 } },
    { title: 'Khách hàng B', value: '₫230,000', progress: { value: 45 } },
    { title: 'Khách hàng C', value: '₫180,000', progress: { value: 30 } },
    { title: 'Khách hàng D', value: '₫120,000', progress: { value: 20 } },
    { title: 'Khách hàng E', value: '₫90,000', progress: { value: 15 } }
  ],
  quarterly: [
    { title: 'Khách hàng A', value: '₫1,350,000', progress: { value: 85 } },
    { title: 'Khách hàng B', value: '₫690,000', progress: { value: 60 } },
    { title: 'Khách hàng C', value: '₫540,000', progress: { value: 45 } },
    { title: 'Khách hàng D', value: '₫360,000', progress: { value: 30 } },
    { title: 'Khách hàng E', value: '₫270,000', progress: { value: 25 } }
  ]
};

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 1.5 }}>{children}</Box>}
    </div>
  );
};

// Debt Overview Cards Component
const DebtOverviewCards = () => {
  const theme = useTheme();

  return (
    <Grid container sx={{ borderRadius: 4, boxShadow: theme.shadows[1], ...applyBorderWithRadius(16, theme) }}>
      {debtOverview.map((item, index) => (
        <Grid key={index} size={{ xs: 6, sm: 6, md: 3 }}>
          <OverviewCard {...{ ...item, cardProps: { sx: { border: 'none', borderRadius: 0, boxShadow: 'none' } } }} />
        </Grid>
      ))}
    </Grid>
  );
};

// Debt Chart Component
const DebtChart = () => {
  const theme = useTheme();
  const [view, setView] = useState('monthly');

  const handleViewChange = (event, newValue) => {
    setView(newValue);
  };

  const currentData = view === 'monthly' ? monthlyData : quarterlyData;
  const currentPoints = view === 'monthly' ? monthlyPoints : quarterlyPoints;

  const seriesData = [
    {
      id: 'total_debt',
      data: currentData.totalDebt,
      color: theme.palette.error.main,
      label: 'Tổng Công Nợ'
    },
    {
      id: 'overdue',
      data: currentData.overdue,
      color: theme.palette.warning.main,
      label: 'Quá Hạn'
    },
    {
      id: 'paid',
      data: currentData.paid,
      color: theme.palette.success.main,
      label: 'Đã Thanh Toán'
    }
  ];

  const valueFormatter = (date) => {
    return view === 'monthly' ? date.toLocaleDateString('vi-VN', { month: 'short' }) : `Q${Math.floor(date.getMonth() / 3) + 1}`;
  };

  return (
    <MainCard>
      <Stack sx={{ gap: 3 }}>
        <Stack direction="row" sx={{ alignItems: 'end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Stack sx={{ gap: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 400 }}>
              Phân Tích Công Nợ
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.700' }}>
              Theo dõi xu hướng công nợ và thanh toán theo thời gian
            </Typography>
          </Stack>
          <Tabs value={view} onChange={handleViewChange} aria-label="time filter">
            <Tab label="Theo Tháng" value="monthly" />
            <Tab label="Theo Quý" value="quarterly" />
          </Tabs>
        </Stack>
      </Stack>

      <LineChart
        series={seriesData.map((series) => ({ ...series, showMark: true, curve: 'linear' }))}
        height={300}
        grid={{ horizontal: true, vertical: true }}
        margin={{ top: 25, right: 20, bottom: 60, left: 80 }}
        xAxis={[
          {
            data: currentPoints,
            scaleType: 'point',
            valueFormatter: valueFormatter
          }
        ]}
        yAxis={[
          {
            scaleType: 'linear',
            label: 'Số tiền (₫)',
            valueFormatter: (value) => `₫${(value / 1000).toFixed(0)}K`
          }
        ]}
        slotProps={{ legend: { hidden: false } }}
        sx={{
          '& .MuiLineElement-root': { strokeWidth: 2 },
          '& .MuiMarkElement-root': { strokeWidth: 2 }
        }}
      />
    </MainCard>
  );
};

// Debt Analysis Component
const DebtAnalysis = () => {
  const theme = useTheme();
  const [period, setPeriod] = useState('monthly');

  const handlePeriodChange = (event, newValue) => {
    setPeriod(newValue);
  };

  return (
    <Grid container sx={{ borderRadius: 4, boxShadow: theme.shadows[1], ...applyBorderWithRadius(16, theme) }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack sx={{ gap: 2.5, p: 3 }}>
          <Typography variant="subtitle1">Top Công Nợ Khách Hàng</Typography>
          <Box>
            <Tabs variant="fullWidth" value={period} onChange={handlePeriodChange} aria-label="period tabs">
              <Tab label="Tháng" value="monthly" />
              <Tab label="Quý" value="quarterly" />
            </Tabs>
            <TabPanel value={period} index="monthly">
              <Stack sx={{ gap: 1.25 }}>
                {debtAnalysisData.monthly.map((item, index) => (
                  <ProgressCard key={index} {...item} />
                ))}
              </Stack>
            </TabPanel>
            <TabPanel value={period} index="quarterly">
              <Stack sx={{ gap: 1.25 }}>
                {debtAnalysisData.quarterly.map((item, index) => (
                  <ProgressCard key={index} {...item} />
                ))}
              </Stack>
            </TabPanel>
          </Box>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack sx={{ gap: 2.5, p: 3 }}>
          <Typography variant="subtitle1">Thống Kê Thanh Toán</Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tỷ lệ thanh toán đúng hạn
              </Typography>
              <Typography variant="h5" color="success.main">
                78.5%
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Thời gian thanh toán trung bình
              </Typography>
              <Typography variant="h5" color="warning.main">
                12.3 ngày
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tổng số khách hàng nợ
              </Typography>
              <Typography variant="h5" color="error.main">
                24 khách hàng
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Grid>
    </Grid>
  );
};

// Main Dashboard Component
export default function DashboardDebt() {
  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={12}>
        <DebtOverviewCards />
      </Grid>
      <Grid size={12}>
        <DebtChart />
      </Grid>
      <Grid size={12}>
        <DebtAnalysis />
      </Grid>
    </Grid>
  );
}
