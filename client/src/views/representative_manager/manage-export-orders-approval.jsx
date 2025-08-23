'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Grid,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  TablePagination
} from '@mui/material';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';

import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';

// Ensure API_BASE_URL doesn't duplicate /api, and all endpoints have /api/export-orders
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};
const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true
});

function ManageExportOrdersApproval() {
  const trans = useTrans();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [orderToApprove, setOrderToApprove] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [orderToView, setOrderToView] = useState(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    contract_type: '',
    created_by: ''
  });

  // Add applied filters state to separate current filters from applied ones
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    contract_type: '',
    created_by: ''
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    status: [],
    contract_type: [],
    created_by: []
  });

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, appliedFilters]); // Use appliedFilters instead of filters

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
    // Remove auto page reset - only reset when applying filters
  };

  // Apply filters when search button is clicked
  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(0); // Reset to first page when applying new filters
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Clear all filters
  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      status: '',
      contract_type: '',
      created_by: ''
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(0);
  };

  // Refresh data - reset everything and fetch fresh data
  const handleRefresh = () => {
    // Reset to first page
    setPage(0);
    // Clear all filters
    const emptyFilters = {
      search: '',
      status: '',
      contract_type: '',
      created_by: ''
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    // Fetch fresh data
    fetchOrders();
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log('Fetching from:', `${API_BASE_URL}/api/export-orders`);
      console.log('Auth headers:', getAuthHeaders());

      const response = await axios.get(`${API_BASE_URL}/api/export-orders`, { headers: getAuthHeaders() });

      console.log('API Response:', response.data);
      if (response.data.success) {
        const allOrders = response.data.data || [];
        console.log('All export orders:', allOrders);
        
        // Client-side filtering using appliedFilters instead of filters
        let filteredOrders = allOrders.filter((order) => {
          const matchesSearch = !appliedFilters.search || 
            order._id?.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
            order.contract_id?.contract_code?.toLowerCase().includes(appliedFilters.search.toLowerCase());
          
          const matchesStatus = !appliedFilters.status || order.status === appliedFilters.status;
          const matchesContractType = !appliedFilters.contract_type || order.contract_id?.contract_type === appliedFilters.contract_type;
          const matchesCreatedBy = !appliedFilters.created_by || order.created_by?.email === appliedFilters.created_by;
          
          return matchesSearch && matchesStatus && matchesContractType && matchesCreatedBy;
        });

        // Client-side pagination
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

        setOrders(paginatedOrders);
        setTotalCount(filteredOrders.length);

        // Generate filter options from data
        const statusOptions = [...new Set(allOrders.map((order) => order.status))];
        const contractTypeOptions = [...new Set(allOrders.map((order) => order.contract_id?.contract_type).filter(Boolean))];
        const createdByOptions = [...new Set(allOrders.map((order) => order.created_by?.email).filter(Boolean))];

        setFilterOptions({
          status: statusOptions,
          contract_type: contractTypeOptions,
          created_by: createdByOptions.map((email) => ({ email }))
        });
      } else {
        setOrders([]);
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApproveDialog = (order) => {
    setOrderToApprove(order);
    setApproveDialogOpen(true);
  };
  const handleCloseApproveDialog = () => {
    setApproveDialogOpen(false);
    setOrderToApprove(null);
  };
  const handleApprove = async () => {
    if (!orderToApprove) return;
    setApproveLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/export-orders/${orderToApprove._id}/approve`,
        {}, // No longer sending status, only sending empty body
        { headers: getAuthHeaders() }
      );
      setSuccess(trans.representativeManagerExportOrdersApproval.messages.orderApproved);
      fetchOrders();
      handleCloseApproveDialog();
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleOpenRejectDialog = (order) => {
    setOrderToReject(order);
    setRejectDialogOpen(true);
  };
  const handleCloseRejectDialog = () => {
    setRejectDialogOpen(false);
    setOrderToReject(null);
  };
  const handleReject = async () => {
    if (!orderToReject) return;
    setRejectLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/export-orders/${orderToReject._id}/reject`,
        { reason: '' }, // Always send an empty reason for rejection
        { headers: getAuthHeaders() }
      );
      setSuccess(trans.representativeManagerExportOrdersApproval.messages.orderRejected);
      fetchOrders();
      handleCloseRejectDialog();
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleOpenDetailsDialog = (order) => {
    setOrderToView(order);
    setDetailsDialogOpen(true);
  };
  const handleCloseDetailsDialog = () => {
    setOrderToView(null);
    setDetailsDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {trans.representativeManagerExportOrdersApproval.title}
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <FilterIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {trans.representativeManagerExportOrdersApproval.filters.title}
            </Typography>
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label={trans.representativeManagerExportOrdersApproval.filters.search}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                variant="outlined"
                size="medium"
                placeholder={trans.representativeManagerExportOrdersApproval.filters.searchPlaceholder}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="medium" sx={{ maxWidth: 160 }}>
                <InputLabel>{trans.representativeManagerExportOrdersApproval.filters.status}</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label={trans.representativeManagerExportOrdersApproval.filters.status}
                  renderValue={(selected) => (
                    <span
                      style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {selected || trans.representativeManagerExportOrdersApproval.filters.allStatus}
                    </span>
                  )}
                  sx={{
                    width: 160
                  }}
                >
                  <MenuItem value="">{trans.representativeManagerExportOrdersApproval.filters.allStatus}</MenuItem>
                  {filterOptions?.status?.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="medium" sx={{ maxWidth: 160 }}>
                <InputLabel>{trans.representativeManagerExportOrdersApproval.filters.contractType}</InputLabel>
                <Select
                  value={filters.contract_type}
                  onChange={(e) => handleFilterChange('contract_type', e.target.value)}
                  label={trans.representativeManagerExportOrdersApproval.filters.contractType}
                  renderValue={(selected) => (
                    <span
                      style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {selected === 'economic'
                        ? trans.representativeManagerExportOrdersApproval.filters.economic
                        : selected === 'principal'
                          ? trans.representativeManagerExportOrdersApproval.filters.principal
                          : selected || trans.representativeManagerExportOrdersApproval.filters.allContractTypes}
                    </span>
                  )}
                  sx={{
                    width: 160
                  }}
                >
                  <MenuItem value="">{trans.representativeManagerExportOrdersApproval.filters.allContractTypes}</MenuItem>
                  {filterOptions?.contract_type?.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type === 'economic'
                        ? trans.representativeManagerExportOrdersApproval.filters.economic
                        : type === 'principal'
                          ? trans.representativeManagerExportOrdersApproval.filters.principal
                          : type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="medium" sx={{ maxWidth: 200 }}>
                <InputLabel>{trans.representativeManagerExportOrdersApproval.filters.createdBy}</InputLabel>
                <Select
                  value={filters.created_by}
                  onChange={(e) => handleFilterChange('created_by', e.target.value)}
                  label={trans.representativeManagerExportOrdersApproval.filters.createdBy}
                  renderValue={(selected) => (
                    <span
                      style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {selected || trans.representativeManagerExportOrdersApproval.filters.allUsers}
                    </span>
                  )}
                  sx={{
                    width: 200
                  }}
                >
                  <MenuItem value="">{trans.representativeManagerExportOrdersApproval.filters.allUsers}</MenuItem>
                  {filterOptions?.created_by?.map((user) => (
                    <MenuItem key={user.email} value={user.email}>
                      {user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                variant="contained"
                onClick={applyFilters}
                fullWidth
                sx={{ height: '56px' }}
                startIcon={<SearchIcon />}
              >
                {trans.common.search || 'Search'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                variant="outlined"
                onClick={handleRefresh}
                disabled={loading}
                fullWidth
                sx={{ height: '56px' }}
              >
                {trans.representativeManagerExportOrdersApproval.filters.refresh}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                fullWidth
                sx={{ height: '56px' }}
              >
                {trans.common.clear || 'Clear'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ border: '1px solid #e0e0e0' }}>
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid #e0e0e0',
            bgcolor: 'grey.50'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {trans.representativeManagerExportOrdersApproval.table.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {trans.representativeManagerExportOrdersApproval.table.totalOrders} {totalCount}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>Order ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{trans.representativeManagerExportOrdersApproval.table.contract}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{trans.representativeManagerExportOrdersApproval.table.createdBy}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{trans.representativeManagerExportOrdersApproval.table.status}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {trans.representativeManagerExportOrdersApproval.table.actions}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id} hover sx={{ transition: 'background 0.2s', '&:hover': { backgroundColor: '#f0f4fa' } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'text.primary' }}>
                      #{order._id?.slice(-6)?.toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>{order.contract_id?.contract_code || 'N/A'}</TableCell>
                  <TableCell>{order.created_by?.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={
                        order.status === 'approved'
                          ? 'success'
                          : order.status === 'rejected'
                            ? 'error'
                            : order.status === 'draft'
                              ? 'default'
                              : 'info'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} justifyContent="center">
                      {order.status === 'draft' && (
                        <>
                          <Button variant="contained" color="success" onClick={() => handleOpenApproveDialog(order)}>
                            {trans.representativeManagerExportOrdersApproval.actions.approve}
                          </Button>
                          <Button variant="contained" color="error" onClick={() => handleOpenRejectDialog(order)}>
                            {trans.representativeManagerExportOrdersApproval.actions.reject}
                          </Button>
                        </>
                      )}
                      <Button variant="outlined" color="info" onClick={() => handleOpenDetailsDialog(order)}>
                        {trans.representativeManagerExportOrdersApproval.actions.viewDetails}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">
                      {loading
                        ? trans.representativeManagerExportOrdersApproval.table.loadingOrders
                        : trans.representativeManagerExportOrdersApproval.table.noOrders}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid #e0e0e0',
            bgcolor: 'grey.50'
          }}
        />
      </Card>
      {/* Order Details Dialog */}
      <Dialog open={approveDialogOpen} onClose={handleCloseApproveDialog}>
        <DialogTitle>{trans.representativeManagerExportOrdersApproval.dialogs.approve.title}</DialogTitle>
        <DialogContent>
          <Typography>{trans.representativeManagerExportOrdersApproval.dialogs.approve.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApproveDialog}>{trans.representativeManagerExportOrdersApproval.dialogs.approve.cancel}</Button>
          <Button onClick={handleApprove} color="success" variant="contained" disabled={approveLoading}>
            {approveLoading
              ? trans.representativeManagerExportOrdersApproval.actions.approving
              : trans.representativeManagerExportOrdersApproval.actions.approve}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={rejectDialogOpen} onClose={handleCloseRejectDialog}>
        <DialogTitle>{trans.representativeManagerExportOrdersApproval.dialogs.reject.title}</DialogTitle>
        <DialogContent>
          <Typography>{trans.representativeManagerExportOrdersApproval.dialogs.reject.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog}>{trans.representativeManagerExportOrdersApproval.dialogs.reject.cancel}</Button>
          <Button onClick={handleReject} color="error" variant="contained" disabled={rejectLoading}>
            {rejectLoading
              ? trans.representativeManagerExportOrdersApproval.actions.rejecting
              : trans.representativeManagerExportOrdersApproval.actions.reject}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={detailsDialogOpen} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600, fontSize: 22, pb: 1 }}>
          {trans.representativeManagerExportOrdersApproval.dialogs.details.title}
        </DialogTitle>
        <DialogContent>
          {orderToView && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {trans.representativeManagerExportOrdersApproval.dialogs.details.basicInfo}
                    </Typography>
                    <Typography variant="body2">
                      <b>{trans.representativeManagerExportOrdersApproval.dialogs.details.contract}:</b>{' '}
                      {orderToView.contract_id?.contract_code || trans.common.na}
                    </Typography>
                    <Typography variant="body2">
                      <b>{trans.representativeManagerExportOrdersApproval.dialogs.details.createdBy}:</b>{' '}
                      {orderToView.created_by?.email || trans.common.na}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" component="span">
                        <b>{trans.representativeManagerExportOrdersApproval.dialogs.details.status}:</b>
                      </Typography>
                      <Chip label={orderToView.status} color="info" size="small" sx={{ ml: 1 }} />
                    </Box>
                    <Typography variant="body2">
                      <strong>{trans.representativeManagerExportOrdersApproval.dialogs.details.warehouseManager}:</strong>{' '}
                      {orderToView.warehouse_manager_id?.email || '-'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {trans.representativeManagerExportOrdersApproval.dialogs.details.orderOverview}
                    </Typography>
                    <Typography variant="body2">
                      <b>{trans.representativeManagerExportOrdersApproval.dialogs.details.medicineTypes}:</b>{' '}
                      {orderToView.details?.length || 0}
                    </Typography>
                    <Typography variant="body2">
                      <b>{trans.representativeManagerExportOrdersApproval.dialogs.details.totalAmount}:</b>{' '}
                      {orderToView.details
                        ? orderToView.details.reduce((sum, d) => sum + d.expected_quantity * d.unit_price, 0).toLocaleString() +
                          ' ' +
                          trans.common.currency
                        : '0 ' + trans.common.currency}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                {trans.representativeManagerExportOrdersApproval.dialogs.details.medicineList}
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>
                        <b>{trans.representativeManagerExportOrdersApproval.dialogs.details.medicine}</b>
                      </TableCell>
                      <TableCell align="right">
                        <b>{trans.representativeManagerExportOrdersApproval.dialogs.details.quantity}</b>
                      </TableCell>
                      <TableCell align="right">
                        <b>{trans.representativeManagerExportOrdersApproval.dialogs.details.unitPrice}</b>
                      </TableCell>
                      <TableCell align="right">
                        <b>{trans.representativeManagerExportOrdersApproval.dialogs.details.total}</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderToView.details?.map((d, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{d.medicine_id?.medicine_name || d.medicine_id || 'N/A'}</TableCell>
                        <TableCell align="right">{d.expected_quantity}</TableCell>
                        <TableCell align="right">{d.unit_price?.toLocaleString() || 0}</TableCell>
                        <TableCell align="right">{(d.expected_quantity * d.unit_price).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {/* Grand Total Row */}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <b>{trans.representativeManagerExportOrdersApproval.dialogs.details.grandTotal}</b>
                      </TableCell>
                      <TableCell align="right">
                        {orderToView.details
                          ? orderToView.details.reduce((sum, d) => sum + d.expected_quantity * d.unit_price, 0).toLocaleString() +
                            ' ' +
                            trans.common.currency
                          : '0 ' + trans.common.currency}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', pr: 3, pb: 2 }}>
          <Button onClick={handleCloseDetailsDialog} variant="contained" color="primary" sx={{ minWidth: 120 }}>
            {trans.representativeManagerExportOrdersApproval.dialogs.details.close}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ManageExportOrdersApproval;
