'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tabs,
  Tab,
  Stack,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  FileUpload as FileUploadIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  LocalPharmacy as MedicineIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN');
};

export default function Report() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    bills: [],
    summary: {},
    filters: {}
  });
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
    period: 'monthly',
    status: '',
    type: '',
    partnerType: '',
    reportType: 'comprehensive'
  });
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [templates, setTemplates] = useState([]);

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.period) params.append('period', filters.period);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.partnerType) params.append('partnerType', filters.partnerType);

      const response = await axios.get(`${API_BASE_URL}/api/reports/comprehensive?${params.toString()}`, { headers: getAuthHeaders() });

      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError('Failed to load report data');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError(error.response?.data?.error || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reports/templates`, { headers: getAuthHeaders() });

      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.period) params.append('period', filters.period);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.partnerType) params.append('partnerType', filters.partnerType);
      params.append('reportType', filters.reportType);

      const response = await axios.get(`${API_BASE_URL}/api/reports/export?${params.toString()}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${filters.reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const handleFileUpload = async () => {
    if (!uploadFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await axios.post(`${API_BASE_URL}/api/reports/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert('File uploaded successfully!');
        setUploadDialog(false);
        setUploadFile(null);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    fetchTemplates();
  }, [filters]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'IMPORT':
        return 'info';
      case 'EXPORT':
        return 'primary';
      case 'PAYMENT_VOUCHER':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ padding: 3 }}>
        <Typography variant="h4" gutterBottom>
          Báo Cáo Thống Kê
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Bộ Lọc
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Từ ngày"
                  value={filters.startDate}
                  onChange={(newValue) => handleFilterChange('startDate', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Đến ngày"
                  value={filters.endDate}
                  onChange={(newValue) => handleFilterChange('endDate', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Chu kỳ</InputLabel>
                  <Select value={filters.period} onChange={(e) => handleFilterChange('period', e.target.value)} label="Chu kỳ">
                    <MenuItem value="weekly">Tuần</MenuItem>
                    <MenuItem value="monthly">Tháng</MenuItem>
                    <MenuItem value="quarterly">Quý</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} label="Trạng thái">
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="pending">Chờ xử lý</MenuItem>
                    <MenuItem value="completed">Hoàn thành</MenuItem>
                    <MenuItem value="overdue">Quá hạn</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Loại</InputLabel>
                  <Select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)} label="Loại">
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="IMPORT">Nhập hàng</MenuItem>
                    <MenuItem value="EXPORT">Xuất hàng</MenuItem>
                    <MenuItem value="PAYMENT_VOUCHER">Phiếu chi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportToExcel} disabled={loading}>
            Tải về Excel
          </Button>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setUploadDialog(true)}>
            Upload File
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchReportData} disabled={loading}>
            Làm mới
          </Button>
        </Stack>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Tổng số bills
                </Typography>
                <Typography variant="h4">{reportData.summary?.totalBills || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Tổng giá trị
                </Typography>
                <Typography variant="h4" color="primary">
                  {formatCurrency(reportData.summary?.totalValue || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Đã thanh toán
                </Typography>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(reportData.summary?.totalPaid || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Còn lại
                </Typography>
                <Typography variant="h4" color="error.main">
                  {formatCurrency(reportData.summary?.totalRemaining || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Báo cáo tổng hợp" icon={<AssessmentIcon />} />
            <Tab label="Theo thời gian" icon={<TrendingUpIcon />} />
            <Tab label="Theo đối tác" icon={<BusinessIcon />} />
            <Tab label="Theo thuốc" icon={<MedicineIcon />} />
          </Tabs>
        </Box>

        {/* Loading */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Comprehensive Report Table */}
        {activeTab === 0 && (
          <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Mã Bill</TableCell>
                  <TableCell>Mã Hợp đồng</TableCell>
                  <TableCell>Loại đối tác</TableCell>
                  <TableCell>Mã đơn hàng</TableCell>
                  <TableCell>Loại đơn</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Tổng giá trị</TableCell>
                  <TableCell align="right">Đã thanh toán</TableCell>
                  <TableCell align="right">Còn lại</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.bills?.map((bill) => (
                  <TableRow key={bill.id} hover>
                    <TableCell>{bill.billCode}</TableCell>
                    <TableCell>{bill.contractCode}</TableCell>
                    <TableCell>
                      <Chip label={bill.partnerType} size="small" color={bill.partnerType === 'Supplier' ? 'primary' : 'secondary'} />
                    </TableCell>
                    <TableCell>{bill.orderCode}</TableCell>
                    <TableCell>
                      <Chip label={bill.orderType} size="small" color={getTypeColor(bill.orderType)} />
                    </TableCell>
                    <TableCell>
                      <Chip label={bill.status} size="small" color={getStatusColor(bill.status)} />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(bill.totalValue)}</TableCell>
                    <TableCell align="right">{formatCurrency(bill.amountPaid)}</TableCell>
                    <TableCell align="right">{formatCurrency(bill.remainingAmount)}</TableCell>
                    <TableCell>{formatDate(bill.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Upload Dialog */}
        <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload File Excel</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <input
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={(e) => setUploadFile(e.target.files[0])}
              />
              <label htmlFor="file-upload">
                <Button variant="outlined" component="span" startIcon={<FileUploadIcon />} fullWidth>
                  Chọn file Excel
                </Button>
              </label>
              {uploadFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  File đã chọn: {uploadFile.name}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialog(false)}>Hủy</Button>
            <Button onClick={handleFileUpload} variant="contained" disabled={!uploadFile || uploading}>
              {uploading ? 'Đang upload...' : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
