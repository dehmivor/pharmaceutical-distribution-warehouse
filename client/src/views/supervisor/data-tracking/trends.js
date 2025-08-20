'use client';

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Badge
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon,
  LocalShipping as LocalShippingIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import useTrans from '@/hooks/useTrans';
import {
  useAIDashboard,
  useAIImportRecommendations,
  useAIDemandPredictions,
  useAIMarketTrends,
  useAIDemandAnomalies
} from '@/hooks/useAITrends';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`ai-trends-tabpanel-${index}`} aria-labelledby={`ai-trends-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
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
        return <WarningIcon />;
      case 'medium':
        return <InfoIcon />;
      case 'low':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <Chip
      icon={getPriorityIcon(priority)}
      label={priority.toUpperCase()}
      color={getPriorityColor(priority)}
      size="small"
      variant="outlined"
    />
  );
};

// Trend Icon Component
const TrendIcon = ({ trend }) => {
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

// AI Statistics Cards
const AIStatisticsCards = ({ statistics, loading }) => {
  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress size={40} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!statistics) return null;

  const cards = [
    {
      title: 'Total Medicines',
      value: statistics.totalMedicines || 0,
      icon: <InventoryIcon />,
      color: 'primary.main'
    },
    {
      title: 'Import Recommendations',
      value: statistics.totalRecommendations || 0,
      icon: <LocalShippingIcon />,
      color: 'warning.main'
    },
    {
      title: 'Demand Anomalies',
      value: statistics.totalAnomalies || 0,
      icon: <WarningIcon />,
      color: 'error.main'
    },
    {
      title: 'Market Alerts',
      value: statistics.marketAlerts || 0,
      icon: <NotificationsIcon />,
      color: 'info.main'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: card.color, color: 'white' }}>{card.icon}</Avatar>
                <Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {card.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.title}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Demand Predictions Chart
const DemandPredictionsChart = ({ predictions, loading }) => {
  if (loading) {
    return (
      <Card sx={{ height: 400 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (!predictions || !predictions.predictions || predictions.predictions.length === 0) {
    return (
      <Card sx={{ height: 400 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography color="text.secondary">No prediction data available</Typography>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = predictions.predictions.slice(0, 10).map((prediction, index) => ({
    id: index,
    medicine: prediction.medicineName || `Medicine ${index + 1}`,
    trend: prediction.trend,
    confidence: prediction.confidence,
    nextMonth: prediction.predictions[0]?.predictedQuantity || 0
  }));

  return (
    <Card sx={{ height: 400 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Demand Predictions (Next 6 Months)
        </Typography>
        <Box sx={{ height: 300, mt: 2 }}>
          <BarChart
            dataset={chartData}
            xAxis={[{ scaleType: 'band', dataKey: 'medicine' }]}
            yAxis={[{ label: 'Predicted Quantity' }]}
            series={[
              {
                dataKey: 'nextMonth',
                label: 'Next Month Demand',
                color: 'primary.main'
              }
            ]}
            height={300}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

// Import Recommendations List
const ImportRecommendationsList = ({ recommendations, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || !recommendations.recommendations || recommendations.recommendations.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary" textAlign="center">
            No import recommendations available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI Import Recommendations
        </Typography>
        <List>
          {recommendations.recommendations.slice(0, 10).map((rec, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
                    <LocalShippingIcon />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {rec.medicineName}
                      </Typography>
                      <PriorityBadge priority={rec.priority} />
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {rec.reason}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip icon={<InventoryIcon />} label={`Qty: ${rec.recommendedQuantity}`} size="small" variant="outlined" />
                        <Chip icon={<ScheduleIcon />} label={rec.urgency} size="small" variant="outlined" />
                        {rec.estimatedCost && (
                          <Chip icon={<MoneyIcon />} label={`${rec.estimatedCost.toLocaleString()} VND`} size="small" variant="outlined" />
                        )}
                      </Stack>
                    </Stack>
                  }
                />
              </ListItem>
              {index < recommendations.recommendations.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Market Trends Section
const MarketTrendsSection = ({ marketTrends, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (!marketTrends) return null;

  return (
    <Grid container spacing={3}>
      {/* WHO Alerts */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="warning.main">
              WHO Disease Alerts
            </Typography>
            {marketTrends.whoAlerts && marketTrends.whoAlerts.length > 0 ? (
              <List>
                {marketTrends.whoAlerts.map((alert, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={alert.title}
                      secondary={
                        <Stack spacing={1}>
                          <Typography variant="body2">{alert.description}</Typography>
                          <Chip label={alert.severity} size="small" color={alert.severity === 'high' ? 'error' : 'warning'} />
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">No WHO alerts available</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Drug Bank Updates */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="info.main">
              Drug Bank Updates
            </Typography>
            {marketTrends.drugBankUpdates && marketTrends.drugBankUpdates.length > 0 ? (
              <List>
                {marketTrends.drugBankUpdates.map((update, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InfoIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary={update.title}
                      secondary={
                        <Stack spacing={1}>
                          <Typography variant="body2">{update.description}</Typography>
                          <Chip label={update.type} size="small" variant="outlined" />
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">No drug bank updates available</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Main Trends Component
function Trends() {
  const trans = useTrans();
  const [tabValue, setTabValue] = useState(0);

  // AI Hooks
  const { dashboardData, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useAIDashboard();
  const { recommendations, loading: recommendationsLoading, error: recommendationsError } = useAIImportRecommendations();
  const { predictions, loading: predictionsLoading, error: predictionsError } = useAIDemandPredictions(6);
  const { marketTrends, loading: marketLoading, error: marketError } = useAIMarketTrends();
  const { anomalies, loading: anomaliesLoading, error: anomaliesError } = useAIDemandAnomalies();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    refetchDashboard();
  };

  // Check for any errors
  const hasError = dashboardError || recommendationsError || predictionsError || marketError || anomaliesError;
  const errorMessage = dashboardError || recommendationsError || predictionsError || marketError || anomaliesError;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            AI-Powered Market Trends Analysis
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Intelligent demand forecasting and import recommendations powered by AI
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton onClick={handleRefresh} color="primary" size="large">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Error Alert */}
      {hasError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {/* AI Statistics Cards */}
      <AIStatisticsCards statistics={dashboardData?.statistics} loading={dashboardLoading} />

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="AI trends tabs">
            <Tab icon={<AnalyticsIcon />} label="Demand Predictions" iconPosition="start" />
            <Tab icon={<LocalShippingIcon />} label="Import Recommendations" iconPosition="start" />
            <Tab icon={<AssessmentIcon />} label="Market Intelligence" iconPosition="start" />
            <Tab icon={<WarningIcon />} label="Anomaly Detection" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <DemandPredictionsChart predictions={predictions} loading={predictionsLoading} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ImportRecommendationsList recommendations={recommendations} loading={recommendationsLoading} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <MarketTrendsSection marketTrends={marketTrends} loading={marketLoading} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error.main">
                Demand Anomalies Detection
              </Typography>
              {anomaliesLoading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : anomalies && anomalies.length > 0 ? (
                <List>
                  {anomalies.slice(0, 10).map((anomaly, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <WarningIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={anomaly.description}
                        secondary={
                          <Stack spacing={1}>
                            <Typography variant="body2">Type: {anomaly.anomalyType}</Typography>
                            <Chip label={anomaly.severity} size="small" color={anomaly.severity === 'high' ? 'error' : 'warning'} />
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No anomalies detected</Typography>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Card>

      {/* Last Updated Info */}
      {dashboardData && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Last updated: {new Date(dashboardData.generatedAt).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default Trends;
