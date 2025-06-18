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
  Snackbar
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';

// Components
import ImportOrderForm from '@/sections/warehouse/ImportOrderForm';
import ImportOrderDetails from '@/sections/warehouse/ImportOrderDetails';

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

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/import-orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when component mounts
  useEffect(() => {
    fetchOrders();
  }, []);

  // Delete order
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/import-orders/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete order');
      }

      setSuccess('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      setError(error.message);
    }
  };

  // Update order status
  const handleStatusChange = async (id, status) => {
    try {
      const response = await fetch(`/api/import-orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update order status');
      }

      setSuccess('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.message);
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
    fetchOrders();
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
<<<<<<<< HEAD:client/src/app/(warehouse)/manage-import-orders/page.jsx
  const filteredOrders = orders.filter((order) =>
    order._id.toLowerCase().includes(searchTerm.toLowerCase())
  );
========
  const filteredOrders = orders.filter((order) => order.import_order_code.toLowerCase().includes(searchTerm.toLowerCase()));
>>>>>>>> ef4a9de2491a0e4280661f62d41aae2ea07a71e5:client/src/views/warehouse/ManageOrderPage.jsx

  // Paginate orders
  const paginatedOrders = filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Manage Import Orders</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
          New Order
        </Button>
      </Box>

      <TextField fullWidth label="Search Orders" variant="outlined" value={searchTerm} onChange={handleSearch} sx={{ mb: 3 }} />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Manager</TableCell>
              <TableCell>Import Date</TableCell>
              <TableCell>Purchase Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order._id}>
<<<<<<<< HEAD:client/src/app/(warehouse)/manage-import-orders/page.jsx
                <TableCell>{order.manager_id?.fullName || 'N/A'}</TableCell>
                <TableCell>
                  {new Date(order.import_date).toLocaleDateString()}
                </TableCell>
                <TableCell>{order.purchase_order_id?.code || 'N/A'}</TableCell>
========
                <TableCell>{order.import_order_code}</TableCell>
                <TableCell>{order.contract_id.contract_code}</TableCell>
                <TableCell>{order.supplier_id.full_name}</TableCell>
                <TableCell>{order.warehouse_id.full_name}</TableCell>
                <TableCell>{new Date(order.import_date).toLocaleDateString()}</TableCell>
                <TableCell>{order.total_value.toLocaleString()} VND</TableCell>
>>>>>>>> ef4a9de2491a0e4280661f62d41aae2ea07a71e5:client/src/views/warehouse/ManageOrderPage.jsx
                <TableCell>{order.status}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpenForm(order)} disabled={order.status === 'completed'}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(order._id)} disabled={order.status === 'completed'}>
                    <DeleteIcon />
                  </IconButton>
                  <IconButton
                    color="info"
                    onClick={() => handleOpenDetails(order)}
                  >
                    <InfoIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>{selectedOrder ? 'Edit Import Order' : 'New Import Order'}</DialogTitle>
        <DialogContent>
<<<<<<<< HEAD:client/src/app/(warehouse)/manage-import-orders/page.jsx
          <ImportOrderForm
            order={selectedOrder}
            onClose={handleCloseForm}
            onSuccess={() => {
              handleCloseForm();
              fetchOrders();
            }}
          />
========
          <ImportOrderForm order={selectedOrder} onClose={handleCloseForm} />
>>>>>>>> ef4a9de2491a0e4280661f62d41aae2ea07a71e5:client/src/views/warehouse/ManageOrderPage.jsx
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Import Order Details</DialogTitle>
        <DialogContent>
          <ImportOrderDetails order={selectedOrder} onClose={handleCloseDetails} />
        </DialogContent>
      </Dialog>

      {/* Error Snackbar */}
<<<<<<<< HEAD:client/src/app/(warehouse)/manage-import-orders/page.jsx
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
      >
        <Alert onClose={handleCloseError} severity="error">
========
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
>>>>>>>> ef4a9de2491a0e4280661f62d41aae2ea07a71e5:client/src/views/warehouse/ManageOrderPage.jsx
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageImportOrder;
