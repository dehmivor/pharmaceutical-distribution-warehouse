'use client';
import React, { useState, useEffect, useCallback } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { 
  Info as InfoIcon, 
  Update as UpdateIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import ImportOrderDetails from '@/sections/warehouse/ImportOrderDetails';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

// Status color mapping
const getStatusColor = (status) => {
  const statusColors = {
    draft: 'default',
    approved: 'success',
    delivered: 'info',
    checked: 'warning',
    arranged: 'primary',
    completed: 'success',
    cancelled: 'error'
  };
  return statusColors[status] || 'default';
};

// Allowed statuses for warehouse manager
const ALLOWED_STATUSES = ['checked', 'arranged'];

const ManageImportOrders = () => {
  // State management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/import-orders', {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.error || 'Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load orders on component mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle status change
  const handleStatusChange = useCallback(async (id, status) => {
    try {
      setUpdatingStatus(true);
      setError(null);
      
      const response = await axiosInstance.patch(
        `/import-orders/${id}/status`,
        { status },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setSuccess('Order status updated successfully');
        setOpenStatusDialog(false);
        setSelectedOrder(null);
        setNewStatus('');
        fetchOrders(); // Refresh the list
      } else {
        throw new Error(response.data.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.response?.data?.error || 'Failed to update order status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  }, [fetchOrders]);

  // Dialog handlers
  const handleOpenStatusDialog = useCallback((order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setOpenStatusDialog(true);
  }, []);

  const handleCloseStatusDialog = useCallback(() => {
    setOpenStatusDialog(false);
    setSelectedOrder(null);
    setNewStatus('');
  }, []);

  const handleOpenDetails = useCallback((order) => {
    setSelectedOrder(order);
    setOpenDetails(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedOrder(null);
    setOpenDetails(false);
  }, []);

  // Notification handlers
  const handleCloseError = useCallback(() => setError(null), []);
  const handleCloseSuccess = useCallback(() => setSuccess(null), []);

  // Pagination handlers
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Search handler
  const handleSearch = useCallback((event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  }, []);

  // Filter orders based on search term
  const filteredOrders = orders.filter((order) =>
    order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier_contract_id?.contract_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.warehouse_manager_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate orders
  const paginatedOrders = filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Check if order can be updated
  const canUpdateStatus = (order) => {
    return ['delivered', 'checked', 'arranged'].includes(order.status);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Import Orders Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Warehouse managers can update order status to "Checked" or "Arranged"
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchOrders}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Search Section */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Search Orders"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          placeholder="Search by order ID, contract code, or manager name..."
        />
      </Box>

      {/* Orders Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.light' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Manager</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Manager Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Import Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Supplier Contract</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm ? 'No orders found matching your search.' : 'No orders available.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell>{order.warehouse_manager_id?.name || 'N/A'}</TableCell>
                  <TableCell>{order.warehouse_manager_id?.email || 'N/A'}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{order.supplier_contract_id?.contract_code || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      color="warning" 
                      onClick={() => handleOpenStatusDialog(order)}
                      disabled={!canUpdateStatus(order)}
                      title={canUpdateStatus(order) ? "Update Status" : "Cannot update this status"}
                      sx={{ mr: 1 }}
                    >
                      <UpdateIcon />
                    </IconButton>
                    <IconButton
                      color="info"
                      onClick={() => handleOpenDetails(order)}
                      title="View Details"
                    >
                      <InfoIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
        />
      </TableContainer>

      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onClose={handleCloseStatusDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Order Status
          {selectedOrder && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Order ID: {selectedOrder._id}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Status: <strong>{selectedOrder?.status}</strong>
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="New Status"
                disabled={updatingStatus}
              >
                {ALLOWED_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Warehouse managers can only change status to "Checked" or "Arranged"
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog} disabled={updatingStatus}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleStatusChange(selectedOrder._id, newStatus)}
            variant="contained"
            disabled={!newStatus || newStatus === selectedOrder?.status || updatingStatus}
            startIcon={updatingStatus ? <CircularProgress size={16} /> : null}
          >
            {updatingStatus ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Import Order Details</DialogTitle>
        <DialogContent>
          <ImportOrderDetails order={selectedOrder} onClose={handleCloseDetails} />
        </DialogContent>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageImportOrders;
