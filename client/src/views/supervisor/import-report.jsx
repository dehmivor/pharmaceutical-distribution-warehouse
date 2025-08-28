'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import useTrans from '@/hooks/useTrans';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

import useConfig from '@/hooks/useConfig';
import { ThemeI18n } from '@/config';

export default function ImportReport() {
  const trans = useTrans();
  const { i18n } = useConfig();

  // Move formatCurrency inside component and use useMemo
  const formatCurrency = useMemo(() => {
    return (value) => {
      const locale = i18n === ThemeI18n.VN ? 'vi-VN' : 'en-US';

      // For VND, display in thousands format
      if (i18n === ThemeI18n.VN) {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'VND',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value * 1000); // Multiply by 1000 since value is in thousands
      } else {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      }
    };
  }, [i18n]);

  // Move formatDate inside component and use useMemo
  const formatDate = useMemo(() => {
    return (date) => {
      const locale = i18n === ThemeI18n.VN ? 'vi-VN' : 'en-US';
      return new Date(date).toISOString().slice(0, 10);
    };
  }, [i18n]);

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    importOrders: [],
    summary: {},
    filters: {}
  });

  // Pagination state
  const [page, setPage] = useState(0); // 0-based for TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(7);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 10), // Previous month
    endDate: new Date().toISOString().slice(0, 10), // Today
    period: 'monthly',
    status: 'all',
    supplierId: 'All Supplier',
    reportType: 'comprehensive'
  });
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.period) params.append('period', filters.period);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.supplierId && filters.supplierId !== 'All Supplier') params.append('supplierId', filters.supplierId);

      // Add pagination parameters
      params.append('page', (page + 1).toString()); // Convert to 1-based for API
      params.append('limit', rowsPerPage.toString());

      console.log('Frontend filters:', filters);
      console.log('Fetching import report with params:', params.toString());

      const response = await axios.get(`${API_BASE_URL}/api/reports/import-orders?${params.toString()}`, {
        headers: getAuthHeaders()
      });

      console.log('Import report response:', response.data);

      if (response.data.success) {
        setReportData(response.data.data);
        // Lấy tổng số dòng từ pagination total nếu có, fallback tính sub-items
        const totalRows =
          response.data.data.pagination?.total ||
          response.data.data.importOrders?.reduce((sum, order) => sum + (order.medicineDetails?.length || 0), 0) ||
          0;
        setTotalCount(totalRows);
      }
    } catch (error) {
      console.error('Error fetching import report data:', error);
      setError(error.response?.data?.error || trans.reports.failedToLoad);
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

  // Fetch partner types from database
  const fetchPartnerTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reports/partner-types`, { headers: getAuthHeaders() });
      if (response.data.success) {
        setPartnerTypes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching partner types:', error);
    }
  };

  // Fetch suppliers for supplier filter
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/supplier/all/v1`, { headers: getAuthHeaders() });
      if (response.data.success) {
        setSuppliers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.period) params.append('period', filters.period);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.supplierId && filters.supplierId !== 'All Supplier') params.append('supplierId', filters.supplierId);
      params.append('reportType', 'import-orders');

      const response = await axios.get(`${API_BASE_URL}/api/reports/import-orders/export?${params.toString()}`, {
        headers: getAuthHeaders(),
        responseType: 'blob',
        timeout: 30000
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response received from server');
      }

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `import_orders_report_${timestamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError(error.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchReportData();
    fetchTemplates();
    fetchPartnerTypes();
    fetchSuppliers(); // Fetch suppliers when component mounts
  }, []); // Only run on component mount

  // Pagination changes
  useEffect(() => {
    if (page > 0 || rowsPerPage !== 7) {
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
      supplierId: 'All Supplier',
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
      case 'processing':
        return 'info';
      case 'cancelled':
        return 'error';
      case 'approved':
        return 'default';
      case 'draft':
        return 'default';
      case 'delivered':
        return 'info';
      case 'checked':
        return 'warning';
      case 'arranged':
        return 'primary';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'IMPORT':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {trans.reports.importReportTitle}
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {trans.reports.importReportDescription}
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
                label={trans.reports.startDate || 'Start Date'}
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label={trans.reports.endDate || 'End Date'}
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel id="period-label">{trans.reports.period || 'Period'}</InputLabel>
                <Select
                  labelId="period-label"
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  label={trans.reports.period || 'Period'}
                >
                  <MenuItem value="weekly">{trans.common.weekly || 'Weekly'}</MenuItem>
                  <MenuItem value="monthly">{trans.common.monthly || 'Monthly'}</MenuItem>
                  <MenuItem value="quarterly">{trans.common.quarterly || 'Quarterly'}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>{trans.reports.status || 'Status'}</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label={trans.reports.status || 'Status'}
                >
                  <MenuItem value="all">{trans.reports.allStatus || 'All Status'}</MenuItem>
                  <MenuItem value="draft">
                    <Typography noWrap sx={{ maxWidth: '120px' }}>
                      {trans.reports.draft || 'Draft'}
                    </Typography>
                  </MenuItem>
                  <MenuItem value="pending">
                    <Typography>{trans.reports.pending || 'Pending'}</Typography>
                  </MenuItem>
                  <MenuItem value="approved">
                    <Typography>{trans.reports.approved || 'Approved'}</Typography>
                  </MenuItem>
                  <MenuItem value="delivered">
                    <Typography>{trans.reports.delivered || 'Delivered'}</Typography>
                  </MenuItem>
                  <MenuItem value="checked">
                    <Typography>{trans.reports.checked || 'Checked'}</Typography>
                  </MenuItem>
                  <MenuItem value="arranged">
                    <Typography>{trans.reports.arranged || 'Arranged'}</Typography>
                  </MenuItem>
                  <MenuItem value="completed">
                    <Typography>{trans.reports.completed || 'Completed'}</Typography>
                  </MenuItem>
                  <MenuItem value="cancelled">
                    <Typography>{trans.reports.cancelled || 'Cancelled'}</Typography>
                  </MenuItem>
                  <MenuItem value="rejected">
                    <Typography>{trans.reports.rejected || 'Rejected'}</Typography>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>{trans.reports.supplier || 'Supplier'}</InputLabel>
                <Select
                  value={filters.supplierId}
                  onChange={(e) => handleFilterChange('supplierId', e.target.value)}
                  label={trans.reports.supplier || 'Supplier'}
                  disabled={suppliers.length === 0}
                >
                  <MenuItem value="All Supplier">{trans.reports.all || 'All'}</MenuItem>
                  {suppliers.length === 0 ? (
                    <MenuItem disabled>Loading...</MenuItem>
                  ) : (
                    suppliers.map((supplier) => (
                      <MenuItem key={supplier._id} value={supplier._id}>
                        <Typography>{supplier.name}</Typography>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={exportToExcel} disabled={loading} fullWidth>
                {trans.reports.export || 'Export'}
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={handleReset} disabled={loading} fullWidth>
                {trans.common.reset || 'Reset'}
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button size="small" variant="contained" startIcon={<Search />} onClick={handleSearch} disabled={loading} fullWidth>
                {trans.common.search || 'Search'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {loading && <LinearProgress variant="indeterminate" sx={{ mb: 2 }} />}

      {/* Import Orders Report Table */}
      {activeTab === 0 && (
        <>
          {reportData.importOrders && reportData.importOrders.length > 0 ? (
            <>
              <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
                <Table stickyHeader>
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.medicineCode || 'Mã thuốc'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.medicineName || 'Tên thuốc'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.unitOfMeasure || 'Đơn vị'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.quantity || 'Số lượng'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.importQuantity || 'Nhập'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.batchCode || 'Số lô'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.orderCode || 'Mã đơn hàng'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.contractCode || 'Mã HĐ'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.supplierName || 'Nhà cung cấp'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.status || 'Trạng thái'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.importOrders?.map((order) =>
                      order.medicineDetails?.map((medicine, index) => (
                        <TableRow key={`${order.id}-${index}`} hover>
                          <TableCell>{medicine.medicineCode}</TableCell>
                          <TableCell>{medicine.medicineName}</TableCell>
                          <TableCell>{medicine.unitOfMeasure}</TableCell>
                          <TableCell>{medicine.quantity}</TableCell>
                          <TableCell>{medicine.quantity}</TableCell>
                          <TableCell>{medicine.batchCode}</TableCell>
                          <TableCell>{order.orderCode}</TableCell>
                          <TableCell>{order.contractCode}</TableCell>
                          <TableCell>{order.supplierName}</TableCell>
                          <TableCell>
                            <Chip label={order.status} size="small" color={getStatusColor(order.status)} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
                rowsPerPageOptions={[7]}
                labelRowsPerPage={trans.reports.rowsPerPage || 'Rows per page:'}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} ${trans.reports.of || 'of'} ${count !== -1 ? count : trans.reports.moreThanTo || 'more than'}`
                }
              />
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {trans.reports.noDataToDisplay || 'No data to display'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {trans.reports.tryChangingFiltersOrCheckingData || 'Try changing filters or checking data availability'}
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{trans.reports.uploadExcelFile || 'Upload Excel File'}</DialogTitle>
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
                {trans.reports.selectExcelFile || 'Select Excel File'}
              </Button>
            </label>
            {uploadFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {trans.reports.selectedFile || 'Selected file'}: {uploadFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>{trans.common.cancel || 'Cancel'}</Button>
          <Button onClick={() => {}} variant="contained" disabled={!uploadFile}>
            {trans.reports.upload || 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
