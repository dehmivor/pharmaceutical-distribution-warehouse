'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Tooltip,
  Avatar,
  Stack,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Assessment as AssessmentIcon,
  Inventory as InventoryIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts/BarChart';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';
import MainCard from '@/components/MainCard';
import Legend from '@/components/third-party/chart/Legend';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'processing':
      return 'info';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Dashboard Header Component
const DashboardHeader = ({ title, subtitle }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
    <Typography variant="body1" color="text.secondary">
      {subtitle}
    </Typography>
  </Box>
);

// Overview Stats Card Component
const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card sx={{ height: '100%', position: 'relative' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ bgcolor: `${color}.light`, borderRadius: '50%', p: 2 }}>{icon}</Box>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </CardContent>
  </Card>
);

// Overview Stats Grid Component
const OverviewStatsGrid = ({ overviewData }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Tổng Phiếu Nhập" value={overviewData.totalImportOrders} icon={<ShoppingCartIcon />} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Tổng Phiếu Xuất" value={overviewData.totalExportOrders} icon={<LocalShippingIcon />} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Hợp Đồng Hoạt Động" value={overviewData.totalContracts} icon={<AssessmentIcon />} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Tổng Thuốc" value={overviewData.totalMedicines} icon={<InventoryIcon />} />
      </Grid>
    </Grid>
  );
};

// Secondary Stats Grid Component
const SecondaryStatsGrid = ({ overviewData }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Tổng Nhà Cung Cấp" value={overviewData.totalSuppliers} icon={<BusinessIcon />} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Tổng Nhà Thuốc" value={overviewData.totalRetailers} icon={<StoreIcon />} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Tổng Doanh Thu" value={`${overviewData.totalRevenue.toLocaleString()} VND`} icon={<MoneyIcon />} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Tổng Chi Phí" value={`${overviewData.totalExpenses.toLocaleString()} VND`} icon={<MoneyIcon />} />
      </Grid>
    </Grid>
  );
};

// Alerts and Warnings Component
const AlertsSection = ({ overviewData, trans }) => {
  if (overviewData.pendingApprovals === 0 && overviewData.lowStockItems === 0) {
    return null;
  }

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {overviewData.pendingApprovals > 0 && (
        <Grid item xs={12} md={6}>
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            action={
              <IconButton color="inherit" size="small">
                <RefreshIcon />
              </IconButton>
            }
            sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {overviewData.pendingApprovals} {trans.dashboard.pendingApprovals.toLowerCase()}
            </Typography>
            <Typography variant="body2">{trans.messages.needApproval || 'Need to approve pending import/export orders'}</Typography>
          </Alert>
        </Grid>
      )}
      {overviewData.lowStockItems > 0 && (
        <Grid item xs={12} md={6}>
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            action={
              <IconButton color="inherit" size="small">
                <RefreshIcon />
              </IconButton>
            }
            sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {overviewData.lowStockItems} {trans.dashboard.lowStockItems.toLowerCase()}
            </Typography>
            <Typography variant="body2">{trans.messages.needCheckLowStock || trans.alerts.needCheckLowStock}</Typography>
          </Alert>
        </Grid>
      )}
    </Grid>
  );
};

// Process Chart Component
const ProcessChart = ({ recentOrders, trans }) => {
  const [view, setView] = useState('daily');
  const [visibilityOption, setVisibilityOption] = useState({
    import: true,
    export: true,
    pending: true
  });

  const timeFilter = [trans.common.daily, trans.common.weekly, trans.common.monthly];

  const handleViewChange = (_event, newValue) => {
    const viewMap = { 0: 'daily', 1: 'weekly', 2: 'monthly' };
    setView(viewMap[newValue]);
  };

  const toggleVisibility = (id) => {
    setVisibilityOption((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Mock data for chart - in real app, this would come from API
  const chartData = {
    daily: {
      import: [8, 12, 15, 10, 18, 14, 20],
      export: [6, 10, 12, 8, 15, 12, 18],
      pending: [2, 2, 3, 2, 3, 2, 2]
    },
    weekly: {
      import: [85, 92, 78, 88, 95, 82, 90, 87],
      export: [75, 82, 68, 78, 85, 72, 80, 77],
      pending: [10, 10, 10, 10, 10, 10, 10, 10]
    },
    monthly: {
      import: [320, 285, 310, 295, 340, 315, 330, 305, 325, 290, 315, 335],
      export: [280, 245, 270, 255, 300, 275, 290, 265, 285, 250, 275, 295],
      pending: [40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40]
    }
  };

  const timeLabels = {
    daily: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    weekly: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'],
    monthly: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
  };

  const currentData = chartData[view];
  const seriesData = [
    {
      id: 'import',
      data: currentData.import,
      color: '#1976d2',
      visible: visibilityOption.import,
      label: 'Phiếu Nhập'
    },
    {
      id: 'export',
      data: currentData.export,
      color: '#2e7d32',
      visible: visibilityOption.export,
      label: 'Phiếu Xuất'
    },
    {
      id: 'pending',
      data: currentData.pending,
      color: '#ed6c02',
      visible: visibilityOption.pending,
      label: 'Chờ Duyệt'
    }
  ];

  const visibleSeries = seriesData.filter((s) => s.visible);
  const legendItems = seriesData.map((series) => ({
    visible: series.visible,
    id: series.id
  }));

  const viewToIndex = { daily: 0, weekly: 1, monthly: 2 };

  return (
    <MainCard sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
      <Stack sx={{ gap: 3 }}>
        <Stack direction="row" sx={{ alignItems: 'end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Stack sx={{ gap: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              Thống Kê Quy Trình Kho
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.700' }}>
              Theo dõi tiến độ nhập xuất kho
            </Typography>
          </Stack>
          <Tabs
            value={viewToIndex[view] || 0}
            onChange={handleViewChange}
            aria-label="filter tabs"
            sx={{
              width: 'fit-content',
              '& .MuiTab-root': {
                minWidth: 80,
                fontSize: '0.875rem'
              }
            }}
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
};

// Quick Actions Component
const QuickActionsCard = ({ trans }) => {
  const actions = [
    {
      title: 'Quản Lý Đơn Hàng',
      description: 'Xem và xử lý các đơn hàng nhập xuất',
      icon: <ShoppingCartIcon />,
      color: 'primary',
      path: '/sp-import-orders'
    },
    {
      title: 'Quản Lý Hợp Đồng',
      description: 'Theo dõi và quản lý hợp đồng với đối tác',
      icon: <AssessmentIcon />,
      color: 'success',
      path: '/sp-contract-management'
    },
    {
      title: 'Quản Lý Thuốc',
      description: 'Kiểm soát tồn kho và thông tin thuốc',
      icon: <InventoryIcon />,
      color: 'info',
      path: '/sp-manage-medicines'
    },
    {
      title: 'Báo Cáo & Thống Kê',
      description: 'Xem báo cáo chi tiết và phân tích dữ liệu',
      icon: <TrendingUpIcon />,
      color: 'warning',
      path: '/sp-report'
    }
  ];

  return (
    <MainCard sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
      <Stack sx={{ gap: 3 }}>
        <Stack sx={{ gap: 0.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Thao Tác Nhanh
          </Typography>
          <Typography variant="caption" sx={{ color: 'grey.700' }}>
            Truy cập nhanh các chức năng chính
          </Typography>
        </Stack>

        <Grid container spacing={0} sx={{ width: '100%' }}>
          {actions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 0,
                  cursor: 'pointer',
                  border: '1px solid #e0e0e0',
                  '&:not(:last-child)': {
                    borderRight: '1px solid #e0e0e0'
                  }
                }}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Box
                    sx={{
                      bgcolor: `${action.color}.light`,
                      borderRadius: '50%',
                      p: 1.5,
                      mx: 'auto',
                      mb: 2,
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {React.cloneElement(action.icon, {
                      sx: { color: `${action.color}.main`, fontSize: 24 }
                    })}
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    {action.description}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      borderColor: `${action.color}.main`,
                      color: `${action.color}.main`,
                      '&:hover': {
                        borderColor: `${action.color}.dark`,
                        bgcolor: `${action.color}.light`
                      }
                    }}
                  >
                    Truy Cập
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </MainCard>
  );
};

// Recent Activities Component
const RecentActivitiesCard = ({ recentOrders, trans }) => {
  const activities = recentOrders.slice(0, 8).map((order, index) => ({
    id: order._id || index,
    message: `${order.contract_id?.partner_type === 'Supplier' ? 'Nhập' : 'Xuất'} - ${order._id?.slice(-8) || order.order_code || `#${index + 1}`}`,
    time: new Date(order.createdAt || Date.now() - index * 3600000).toLocaleString('vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    status: order.status,
    type: order.contract_id?.partner_type === 'Supplier' ? 'import' : 'export'
  }));

  return (
    <MainCard sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
      <Stack sx={{ gap: 3 }}>
        <Stack sx={{ gap: 0.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Hoạt Động Gần Đây
          </Typography>
          <Typography variant="caption" sx={{ color: 'grey.700' }}>
            Theo dõi các hoạt động mới nhất trong hệ thống
          </Typography>
        </Stack>

        <Stack spacing={2}>
          {activities.map((activity) => (
            <Box
              key={activity.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderRadius: 0,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'grey.200'
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    bgcolor: activity.type === 'import' ? 'primary.light' : 'success.light',
                    borderRadius: '50%',
                    p: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {activity.type === 'import' ? (
                    <ShoppingCartIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  ) : (
                    <LocalShippingIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  )}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {activity.message}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={activity.status} color={getStatusColor(activity.status)} size="small" variant="outlined" />
                <Typography variant="caption" color="text.secondary">
                  {activity.time}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>
    </MainCard>
  );
};

function SupervisorDashboard() {
  const trans = useTrans();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalImportOrders: 0,
      totalExportOrders: 0,
      totalContracts: 0,
      totalMedicines: 0,
      totalSuppliers: 0,
      totalRetailers: 0,
      pendingApprovals: 0,
      lowStockItems: 0,
      totalRevenue: 0,
      totalExpenses: 0
    },
    recentOrders: [],
    lowStockMedicines: []
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [importResponse, exportResponse, contractsResponse, medicinesResponse, suppliersResponse, retailersResponse] =
        await Promise.all([
          axios.get(`${API_BASE_URL}/api/import-orders`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/api/export-orders`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/api/contract`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/api/medicine/all/v1`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/api/supplier/all/v1`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE_URL}/api/retailer/all/v1`, { headers: getAuthHeaders() })
        ]);

      const importOrders = importResponse.data.data || [];
      const exportOrders = exportResponse.data.data || [];
      const contracts = contractsResponse.data.data?.contracts || [];
      const medicines = medicinesResponse.data.data || [];
      const suppliers = suppliersResponse.data.data || [];
      const retailers = retailersResponse.data.data || [];

      // Calculate overview stats
      const totalRevenue = exportOrders
        .filter((order) => order.status === 'completed')
        .reduce(
          (sum, order) =>
            sum + (order.details?.reduce((detailSum, detail) => detailSum + detail.expected_quantity * detail.unit_price, 0) || 0),
          0
        );

      const totalExpenses = importOrders
        .filter((order) => order.status === 'completed')
        .reduce(
          (sum, order) => sum + (order.details?.reduce((detailSum, detail) => detailSum + detail.quantity * detail.unit_price, 0) || 0),
          0
        );

      const overview = {
        totalImportOrders: importOrders.length,
        totalExportOrders: exportOrders.length,
        totalContracts: contracts.length,
        totalMedicines: medicines.length,
        totalSuppliers: suppliers.length,
        totalRetailers: retailers.length,
        pendingApprovals:
          importOrders.filter((order) => order.status === 'draft').length + exportOrders.filter((order) => order.status === 'draft').length,
        lowStockItems: medicines.filter((med) => med.current_stock < (med.min_stock_threshold || 10)).length,
        totalRevenue,
        totalExpenses
      };

      setDashboardData({
        overview,
        recentOrders: [...importOrders, ...exportOrders].slice(0, 10),
        lowStockMedicines: medicines.filter((med) => med.current_stock < (med.min_stock_threshold || 10)).slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(trans.common.failedToLoadDashboard);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <IconButton color="inherit" size="small" onClick={fetchDashboardData}>
              <RefreshIcon />
            </IconButton>
          }
          sx={{ borderRadius: 2 }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <DashboardHeader title={trans.dashboard.title} subtitle="Quản lý toàn diện hệ thống kho dược phẩm và theo dõi hiệu suất kinh doanh" />

      {/* Overview Stats */}
      <Box sx={{ mb: 4 }}>
        <OverviewStatsGrid overviewData={dashboardData.overview} />
      </Box>

      {/* Secondary Stats */}
      <Box sx={{ mb: 4 }}>
        <SecondaryStatsGrid overviewData={dashboardData.overview} />
      </Box>

      {/* Alerts and Warnings */}
      <AlertsSection overviewData={dashboardData.overview} trans={trans} />

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <QuickActionsCard trans={trans} />
      </Box>

      {/* Recent Activities */}
      <Box sx={{ mb: 4 }}>
        <RecentActivitiesCard recentOrders={dashboardData.recentOrders} trans={trans} />
      </Box>
    </Box>
  );
}

export default SupervisorDashboard;
