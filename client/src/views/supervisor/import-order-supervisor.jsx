'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Snackbar,
  Alert,
  Chip,
  TextField,
  Grid,
  Button,
  CircularProgress,
  Stack,
  MenuItem
} from '@mui/material';
import { Info as InfoIcon, ForkLeft as ForwardIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
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

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const getStatusColor = (status) =>
  ({
    draft: 'default',
    approved: 'success',
    delivered: 'info',
    checked: 'warning',
    arranged: 'primary',
    completed: 'success',
    cancelled: 'error'
  })[status] || 'default';

const IMPORT_ORDER_STATUSES = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  DELIVERED: 'delivered',
  CHECKED: 'checked',
  ARRANGED: 'arranged',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export default function ImportOrderSupervisor() {
  const trans = useTrans();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [openDetails, setOpenDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Pagination and filtering
  const [page, setPage] = useState(1); // 1-based page
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');

  const [actionLoading, setActionLoading] = useState(false);

  // Fetch orders with filter, pagination
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: rowsPerPage
      };

      if (filterDate) params.createdAt = filterDate;
      if (filterStatus && filterStatus !== 'All Status') params.status = filterStatus;

      const response = await axiosInstance.get('/import-orders', { params });
      if (response.data.success || response.data.data) {
        setOrders(response.data.data || []);
        setTotalCount(response.data.pagination?.total || response.data.data?.length || 0);
      } else {
        throw new Error(response.data.error || trans.common.failedToFetchOrders);
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filterDate, filterStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleChangePage = (_e, newPage) => {
    setPage(newPage + 1); // TablePagination is zero-based; API is 1-based
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(1);
  };

  const handleSearchClick = () => {
    setPage(1);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setFilterDate('');
    setFilterStatus('All Status');
    setPage(1);
  };

  // Edit dialog open/close and form change handlers

  // Details dialog open/close
  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setOpenDetails(false);
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    try {
      return `${Number(value).toLocaleString('en-US')} VND`;
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {trans.importOrders.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {trans.importOrders.description}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchOrders()} disabled={loading}>
          {trans.importOrders.refresh}
        </Button>
      </Box>

      {/* Filters */}
      <Box component={Paper} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label={trans.common.createdDate}
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />

          <TextField
            select
            label={trans.importOrders.status}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="small"
          >
            <MenuItem value="All Status">{trans.importOrders.allStatus}</MenuItem>
            {Object.values(IMPORT_ORDER_STATUSES).map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>

          <Button size="small" variant="contained" startIcon={<SearchIcon />} onClick={handleSearchClick}>
            {trans.importOrders.search}
          </Button>
          <Button size="small" variant="outlined" onClick={handleResetFilters}>
            {trans.common.reset}
          </Button>
        </Stack>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 120 }}>{trans.common.orderCode}</TableCell>
              <TableCell sx={{ minWidth: 120 }}>{trans.common.contractCode}</TableCell>
              <TableCell sx={{ minWidth: 150 }}>{trans.common.supplier}</TableCell>
              <TableCell sx={{ minWidth: 150 }}>{trans.common.createdBy}</TableCell>
              <TableCell align="right" sx={{ minWidth: 120 }}>
                {trans.common.totalAmount}
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>{trans.importOrders.status}</TableCell>
              <TableCell sx={{ minWidth: 150 }}>{trans.common.warehouseManager}</TableCell>
              <TableCell sx={{ minWidth: 100 }}>{trans.importOrders.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{trans.importOrders.noOrdersFound}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const totalAmount = order.details?.reduce((acc, d) => acc + (d.quantity || 0) * (d.unit_price || 0), 0) || 0;
                return (
                  <TableRow hover key={order._id}>
                    <TableCell title={order._id}>
                      {order._id ? `${order._id.slice(0, 6)}...${order._id.slice(-4)}` : trans.common.na}
                    </TableCell>
                    <TableCell>{order.contract_id?.contract_code || trans.common.na}</TableCell>
                    <TableCell>{order.contract_id?.partner_id?.name || trans.common.na}</TableCell>
                    <TableCell>{order.created_by?.email || trans.common.na}</TableCell>
                    <TableCell align="right">{formatCurrency(totalAmount)}</TableCell>
                    <TableCell>
                      <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                    </TableCell>
                    <TableCell>{order.warehouse_manager_id?.email || trans.common.notAssigned}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton color="info" onClick={() => handleOpenDetails(order)}>
                          <InfoIcon />
                        </IconButton>
                        <IconButton
                          color="secondary"
                          onClick={() => (window.location.href = 'https://localhost:3000/manage-bills')}
                          title={trans.common.createDebt}
                        >
                          <ForwardIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="lg" fullWidth>
        <DialogTitle>{trans.importOrders.orderDetails}</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    {trans.common.basicInformation}
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {trans.common.orderId}
                        </Typography>
                        <Typography variant="body1">{selectedOrder._id}</Typography>
                      </Grid>
                      {/* Order Code is hidden for all orders */}
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {trans.importOrders.status}
                        </Typography>
                        <Chip label={selectedOrder.status} color={getStatusColor(selectedOrder.status)} size="small" />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    {trans.common.contractInformation}
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {trans.common.contractCode}
                        </Typography>
                        <Typography variant="body1">{selectedOrder.contract_id?.contract_code || trans.common.na}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {trans.common.supplier}
                        </Typography>
                        <Typography variant="body1">{selectedOrder.contract_id?.partner_id?.name || trans.common.na}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {trans.importOrders.contractStatus}
                        </Typography>
                        <Typography variant="body1">{selectedOrder.contract_id?.status || trans.importOrders.na}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    {trans.common.warehouseInformation}
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      {/* Warehouse is hidden for all orders */}
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {trans.common.warehouseManager}
                        </Typography>
                        <Typography variant="body1">{selectedOrder.warehouse_manager_id?.email || trans.common.notAssigned}</Typography>
                      </Grid>
                      {/* Only show Manager Email for regular orders, not for internal orders */}
                      {selectedOrder.contract_id && (
                        <Grid item xs={6} md={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            {trans.common.managerEmail}
                          </Typography>
                          <Typography variant="body1">{selectedOrder.warehouse_manager_id?.email || trans.common.na}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>

                {/* User Info & Order Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    {trans.common.userInformation}
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {trans.common.createdBy}
                        </Typography>
                        <Typography variant="body1">{selectedOrder.created_by?.email || trans.common.na}</Typography>
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {trans.common.creatorEmail}
                        </Typography>
                        <Typography variant="body1">{selectedOrder.created_by?.email || trans.common.na}</Typography>
                      </Grid>
                      {/* Only show Approved By for regular orders, not for internal orders */}
                      {selectedOrder.contract_id && (
                        <Grid item xs={6} md={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            {trans.common.approvedBy}
                          </Typography>
                          <Typography variant="body1">
                            {selectedOrder.approved_by?.name || selectedOrder.approval_by?.name || trans.common.na}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    {trans.common.orderDetails}
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>{trans.common.medicineName}</TableCell>
                            <TableCell>{trans.common.licenseCode}</TableCell>
                            <TableCell align="right">{trans.common.quantity}</TableCell>
                            {/* Only show pricing columns for regular orders */}
                            {selectedOrder.contract_id && (
                              <>
                                <TableCell align="right">{trans.common.unitPrice}</TableCell>
                                <TableCell align="right">{trans.common.total}</TableCell>
                              </>
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedOrder.details?.map((detail, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{detail.medicine_id?.medicine_name || trans.common.na}</TableCell>
                              <TableCell>{detail.medicine_id?.license_code || trans.common.na}</TableCell>
                              <TableCell align="right">{detail.quantity || 0}</TableCell>
                              {/* Only show pricing values for regular orders */}
                              {selectedOrder.contract_id && (
                                <>
                                  <TableCell align="right">{formatCurrency(detail.unit_price)}</TableCell>
                                  <TableCell align="right">{formatCurrency((detail.quantity || 0) * (detail.unit_price || 0))}</TableCell>
                                </>
                              )}
                            </TableRow>
                          ))}
                          {/* Only show Total Amount row for regular orders */}
                          {selectedOrder.contract_id && (
                            <TableRow>
                              <TableCell colSpan={5}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {trans.common.totalAmount}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {formatCurrency(
                                    selectedOrder.details?.reduce((total, detail) => total + detail.quantity * detail.unit_price, 0) || 0
                                  )}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>

                {/* Notes */}
                {selectedOrder.notes && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      {trans.common.notes}
                    </Typography>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="body1">{selectedOrder.notes}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>{trans.common.close}</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar: Error */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Snackbar: Success */}
      <Snackbar
        open={!!success}
        autoHideDuration={1500}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
