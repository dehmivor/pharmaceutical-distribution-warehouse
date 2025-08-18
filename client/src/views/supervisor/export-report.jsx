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

const formatCurrency = (value) => {
  const { i18n } = useConfig();
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

const formatDate = (date) => {
  const { i18n } = useConfig();
  const locale = i18n === ThemeI18n.VN ? 'vi-VN' : 'en-US';
  return new Date(date).toISOString().slice(0, 10);
};

export default function ExportReport() {
  const trans = useTrans();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    exportOrders: [],
    summary: {},
    filters: {}
  });

  // Pagination state
  const [page, setPage] = useState(0); // 0-based for TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 10), // Previous month
    endDate: new Date().toISOString().slice(0, 10), // Today
    period: 'monthly',
    status: 'all',
    retailerId: 'All Retailer',
    reportType: 'comprehensive'
  });
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [retailers, setRetailers] = useState([]);

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
      if (filters.retailerId) params.append('retailerId', filters.retailerId);

      // Add pagination parameters
      params.append('page', (page + 1).toString()); // Convert to 1-based for API
      params.append('limit', rowsPerPage.toString());

      console.log('Frontend filters:', filters);
      console.log('Fetching export report with params:', params.toString());

      const response = await axios.get(`${API_BASE_URL}/api/reports/export-orders?${params.toString()}`, {
        headers: getAuthHeaders()
      });

      console.log('Export report response:', response.data);

      if (response.data.success) {
        setReportData(response.data.data);
        setTotalCount(response.data.data.pagination?.total || response.data.data.exportOrders?.length || 0);
        console.log('Export report data set:', response.data.data);
        console.log('Export orders count:', response.data.data.exportOrders?.length || 0);
        console.log('Pagination info:', response.data.data.pagination);
      } else {
        setError(trans.reports.failedToLoad);
      }
    } catch (error) {
      console.error('Error fetching export report data:', error);
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

  // Fetch retailers for partner type filter
  const fetchRetailers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/retailer/all/v1`, { headers: getAuthHeaders() });
      if (response.data.success) {
        setRetailers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching retailers:', error);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.period) params.append('period', filters.period);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.retailerId) params.append('retailerId', filters.retailerId);
      params.append('reportType', 'export-orders');

      const response = await axios.get(`${API_BASE_URL}/api/reports/export-orders/export?${params.toString()}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export_orders_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError(trans.reports.failedToExport);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchReportData();
    fetchTemplates();
    fetchPartnerTypes();
    fetchRetailers(); // Fetch retailers when component mounts
  }, []); // Only run on component mount

  // Pagination changes
  useEffect(() => {
    if (page > 0 || rowsPerPage !== 5) {
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
      retailerId: '',
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
      default:
        return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'EXPORT':
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
            {trans.reports.exportReportTitle}
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {trans.reports.exportReportDescription}
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
                label={trans.reports.startDate}
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label={trans.reports.endDate}
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel id="period-label">{trans.reports.period}</InputLabel>
                <Select
                  labelId="period-label"
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  label={trans.reports.period}
                >
                  <MenuItem value="weekly">{trans.common.weekly}</MenuItem>
                  <MenuItem value="monthly">{trans.common.monthly}</MenuItem>
                  <MenuItem value="quarterly">{trans.common.quarterly}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>{trans.reports.status}</InputLabel>
                <Select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} label={trans.reports.status}>
                  <MenuItem value="all">{trans.reports.allStatus}</MenuItem>
                  <MenuItem value="draft">
                    <Typography noWrap sx={{ maxWidth: '120px' }}>
                      {trans.reports.draft.length > 7 ? `${trans.reports.draft.substring(0, 7)}...` : trans.reports.draft}
                    </Typography>
                  </MenuItem>
                  <MenuItem value="pending">
                    <Typography>{trans.reports.pending}</Typography>
                  </MenuItem>
                  <MenuItem value="processing">
                    <Typography>{trans.reports.processing}</Typography>
                  </MenuItem>
                  <MenuItem value="completed">
                    <Typography>{trans.reports.completed}</Typography>
                  </MenuItem>
                  <MenuItem value="cancelled">
                    <Typography>{trans.reports.cancelled}</Typography>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>{trans.reports.retailer || 'Retailer'}</InputLabel>
                <Select
                  value={filters.retailerId}
                  onChange={(e) => handleFilterChange('retailerId', e.target.value)}
                  label={trans.reports.retailer || 'Retailer'}
                  disabled={retailers.length === 0}
                >
                  <MenuItem value="All Retailer">{trans.reports.all}</MenuItem>
                  {retailers.length === 0 ? (
                    <MenuItem disabled>Loading...</MenuItem>
                  ) : (
                    retailers.map((retailer) => (
                      <MenuItem key={retailer._id} value={retailer._id}>
                        <Typography>{retailer.name}</Typography>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={exportToExcel} disabled={loading} fullWidth>
                {trans.reports.export}
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialog(true)}
                disabled={loading}
                fullWidth
              >
                {trans.reports.upload}
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={handleReset} disabled={loading} fullWidth>
                {trans.common.reset}
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button size="small" variant="contained" startIcon={<Search />} onClick={handleSearch} disabled={loading} fullWidth>
                {trans.common.search}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {loading && <LinearProgress variant="indeterminate" sx={{ mb: 2 }} />}

      {/* Export Orders Report Table */}
      {activeTab === 0 && (
        <>
          {reportData.exportOrders && reportData.exportOrders.length > 0 ? (
            <>
              <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
                <Table stickyHeader>
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.orderCode}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.contractCode}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.status}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.orderType}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">
                        {trans.reports.totalValue}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.createdBy}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.approvedBy}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.createdAt}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trans.reports.updatedAt}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.exportOrders?.map((order) => (
                      <TableRow key={order.id} hover>
                        <TableCell>{order.orderCode}</TableCell>
                        <TableCell>{order.contractCode}</TableCell>
                        <TableCell>
                          <Chip label={order.status} size="small" color={getStatusColor(order.status)} />
                        </TableCell>
                        <TableCell>
                          <Chip label={order.orderType} size="small" color={getTypeColor(order.orderType)} />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(order.totalValue)}</TableCell>
                        <TableCell>{order.createdBy}</TableCell>
                        <TableCell>{order.approvedBy || 'N/A'}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>{formatDate(order.updatedAt)}</TableCell>
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
                rowsPerPageOptions={[7]}
                labelRowsPerPage={trans.reports.rowsPerPage}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} ${trans.reports.of} ${count !== -1 ? count : trans.reports.moreThanTo}`
                }
              />
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {trans.reports.noDataToDisplay}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {trans.reports.tryChangingFiltersOrCheckingData}
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{trans.reports.uploadExcelFile}</DialogTitle>
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
                {trans.reports.selectExcelFile}
              </Button>
            </label>
            {uploadFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {trans.reports.selectedFile}: {uploadFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>{trans.common.cancel}</Button>
          <Button onClick={() => {}} variant="contained" disabled={!uploadFile}>
            {trans.reports.upload}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
