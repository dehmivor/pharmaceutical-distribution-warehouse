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
import { BarChart } from '@mui/x-charts';
import { useRouter } from 'next/navigation';
import { Fab } from '@mui/material';
import { ArrowBackIosNewOutlined, ArrowCircleRight } from '@mui/icons-material';

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
      avatar: <TrendingUpIcon size={16} />
    },
    icon: <CreditCardIcon size={24} />
  },
  {
    title: 'Công Nợ Quá Hạn',
    value: '₫890,000',
    compare: 'So với tuần trước',
    chip: {
      label: '12.5%',
      color: 'error',
      avatar: <TrendingUpIcon size={16} />
    },
    icon: <WarningIcon size={24} />
  },
  {
    title: 'Đã Thanh Toán',
    value: '₫1,560,000',
    compare: 'So với tuần trước',
    chip: {
      label: '15.3%',
      color: 'success',
      avatar: <TrendingUpIcon size={16} />
    },
    icon: <CheckCircleIcon size={24} />
  },
  {
    title: 'Sắp Đến Hạn',
    value: '₫340,000',
    compare: 'So với tuần trước',
    chip: {
      label: '5.1%',
      color: 'warning',
      avatar: <TrendingDownIcon size={16} />
    },
    icon: <AccessTimeIcon size={24} />
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

const HistoricalDebtCard = () => {
  const theme = useTheme();

  // Giả sử dùng dữ liệu tháng
  const series = [
    {
      id: 'total_debt',
      data: monthlyData.totalDebt,
      label: 'Tổng Công Nợ',
      color: theme.palette.error.main
    }
  ];

  return (
    <MainCard sx={{ height: '100%' }}>
      <Stack spacing={2} height="100%">
        <Typography variant="subtitle1">Lịch Sử Công Nợ</Typography>
        <LineChart
          series={series}
          height={250}
          xAxis={[
            {
              data: monthlyPoints,
              scaleType: 'point',
              valueFormatter: (date) => date.toLocaleDateString('vi-VN', { month: 'short' })
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
      </Stack>
    </MainCard>
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

// Trong thực tế bạn sẽ lấy dữ liệu thật, mình tạo mock như sau:

const debtReceivableData = {
  monthly: [1200, 1100, 1150, 1250, 1300, 1200, 1190, 1180, 1150, 1170, 1200, 1220],
  quarterly: [3450, 3800, 3500, 3800]
};

const debtPayableData = {
  monthly: [900, 850, 870, 910, 930, 890, 860, 820, 800, 810, 830, 840],
  quarterly: [2600, 2750, 2500, 2550]
};
const DebtReceivableChart = () => {
  const theme = useTheme();
  const [view, setView] = useState('monthly');

  const handleViewChange = (event, newValue) => {
    setView(newValue);
  };

  const data = view === 'monthly' ? debtReceivableData.monthly : debtReceivableData.quarterly;
  const points = view === 'monthly' ? monthlyPoints : quarterlyPoints;

  return (
    <MainCard>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Công Nợ Cần Thu</Typography>
          <Tabs value={view} onChange={handleViewChange} aria-label="debt receivable view tabs" size="small">
            <Tab label="Theo Tháng" value="monthly" />
            <Tab label="Theo Quý" value="quarterly" />
          </Tabs>
        </Stack>

        <LineChart
          series={[
            {
              id: 'receivable',
              data: data,
              color: theme.palette.warning.main,
              label: 'Công Nợ Cần Thu'
            }
          ]}
          height={250}
          xAxis={[
            {
              data: points,
              scaleType: 'point',
              valueFormatter: (date) =>
                view === 'monthly' ? date.toLocaleDateString('vi-VN', { month: 'short' }) : `Q${Math.floor(date.getMonth() / 3) + 1}`
            }
          ]}
          yAxis={[
            {
              scaleType: 'linear',
              label: 'Số tiền (₫)',
              valueFormatter: (val) => `₫${(val / 1000).toFixed(0)}K`
            }
          ]}
          slotProps={{ legend: { hidden: false } }}
          sx={{ '& .MuiLineElement-root': { strokeWidth: 2 } }}
        />
      </Stack>
    </MainCard>
  );
};
const DebtPayableChart = () => {
  const theme = useTheme();
  const [view, setView] = useState('monthly');

  const handleViewChange = (event, newValue) => {
    setView(newValue);
  };

  const data = view === 'monthly' ? debtPayableData.monthly : debtPayableData.quarterly;
  const points = view === 'monthly' ? monthlyPoints : quarterlyPoints;

  return (
    <MainCard>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Công Nợ Cần Thanh Toán</Typography>
          <Tabs value={view} onChange={handleViewChange} aria-label="debt payable view tabs" size="small">
            <Tab label="Theo Tháng" value="monthly" />
            <Tab label="Theo Quý" value="quarterly" />
          </Tabs>
        </Stack>

        <LineChart
          series={[
            {
              id: 'payable',
              data: data,
              color: theme.palette.error.main,
              label: 'Công Nợ Cần Thanh Toán'
            }
          ]}
          height={250}
          xAxis={[
            {
              data: points,
              scaleType: 'point',
              valueFormatter: (date) =>
                view === 'monthly' ? date.toLocaleDateString('vi-VN', { month: 'short' }) : `Q${Math.floor(date.getMonth() / 3) + 1}`
            }
          ]}
          yAxis={[
            {
              scaleType: 'linear',
              label: 'Số tiền (₫)',
              valueFormatter: (val) => `₫${(val / 1000).toFixed(0)}K`
            }
          ]}
          slotProps={{ legend: { hidden: false } }}
          sx={{ '& .MuiLineElement-root': { strokeWidth: 2 } }}
        />
      </Stack>
    </MainCard>
  );
};

const DebtAnalysis = () => {
  const theme = useTheme();
  const [period, setPeriod] = useState('monthly');

  const handlePeriodChange = (event, newValue) => {
    setPeriod(newValue);
  };

  const currentData = debtAnalysisData[period];
  const series = [
    {
      id: 'debt',
      data: currentData.map((item) => Number(item.value.replace(/[₫,]/g, '')) / 1000),
      label: 'Công Nợ (nghìn VND)',
      color: theme.palette.primary.main
    }
  ];
  const categories = currentData.map((item) => item.title);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <DebtReceivableChart />
      </Grid>
      <Grid item xs={12} md={4}>
        <DebtPayableChart />
      </Grid>
      <Grid item xs={12} md={4}>
        <MainCard>
          <Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Phân Tích Công Nợ</Typography>
              <Tabs value={period} onChange={handlePeriodChange} aria-label="debt analysis period tabs" size="small">
                <Tab label="Theo Tháng" value="monthly" />
                <Tab label="Theo Quý" value="quarterly" />
              </Tabs>
            </Stack>
            <BarChart
              series={series}
              height={300}
              xAxis={[{ data: categories, scaleType: 'band' }]}
              yAxis={[{ scaleType: 'linear', label: 'Số tiền (₫)', valueFormatter: (val) => `₫${(val / 1000).toFixed(0)}K` }]}
              slotProps={{ legend: { hidden: false } }}
            />
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
};

// Main Dashboard Component
export default function DashboardDebt() {
  const router = useRouter();
  const handleReportClick = () => {
    router.push('/sp-report'); // đường dẫn màn báo cáo thống kê
  };
  return (
    <>
      <Grid container spacing={3}>
        <Grid size={12}>
          <DebtOverviewCards />
        </Grid>
        <Grid size={12}>
          <DebtChart />
        </Grid>
      </Grid>

      <Fab
        color="primary"
        size="large"
        aria-label="add"
        onClick={handleReportClick}
        sx={{
          position: 'fixed',
          bottom: 26,
          right: 26,
          zIndex: (theme) => theme.zIndex.tooltip + 1
        }}
      >
        <ArrowCircleRight />
      </Fab>
    </>
  );
}
