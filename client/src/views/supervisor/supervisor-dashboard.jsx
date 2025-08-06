'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

function SupervisorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalImportOrders: 0,
      totalExportOrders: 0,
      totalContracts: 0,
      totalMedicines: 0,
      pendingApprovals: 0,
      lowStockItems: 0
    },
    recentOrders: [],
    topMedicines: [],
    systemStatus: {
      importOrders: { draft: 0, approved: 0, completed: 0, cancelled: 0 },
      exportOrders: { draft: 0, approved: 0, completed: 0, cancelled: 0 }
    }
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch import orders
      const importResponse = await axios.get(`${API_BASE_URL}/api/import-orders`, {
        headers: getAuthHeaders()
      });
      const importOrders = importResponse.data.data || [];

      // Fetch export orders
      const exportResponse = await axios.get(`${API_BASE_URL}/api/export-orders`, {
        headers: getAuthHeaders()
      });
      const exportOrders = exportResponse.data.data || [];

      // Fetch contracts
      const contractsResponse = await axios.get(`${API_BASE_URL}/api/contract`, {
        headers: getAuthHeaders()
      });
      const contracts = contractsResponse.data.data?.contracts || [];

      // Fetch medicines
      const medicinesResponse = await axios.get(`${API_BASE_URL}/api/medicine/all/v1`, {
        headers: getAuthHeaders()
      });
      const medicines = medicinesResponse.data.data || [];

      // Calculate statistics
      const importStatusCount = importOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const exportStatusCount = exportOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      // Get recent orders (last 5)
      const recentOrders = [...importOrders, ...exportOrders]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      // Calculate overview stats
      const overview = {
        totalImportOrders: importOrders.length,
        totalExportOrders: exportOrders.length,
        totalContracts: contracts.length,
        totalMedicines: medicines.length,
        pendingApprovals: (importStatusCount.draft || 0) + (exportStatusCount.draft || 0),
        lowStockItems: medicines.filter(med => med.current_stock < (med.min_stock_threshold || 10)).length
      };

      setDashboardData({
        overview,
        recentOrders,
        topMedicines: medicines.slice(0, 5), // Top 5 medicines by stock
        systemStatus: {
          importOrders: importStatusCount,
          exportOrders: exportStatusCount
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary', trend = null }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${color}.light`,
              color: `${color}.main`
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Chip
              icon={trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${Math.abs(trend)}%`}
              color={trend > 0 ? 'success' : 'error'}
              size="small"
            />
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          {value.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

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
        <Alert severity="error" action={
          <IconButton color="inherit" size="small" onClick={fetchDashboardData}>
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          Supervisor Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tổng quan hệ thống quản lý kho dược phẩm
        </Typography>
      </Box>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Import Orders"
            value={dashboardData.overview.totalImportOrders}
            icon={<ShoppingCartIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Export Orders"
            value={dashboardData.overview.totalExportOrders}
            icon={<LocalShippingIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Contracts"
            value={dashboardData.overview.totalContracts}
            icon={<AssessmentIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Medicines"
            value={dashboardData.overview.totalMedicines}
            icon={<InventoryIcon />}
            color="success"
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
                  {dashboardData.overview.pendingApprovals} orders pending approval
                </Typography>
                <Typography variant="body2">
                  Cần duyệt các đơn hàng import/export đang chờ xử lý
                </Typography>
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
                  {dashboardData.overview.lowStockItems} medicines low in stock
                </Typography>
                <Typography variant="body2">
                  Cần kiểm tra và bổ sung thuốc có tồn kho thấp
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* System Status */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Import Orders Status
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(dashboardData.systemStatus.importOrders).map(([status, count]) => (
                  <Grid item xs={6} key={status}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip 
                        label={status} 
                        color={getStatusColor(status)} 
                        size="small" 
                        variant="outlined"
                      />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {count}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Export Orders Status
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(dashboardData.systemStatus.exportOrders).map(([status, count]) => (
                  <Grid item xs={6} key={status}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip 
                        label={status} 
                        color={getStatusColor(status)} 
                        size="small" 
                        variant="outlined"
                      />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {count}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Orders */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Orders
                </Typography>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={fetchDashboardData}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Contract</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentOrders.map((order) => (
                      <TableRow key={order._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {order._id.slice(-8)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={order.contract_id?.partner_type === 'Supplier' ? 'Import' : 'Export'} 
                            color={order.contract_id?.partner_type === 'Supplier' ? 'primary' : 'secondary'} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{order.contract_id?.contract_code || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={order.status} 
                            color={getStatusColor(order.status)} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(order.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Top Medicines by Stock
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dashboardData.topMedicines.map((medicine, index) => (
                  <Box key={medicine._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {medicine.medicine_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {medicine.license_code}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {medicine.current_stock || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        in stock
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SupervisorDashboard;
