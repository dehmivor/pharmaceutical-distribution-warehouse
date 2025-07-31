'use client'; 
import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import { Box, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';

import RepresentativeOverviewCard from '@/sections/dashboard/RepresentativeOverviewCard';
import RepresentativeOverviewChart from '@/sections/dashboard/RepresentativeOverviewChart';
import RepresentativeTopRef from '@/sections/dashboard/RepresentativeTopRef';
import RepresentativeMonthlyChart from '@/sections/dashboard/RepresentativeMonthlyChart';
import RepresentativeRecentActivity from '@/sections/dashboard/RepresentativeRecentActivity';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export default function RepresentativeDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${API_BASE_URL}/api/dashboard/representative`, {
          headers: getAuthHeaders()
        });

        if (response.data.success) {
          setDashboardData(response.data.data);
        } else {
          throw new Error(response.data.error || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          No dashboard data available
        </Alert>
      </Box>
    );
  }

  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={12}>
        <RepresentativeOverviewCard data={dashboardData.overview} />
      </Grid>
      <Grid size={12}>
        <RepresentativeOverviewChart data={dashboardData.comparison} />
      </Grid>
      <Grid size={12}>
        <RepresentativeTopRef data={dashboardData.topExport} />
      </Grid>
      <Grid size={12}>
        <RepresentativeMonthlyChart data={dashboardData.monthlyChart} />
      </Grid>
      <Grid size={12}>
        <RepresentativeRecentActivity data={dashboardData.recentActivity} />
      </Grid>
    </Grid>
  );
} 