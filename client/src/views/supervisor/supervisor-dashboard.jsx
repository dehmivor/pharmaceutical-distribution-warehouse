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
  Stack
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
  People as PeopleIcon
} from '@mui/icons-material';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';

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

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card sx={{ height: '100%', position: 'relative' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ bgcolor: `${color}.light`, borderRadius: '50%', p: 2 }}>
          {icon}
        </Box>
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
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.details?.reduce((detailSum, detail) => detailSum + detail.expected_quantity * detail.unit_price, 0) || 0), 0);

      const totalExpenses = importOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.details?.reduce((detailSum, detail) => detailSum + detail.quantity * detail.unit_price, 0) || 0), 0);

      const overview = {
        totalImportOrders: importOrders.length,
        totalExportOrders: exportOrders.length,
        totalContracts: contracts.length,
        totalMedicines: medicines.length,
        totalSuppliers: suppliers.length,
        totalRetailers: retailers.length,
        pendingApprovals: importOrders.filter(order => order.status === 'draft').length + exportOrders.filter(order => order.status === 'draft').length,
        lowStockItems: medicines.filter(med => med.current_stock < (med.min_stock_threshold || 10)).length,
        totalRevenue,
        totalExpenses
      };

      setDashboardData({ overview, recentOrders: [...importOrders, ...exportOrders].slice(0, 10), lowStockMedicines: medicines.filter(med => med.current_stock < (med.min_stock_threshold || 10)).slice(0, 5) });
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
            <IconButton color="inherit" size="small" onClick={fetchDashboardData}>
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 4 }}>
        {trans.dashboard.title}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.importOrders}
            value={dashboardData.overview.totalImportOrders}
            icon={<ShoppingCartIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.exportOrders}
            value={dashboardData.overview.totalExportOrders}
            icon={<LocalShippingIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.activeContracts}
            value={dashboardData.overview.totalContracts}
            icon={<AssessmentIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.totalMedicines}
            value={dashboardData.overview.totalMedicines}
            icon={<InventoryIcon />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.totalSuppliers}
            value={dashboardData.overview.totalSuppliers}
            icon={<BusinessIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.totalRetailers}
            value={dashboardData.overview.totalRetailers}
            icon={<StoreIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.totalRevenue}
            value={`${dashboardData.overview.totalRevenue.toLocaleString()} VND`}
            icon={<MoneyIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.totalExpenses}
            value={`${dashboardData.overview.totalExpenses.toLocaleString()} VND`}
            icon={<MoneyIcon />}
          />
        </Grid>
      </Grid>

      {/* Alerts and Warnings */}
      {(dashboardData.overview.pendingApprovals > 0 || dashboardData.overview.lowStockItems > 0) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {dashboardData.overview.pendingApprovals > 0 && (
            <Grid item xs={12} md={6}>
              <Alert
                severity="warning"
                icon={<WarningIcon />}
                action={
                  <IconButton color="inherit" size="small">
                    <RefreshIcon />
                  </IconButton>
                }
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {dashboardData.overview.pendingApprovals} {trans.dashboard.pendingApprovals.toLowerCase()}
                </Typography>
                <Typography variant="body2">{trans.messages.needApproval || 'Need to approve pending import/export orders'}</Typography>
              </Alert>
            </Grid>
          )}
          {dashboardData.overview.lowStockItems > 0 && (
            <Grid item xs={12} md={6}>
              <Alert
                severity="error"
                icon={<ErrorIcon />}
                action={
                  <IconButton color="inherit" size="small">
                    <RefreshIcon />
                  </IconButton>
                }
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {dashboardData.overview.lowStockItems} {trans.dashboard.lowStockItems.toLowerCase()}
                </Typography>
                <Typography variant="body2">{trans.messages.needCheckLowStock || trans.alerts.needCheckLowStock}</Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* Recent Orders */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            {trans.common.recentOrders}
          </Typography>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {dashboardData.recentOrders.map(order => (
              <Box key={order._id} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #eee' }}>
                <Typography variant="body2">
                  {order.contract_id?.partner_type === 'Supplier' ? trans.common.import : trans.common.export} - {order._id.slice(-8)}
                </Typography>
                <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SupervisorDashboard;
