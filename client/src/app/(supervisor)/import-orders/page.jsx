'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';

// Components
import ImportOrderDetails from '@/sections/warehouse/ImportOrderDetails';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    return '-';
  }
};

// Helper function to format currency
const formatCurrency = (value) => {
  if (!value) return '-';
  try {
    return `${Number(value).toLocaleString('en-US')} VND`;
  } catch (error) {
    return '-';
  }
};

const SupervisorImportOrders = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/import-orders');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when component mounts
  useEffect(() => {
    fetchOrders();
  }, []);

  // Update order status
  const handleStatusChange = async (id, newStatus) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/import-orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }

      setSuccess('Status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setOpenDetails(false);
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleCloseSuccess = () => {
    setSuccess(null);
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter((order) =>
    order?.import_order_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate orders
  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Import Orders</Typography>
      </Box>

      <TextField
        fullWidth
        label="Search Orders"
        variant="outlined"
        value={searchTerm}
        onChange={handleSearch}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Code</TableCell>
              <TableCell>Contract</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell>Import Date</TableCell>
              <TableCell>Total Value</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order?._id}>
                <TableCell>{order?.import_order_code || '-'}</TableCell>
                <TableCell>{order?.contract_id?.contract_code || '-'}</TableCell>
                <TableCell>{order?.supplier_id?.full_name || '-'}</TableCell>
                <TableCell>{order?.warehouse_id?.full_name || '-'}</TableCell>
                <TableCell>{formatDate(order?.import_date)}</TableCell>
                <TableCell>{formatCurrency(order?.total_value)}</TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <Select
                      value={order?.status || ''}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      disabled={actionLoading}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDetails(order)} disabled={actionLoading}>
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredOrders.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Import Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && <ImportOrderDetails order={selectedOrder} onClose={handleCloseDetails} />}
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
        autoHideDuration={1500}
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

export default SupervisorImportOrders; 