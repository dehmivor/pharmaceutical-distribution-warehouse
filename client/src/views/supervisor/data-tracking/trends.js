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
  OpenInNew as OpenInNewIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts';
import Link from '@mui/material/Link';
import useTrans from '@/hooks/useTrans';
import { useAIImportRecommendations, useAIDemandPredictions, useAIMarketTrends } from '@/hooks/useAITrends';

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

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return 'Không xác định';
    }
  };

  return <Chip label={getPriorityLabel(priority)} size="small" color={getPriorityColor(priority)} variant="outlined" />;
};

const DemandPredictionsChart = ({ predictions, loading }) => {
  if (loading) {
    return (
      <Card sx={{ height: 450 }}>
        <CardContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}
        >
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (!predictions || !predictions.predictions?.length) {
    return (
      <Card sx={{ height: 450 }}>
        <CardContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}
        >
          <Typography color="text.secondary">No prediction data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const chartData = predictions.predictions.slice(0, 10).map((prediction, index) => ({
    id: index,
    medicine: prediction.medicineName || `Thuốc ${index + 1} (Chưa có tên)`,
    nextMonth: prediction.predictions[0]?.predictedQuantity || 0
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Dự Đoán Nhu Cầu Thuốc (6 Tháng Tới) - Dữ Liệu Từ Database
        </Typography>
        <Box sx={{ height: 320, mt: 3 }}>
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
            height={320}
          />
        </Box>

        <Box sx={{ mt: 4, maxHeight: 370, overflowY: 'auto' }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Chi Tiết Dự Đoán Nhu Cầu
          </Typography>
          <List disablePadding>
            {predictions.predictions.slice(0, 10).map((prediction, index) => (
              <ListItem key={index} divider sx={{ py: 1.5 }}>
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
                          sx={{ width: '100%', textAlign: 'center' }}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  <Typography variant="caption" color="text.secondary" display="block">
                    Thuật toán: {prediction.algorithm} • Cập nhật: {new Date(prediction.lastUpdated).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

const MarketTrendsSection = ({ marketTrends, loading }) => {
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Đang tải thông tin thị trường...
        </Typography>
      </Box>
    );
  }

  if (!marketTrends) {
    return (
      <Typography color="text.secondary" textAlign="center" py={5}>
        Không có dữ liệu thị trường
      </Typography>
    );
  }

  const { vietnamHealthAlerts, vietnamDrugUpdates, regionalMarketTrends, vietnamPharmaNews, totalNewsFetched, lastFetchStatus } =
    marketTrends;

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold" color="primary.main">
        Market Intelligence Việt Nam
      </Typography>

      {/* Data Source Info */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" color="text.secondary">
            <strong>Thông tin nguồn dữ liệu:</strong>
          </Typography>
          <Chip label={`${totalNewsFetched || 0} tin tức đã cập nhật`} size="small" color="info" variant="outlined" />
          <Chip
            label={lastFetchStatus === 'success' ? 'Cập nhật thành công' : 'Sử dụng dữ liệu mẫu'}
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
                Cảnh Báo Y Tế Việt Nam
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
                        <strong>Tình hình hiện tại:</strong> {alert.description}
                      </Typography>

                      {/* Danh mục thuốc bị ảnh hưởng */}
                      {alert.affectedMedicines && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          <strong>Thuốc bị ảnh hưởng:</strong> {alert.affectedMedicines.join(', ')}
                        </Typography>
                      )}

                      {/* Kết luận và tác động */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                        <strong>Kết luận:</strong> {alert.conclusion}
                      </Typography>

                      {/* Link bài báo */}
                      {alert.url && (
                        <Box sx={{ mb: 1.5 }}>
                          <Link href={alert.url} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none' }}>
                            <Button variant="outlined" size="small" startIcon={<OpenInNewIcon />} sx={{ textTransform: 'none' }}>
                              Xem tin tức chi tiết từ {alert.source}
                            </Button>
                          </Link>
                        </Box>
                      )}

                      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                        <Chip
                          label={
                            alert.severity === 'high' ? 'Mức độ cao' : alert.severity === 'medium' ? 'Mức độ trung bình' : 'Mức độ thấp'
                          }
                          size="small"
                          color={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
                        />
                        <Chip label={alert.region} size="small" color="success" />
                        <Chip label={alert.category} size="small" variant="outlined" color="info" />
                      </Stack>

                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        Nguồn: {alert.source} • {new Date(alert.date).toLocaleDateString('vi-VN')}
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
                Cập Nhật Dược Phẩm Việt Nam
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
                        <strong>Tình hình hiện tại:</strong> {update.description}
                      </Typography>

                      {/* Danh mục thuốc bị ảnh hưởng */}
                      {update.affectedCategory && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          <strong>Danh mục thuốc:</strong> {update.affectedCategory}
                        </Typography>
                      )}

                      {/* Kết luận và tác động */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                        <strong>Kết luận:</strong> {update.conclusion}
                      </Typography>

                      {/* Link bài báo */}
                      {update.url && (
                        <Box sx={{ mb: 1.5 }}>
                          <Link href={update.url} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none' }}>
                            <Button variant="outlined" size="small" startIcon={<OpenInNewIcon />} sx={{ textTransform: 'none' }}>
                              Xem tin tức chi tiết từ {update.source}
                            </Button>
                          </Link>
                        </Box>
                      )}

                      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                        <Chip
                          label={
                            update.type === 'drug_regulation'
                              ? 'Quy định mới'
                              : update.type === 'industry_update'
                                ? 'Cập nhật ngành'
                                : 'Phê duyệt'
                          }
                          size="small"
                          color="primary"
                        />
                        <Chip label={update.region} size="small" color="success" />
                        <Chip label={update.category} size="small" variant="outlined" color="info" />
                      </Stack>

                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        Nguồn: {update.source} • {new Date(update.date).toLocaleDateString('vi-VN')}
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
                Xu Hướng Thị Trường Theo Vùng Miền
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
                        <strong>Tình hình hiện tại:</strong> {trend.description}
                      </Typography>

                      {/* Danh mục thuốc bị ảnh hưởng */}
                      {trend.affectedCategory && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          <strong>Danh mục thuốc:</strong> {trend.affectedCategory}
                        </Typography>
                      )}

                      {/* Kết luận và cơ hội */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                        <strong>Kết luận:</strong> {trend.conclusion}
                      </Typography>

                      {/* Link bài báo */}
                      {trend.url && (
                        <Box sx={{ mb: 1.5 }}>
                          <Link href={trend.url} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none' }}>
                            <Button variant="outlined" size="small" startIcon={<OpenInNewIcon />} sx={{ textTransform: 'none' }}>
                              Xem tin tức chi tiết từ {trend.source}
                            </Button>
                          </Link>
                        </Box>
                      )}

                      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                        <Chip label={trend.region} size="small" color="success" />
                        <Chip label={trend.type === 'demand_increase' ? 'Tăng nhu cầu' : 'Xu hướng mới'} size="small" color="primary" />
                        <Chip label={trend.category} size="small" variant="outlined" color="info" />
                      </Stack>

                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        Nguồn: {trend.source} • {new Date(trend.date).toLocaleDateString('vi-VN')}
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
                Tin Tức Ngành Dược Phẩm Việt Nam
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
                        <strong>Tình hình hiện tại:</strong> {news.description}
                      </Typography>

                      {/* Danh mục thuốc bị ảnh hưởng */}
                      {news.affectedCategory && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          <strong>Danh mục thuốc:</strong> {news.affectedCategory}
                        </Typography>
                      )}

                      {/* Kết luận và tác động */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                        <strong>Kết luận:</strong> {news.conclusion}
                      </Typography>

                      {/* Link bài báo */}
                      {news.url && (
                        <Box sx={{ mb: 1.5 }}>
                          <Link href={news.url} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none' }}>
                            <Button variant="outlined" size="small" startIcon={<OpenInNewIcon />} sx={{ textTransform: 'none' }}>
                              Xem tin tức chi tiết từ {news.source}
                            </Button>
                          </Link>
                        </Box>
                      )}

                      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                        <Chip
                          label={
                            news.type === 'industry_update'
                              ? 'Cập nhật ngành'
                              : news.type === 'export_opportunity'
                                ? 'Cơ hội xuất khẩu'
                                : 'Phát triển ngành'
                          }
                          size="small"
                          color="primary"
                        />
                        <Chip label={news.region} size="small" color="success" />
                        <Chip label={news.category} size="small" variant="outlined" color="info" />
                      </Stack>

                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        Nguồn: {news.source} • {new Date(news.date).toLocaleDateString('vi-VN')}
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const hasError = recommendationsError || predictionsError || marketError;
  const errorMessage = recommendationsError || predictionsError || marketError;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            AI-Powered Market Trends Analysis
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={480}>
            Intelligent demand forecasting and market intelligence powered by AI
          </Typography>
        </Box>
      </Stack>

      <Card sx={{ maxWidth: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="AI trends tabs" variant="scrollable" scrollButtons="auto">
            <Tab icon={<AnalyticsIcon />} label="Demand Predictions" iconPosition="start" />
            <Tab icon={<AssessmentIcon />} label="Market Intelligence Việt Nam" iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <DemandPredictionsChart predictions={predictions} loading={predictionsLoading} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <MarketTrendsSection marketTrends={marketTrends} loading={marketLoading} />
        </TabPanel>
      </Card>
    </Box>
  );
}

export default Trends;
