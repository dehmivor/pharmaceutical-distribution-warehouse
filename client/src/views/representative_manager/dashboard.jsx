'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  Stack, 
  Button, 
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  FileDownload as IconFileImport,
  Receipt as IconReceipt,
  CheckCircle as IconCheckCircle,
  Cancel as IconXCircle,
  Schedule as IconClock,
  TrendingUp as IconTrendingUp,
  Visibility as IconVisibility,
  LocalShipping as IconShipping,
  Inventory as IconInventory,
  Business as IconBusiness
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
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

const DataSummaryCard = ({ title, tabs, activeTab, onTabChange, data, maxValue, loading }) => (
  <Paper sx={{ p: 3, height: '100%' }}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    
    <Tabs 
      value={activeTab} 
      onChange={(e, newValue) => onTabChange(newValue)}
      sx={{ mb: 2 }}
    >
      {tabs.map((tab, index) => (
        <Tab key={index} label={tab} />
      ))}
    </Tabs>

    {loading ? (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <CircularProgress />
      </Box>
    ) : (
      <List sx={{ p: 0 }}>
        {data.map((item, index) => (
          <ListItem key={index} sx={{ px: 0, py: 1 }}>
            <ListItemText
              primary={item.name}
              secondary={`${item.value.toLocaleString()}`}
              sx={{ flex: 1 }}
            />
            <Box sx={{ width: 100, mr: 2 }}>
              <LinearProgress
                variant="determinate"
                value={maxValue > 0 ? (item.value / maxValue) * 100 : 0}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </ListItem>
        ))}
      </List>
    )}
  </Paper>
);

export default function RepresentativeManagerDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingApproval: 0,
    approvedOrders: 0,
    cancelledOrders: 0
  });
  const [chartData, setChartData] = useState([]);
  const [topSuppliersData, setTopSuppliersData] = useState([]);
  const [topStatusData, setTopStatusData] = useState([]);
  const [topContractsData, setTopContractsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab states for summary cards
  const [topSuppliersTab, setTopSuppliersTab] = useState(0);
  const [topStatusTab, setTopStatusTab] = useState(0);
  const [topContractsTab, setTopContractsTab] = useState(0);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch import orders
      const ordersResponse = await axios.get(`${API_BASE_URL}/api/import-orders`, {
        headers: getAuthHeaders()
      });
      const orders = ordersResponse.data.data || [];

      // Fetch contracts
      const contractsResponse = await axios.get(`${API_BASE_URL}/api/contract`, {
        headers: getAuthHeaders()
      });
      const contracts = contractsResponse.data.data?.contracts || [];

      // Calculate stats
      const statsData = {
        totalOrders: orders.length,
        pendingApproval: orders.filter((o) => o.status === 'draft').length,
        approvedOrders: orders.filter((o) => o.status === 'approved').length,
        cancelledOrders: orders.filter((o) => o.status === 'cancelled').length
      };

      setStats(statsData);

      // Generate chart data (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      const chartDataArray = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === monthIndex && orderDate.getFullYear() === new Date().getFullYear();
        });
        
        chartDataArray.push({
          month: months[monthIndex],
          orders: monthOrders.length,
          approvals: monthOrders.filter(o => o.status === 'approved').length
        });
      }
      
      setChartData(chartDataArray);

      // Generate top suppliers data
      const supplierStats = {};
      orders.forEach(order => {
        const supplierName = order.contract_id?.partner_id?.name || 'Unknown Supplier';
        supplierStats[supplierName] = (supplierStats[supplierName] || 0) + 1;
      });
      
      const topSuppliers = Object.entries(supplierStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      
      setTopSuppliersData(topSuppliers);

      // Generate top status data
      const statusStats = {};
      orders.forEach(order => {
        const status = order.status || 'unknown';
        statusStats[status] = (statusStats[status] || 0) + 1;
      });
      
      const topStatus = Object.entries(statusStats)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      
      setTopStatusData(topStatus);

      // Generate top contracts data
      const contractStats = {};
      orders.forEach(order => {
        const contractCode = order.contract_id?.contract_code || 'Unknown Contract';
        contractStats[contractCode] = (contractStats[contractCode] || 0) + 1;
      });
      
      const topContracts = Object.entries(contractStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      
      setTopContractsData(topContracts);

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
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Representative Manager Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Pharmaceutical Distribution Warehouse Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Line Chart Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Import Orders Overview (Last 6 Months)
        </Typography>
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="orders" 
                stackId="1" 
                stroke="#1976d2" 
                fill="#1976d2" 
                fillOpacity={0.6}
                name="Total Orders"
              />
              <Area 
                type="monotone" 
                dataKey="approvals" 
                stackId="1" 
                stroke="#2e7d32" 
                fill="#2e7d32" 
                fillOpacity={0.6}
                name="Approved Orders"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

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

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <DataSummaryCard
            title="Top Suppliers"
            tabs={['Last 7 days', 'Last Month', 'Last Year']}
            activeTab={topSuppliersTab}
            onTabChange={setTopSuppliersTab}
            data={topSuppliersData}
            maxValue={topSuppliersData.length > 0 ? Math.max(...topSuppliersData.map(item => item.value)) : 0}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DataSummaryCard
            title="Order Status"
            tabs={['Status', 'Priority']}
            activeTab={topStatusTab}
            onTabChange={setTopStatusTab}
            data={topStatusData}
            maxValue={topStatusData.length > 0 ? Math.max(...topStatusData.map(item => item.value)) : 0}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DataSummaryCard
            title="Top Contracts"
            tabs={['Active', 'Expired']}
            activeTab={topContractsTab}
            onTabChange={setTopContractsTab}
            data={topContractsData}
            maxValue={topContractsData.length > 0 ? Math.max(...topContractsData.map(item => item.value)) : 0}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button variant="contained" startIcon={<IconFileImport />} href="/manage-import-orders-approval">
            Review Import Orders
          </Button>
          <Button variant="outlined" startIcon={<IconReceipt />} href="/rm-create-bills">
            Create Bills
          </Button>
          <Button variant="outlined" startIcon={<IconBusiness />} href="/rm-manage-contracts">
            Manage Contracts
          </Button>
          <Button variant="outlined" startIcon={<IconInventory />} href="/statistics">
            View Statistics
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
