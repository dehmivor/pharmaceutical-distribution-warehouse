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
  TablePagination,
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
  FileUpload as FileUploadIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  LocalPharmacy as MedicineIcon,
  Refresh,
  Filter,
  Filter1,
  Search
} from '@mui/icons-material';
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

  // Pagination state
  const [page, setPage] = useState(0); // 0-based for TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 10), // Previous month
    endDate: new Date().toISOString().slice(0, 10), // Today
    period: 'monthly',
    status: 'all',
    type: 'all',
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
      if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString());
      if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString());
      if (filters.period) params.append('period', filters.period);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.partnerType) params.append('partnerType', filters.partnerType);

      // Add pagination parameters
      params.append('page', (page + 1).toString()); // Convert to 1-based for API
      params.append('limit', rowsPerPage.toString());

      console.log('Frontend filters:', filters);
      console.log('Date conversion:', {
        startDate: filters.startDate,
        endDate: filters.endDate,
        startDateISO: new Date(filters.startDate).toISOString(),
        endDateISO: new Date(filters.endDate).toISOString()
      });
      console.log('Fetching report with params:', params.toString());
      console.log('Auth headers:', getAuthHeaders());
      const response = await axios.get(`${API_BASE_URL}/api/reports/comprehensive?${params.toString()}`, { headers: getAuthHeaders() });

      console.log('Report response:', response.data);

      if (response.data.success) {
        setReportData(response.data.data);
        setTotalCount(response.data.data.pagination?.total || response.data.data.bills?.length || 0);
        console.log('Report data set:', response.data.data);
        console.log('Bills count:', response.data.data.bills?.length || 0);
        console.log('Pagination info:', response.data.data.pagination);
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
      if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString());
      if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString());
      if (filters.period) params.append('period', filters.period);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.partnerType) params.append('partnerType', filters.partnerType);
      params.append('reportType', filters.reportType);

      const response = await axios.get(`${API_BASE_URL}/api/reports/export?${params.toString()}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
      });

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
        fetchReportData(); // refresh data after upload
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchReportData();
    fetchTemplates();
  }, []); // Only run on component mount

  // Pagination changes
  useEffect(() => {
    if (page > 0 || rowsPerPage !== 10) {
      // Avoid duplicate initial load
      fetchReportData();
    }
  }, [page, rowsPerPage]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (field, value) => {
    console.log('Filter change:', field, value);
    setFilters((prev) => ({ ...prev, [field]: value }));
    // Note: Removed automatic page reset - now only happens on search
  };

  const handleSearch = () => {
    setPage(0); // Reset to first page when searching
    fetchReportData();
  };

  const handleReset = () => {
    // Reset all filters to default values
    setFilters({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 10), // Previous month
      endDate: new Date().toISOString().slice(0, 10), // Today
      period: 'monthly',
      status: 'all',
      type: 'all',
      partnerType: '',
      reportType: 'comprehensive'
    });
    setPage(0); // Reset to first page
    // Auto-fetch data after reset to show default results
    setTimeout(() => {
      fetchReportData();
    }, 100); // Small delay to ensure state is updated
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'partial':
        return 'info';
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Report Bill
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Tổng hợp báo cáo các loại bill trong hệ thống
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Filter inputs */}
            <Grid item xs={12} md={3}>
              <TextField
                label="Từ ngày"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Đến ngày"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel id="period-label">Chu kỳ</InputLabel>
                <Select
                  labelId="period-label"
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  label="Chu kỳ"
                >
                  <MenuItem value="weekly">Tuần</MenuItem>
                  <MenuItem value="monthly">Tháng</MenuItem>
                  <MenuItem value="quarterly">Quý</MenuItem>
                  {/* Nếu cần thêm 'yearly' có thể thêm ở đây */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel label="Trạng thái" id="status-label">
                  Trạng thái
                </InputLabel>
                <Select
                  labelId="status-label"
                  value={filters.status || 'all'}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Trạng thái"
                >
                  <MenuItem value="all">Tất cả trạng thái</MenuItem>
                  <MenuItem value="pending">Chờ xử lý</MenuItem>
                  <MenuItem value="partial">Thanh toán một phần</MenuItem>
                  <MenuItem value="completed">Hoàn thành</MenuItem>
                  <MenuItem value="overdue">Quá hạn</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel id="type-label">Loại</InputLabel>
                <Select
                  labelId="type-label"
                  value={filters.type || 'all'}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  label="Loại"
                >
                  <MenuItem value="all">Tất cả loại</MenuItem>
                  <MenuItem value="IMPORT">Nhập hàng</MenuItem>
                  <MenuItem value="EXPORT">Xuất hàng</MenuItem>
                  <MenuItem value="PAYMENT_VOUCHER">Phiếu chi</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button size="small" variant="contained" startIcon={<DownloadIcon />} onClick={exportToExcel} disabled={loading} fullWidth>
                Tải về Excel
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button size="small" variant="outlined" startIcon={<UploadIcon />} onClick={() => setUploadDialog(true)} fullWidth>
                Upload File
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={handleReset} disabled={loading} fullWidth>
                Reset
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button size="small" variant="contained" startIcon={<Search />} onClick={handleSearch} disabled={loading} fullWidth>
                Search
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && <LinearProgress variant="indeterminate" sx={{ mb: 2 }} />}

      {/* Comprehensive Report Table */}
      {activeTab === 0 && (
        <>
          {reportData.bills && reportData.bills.length > 0 ? (
            <>
              <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
                <Table stickyHeader>
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Mã Bill</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Mã Hợp đồng</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Loại đối tác</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Mã đơn hàng</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Loại đơn</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">
                        Tổng giá trị
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">
                        Đã thanh toán
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">
                        Còn lại
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Ngày tạo</TableCell>
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

              {/* Pagination */}
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Số hàng mỗi trang:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`}
              />
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Không có dữ liệu để hiển thị
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hãy thử thay đổi bộ lọc hoặc kiểm tra lại dữ liệu
              </Typography>
            </Box>
          )}
        </>
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
  );
}
