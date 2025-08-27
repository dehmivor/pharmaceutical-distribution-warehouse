'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  Analytics as AnalyticsIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts';
import Link from '@mui/material/Link';
import useTrans from '@/hooks/useTrans';
import { openSnackbar } from '@/states/snackbar';
import {
  useAIImportRecommendations,
  useAIDemandPredictions,
  useAIMarketTrends,
  useOpenAIStatus,
  useAIPoweredMarketTrends,
  useAIPoweredImportRecommendations,
  useAIPoweredAnomalies
} from '@/hooks/useAITrends';

// TabPanel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`ai-trends-tabpanel-${index}`} aria-labelledby={`ai-trends-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Trend Icon Component
const TrendIcon = ({ trend }) => {
  if (trend === 'increasing') {
    return <TrendingUpIcon color="success" />;
  } else if (trend === 'decreasing') {
    return <TrendingDownIcon color="error" />;
  } else {
    return <TrendingFlatIcon color="info" />;
  }
};

// Utility function to safely open external links
const safeOpenLink = (url, source, type) => {
  try {
    // Validate URL
    const validUrl = new URL(url);

    // Check if URL is safe (http/https only)
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      throw new Error('Unsafe protocol');
    }

    // Show notification
    openSnackbar({
      open: true,
      message: `🔗 Opening ${type} from ${source}`,
      alert: { color: 'info', variant: 'filled' }
    });

    // Open link in new tab after a short delay
    setTimeout(() => {
      window.open(validUrl.href, '_blank', 'noopener,noreferrer');
    }, 100);

    return true;
  } catch (error) {
    // Show error notification
    openSnackbar({
      open: true,
      message: `❌ Invalid or unsafe URL: ${url}`,
      alert: { color: 'error', variant: 'filled' }
    });

    console.error('URL Error:', { url, source, type, error });
    return false;
  }
};

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const trans = useTrans();

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

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return trans.aiTrends.highSeverity;
      case 'medium':
        return trans.aiTrends.mediumSeverity;
      case 'low':
        return trans.aiTrends.lowSeverity;
      default:
        return trans.aiTrends.notAvailable;
    }
  };

  return <Chip label={getPriorityLabel(priority)} size="small" color={getPriorityColor(priority)} variant="outlined" />;
};

const DemandPredictionsChart = ({ predictions, loading }) => {
  const trans = useTrans();

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {trans.aiTrends.loadingPredictions}
        </Typography>
      </Box>
    );
  }

  if (!predictions) {
    return (
      <Typography color="text.secondary" textAlign="center" py={5}>
        {trans.aiTrends.loadingPredictions}
      </Typography>
    );
  }

  if (!Array.isArray(predictions) || predictions.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" py={5}>
        {trans.aiTrends.noPredictionData}
      </Typography>
    );
  }

  // Chuẩn bị dữ liệu cho biểu đồ
  const chartData = predictions.map((prediction, index) => ({
    id: index,
    value: prediction.predictions?.[0] || 0,
    label: prediction.medicineName || `${trans.aiTrends.medicineName} ${index + 1} (${trans.aiTrends.noNameAvailable})`,
    trend: prediction.trend || 'stable'
  }));

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold" color="primary.main">
        {trans.aiTrends.demandChartTitle}
      </Typography>

      {/* Biểu đồ cột */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            {trans.aiTrends.demandChartTitle}
          </Typography>
          <Box sx={{ height: 400, width: '100%' }}>
            <BarChart
              dataset={chartData}
              xAxis={[{ scaleType: 'band', dataKey: 'label' }]}
              series={[
                {
                  dataKey: 'value',
                  label: trans.aiTrends.demandPredictions,
                  color: ({ value }) => {
                    const item = chartData.find((d) => d.value === value);
                    if (item?.trend === 'increasing') return '#4caf50';
                    if (item?.trend === 'decreasing') return '#f44336';
                    return '#2196f3';
                  }
                }
              ]}
              height={400}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Bảng dự đoán chi tiết */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            {trans.aiTrends.detailedTableTitle}
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{trans.aiTrends.medicineName}</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{trans.aiTrends.trend}</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{trans.aiTrends.confidence}</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                    {trans.aiTrends.month1Prediction}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                    {trans.aiTrends.month2Prediction}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                    {trans.aiTrends.month3Prediction}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{trans.aiTrends.algorithm}</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{trans.aiTrends.lastUpdated}</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(predictions) &&
                  predictions.map((prediction, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {prediction.medicineName || `${trans.aiTrends.medicineName} ${index + 1} (${trans.aiTrends.noNameAvailable})`}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrendIcon trend={prediction.trend} />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {prediction.trend === 'increasing'
                              ? trans.aiTrends.increasing
                              : prediction.trend === 'decreasing'
                                ? trans.aiTrends.decreasing
                                : trans.aiTrends.stable}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                        <Chip
                          label={`${Math.round((prediction.confidence || 0) * 100)}%`}
                          size="small"
                          color={prediction.confidence > 0.7 ? 'success' : prediction.confidence > 0.5 ? 'warning' : 'error'}
                          variant="outlined"
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                        <Typography variant="body2">{prediction.predictions?.[0]?.toLocaleString() || '0'}</Typography>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                        <Typography variant="body2">{prediction.predictions?.[1]?.toLocaleString() || '0'}</Typography>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                        <Typography variant="body2">{prediction.predictions?.[2]?.toLocaleString() || '0'}</Typography>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                        <Chip label={prediction.algorithm || 'linear_regression'} size="small" color="primary" variant="outlined" />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                        <Typography variant="caption" color="text.secondary">
                          {prediction.lastUpdated
                            ? new Date(prediction.lastUpdated).toLocaleDateString(trans.locale || 'en-US')
                            : trans.aiTrends.notAvailable}
                        </Typography>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

const MarketTrendsSection = ({ marketTrends, loading }) => {
  const trans = useTrans();

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {trans.aiTrends.loadingMarketInfo}
        </Typography>
      </Box>
    );
  }

  if (!marketTrends) {
    return (
      <Typography color="text.secondary" textAlign="center" py={5}>
        {trans.aiTrends.noMarketData}
      </Typography>
    );
  }

  const { vietnamHealthAlerts, vietnamDrugUpdates, regionalMarketTrends, vietnamPharmaNews, totalNewsFetched, lastFetchStatus } =
    marketTrends;

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold" color="primary.main">
        {trans.aiTrends.marketIntelligence}
      </Typography>

      {/* Data Source Info */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" color="text.secondary">
            <strong>{trans.aiTrends.dataSourceInfo}</strong>
          </Typography>
          <Chip label={`${totalNewsFetched || 0} ${trans.aiTrends.newsUpdated}`} size="small" color="info" variant="outlined" />
          <Chip
            label={lastFetchStatus === 'success' ? trans.aiTrends.updateSuccess : trans.aiTrends.usingSampleData}
            size="small"
            color={lastFetchStatus === 'success' ? 'success' : 'warning'}
            variant="outlined"
          />
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Cảnh Báo Y Tế Việt Nam */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="error.main">
                {trans.aiTrends.healthAlerts}
              </Typography>
              <List disablePadding>
                {(vietnamHealthAlerts || []).map((alert, index) => (
                  <ListItem key={index} divider sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <WarningIcon color="error" />
                    </ListItemIcon>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {alert.title}
                      </Typography>

                      {/* Mô tả tình hình */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        <strong>{trans.aiTrends.currentSituation}</strong> {alert.description}
                      </Typography>

                      {/* Danh mục thuốc bị ảnh hưởng */}
                      {alert.affectedMedicines && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          <strong>{trans.aiTrends.affectedMedicines}</strong> {alert.affectedMedicines.join(', ')}
                        </Typography>
                      )}

                      {/* Kết luận và tác động */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                        <strong>{trans.aiTrends.conclusion}</strong> {alert.conclusion}
                      </Typography>

                      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                        <Chip
                          label={
                            alert.severity === 'high'
                              ? trans.aiTrends.highSeverity
                              : alert.severity === 'medium'
                                ? trans.aiTrends.mediumSeverity
                                : trans.aiTrends.lowSeverity
                          }
                          size="small"
                          color={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
                        />
                        <Chip label={alert.region} size="small" color="success" />
                        <Chip label={alert.category} size="small" variant="outlined" color="info" />
                      </Stack>

                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        {trans.aiTrends.source} {alert.source} • {new Date(alert.date).toLocaleDateString(trans.locale || 'en-US')}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Cập Nhật Dược Phẩm Việt Nam */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="info.main">
                {trans.aiTrends.drugUpdates}
              </Typography>
              <List disablePadding>
                {(vietnamDrugUpdates || []).map((update, index) => (
                  <ListItem key={index} divider sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <InfoIcon color="info" />
                    </ListItemIcon>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {update.title}
                      </Typography>

                      {/* Mô tả tình hình */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        <strong>{trans.aiTrends.currentSituation}</strong> {update.description}
                      </Typography>

                      {/* Danh mục thuốc bị ảnh hưởng */}
                      {update.affectedCategory && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          <strong>{trans.aiTrends.drugCategory}</strong> {update.affectedCategory}
                        </Typography>
                      )}

                      {/* Kết luận và tác động */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                        <strong>{trans.aiTrends.conclusion}</strong> {update.conclusion}
                      </Typography>

                      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                        <Chip
                          label={
                            update.type === 'drug_regulation'
                              ? trans.aiTrends.newRegulation
                              : update.type === 'industry_update'
                                ? trans.aiTrends.industryUpdate
                                : trans.aiTrends.approval
                          }
                          size="small"
                          color="primary"
                        />
                        <Chip label={update.region} size="small" color="success" />
                        <Chip label={update.category} size="small" variant="outlined" color="info" />
                      </Stack>

                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        {trans.aiTrends.source} {update.source} • {new Date(update.date).toLocaleDateString(trans.locale || 'en-US')}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Xu Hướng Thị Trường Theo Vùng Miền */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="success.main">
                {trans.aiTrends.regionalMarketTrends}
              </Typography>
              <List disablePadding>
                {(regionalMarketTrends || []).map((trend, index) => (
                  <ListItem key={index} divider sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <TrendingUpIcon color="success" />
                    </ListItemIcon>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {trend.title}
                      </Typography>

                      {/* Mô tả tình hình */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        <strong>{trans.aiTrends.currentSituation}</strong> {trend.description}
                      </Typography>

                      {/* Danh mục thuốc bị ảnh hưởng */}
                      {trend.affectedCategory && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          <strong>{trans.aiTrends.drugCategory}</strong> {trend.affectedCategory}
                        </Typography>
                      )}

                      {/* Kết luận và cơ hội */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                        <strong>{trans.aiTrends.conclusion}</strong> {trend.conclusion}
                      </Typography>

                      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                        <Chip label={trend.region} size="small" color="success" />
                        <Chip
                          label={trend.type === 'demand_increase' ? trans.aiTrends.demandIncrease : trans.aiTrends.newTrend}
                          size="small"
                          color="primary"
                        />
                        <Chip label={trend.category} size="small" variant="outlined" color="info" />
                      </Stack>

                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        {trans.aiTrends.source} {trend.source} • {new Date(trend.date).toLocaleDateString(trans.locale || 'en-US')}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Tin Tức Ngành Dược Phẩm Việt Nam */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="warning.main">
                {trans.aiTrends.pharmaNews}
              </Typography>
              <List disablePadding>
                {(vietnamPharmaNews || []).map((news, index) => (
                  <ListItem key={index} divider sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <InfoIcon color="warning" />
                    </ListItemIcon>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {news.title}
                      </Typography>

                      {/* Mô tả tình hình */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        <strong>{trans.aiTrends.currentSituation}</strong> {news.description}
                      </Typography>

                      {/* Danh mục thuốc bị ảnh hưởng */}
                      {news.affectedCategory && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          <strong>{trans.aiTrends.drugCategory}</strong> {news.affectedCategory}
                        </Typography>
                      )}

                      {/* Kết luận và tác động */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                        <strong>{trans.aiTrends.conclusion}</strong> {news.conclusion}
                      </Typography>

                      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                        <Chip
                          label={
                            news.type === 'industry_update'
                              ? trans.aiTrends.industryUpdate
                              : news.type === 'export_opportunity'
                                ? trans.aiTrends.exportOpportunity
                                : trans.aiTrends.industryDevelopment
                          }
                          size="small"
                          color="primary"
                        />
                        <Chip label={news.region} size="small" color="success" />
                        <Chip label={news.category} size="small" variant="outlined" color="info" />
                      </Stack>

                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        {trans.aiTrends.source} {news.source} • {new Date(news.date).toLocaleDateString(trans.locale || 'en-US')}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

function Trends() {
  const trans = useTrans();
  const [tabValue, setTabValue] = useState(0);

  const { recommendations, loading: recommendationsLoading, error: recommendationsError } = useAIImportRecommendations();
  const { predictions, loading: predictionsLoading, error: predictionsError } = useAIDemandPredictions(6);
  const { marketTrends, loading: marketLoading, error: marketError } = useAIMarketTrends();

  // OpenAI integration hooks
  const { status: openaiStatus, loading: openaiStatusLoading } = useOpenAIStatus();
  const { marketTrends: aiMarketTrends, loading: aiMarketTrendsLoading, refetch: refetchAIMarketTrends } = useAIPoweredMarketTrends();
  const {
    recommendations: aiRecommendations,
    loading: aiRecommendationsLoading,
    refetch: refetchAIRecommendations
  } = useAIPoweredImportRecommendations();
  const { anomalies: aiAnomalies, loading: aiAnomaliesLoading, refetch: refetchAIAnomalies } = useAIPoweredAnomalies();

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Trends Component State:', {
      predictions,
      predictionsLoading,
      predictionsError,
      predictionsType: typeof predictions,
      predictionsIsArray: Array.isArray(predictions),
      predictionsLength: Array.isArray(predictions) ? predictions.length : 'N/A'
    });
  }

  const handleTabChange = (event, newValue) => {
    // Chỉ cho phép tab 0 và 1 vì chúng ta đã xóa tab 2
    if (newValue >= 0 && newValue <= 1) {
      setTabValue(newValue);

      // Show tab change notification
      const tabNames = ['Demand Predictions', 'Market Intelligence'];
      openSnackbar({
        open: true,
        message: `📋 Switched to ${tabNames[newValue]} tab`,
        alert: { color: 'info', variant: 'filled' }
      });
    } else {
      setTabValue(0); // Fallback về tab đầu tiên

      openSnackbar({
        open: true,
        message: '⚠️ Invalid tab selected, redirected to Demand Predictions',
        alert: { color: 'warning', variant: 'filled' }
      });
    }
  };

  const hasError = recommendationsError || predictionsError || marketError;
  const errorMessage = recommendationsError || predictionsError || marketError;

  // Show error notifications
  React.useEffect(() => {
    if (hasError) {
      openSnackbar({
        open: true,
        message: `❌ Error: ${errorMessage}`,
        alert: { color: 'error', variant: 'filled' }
      });
    }
  }, [hasError, errorMessage]);

  // Show success notifications for AI operations
  React.useEffect(() => {
    if (aiMarketTrends && !aiMarketTrendsLoading) {
      openSnackbar({
        open: true,
        message: '✅ AI Market Trends analysis completed successfully!',
        alert: { color: 'success', variant: 'filled' }
      });
    }
  }, [aiMarketTrends, aiMarketTrendsLoading]);

  React.useEffect(() => {
    if (aiRecommendations && !aiRecommendationsLoading) {
      openSnackbar({
        open: true,
        message: '✅ AI Import Recommendations generated successfully!',
        alert: { color: 'success', variant: 'filled' }
      });
    }
  }, [aiRecommendations, aiRecommendationsLoading]);

  React.useEffect(() => {
    if (aiAnomalies && !aiAnomaliesLoading) {
      openSnackbar({
        open: true,
        message: '✅ AI Anomalies analysis completed successfully!',
        alert: { color: 'success', variant: 'filled' }
      });
    }
  }, [aiAnomalies, aiAnomaliesLoading]);

  // Show loading notifications
  React.useEffect(() => {
    if (aiMarketTrendsLoading) {
      openSnackbar({
        open: true,
        message: '🔄 AI is analyzing market trends...',
        alert: { color: 'info', variant: 'filled' }
      });
    }
  }, [aiMarketTrendsLoading]);

  React.useEffect(() => {
    if (aiRecommendationsLoading) {
      openSnackbar({
        open: true,
        message: '🔄 AI is generating import recommendations...',
        alert: { color: 'info', variant: 'filled' }
      });
    }
  }, [aiRecommendationsLoading]);

  React.useEffect(() => {
    if (aiAnomaliesLoading) {
      openSnackbar({
        open: true,
        message: '🔄 AI is detecting anomalies...',
        alert: { color: 'info', variant: 'filled' }
      });
    }
  }, [aiAnomaliesLoading]);

  // Show OpenAI status notifications
  React.useEffect(() => {
    if (openaiStatus && !openaiStatusLoading) {
      if (openaiStatus.available) {
        openSnackbar({
          open: true,
          message: '✅ OpenAI API is available and ready to use!',
          alert: { color: 'success', variant: 'filled' }
        });
      } else {
        openSnackbar({
          open: true,
          message: '⚠️ OpenAI API is not available. Some features may be limited.',
          alert: { color: 'warning', variant: 'filled' }
        });
      }
    }
  }, [openaiStatus, openaiStatusLoading]);

  // Show predictions data notifications
  React.useEffect(() => {
    if (predictions && !predictionsLoading && predictions.predictions?.length > 0) {
      openSnackbar({
        open: true,
        message: `📊 Loaded ${predictions.predictions.length} demand predictions successfully!`,
        alert: { color: 'success', variant: 'filled' }
      });
    }
  }, [predictions, predictionsLoading]);

  React.useEffect(() => {
    if (marketTrends && !marketLoading) {
      openSnackbar({
        open: true,
        message: '📈 Market trends data loaded successfully!',
        alert: { color: 'success', variant: 'filled' }
      });
    }
  }, [marketTrends, marketLoading]);

  // Show welcome message when component mounts
  React.useEffect(() => {
    openSnackbar({
      open: true,
      message: '🎯 Welcome to AI Trends Analysis Dashboard!',
      alert: { color: 'info', variant: 'filled' }
    });
  }, []);

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {trans.aiTrends.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {trans.aiTrends.subtitle}
          </Typography>
        </Box>
      </Stack>

      {hasError && (
        <Alert severity="error" sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
          {errorMessage}
        </Alert>
      )}

      <Card sx={{ maxWidth: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="AI trends tabs" variant="scrollable" scrollButtons="auto">
            <Tab icon={<AnalyticsIcon />} label={trans.aiTrends.demandPredictions} iconPosition="start" />
            <Tab icon={<AssessmentIcon />} label={trans.aiTrends.marketIntelligence} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={openaiStatus?.available ? 'AI Available' : 'AI Not Available'}
                  color={openaiStatus?.available ? 'success' : 'error'}
                  variant="outlined"
                  size="small"
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    openSnackbar({
                      open: true,
                      message: '🔄 Refreshing all data...',
                      alert: { color: 'info', variant: 'filled' }
                    });
                    window.location.reload();
                  }}
                  size="small"
                >
                  Refresh All
                </Button>
              </Box>
            </Box>

            {predictionsLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Analyzing demand patterns with AI...
                </Typography>
              </Box>
            ) : predictionsError ? (
              <Alert severity="error">{predictionsError}</Alert>
            ) : (
              <Grid container spacing={3}>
                {predictions?.predictions?.map((prediction, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            {prediction.medicineName || `Medicine ${index + 1}`}
                          </Typography>
                          <Chip
                            label={prediction.trend}
                            color={prediction.trend === 'increasing' ? 'success' : prediction.trend === 'decreasing' ? 'error' : 'default'}
                            size="small"
                          />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Algorithm:</strong> {prediction.algorithm || 'AI Analysis'}
                          </Typography>
                          {prediction.aiInsights && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>AI Enhanced:</strong> Yes
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            📈 Monthly Predictions:
                          </Typography>
                          <Grid container spacing={1}>
                            {prediction.predictions?.slice(0, 3).map((pred, predIndex) => (
                              <Grid item xs={4} key={predIndex}>
                                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                                  <Typography variant="caption" display="block">
                                    {pred.month}
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {pred.predictedQuantity}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>

                        {prediction.aiInsights && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom color="primary">
                              🤖 AI Insights:
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                              {typeof prediction.aiInsights === 'string'
                                ? prediction.aiInsights
                                : JSON.stringify(prediction.aiInsights, null, 2)}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                Market Intelligence & AI Analysis
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={openaiStatus?.available ? 'AI Available' : 'AI Not Available'}
                  color={openaiStatus?.available ? 'success' : 'error'}
                  variant="outlined"
                  size="small"
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    openSnackbar({
                      open: true,
                      message: '🤖 Refreshing AI market analysis...',
                      alert: { color: 'info', variant: 'filled' }
                    });
                    refetchAIMarketTrends();
                  }}
                  disabled={aiMarketTrendsLoading}
                  size="small"
                >
                  Refresh AI Analysis
                </Button>
              </Box>
            </Box>

            {/* <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                AI Market Trends Analysis
              </Typography>
              {aiMarketTrendsLoading ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    AI is analyzing market trends...
                  </Typography>
                </Box>
              ) : aiMarketTrends ? (
                <Box>
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {typeof aiMarketTrends.analysis === 'string'
                        ? aiMarketTrends.analysis
                        : JSON.stringify(aiMarketTrends.analysis, null, 2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`Source: ${aiMarketTrends.source || 'OpenAI'}`} size="small" />
                    <Chip label={`Confidence: ${aiMarketTrends.confidence || 'High'}`} size="small" />
                    <Chip label={`Updated: ${new Date(aiMarketTrends.timestamp).toLocaleString()}`} size="small" />
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">Click "Refresh AI Analysis" to get AI-powered market insights</Typography>
              )}
            </Box> */}

            {/* Traditional Market Trends */}
            <Box sx={{ mb: 3 }}>
              <MarketTrendsSection marketTrends={marketTrends} loading={marketLoading} />
            </Box>
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
}

export default Trends;
