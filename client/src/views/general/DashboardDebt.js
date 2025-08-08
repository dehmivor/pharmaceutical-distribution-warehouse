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
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';

// Custom hook for debt dashboard
import useDebtDashboard from '@/hooks/useDebtDashboard';

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

// Debt Overview Cards Component
const DebtOverviewCards = ({ overviewData }) => {
  const theme = useTheme();

  const debtOverview = [
    {
      title: 'Tổng Công Nợ',
      value: `₫${overviewData.totalDebt?.toLocaleString() || '0'}`,
      compare: 'So với tuần trước',
      chip: {
        label: `${overviewData.weeklyChange?.totalDebt || 0}%`,
        color: 'error',
        avatar: <TrendingUpIcon size={16} />
      },
      icon: <CreditCardIcon size={24} />
    },
    {
      title: 'Công Nợ Quá Hạn',
      value: `₫${overviewData.overdueDebt?.toLocaleString() || '0'}`,
      compare: 'So với tuần trước',
      chip: {
        label: `${overviewData.weeklyChange?.overdueDebt || 0}%`,
        color: 'error',
        avatar: <TrendingUpIcon size={16} />
      },
      icon: <WarningIcon size={24} />
    },
    {
      title: 'Đã Thanh Toán',
      value: `₫${overviewData.paidAmount?.toLocaleString() || '0'}`,
      compare: 'So với tuần trước',
      chip: {
        label: `${overviewData.weeklyChange?.paidAmount || 0}%`,
        color: 'success',
        avatar: <TrendingUpIcon size={16} />
      },
      icon: <CheckCircleIcon size={24} />
    },
    {
      title: 'Sắp Đến Hạn',
      value: `₫${overviewData.upcomingDebt?.toLocaleString() || '0'}`,
      compare: 'So với tuần trước',
      chip: {
        label: `${overviewData.weeklyChange?.upcomingDebt || 0}%`,
        color: 'warning',
        avatar: <TrendingDownIcon size={16} />
      },
      icon: <AccessTimeIcon size={24} />
    }
  ];

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
const DebtChart = ({ chartData }) => {
  const theme = useTheme();
  const [view, setView] = useState('monthly');

  const handleViewChange = (event, newValue) => {
    setView(newValue);
  };

  const currentData = view === 'monthly' ? chartData.monthly : chartData.quarterly;
  const currentPoints = currentData.map((item, index) => new Date(item.month || item.quarter));

  const seriesData = [
    {
      id: 'total_debt',
      data: currentData.map((item) => item.totalDebt),
      color: theme.palette.error.main,
      label: 'Tổng Công Nợ'
    },
    {
      id: 'overdue',
      data: currentData.map((item) => item.overdue),
      color: theme.palette.warning.main,
      label: 'Quá Hạn'
    },
    {
      id: 'paid',
      data: currentData.map((item) => item.paid),
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
            valueFormatter: (value) => `₫${(value * 1000).toFixed(0)}K`
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

// Debt Receivable Chart Component
const DebtReceivableChart = ({ receivableData }) => {
  const theme = useTheme();
  const [view, setView] = useState('monthly');

  const handleViewChange = (event, newValue) => {
    setView(newValue);
  };

  const data = view === 'monthly' ? receivableData.monthly : receivableData.quarterly;
  const points = data.map((_, index) => new Date(2024, index, 1));

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
              valueFormatter: (val) => `₫${(val * 1000).toFixed(0)}K`
            }
          ]}
          slotProps={{ legend: { hidden: false } }}
          sx={{ '& .MuiLineElement-root': { strokeWidth: 2 } }}
        />
      </Stack>
    </MainCard>
  );
};

// Debt Payable Chart Component
const DebtPayableChart = ({ payableData }) => {
  const theme = useTheme();
  const [view, setView] = useState('monthly');

  const handleViewChange = (event, newValue) => {
    setView(newValue);
  };

  const data = view === 'monthly' ? payableData.monthly : payableData.quarterly;
  const points = data.map((_, index) => new Date(2024, index, 1));

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
              valueFormatter: (val) => `₫${(val * 1000).toFixed(0)}K`
            }
          ]}
          slotProps={{ legend: { hidden: false } }}
          sx={{ '& .MuiLineElement-root': { strokeWidth: 2 } }}
        />
      </Stack>
    </MainCard>
  );
};

// Debt Analysis Component
const DebtAnalysis = ({ analysisData }) => {
  const theme = useTheme();
  const [period, setPeriod] = useState('monthly');

  const handlePeriodChange = (event, newValue) => {
    setPeriod(newValue);
  };

  const currentData = analysisData[period] || [];
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
        <DebtReceivableChart receivableData={analysisData.receivable || { monthly: [], quarterly: [] }} />
      </Grid>
      <Grid item xs={12} md={4}>
        <DebtPayableChart payableData={analysisData.payable || { monthly: [], quarterly: [] }} />
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
              yAxis={[{ scaleType: 'linear', label: 'Số tiền (₫)', valueFormatter: (val) => `₫${(val * 1000).toFixed(0)}K` }]}
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
  const { dashboardData, loading, refreshing, error, lastUpdated, refreshDashboard } = useDebtDashboard();

  const handleReportClick = () => {
    router.push('/sp-report'); // đường dẫn màn báo cáo thống kê
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <IconButton color="inherit" size="small" onClick={refreshDashboard}>
              <RefreshIcon />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={12}>
          <DebtOverviewCards overviewData={dashboardData.overview} />
        </Grid>
        <Grid size={12}>
          <DebtChart chartData={dashboardData.chartData} />
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
