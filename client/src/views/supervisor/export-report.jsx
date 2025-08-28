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
import useConfig from '@/hooks/useConfig';
import { ThemeI18n } from '@/config';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export default function ExportReport() {
  const trans = useTrans();
  const { i18n } = useConfig();

  // Move formatCurrency and formatDate functions inside the component
  const formatCurrency = (value) => {
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
    const locale = i18n === ThemeI18n.VN ? 'vi-VN' : 'en-US';
    return new Date(date).toISOString().slice(0, 10);
  };

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
      // Fix: Use partnerType instead of retailerId for the API
      if (filters.retailerId && filters.retailerId !== 'All Retailer') {
        // Find the retailer to get its partner type
        const selectedRetailer = retailers.find(r => r._id === filters.retailerId);
        if (selectedRetailer && selectedRetailer.partner_type) {
          params.append('partnerType', selectedRetailer.partner_type);
        }
      }

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
        
        // Debug: Log first order to see structure
        if (response.data.data.exportOrders && response.data.data.exportOrders.length > 0) {
          console.log('First order structure:', response.data.data.exportOrders[0]);
        }
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
      setError(null);

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.period) params.append('period', filters.period);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      // Fix: Use partnerType instead of retailerId for the API
      if (filters.retailerId && filters.retailerId !== 'All Retailer') {
        // Find the retailer to get its partner type
        const selectedRetailer = retailers.find(r => r._id === filters.retailerId);
        if (selectedRetailer && selectedRetailer.partner_type) {
          params.append('partnerType', selectedRetailer.partner_type);
        }
      }
      params.append('reportType', 'export-orders');

      console.log('Exporting export orders with params:', params.toString());

      const response = await axios.get(`${API_BASE_URL}/api/reports/export-orders/export?${params.toString()}`, {
        headers: getAuthHeaders(),
        responseType: 'blob',
        timeout: 30000 // 30 second timeout
      });

      console.log('Export response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataType: typeof response.data,
        dataSize: response.data?.size,
        isBlob: response.data instanceof Blob
      });

      // Validate response
      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response received from server');
      }

      // Check if response is already a blob
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format - expected blob');
      }

      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `export_orders_report_${timestamp}.xlsx`;
      link.setAttribute('download', filename);

      console.log('Creating download link:', { url, filename });

      // Add link to DOM, click it, and remove it
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      console.log('Export completed successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });

      // Handle different types of errors
      let errorMessage = trans.reports.failedToExport;

      if (error.response) {
        // Server responded with error
        console.error('Server error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });

        if (error.response.status === 404) {
          errorMessage = 'No data available for export with current filters';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error during export';
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        // Network error
        console.error('Network error:', error.request);
        errorMessage = 'Network error - please check your connection';
      } else if (error.message) {
        // Other error
        console.error('Other error:', error.message);
        errorMessage = error.message;
      }

      setError(errorMessage);
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
                      <TableCell sx={{ fontWeight: 'bold' }}>Mã thuốc</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tên thuốc</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Đơn vị</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Số lượng</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Sẵn có</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Đã xuất</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Số lô</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Order Code</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Contract Code</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Nhà bán lẻ</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.exportOrders?.map((order) => {
                      // Check if medicineDetails exists and has data
                      if (!order.medicineDetails || order.medicineDetails.length === 0) {
                        // If no medicine details, show order info with empty medicine fields
                        return (
                          <TableRow key={order.id} hover>
                            <TableCell>N/A</TableCell>
                            <TableCell>N/A</TableCell>
                            <TableCell>N/A</TableCell>
                           
                            <TableCell>N/A</TableCell>
                            <TableCell>{order.orderCode}</TableCell>
                            <TableCell>{order.contractCode}</TableCell>
                            <TableCell>{order.partnerName}</TableCell>
                            <TableCell>
                              <Chip label={order.status} size="small" color={getStatusColor(order.status)} />
                            </TableCell>
                          </TableRow>
                        );
                      }
                      
                      // Map through medicine details for each order
                      return order.medicineDetails.map((medicine, index) => (
                        <TableRow key={`${order.id}-${index}`} hover>
                          <TableCell>{medicine.medicineCode}</TableCell>
                          <TableCell>{medicine.medicineName}</TableCell>
                          <TableCell>{medicine.unit}</TableCell>
                          <TableCell>{medicine.quantity}</TableCell>
                          <TableCell>{medicine.available}</TableCell>
                          <TableCell>{medicine.exported}</TableCell>
                          <TableCell>{medicine.batchNumber}</TableCell>
                          <TableCell>{order.orderCode}</TableCell>
                          <TableCell>{order.contractCode}</TableCell>
                          <TableCell>{order.partnerName}</TableCell>
                          <TableCell>
                            <Chip label={order.status} size="small" color={getStatusColor(order.status)} />
                          </TableCell>
                        </TableRow>
                      ));
                    })}
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
