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
    medicine: prediction.medicineName || `Thuốc ${index + 1} (Chưa có tên)`,
    trend: prediction.trend,
    confidence: prediction.confidence,
    nextMonth: prediction.predictions[0]?.predictedQuantity || 0
  }));

  return (
    <Card sx={{ height: 400 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Dự Đoán Nhu Cầu Thuốc (6 Tháng Tới) - Dữ Liệu Từ Database
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

        {/* Detailed Predictions Table */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Chi Tiết Dự Đoán Nhu Cầu
          </Typography>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <List>
              {predictions.predictions.slice(0, 10).map((prediction, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <TrendIcon trend={prediction.trend} />
                  </ListItemIcon>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {prediction.medicineName || `Thuốc ${index + 1}`}
                      </Typography>
                      <Chip
                        label={prediction.trend === 'increasing' ? 'Tăng' : prediction.trend === 'decreasing' ? 'Giảm' : 'Ổn định'}
                        size="small"
                        color={prediction.trend === 'increasing' ? 'success' : prediction.trend === 'decreasing' ? 'error' : 'info'}
                      />
                      <Chip label={`Độ tin cậy: ${(prediction.confidence * 100).toFixed(0)}%`} size="small" variant="outlined" />
                    </Stack>

                    {/* Monthly Predictions */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Dự đoán theo tháng:</strong>
                    </Typography>
                    <Grid container spacing={1} sx={{ mb: 1 }}>
                      {prediction.predictions.slice(0, 3).map((monthPred, monthIndex) => (
                        <Grid item xs={4} key={monthIndex}>
                          <Chip
                            label={`${monthPred.month}: ${monthPred.predictedQuantity.toLocaleString()}`}
                            size="small"
                            variant="outlined"
                          />
                        </Grid>
                      ))}
                    </Grid>

                    <Typography variant="caption" color="text.secondary">
                      Thuật toán: {prediction.algorithm} • Cập nhật: {new Date(prediction.lastUpdated).toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Box>
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
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {rec.medicineName}
                    </Typography>
                    <PriorityBadge priority={rec.priority} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {rec.reason}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip icon={<InventoryIcon />} label={`Qty: ${rec.recommendedQuantity}`} size="small" variant="outlined" />
                    <Chip icon={<ScheduleIcon />} label={rec.urgency} size="small" variant="outlined" />
                    {rec.estimatedCost && (
                      <Chip icon={<MoneyIcon />} label={`${rec.estimatedCost.toLocaleString()} VND`} size="small" variant="outlined" />
                    )}
                  </Stack>
                </Box>
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
      <Card sx={{ height: 400 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (!marketTrends) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">No market trends data available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Vietnam Health Alerts */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error.main">
              Cảnh Báo Y Tế Việt Nam
            </Typography>
            <List>
              {(marketTrends.vietnamHealthAlerts || []).slice(0, 5).map((alert, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {alert.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {alert.description}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <Chip
                        label={alert.severity === 'high' ? 'Cao' : 'Trung bình'}
                        size="small"
                        color={alert.severity === 'high' ? 'error' : 'warning'}
                      />
                      <Chip label={alert.region} size="small" variant="outlined" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Nguồn: {alert.source} • {new Date(alert.date).toLocaleDateString('vi-VN')}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Vietnam Drug Updates */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="info.main">
              Cập Nhật Dược Phẩm Việt Nam
            </Typography>
            <List>
              {(marketTrends.vietnamDrugUpdates || []).slice(0, 5).map((update, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <InfoIcon color="info" />
                  </ListItemIcon>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {update.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {update.description}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <Chip
                        label={update.type === 'policy_update' ? 'Chính sách' : update.type === 'price_change' ? 'Giá cả' : 'Phê duyệt'}
                        size="small"
                        color="primary"
                      />
                      <Chip label={update.region} size="small" variant="outlined" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Nguồn: {update.source} • {new Date(update.date).toLocaleDateString('vi-VN')}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Regional Market Trends */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="success.main">
              Xu Hướng Thị Trường Theo Vùng Miền
            </Typography>
            <Grid container spacing={2}>
              {(marketTrends.regionalMarketTrends || []).map((trend, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {trend.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {trend.description}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Chip label={trend.region} size="small" color="success" />
                        <Chip
                          label={
                            trend.type === 'demand_increase'
                              ? 'Tăng nhu cầu'
                              : trend.type === 'traditional_medicine'
                                ? 'Đông y'
                                : 'Nhi khoa'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Nguồn: {trend.source}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Vietnam Pharma Industry News */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary.main">
              Tin Tức Ngành Dược Phẩm Việt Nam
            </Typography>
            <List>
              {(marketTrends.vietnamPharmaNews || []).map((news, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <AssessmentIcon color="primary" />
                  </ListItemIcon>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {news.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {news.description}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <Chip
                        label={
                          news.type === 'industry_update'
                            ? 'Phát triển ngành'
                            : news.type === 'export_opportunity'
                              ? 'Xuất khẩu'
                              : 'Chất lượng'
                        }
                        size="small"
                        color="primary"
                      />
                      <Chip label={news.region} size="small" variant="outlined" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Nguồn: {news.source} • {new Date(news.date).toLocaleDateString('vi-VN')}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Data Source Info */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              <strong>Nguồn dữ liệu:</strong> {marketTrends.dataSource || 'Bộ Y tế, Cục Quản lý Dược Việt Nam'}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              <strong>Khu vực:</strong> {marketTrends.region || 'Việt Nam'} •<strong>Cập nhật lúc:</strong>{' '}
              {new Date(marketTrends.analyzedAt).toLocaleString('vi-VN')}
            </Typography>
            {marketTrends.totalNewsFetched && (
              <Typography variant="body2" color="text.secondary" textAlign="center" component="div">
                <strong>Số tin tức đã lấy:</strong> {marketTrends.totalNewsFetched} bài viết •<strong>Trạng thái:</strong>
                <Chip
                  label={marketTrends.lastFetchStatus === 'success' ? 'Thành công' : 'Fallback'}
                  size="small"
                  color={marketTrends.lastFetchStatus === 'success' ? 'success' : 'warning'}
                  sx={{ ml: 1 }}
                />
              </Typography>
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
            <Tab icon={<AssessmentIcon />} label="Market Intelligence Việt Nam" iconPosition="start" />
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
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          {anomaly.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Type: {anomaly.anomalyType}
                        </Typography>
                        <Chip label={anomaly.severity} size="small" color={anomaly.severity === 'high' ? 'error' : 'warning'} />
                      </Box>
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
