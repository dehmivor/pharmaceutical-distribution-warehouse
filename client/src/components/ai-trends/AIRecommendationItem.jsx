import React, { useState } from 'react';
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Stack,
  Typography,
  Box,
  Tooltip,
  IconButton,
  Collapse,
  Grid,
  Button
} from '@mui/material';
import {
  LocalShipping as LocalShippingIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';

const AIRecommendationItem = ({ recommendation, index }) => {
  const [expanded, setExpanded] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <LocalShippingIcon />;
      case 'medium':
        return <InventoryIcon />;
      case 'low':
        return <LocalOfferIcon />;
      default:
        return <InventoryIcon />;
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUpIcon color="success" />;
      case 'decreasing':
        return <TrendingDownIcon color="error" />;
      case 'stable':
        return <TrendingFlatIcon color="info" />;
      default:
        return <TrendingFlatIcon color="info" />;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'immediate':
        return 'error';
      case 'within_month':
        return 'warning';
      case 'within_quarter':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <>
      <ListItem
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          mb: 1,
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
      >
        <ListItemIcon>
          <Avatar sx={{ bgcolor: `${getPriorityColor(recommendation.priority)}.main`, color: 'white' }}>
            {getPriorityIcon(recommendation.priority)}
          </Avatar>
        </ListItemIcon>

        <ListItemText
          primary={
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {recommendation.medicineName}
              </Typography>
              <Chip
                label={recommendation.priority.toUpperCase()}
                size="small"
                color={getPriorityColor(recommendation.priority)}
                variant="outlined"
              />
              {recommendation.trend && (
                <Tooltip title={`Demand trend: ${recommendation.trend}`}>
                  <Box>{getTrendIcon(recommendation.trend)}</Box>
                </Tooltip>
              )}
            </Stack>
          }
          secondary={
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                {recommendation.reason}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  icon={<InventoryIcon />}
                  label={`Qty: ${recommendation.recommendedQuantity?.toLocaleString() || 'N/A'}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<ScheduleIcon />}
                  label={recommendation.urgency}
                  size="small"
                  variant="outlined"
                  color={getUrgencyColor(recommendation.urgency)}
                />
                {recommendation.estimatedCost && (
                  <Chip icon={<MoneyIcon />} label={formatCurrency(recommendation.estimatedCost)} size="small" variant="outlined" />
                )}
                <Chip
                  label={`${Math.round((recommendation.confidence || 0) * 100)}% confidence`}
                  size="small"
                  variant="outlined"
                  color={getConfidenceColor(recommendation.confidence)}
                />
              </Stack>
            </Stack>
          }
        />

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => setExpanded(!expanded)} color="primary">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </ListItem>

      {/* Expanded Details */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ ml: 4, mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2" fontWeight="bold" color="primary">
              Detailed Analysis
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Supplier:</strong> {recommendation.supplier || 'Multiple suppliers'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Confidence Level:</strong> {Math.round((recommendation.confidence || 0) * 100)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Algorithm:</strong> Linear Regression
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Priority Score:</strong>{' '}
                    {recommendation.priority === 'high' ? '9-10' : recommendation.priority === 'medium' ? '6-8' : '1-5'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Risk Level:</strong>{' '}
                    {recommendation.priority === 'high' ? 'High' : recommendation.priority === 'medium' ? 'Medium' : 'Low'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Action Required:</strong> {recommendation.urgency}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" startIcon={<LocalShippingIcon />} color="primary">
                Create Import Order
              </Button>
              <Button variant="outlined" size="small" startIcon={<VisibilityIcon />}>
                View Medicine Details
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Collapse>
    </>
  );
};

export default AIRecommendationItem;
