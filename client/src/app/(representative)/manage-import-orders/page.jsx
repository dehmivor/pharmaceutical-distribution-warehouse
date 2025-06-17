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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';

// Components
import ImportOrderForm from './components/ImportOrderForm';
import ImportOrderDetails from './components/ImportOrderDetails';

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

const ManageImportOrder = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
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

  // Create new order
  const handleCreateOrder = async (orderData) => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/import-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      setSuccess('Order created successfully');
      handleCloseForm();
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      setError(error.message || 'Failed to create order');
    } finally {
      setActionLoading(false);
    }
  };

  // Update order
  const handleUpdateOrder = async (id, orderData) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/import-orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update order');
      }

      setSuccess('Order updated successfully');
      handleCloseForm();
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      setError(error.message || 'Failed to update order');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete order
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/import-orders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete order');
      }

      setSuccess('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      setError(error.message || 'Failed to delete order');
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

  const handleOpenForm = (order = null) => {
    setSelectedOrder(order);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setSelectedOrder(null);
    setOpenForm(false);
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
        <Typography variant="h4">Manage Import Orders</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          disabled={actionLoading}
        >
          New Order
        </Button>
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
                <TableCell>{order?.status || '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDetails(order)} disabled={actionLoading}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton onClick={() => handleOpenForm(order)} disabled={actionLoading}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(order._id)} disabled={actionLoading}>
                    <DeleteIcon />
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

      {/* Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedOrder ? 'Edit Import Order' : 'Create New Import Order'}
        </DialogTitle>
        <DialogContent>
          <ImportOrderForm
            order={selectedOrder}
            onSubmit={selectedOrder ? handleUpdateOrder : handleCreateOrder}
            onClose={handleCloseForm}
            loading={actionLoading}
          />
        </DialogContent>
      </Dialog>

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

export default ManageImportOrder; 