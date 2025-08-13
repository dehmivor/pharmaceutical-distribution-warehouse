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
  Tooltip,
  Avatar,
  Stack
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
  Error as ErrorIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  AccountCircle as AccountCircleIcon,
  Timeline as TimelineIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
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
    users: {
      representatives: [],
      representativeManagers: [],
      warehouseStaff: [],
      warehouseManagers: [],
      supervisors: []
    },
    recentOrders: [],
    topMedicines: [],
    lowStockMedicines: [],
    systemStatus: {
      importOrders: { draft: 0, approved: 0, completed: 0, cancelled: 0 },
      exportOrders: { draft: 0, approved: 0, completed: 0, cancelled: 0 }
    },
    roleActivity: {
      representatives: { totalOrders: 0, activeUsers: 0 },
      representativeManagers: { totalApprovals: 0, activeUsers: 0 },
      warehouseStaff: { totalOperations: 0, activeUsers: 0 },
      warehouseManagers: { totalOperations: 0, activeUsers: 0 }
    }
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        importResponse,
        exportResponse,
        contractsResponse,
        medicinesResponse,
        suppliersResponse,
        retailersResponse,
        usersResponse
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/import-orders`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/api/export-orders`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/api/contract`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/api/medicine/all/v1`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/api/supplier/all/v1`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/api/retailer/all/v1`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/api/accounts`, { headers: getAuthHeaders() })
      ]);

      const importOrders = importResponse.data.data || [];
      const exportOrders = exportResponse.data.data || [];
      const contracts = contractsResponse.data.data?.contracts || [];
      const medicines = medicinesResponse.data.data || [];
      const suppliers = suppliersResponse.data.data || [];
      const retailers = retailersResponse.data.data || [];
      const users = usersResponse.data.data || [];

      // Calculate statistics
      const importStatusCount = importOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const exportStatusCount = exportOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      // Calculate revenue and expenses
      const totalRevenue = exportOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => {
          return sum + (order.details?.reduce((detailSum, detail) => 
            detailSum + (detail.expected_quantity * detail.unit_price), 0) || 0);
        }, 0);

      const totalExpenses = importOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => {
          return sum + (order.details?.reduce((detailSum, detail) => 
            detailSum + (detail.quantity * detail.unit_price), 0) || 0);
        }, 0);

      // Get recent orders (last 10)
      const recentOrders = [...importOrders, ...exportOrders]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);

      // Get low stock medicines
      const lowStockMedicines = medicines
        .filter(med => med.current_stock < (med.min_stock_threshold || 10))
        .sort((a, b) => a.current_stock - b.current_stock)
        .slice(0, 5);

      // Categorize users by role
      const categorizedUsers = {
        representatives: users.filter(user => user.role === 'representative'),
        representativeManagers: users.filter(user => user.role === 'representative_manager'),
        warehouseStaff: users.filter(user => user.role === 'warehouse'),
        warehouseManagers: users.filter(user => user.role === 'warehouse_manager'),
        supervisors: users.filter(user => user.role === 'supervisor')
      };

      // Calculate role activity
      const roleActivity = {
        representatives: {
          totalOrders: importOrders.filter(o => o.created_by?.role === 'representative').length + 
                      exportOrders.filter(o => o.created_by?.role === 'representative').length,
          activeUsers: categorizedUsers.representatives.filter(u => u.status === 'active').length
        },
        representativeManagers: {
          totalApprovals: importOrders.filter(o => o.status === 'approved').length + 
                         exportOrders.filter(o => o.status === 'approved').length,
          activeUsers: categorizedUsers.representativeManagers.filter(u => u.status === 'active').length
        },
        warehouseStaff: {
          totalOperations: importOrders.filter(o => ['delivered', 'checked', 'arranged', 'completed'].includes(o.status)).length,
          activeUsers: categorizedUsers.warehouseStaff.filter(u => u.status === 'active').length
        },
        warehouseManagers: {
          totalOperations: exportOrders.filter(o => ['delivered', 'checked', 'arranged', 'completed'].includes(o.status)).length,
          activeUsers: categorizedUsers.warehouseManagers.filter(u => u.status === 'active').length
        }
      };

      // Calculate overview stats
      const overview = {
        totalImportOrders: importOrders.length,
        totalExportOrders: exportOrders.length,
        totalContracts: contracts.length,
        totalMedicines: medicines.length,
        totalSuppliers: suppliers.length,
        totalRetailers: retailers.length,
        pendingApprovals: (importStatusCount.draft || 0) + (exportStatusCount.draft || 0),
        lowStockItems: medicines.filter(med => med.current_stock < (med.min_stock_threshold || 10)).length,
        totalRevenue,
        totalExpenses
      };

      setDashboardData({
        overview,
        users: categorizedUsers,
        recentOrders,
        topMedicines: medicines.slice(0, 5),
        lowStockMedicines,
        systemStatus: {
          importOrders: importStatusCount,
          exportOrders: exportStatusCount
        },
        roleActivity
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

  const getRoleColor = (role) => {
    switch (role) {
      case 'representative':
        return 'primary';
      case 'representative_manager':
        return 'secondary';
      case 'warehouse':
        return 'info';
      case 'warehouse_manager':
        return 'warning';
      case 'supervisor':
        return 'success';
      default:
        return 'default';
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary', trend = null, subtitle = null }) => (
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
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
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
          {trans.dashboard.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {trans.dashboard.description}
        </Typography>
      </Box>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.importOrders}
            value={dashboardData.overview.totalImportOrders}
            icon={<ShoppingCartIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.exportOrders}
            value={dashboardData.overview.totalExportOrders}
            icon={<LocalShippingIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.activeContracts}
            value={dashboardData.overview.totalContracts}
            icon={<AssessmentIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.totalMedicines}
            value={dashboardData.overview.totalMedicines}
            icon={<InventoryIcon />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.totalSuppliers}
            value={dashboardData.overview.totalSuppliers}
            icon={<BusinessIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.totalRetailers}
            value={dashboardData.overview.totalRetailers}
            icon={<StoreIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.totalRevenue}
            value={`${dashboardData.overview.totalRevenue.toLocaleString()} VND`}
            icon={<MoneyIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={trans.dashboard.totalExpenses}
            value={`${dashboardData.overview.totalExpenses.toLocaleString()} VND`}
            icon={<MoneyIcon />}
            color="error"
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
                <Typography variant="body2">
                  {trans.messages.needApproval || 'Need to approve pending import/export orders'}
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
                  {dashboardData.overview.lowStockItems} {trans.dashboard.lowStockItems.toLowerCase()}
                </Typography>
                <Typography variant="body2">
                  {trans.messages.needCheckLowStock || 'Need to check and replenish low stock medicines'}
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* Role Management Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            {trans.dashboard.roleActivity} & Performance Data
          </Typography>
        </Grid>
        
        {/* Representative Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {trans.dashboard.representatives} Activity
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {dashboardData.roleActivity.representatives.totalOrders}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {trans.dashboard.totalOrders} Created
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                      {dashboardData.users.representatives.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active {trans.dashboard.representatives}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {trans.dashboard.recentOrders} by {trans.dashboard.representatives}:
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {dashboardData.recentOrders
                      .filter(order => order.created_by?.role === 'representative')
                      .slice(0, 5)
                      .map((order) => (
                        <Box key={order._id} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #eee' }}>
                          <Typography variant="body2">
                            {order.contract_id?.partner_type === 'Supplier' ? 'Import' : 'Export'} - {order._id.slice(-8)}
                          </Typography>
                          <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                        </Box>
                      ))}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Representative Manager Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <AssessmentIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {trans.dashboard.representativeManagers} Activity
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {dashboardData.roleActivity.representativeManagers.totalApprovals}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {trans.dashboard.totalOrders} Approved
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      {dashboardData.users.representativeManagers.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active {trans.dashboard.representativeManagers}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Approval Rate Analysis:
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                    <Typography variant="body2">Draft {trans.dashboard.totalOrders}:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {dashboardData.systemStatus.importOrders.draft + dashboardData.systemStatus.exportOrders.draft}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                    <Typography variant="body2">Approved {trans.dashboard.totalOrders}:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {dashboardData.systemStatus.importOrders.approved + dashboardData.systemStatus.exportOrders.approved}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Warehouse Staff Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <InventoryIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {trans.dashboard.warehouseStaff} Activity
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                      {dashboardData.roleActivity.warehouseStaff.totalOperations}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Import {trans.dashboard.totalOperations}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {dashboardData.users.warehouseStaff.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Staff
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Import Order Status Breakdown:
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                    <Typography variant="body2">Delivered:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {dashboardData.systemStatus.importOrders.delivered || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                    <Typography variant="body2">Checked:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {dashboardData.systemStatus.importOrders.checked || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                    <Typography variant="body2">Arranged:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {dashboardData.systemStatus.importOrders.arranged || 0}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Warehouse Manager Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <LocalShippingIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Warehouse Manager Activity
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      {dashboardData.roleActivity.warehouseManagers.totalOperations}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Export Operations
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                      {dashboardData.users.warehouseManagers.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Managers
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Export Order Status Breakdown:
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                    <Typography variant="body2">Delivered:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {dashboardData.systemStatus.exportOrders.delivered || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                    <Typography variant="body2">Checked:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {dashboardData.systemStatus.exportOrders.checked || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                    <Typography variant="body2">Arranged:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {dashboardData.systemStatus.exportOrders.arranged || 0}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

      {/* Recent Orders and Low Stock */}
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
                        <TableCell>Details</TableCell>
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
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {order.details?.length || 0} items
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
          <Stack spacing={3}>
            {/* Top Medicines */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  {trans.tabs.inventory} {trans.header.dashboard}
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
                          {trans.status.active}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Low Stock Medicines */}
            {dashboardData.lowStockMedicines.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
                                      {trans.messages.warning} {trans.tabs.inventory}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dashboardData.lowStockMedicines.map((medicine) => (
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
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                          {medicine.current_stock || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          / {medicine.min_stock_threshold || 10}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
        
      </Grid>
    </Box>
  );
}

export default SupervisorDashboard;
