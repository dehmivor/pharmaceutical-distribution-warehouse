'use client'
import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Skeleton
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  Notifications as NotificationsIcon,
  Medication as MedicationIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Success as SuccessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import WarehouseManagerChart from '@/sections/dashboard/WarehouseManagerChart';
import useWarehouseManagerDashboard from '@/hooks/useWarehouseManagerDashboard';
import DashboardStats from '@/components/DashboardStats';



const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: `${color}.main`
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const RecentOrdersTable = ({ orders, title }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        {title}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders && orders.slice(0, 5).map((order) => (
              <TableRow key={order.id || order._id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {(order.id || order._id || '').toString().slice(-8).toUpperCase()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.status || 'Unknown'}
                    size="small"
                    color={
                      order.status === 'completed'
                        ? 'success'
                        : order.status === 'pending'
                        ? 'warning'
                        : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton size="small" color="primary">
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
);

const AlertsSection = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <NotificationsIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              System Alerts
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SuccessIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No alerts at the moment. All systems are running normally.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }
  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      case 'success':
        return <SuccessIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <NotificationsIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            System Alerts
          </Typography>
        </Box>
        <List sx={{ p: 0 }}>
          {(alerts || []).map((alert, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  {getAlertIcon(alert.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                      {alert.title}
                    </Typography>
                  }
                  secondary={
                    <Box component="span">
                      <Box component="span" sx={{ display: 'block', mb: 0.5 }}>
                        {alert.message}
                      </Box>
                      <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        {new Date(alert.timestamp).toLocaleString('vi-VN')}
                      </Box>
                    </Box>
                  }
                />
                <Chip
                  label={alert.severity}
                  size="small"
                  color={getAlertColor(alert.severity)}
                />
              </ListItem>
              {index < alerts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

const DashboardSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Skeleton variant="text" width={300} height={40} />
      <Skeleton variant="circular" width={40} height={40} />
    </Box>
    
    {/* Statistics Cards Skeleton */}
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {[1, 2, 3, 4].map((item) => (
        <Grid item xs={12} sm={6} md={3} key={item}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="circular" width={60} height={60} sx={{ ml: 'auto', mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
    
    {/* Chart Skeleton */}
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Skeleton variant="text" width={200} height={30} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </CardContent>
    </Card>
    
    {/* Tables Skeleton */}
    <Grid container spacing={3}>
      {[1, 2, 3].map((item) => (
        <Grid item xs={12} md={4} key={item}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Skeleton variant="text" width={150} height={30} sx={{ mb: 2 }} />
              {[1, 2, 3, 4, 5].map((row) => (
                <Skeleton key={row} variant="text" width="100%" height={20} sx={{ mb: 1 }} />
              ))}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
);

const TopMedicinesSection = ({ topMedicines }) => {
  if (!topMedicines || topMedicines.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <MedicationIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Top Medicines
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <MedicationIcon color="disabled" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No medicine data available at the moment.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <MedicationIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Top Medicines
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Medicine Name</TableCell>
              <TableCell>Total Imported</TableCell>
              <TableCell>Total Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(topMedicines || []).map((medicine) => (
              <TableRow key={medicine.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {medicine.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="primary">
                    {medicine.totalImported?.toLocaleString() || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {medicine.totalValue?.toLocaleString() || 0} VND
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
  );
};

const WarehouseManagerDashboard = () => {
  const { dashboardData, loading, refreshing, error, lastUpdated, refreshDashboard } = useWarehouseManagerDashboard();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Warehouse Manager Dashboard
          </Typography>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdated.toLocaleString('vi-VN')}
            </Typography>
          )}
        </Box>
        <Tooltip title="Refresh Dashboard">
          <IconButton 
            onClick={refreshDashboard} 
            color="primary"
            disabled={refreshing}
            sx={{ 
              backgroundColor: 'primary.light',
              '&:hover': { backgroundColor: 'primary.main', color: 'white' }
            }}
          >
            <RefreshIcon sx={{ 
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Inventory Items"
            value={dashboardData.stats?.totalInventory || 0}
            icon={<InventoryIcon />}
            color="primary"
            subtitle="Active items in stock"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Import Orders"
            value={dashboardData.stats?.pendingImportOrders || 0}
            icon={<ShippingIcon />}
            color="warning"
            subtitle="Awaiting processing"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Export Orders"
            value={dashboardData.stats?.pendingExportOrders || 0}
            icon={<AssignmentIcon />}
            color="info"
            subtitle="Ready for shipment"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Orders"
            value={dashboardData.stats?.completedOrders || 0}
            icon={<CheckCircleIcon />}
            color="success"
            subtitle="This month"
          />
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={dashboardData.stats?.lowStockItems || 0}
            icon={<WarningIcon />}
            color="error"
            subtitle="Need attention"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Inventory Value"
            value={`${(dashboardData.stats?.totalValue || 0).toLocaleString()} VND`}
            icon={<TrendingUpIcon />}
            color="secondary"
            subtitle="Current stock value"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Import Orders"
            value={dashboardData.detailedStats?.monthly?.importOrders || 0}
            icon={<ShippingIcon />}
            color="primary"
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Export Orders"
            value={dashboardData.detailedStats?.monthly?.exportOrders || 0}
            icon={<AssignmentIcon />}
            color="success"
            subtitle="This month"
          />
        </Grid>
      </Grid>

      {/* Detailed Statistics */}
      <DashboardStats detailedStats={dashboardData.detailedStats} />

      {/* Chart Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={12}>
          <WarehouseManagerChart months={6} />
        </Grid>
      </Grid>

      {/* Recent Orders and Low Stock */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <RecentOrdersTable
            orders={dashboardData.recentImportOrders || []}
            title="Recent Import Orders"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <RecentOrdersTable
            orders={dashboardData.recentExportOrders || []}
            title="Recent Export Orders"
          />
        </Grid>
      </Grid>

      {/* New Sections: Alerts, Top Medicines, and Low Stock */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <AlertsSection alerts={dashboardData.alerts} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TopMedicinesSection topMedicines={dashboardData.topMedicines} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WarningIcon color="warning" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Low Stock Medicines
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine Name</TableCell>
                      <TableCell>Current Stock</TableCell>
                      <TableCell>Minimum Required</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(dashboardData.lowStockMedicines || []).map((item) => (
                      <TableRow key={item.id || item._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {item.name || item.medicine_id?.medicine_name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error">
                            {item.currentStock || item.quantity || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {item.minStock || item.min_quantity || 10}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.status || (item.currentStock === 0 ? 'Out of Stock' : 'Low Stock')}
                            size="small"
                            color={item.status === 'critical' || item.currentStock === 0 ? 'error' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WarehouseManagerDashboard; 