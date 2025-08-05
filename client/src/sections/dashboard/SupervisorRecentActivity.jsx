'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import InventoryIcon from '@mui/icons-material/Inventory';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ErrorIcon from '@mui/icons-material/Error';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const getActivityIcon = (type) => {
  switch (type) {
    case 'import':
      return <FileDownloadIcon color="primary" />;
    case 'export':
      return <FileUploadIcon color="secondary" />;
    case 'inventory':
      return <InventoryIcon color="info" />;
    case 'user':
      return <PersonIcon color="success" />;
    case 'assignment':
      return <AssignmentIcon color="warning" />;
    default:
      return <AssignmentIcon />;
  }
};

const getStatusChip = (status) => {
  const statusConfig = {
    completed: { color: 'success', icon: <CheckCircleIcon />, label: 'Completed' },
    pending: { color: 'warning', icon: <ScheduleIcon />, label: 'Pending' },
    approved: { color: 'info', icon: <CheckCircleIcon />, label: 'Approved' },
    draft: { color: 'default', icon: <ScheduleIcon />, label: 'Draft' },
    delivered: { color: 'primary', icon: <CheckCircleIcon />, label: 'Delivered' },
    error: { color: 'error', icon: <ErrorIcon />, label: 'Error' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return <Chip icon={config.icon} label={config.label} color={config.color} size="small" variant="outlined" />;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};

const SupervisorRecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch recent activities from supervisor API
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/supervisor/recent-activity?limit=10`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setActivities(response.data.data);
      } else {
        throw new Error('Failed to load recent activity');
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setError(error.response?.data?.error || 'Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body2" component="div" color="text.secondary">
            Please try refreshing the page or contact support if the problem persists.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Recent Activity
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchRecentActivity} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <List sx={{ p: 0 }}>
          {activities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>{getActivityIcon(activity.type)}</ListItemIcon>
                <ListItemText
                  disableTypography
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" component="div" sx={{ fontWeight: 500 }}>
                          {activity.title}
                        </Typography>
                        {activity.contractCode && (
                          <Typography variant="caption" component="div" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Contract: {activity.contractCode}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {activity.value && (
                          <Typography variant="caption" component="div" color="text.secondary">
                            {activity.value.toLocaleString()} VND
                          </Typography>
                        )}
                        {getStatusChip(activity.status)}
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" component="div" color="text.secondary">
                        {activity.description.includes('|') ? activity.description.split(',')[1]?.trim() : activity.description}
                      </Typography>
                      <Typography variant="caption" component="div" color="text.secondary">
                        {formatDate(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {activities.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" component="div" color="text.secondary">
              No recent activity found
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SupervisorRecentActivity;
