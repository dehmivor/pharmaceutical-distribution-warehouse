import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
  Avatar,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const AITrendCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'primary.main',
  trend,
  confidence,
  status,
  onClick,
  actions
}) => {
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUpIcon color="success" />;
      case 'decreasing':
        return <TrendingDownIcon color="error" />;
      case 'stable':
        return <TrendingFlatIcon color="info" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <WarningIcon color="error" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success.main';
      case 'warning':
        return 'warning.main';
      case 'error':
        return 'error.main';
      case 'info':
        return 'info.main';
      default:
        return 'primary.main';
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar sx={{ bgcolor: color, color: 'white' }}>
                {icon}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Stack>
            
            {/* Status Icon */}
            {status && (
              <Tooltip title={status}>
                <Box>
                  {getStatusIcon(status)}
                </Box>
              </Tooltip>
            )}
          </Stack>

          {/* Value */}
          <Box>
            <Typography variant="h3" fontWeight="bold" color={color}>
              {value}
            </Typography>
          </Box>

          {/* Footer */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1}>
              {/* Trend */}
              {trend && (
                <Chip
                  icon={getTrendIcon(trend)}
                  label={trend}
                  size="small"
                  variant="outlined"
                  color={trend === 'increasing' ? 'success' : trend === 'decreasing' ? 'error' : 'info'}
                />
              )}
              
              {/* Confidence */}
              {confidence && (
                <Chip
                  label={`${Math.round(confidence * 100)}% confidence`}
                  size="small"
                  variant="outlined"
                  color={confidence >= 0.8 ? 'success' : confidence >= 0.6 ? 'warning' : 'error'}
                />
              )}
            </Stack>

            {/* Actions */}
            {actions && (
              <Stack direction="row" spacing={1}>
                {actions}
              </Stack>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AITrendCard;
