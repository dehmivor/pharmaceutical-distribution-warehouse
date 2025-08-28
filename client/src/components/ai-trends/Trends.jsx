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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  Analytics as AnalyticsIcon,
  OpenInNew as OpenInNewIcon,
  Recommend as RecommendIcon,
  ShowChart as ShowChartIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Article as ArticleIcon,
  Newspaper as NewspaperIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { BarChart, LineChart } from '@mui/x-charts';
import useTrans from '@/hooks/useTrans';
import { openSnackbar } from '@/states/snackbar';

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

// Confidence Level Badge
const ConfidenceBadge = ({ confidence }) => {
  let color = 'error';
  if (confidence >= 0.8) color = 'success';
  else if (confidence >= 0.6) color = 'warning';

  return <Chip label={`${Math.round(confidence * 100)}%`} size="small" color={color} variant="outlined" />;
};

// Forecast Period Badge
const ForecastPeriodBadge = ({ period }) => {
  return <Chip label={`${period} tháng`} size="small" color="primary" variant="outlined" />;
};

// Enhanced AI Trends Hook
const useEnhancedAITrends = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchData = async (endpoint, params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const queryString = new URLSearchParams(params).toString();
      const url = `/api/enhanced-ai-trends/${endpoint}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
      openSnackbar({
        open: true,
        message: `❌ Error: ${err.message}`,
        alert: { color: 'error', variant: 'filled' }
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, data, fetchData };
};

// Market Intelligence Hook - Lấy dữ liệu thực từ các nguồn tin tức
const useMarketIntelligence = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi API để lấy dữ liệu thị trường thực tế
      const response = await fetch('/api/enhanced-ai-trends/market-insights', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
      openSnackbar({
        open: true,
        message: `❌ Error: ${err.message}`,
        alert: { color: 'error', variant: 'filled' }
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, data, fetchMarketData };
};

// Recommendations Tab Component
const RecommendationsTab = () => {
  const trans = useTrans();
  const { loading, error, data, fetchData } = useEnhancedAITrends();
  const [forecastPeriod, setForecastPeriod] = useState(2);

  React.useEffect(() => {
    fetchData('recommendations', { forecastPeriod });
  }, [forecastPeriod]);

  const handleRefresh = () => {
    fetchData('recommendations', { forecastPeriod });
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Đang tải khuyến nghị...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary.main">
          Khuyến Nghị Nhập Khẩu Thuốc
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip label={`Dự báo: ${forecastPeriod} tháng`} color="primary" variant="outlined" />
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
            Làm mới
          </Button>
        </Box>
      </Box>

      {data && data.length > 0 ? (
        <Grid container spacing={3}>
          {data.map((recommendation, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {recommendation.medicineName || `Thuốc ${index + 1}`}
                    </Typography>
                    <Chip label={recommendation.recommendation?.action || 'Khuyến nghị'} color="primary" size="small" />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Khuyến nghị:</strong> {recommendation.recommendation?.description || 'Không có thông tin'}
                    </Typography>

                    {recommendation.recommendation?.quantity && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Số lượng đề xuất:</strong> {recommendation.recommendation.quantity.toLocaleString()}
                      </Typography>
                    )}

                    {recommendation.recommendation?.reason && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Lý do:</strong> {recommendation.recommendation.reason}
                      </Typography>
                    )}

                    {recommendation.recommendation?.priority && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Mức độ ưu tiên:</strong>
                        <Chip
                          label={recommendation.recommendation.priority}
                          size="small"
                          color={
                            recommendation.recommendation.priority === 'high'
                              ? 'error'
                              : recommendation.recommendation.priority === 'medium'
                                ? 'warning'
                                : 'info'
                          }
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Cập nhật: {new Date().toLocaleDateString('vi-VN')}
                    </Typography>
                    <Chip label="AI Generated" size="small" color="success" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">Không có khuyến nghị nào được tạo. Vui lòng thử lại sau.</Alert>
      )}
    </Box>
  );
};

// Market Intelligence Tab Component - Hiển thị dữ liệu thực từ các bài báo
const MarketIntelligenceTab = () => {
  const trans = useTrans();
  const { loading, error, data, fetchMarketData } = useMarketIntelligence();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');

  React.useEffect(() => {
    fetchMarketData();
  }, []);

  const handleRefresh = () => {
    fetchMarketData();
  };

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

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary.main">
          Thông Tin Thị Trường & Tin Tức Y Tế
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Khu vực</InputLabel>
            <Select value={selectedRegion} label="Khu vực" onChange={(e) => setSelectedRegion(e.target.value)}>
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="mien-bac">Miền Bắc</MenuItem>
              <MenuItem value="mien-trung">Miền Trung</MenuItem>
              <MenuItem value="mien-nam">Miền Nam</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Danh mục</InputLabel>
            <Select value={selectedCategory} label="Danh mục" onChange={(e) => setSelectedCategory(e.target.value)}>
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="health">Sức khỏe</MenuItem>
              <MenuItem value="pharma">Dược phẩm</MenuItem>
              <MenuItem value="policy">Chính sách</MenuItem>
              <MenuItem value="market">Thị trường</MenuItem>
            </Select>
          </FormControl>

          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
            Làm mới
          </Button>
        </Box>
      </Box>

      {/* Market Overview Cards */}
      {data && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {data.totalMedicines || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng số thuốc
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {data.averageConfidence ? Math.round(data.averageConfidence * 100) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Độ tin cậy trung bình
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {data.topTrendingMedicines ? data.topTrendingMedicines.length : 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Thuốc xu hướng
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {data.newsCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tin tức mới
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* News Articles Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <NewspaperIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="bold">
              Tin Tức Y Tế & Dược Phẩm Mới Nhất
            </Typography>
          </Box>

          {data?.newsArticles && data.newsArticles.length > 0 ? (
            <Grid container spacing={3}>
              {data.newsArticles.map((article, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <ArticleIcon sx={{ mr: 1, color: 'primary.main', mt: 0.5 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" gutterBottom fontWeight="bold">
                            {article.title}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {article.summary}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            {article.category && <Chip label={article.category} size="small" color="primary" variant="outlined" />}
                            {article.region && <Chip label={article.region} size="small" color="success" variant="outlined" />}
                            {article.priority && (
                              <Chip
                                label={article.priority}
                                size="small"
                                color={article.priority === 'high' ? 'error' : article.priority === 'medium' ? 'warning' : 'info'}
                              />
                            )}
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {article.source} • {new Date(article.publishedDate).toLocaleDateString('vi-VN')}
                            </Typography>
                            {article.url && (
                              <Button size="small" startIcon={<OpenInNewIcon />} onClick={() => window.open(article.url, '_blank')}>
                                Xem chi tiết
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">Không có tin tức mới. Vui lòng thử lại sau.</Alert>
          )}
        </CardContent>
      </Card>

      {/* Market Trends Analysis */}
      {data?.marketTrends && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <BusinessIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Phân Tích Xu Hướng Thị Trường
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {data.marketTrends.map((trend, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {trend.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {trend.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={trend.impact} size="small" color="primary" />
                      <Chip label={trend.region} size="small" color="success" variant="outlined" />
                      <Chip label={trend.category} size="small" color="info" variant="outlined" />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Top Trending Medicines */}
      {data?.topTrendingMedicines && data.topTrendingMedicines.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Top Thuốc Xu Hướng
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Tên thuốc</TableCell>
                    <TableCell>Khu vực</TableCell>
                    <TableCell>Độ tin cậy</TableCell>
                    <TableCell>Số lượng dự báo</TableCell>
                    <TableCell>Khuyến nghị</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.topTrendingMedicines.map((medicine, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {medicine.medicineName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={medicine.forecastRegion || 'Toàn quốc'} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <ConfidenceBadge confidence={medicine.confidenceLevel} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{medicine.forecastedQuantity?.toLocaleString() || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {medicine.quantityAdjustmentRecommendation?.description || 'Không có'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {!data && <Alert severity="info">Không có dữ liệu thị trường. Vui lòng thử lại sau.</Alert>}
    </Box>
  );
};

function Trends() {
  const trans = useTrans();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);

    const tabNames = ['Khuyến Nghị', 'Thông Tin Thị Trường'];
    openSnackbar({
      open: true,
      message: `📋 Chuyển sang tab ${tabNames[newValue]}`,
      alert: { color: 'info', variant: 'filled' }
    });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            AI Trends & Phân Tích Thị Trường
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Phân tích xu hướng thị trường và đưa ra khuyến nghị nhập khẩu thông minh
          </Typography>
        </Box>
      </Stack>

      <Card sx={{ maxWidth: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="AI trends tabs" variant="scrollable" scrollButtons="auto">
            <Tab icon={<RecommendIcon />} label="Khuyến Nghị" iconPosition="start" />
            <Tab icon={<NewspaperIcon />} label="Thông Tin Thị Trường" iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <RecommendationsTab />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <MarketIntelligenceTab />
        </TabPanel>
      </Card>
    </Box>
  );
}

export default Trends;
