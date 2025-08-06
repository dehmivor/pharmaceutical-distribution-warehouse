'use client'
import React, { useState, useEffect } from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';
import WarehouseManagerChart from '@/sections/dashboard/WarehouseManagerChart';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

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
                      order.status === 'completed' ? 'success' :
                      order.status === 'pending' ? 'warning' :
                      order.status === 'cancelled' ? 'error' : 'default'
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
                      <VisibilityIcon fontSize="small" />
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

const WarehouseManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalInventory: 0,
      pendingImportOrders: 0,
      pendingExportOrders: 0,
      completedOrders: 0,
      lowStockItems: 0,
      totalValue: 0
    },
    recentImportOrders: [],
    recentExportOrders: [],
    lowStockMedicines: [],
    chartData: null
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch warehouse manager dashboard data from API
      const [dashboardResponse, chartResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/dashboard/warehouse-manager`, {
          headers: getAuthHeaders()
        }),
        axios.get(`${API_BASE_URL}/api/dashboard/warehouse-manager/chart`, {
          headers: getAuthHeaders()
        })
      ]);

      if (dashboardResponse.data.success && chartResponse.data.success) {
        setDashboardData({
          ...dashboardResponse.data.data,
          chartData: chartResponse.data.data
        });
      } else {
        setError('Failed to load dashboard data');
      }

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
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Warehouse Manager Dashboard
      </Typography>

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
      </Grid>

      {/* Chart Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={12}>
          <WarehouseManagerChart months={6} />
        </Grid>
      </Grid>

      {/* Recent Orders and Low Stock */}
      <Grid container spacing={3}>
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

      {/* Low Stock Medicines */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Low Stock Medicines
              </Typography>
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