'use client';

import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Card, CardContent, Chip, Stack, Button, Alert } from '@mui/material';
import {
  FileDownload as IconFileImport,
  Receipt as IconReceipt,
  CheckCircle as IconCheckCircle,
  Cancel as IconXCircle,
  Schedule as IconClock,
  TrendingUp as IconTrendingUp
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

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <Card sx={{ height: '100%', bgcolor: color }}>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.2)' }}>
          <Icon sx={{ color: 'white' }} />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" color="white" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="white" sx={{ opacity: 0.8 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const RecentOrderCard = ({ order }) => (
  <Paper sx={{ p: 2, mb: 2 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Box>
        <Typography variant="subtitle1" fontWeight="bold">
          Order #{order._id?.slice(-8)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {order.supplier_contract_id?.supplier_id?.name || 'N/A'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Created: {new Date(order.createdAt).toLocaleDateString()}
        </Typography>
      </Box>
      <Box>
        <Chip
          label={order.status?.toUpperCase()}
          color={
            order.status === 'approved' ? 'success' : order.status === 'draft' ? 'default' : order.status === 'cancelled' ? 'error' : 'info'
          }
          size="small"
        />
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'right' }}>
          ${order.total_amount?.toLocaleString() || 0}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

export default function RepresentativeManagerDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingApproval: 0,
    approvedOrders: 0,
    cancelledOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/import-orders`, {
        headers: getAuthHeaders()
      });

      const orders = response.data.data || [];

      // Calculate stats
      const statsData = {
        totalOrders: orders.length,
        pendingApproval: orders.filter((o) => o.status === 'draft').length,
        approvedOrders: orders.filter((o) => o.status === 'approved').length,
        cancelledOrders: orders.filter((o) => o.status === 'cancelled').length
      };

      setStats(statsData);
      setRecentOrders(orders.slice(0, 5)); // Get 5 most recent orders
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Representative Manager Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Overview of import orders and approval status
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Orders" value={stats.totalOrders} icon={IconFileImport} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending Approval" value={stats.pendingApproval} icon={IconClock} color="#ed6c02" subtitle="Draft orders" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Approved" value={stats.approvedOrders} icon={IconCheckCircle} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Cancelled" value={stats.cancelledOrders} icon={IconXCircle} color="#d32f2f" />
        </Grid>
      </Grid>

      {/* Recent Orders */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">Recent Import Orders</Typography>
              <Button variant="outlined" startIcon={<IconFileImport />} href="/manage-import-orders-approval">
                View All Orders
              </Button>
            </Stack>

            {recentOrders.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No orders found
              </Typography>
            ) : (
              recentOrders.map((order) => <RecentOrderCard key={order._id} order={order} />)
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Stack spacing={2}>
              <Button variant="contained" startIcon={<IconFileImport />} href="/manage-import-orders-approval" fullWidth>
                Review Import Orders
              </Button>
              <Button variant="outlined" startIcon={<IconReceipt />} href="/rm-create-bills" fullWidth>
                Create Bills
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
