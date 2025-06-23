'use client';
import React, { useState, useEffect } from 'react';
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
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';
import axios from 'axios';

function ImportOrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form states
  const [formData, setFormData] = useState({
    supplier_contract_id: '',
    details: [{
      medicine_id: '',
      quantity: 0,
      unit_price: 0
    }]
  });

  const [supplierContracts, setSupplierContracts] = useState([]);
  const [warehouseManagers, setWarehouseManagers] = useState([]);
  const [contractMedicines, setContractMedicines] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [medicinesLoading, setMedicinesLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/import-orders');
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierContracts = async () => {
    try {
      const response = await axios.get('/api/supplier-contracts');
      const activeContracts = (response.data.data.contracts || []).filter(c => c.status === 'active');
      setSupplierContracts(activeContracts);
    } catch (error) {
      console.error('Error fetching supplier contracts:', error);
      setError('Failed to load supplier contracts');
    }
  };

  const fetchWarehouseManagers = async () => {
    try {
      const response = await axios.get('/api/users?role=warehouse_manager');
      setWarehouseManagers(response.data.data || []);
    } catch (error) {
      setWarehouseManagers([]);
    }
  };

  const fetchContractMedicines = async (contractId) => {
    if (!contractId) {
      setContractMedicines([]);
      return;
    }
    setMedicinesLoading(true);
    try {
      const response = await axios.get(`/api/supplier-contracts/${contractId}`);
      console.log('Contract medicines loaded:', response.data.data?.items);
      setContractMedicines(response.data.data?.items || []);
    } catch (error) {
      console.error('Error fetching contract medicines:', error);
      setError('Failed to load contract medicines');
      setContractMedicines([]);
    } finally {
      setMedicinesLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSupplierContracts();
    fetchWarehouseManagers();
  }, []);

  useEffect(() => {
    if (formData.supplier_contract_id) {
      fetchContractMedicines(formData.supplier_contract_id);
    } else {
      setContractMedicines([]);
    }
  }, [formData.supplier_contract_id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      await axios.delete(`/api/import-orders/${id}`);
      setSuccess('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      setError(error.response?.data?.error || error.message);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'supplier_contract_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        details: []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...formData.details];
    newDetails[index] = {
      ...newDetails[index],
      [field]: value
    };

    // If medicine changes, get unit price from contract
    if (field === 'medicine_id') {
      const selectedMedicine = contractMedicines.find(med => med.medicine_id._id === value);
      if (selectedMedicine) {
        newDetails[index].unit_price = selectedMedicine.unit_price || 0;
        console.log('Selected medicine:', selectedMedicine.medicine_id.medicine_name, 'Unit price:', selectedMedicine.unit_price);
      }
    }

    setFormData(prev => ({
      ...prev,
      details: newDetails
    }));
  };

  const addDetail = () => {
    setFormData(prev => ({
      ...prev,
      details: [
        ...prev.details,
        {
          medicine_id: '',
          quantity: 0,
          unit_price: 0
        }
      ]
    }));
  };

  const removeDetail = (index) => {
    setFormData(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.details.reduce((total, detail) => {
      return total + (detail.quantity * detail.unit_price);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    // Validate: không cho chọn trùng thuốc
    const medicineIds = formData.details.map(d => d.medicine_id);
    const hasDuplicate = new Set(medicineIds).size !== medicineIds.length;
    if (hasDuplicate) {
      setError('Không được chọn trùng thuốc trong cùng một phiếu nhập!');
      setFormLoading(false);
      return;
    }
    // Validate: số lượng và đơn giá > 0
    for (const detail of formData.details) {
      if (!detail.medicine_id || detail.quantity <= 0 || detail.unit_price <= 0) {
        setError('Vui lòng nhập đầy đủ, số lượng và đơn giá phải lớn hơn 0!');
        setFormLoading(false);
        return;
      }
    }

    try {
      const orderData = {
        supplier_contract_id: formData.supplier_contract_id,
        total: calculateTotal()
      };
      const orderDetails = formData.details;
      const url = selectedOrder
        ? `/api/import-orders/${selectedOrder._id}`
        : '/api/import-orders';
      if (selectedOrder) {
        await axios.put(url, { orderData, orderDetails });
      } else {
        await axios.post(url, { orderData, orderDetails });
      }
      setSuccess(selectedOrder ? 'Order updated successfully' : 'Order created successfully');
      handleCloseForm();
      fetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenForm = (order = null) => {
    if (order) {
      setFormData({
        supplier_contract_id: order.supplier_contract_id._id || order.supplier_contract_id,
        details: order.details.map(d => ({
          ...d,
          medicine_id: typeof d.medicine_id === 'object' ? d.medicine_id._id : d.medicine_id
        }))
      });
    } else {
      setFormData({
        supplier_contract_id: '',
        details: []
      });
    }
    setSelectedOrder(order);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setSelectedOrder(null);
    setOpenForm(false);
    setFormData({
      supplier_contract_id: '',
      details: []
    });
  };

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setOpenDetails(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'approved': return 'success';
      case 'delivered': return 'info';
      case 'checked': return 'warning';
      case 'arranged': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const paginatedOrders = orders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Manage Import Orders</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          Create New Order
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 120 }}>Contract Code</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Supplier</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Warehouse</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Created By</TableCell>
              <TableCell align="right" sx={{ minWidth: 120 }}>Total Amount</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order._id} hover>
                <TableCell>{order.supplier_contract_id?.contract_code || 'N/A'}</TableCell>
                <TableCell>{order.supplier_contract_id?.supplier_id?.name || 'N/A'}</TableCell>
                <TableCell>{order.warehouse_manager_id?.name || 'N/A'}</TableCell>
                <TableCell>{order.created_by?._id || order.created_by || 'N/A'}</TableCell>
                <TableCell align="right">
                  ${order.details?.reduce((total, detail) => 
                    total + (detail.quantity * detail.unit_price), 0
                  ).toLocaleString() || 0}
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                  <IconButton color="primary" onClick={() => handleOpenForm(order)} disabled={order.status !== 'draft'}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(order._id)} disabled={order.status !== 'draft'}>
                    <DeleteIcon />
                  </IconButton>
                    <IconButton color="info" onClick={() => handleOpenDetails(order)}>
                    <InfoIcon />
                  </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={orders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedOrder ? 'Edit Import Order' : 'Create New Import Order'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required size="small">
                  <InputLabel>Supplier Contract</InputLabel>
                  <Select
                    name="supplier_contract_id"
                    value={formData.supplier_contract_id}
                    onChange={handleFormChange}
                    label="Supplier Contract"
                  >
                    {supplierContracts.map((contract) => (
                      <MenuItem key={contract._id} value={contract._id}>
                        {contract.contract_code} - {contract.supplier_id?.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              </Grid>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Order Details</Typography>
                  <Button 
                    onClick={addDetail} 
                    variant="outlined" 
                    size="small"
                disabled={!formData.supplier_contract_id || formData.details.length >= contractMedicines.length}
                  >
                    Add Medicine
                  </Button>
                </Box>
                {!formData.supplier_contract_id && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Please select a Supplier Contract first to load available medicines
                  </Alert>
                )}
                {medicinesLoading && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Loading medicines from selected contract...
                  </Alert>
                )}
            {formData.details.length > 0 && formData.details.map((detail, index) => (
              <Paper sx={{ p: 2, mb: 2, boxShadow: 2 }} key={index}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                    <FormControl fullWidth required size="small">
                          <InputLabel>Medicine</InputLabel>
                          <Select
                            value={detail.medicine_id}
                            onChange={(e) => handleDetailChange(index, 'medicine_id', e.target.value)}
                            label="Medicine"
                            disabled={!formData.supplier_contract_id || medicinesLoading}
                        sx={{ minWidth: 240 }}
                        MenuProps={{
                          PaperProps: {
                            sx: { minWidth: 300 }
                          }
                        }}
                          >
                            {contractMedicines.length === 0 ? (
                              <MenuItem disabled>
                                {!formData.supplier_contract_id 
                                  ? 'Select a contract first' 
                                  : medicinesLoading 
                                    ? 'Loading medicines...' 
                                    : 'No medicines available in this contract'
                                }
                              </MenuItem>
                            ) : (
                          contractMedicines
                            .filter(item =>
                              item.medicine_id._id === detail.medicine_id ||
                              !formData.details.some((d, i) => d.medicine_id === item.medicine_id._id && i !== index)
                            )
                            .map((item) => (
                              <MenuItem key={item.medicine_id._id} value={item.medicine_id._id} sx={{ whiteSpace: 'normal', minWidth: 280 }}>
                                {item.medicine_id.medicine_name}
                                </MenuItem>
                              ))
                            )}
                        {!contractMedicines.some(item => item.medicine_id._id === detail.medicine_id) && detail.medicine_id && (
                          <MenuItem value={detail.medicine_id} sx={{ whiteSpace: 'normal', minWidth: 280 }}>
                            {typeof detail.medicine_id === 'object' ? detail.medicine_id.medicine_name : detail.medicine_id}
                          </MenuItem>
                        )}
                          </Select>
                        </FormControl>
                      </Grid>
                  <Grid item xs={6} md={2}>
                        <TextField
                          fullWidth
                          label="Quantity"
                          type="number"
                          value={detail.quantity}
                          onChange={(e) => handleDetailChange(index, 'quantity', Number(e.target.value))}
                          required
                          disabled={!detail.medicine_id}
                      size="small"
                        />
                      </Grid>
                  <Grid item xs={6} md={2}>
                        <TextField
                          fullWidth
                          label="Unit Price"
                          type="number"
                          value={detail.unit_price}
                      InputProps={{ readOnly: true }}
                          required
                          disabled={!detail.medicine_id}
                      size="small"
                        />
                      </Grid>
                  <Grid item xs={6} md={2}>
                        <TextField
                          fullWidth
                          label="Total"
                          value={(detail.quantity * detail.unit_price).toLocaleString()}
                          InputProps={{ readOnly: true }}
                      size="small"
                        />
                      </Grid>
                  <Grid item xs={6} md={2} sx={{ textAlign: 'center' }}>
                        <IconButton 
                          color="error" 
                          onClick={() => removeDetail(index)}
                          disabled={formData.details.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
              ))}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', minWidth: 220, textAlign: 'right' }}>
                <Typography variant="h6">
                    Total Amount: ${calculateTotal().toLocaleString()}
                  </Typography>
                </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={formLoading}
          >
            {formLoading ? 'Saving...' : (selectedOrder ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Import Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Supplier</Typography>
                  <Typography variant="body1">{selectedOrder.supplier_contract_id?.supplier_id?.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Contract Code</Typography>
                  <Typography variant="body1">{selectedOrder.supplier_contract_id?.contract_code || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Warehouse Manager</Typography>
                  <Typography variant="body1">{selectedOrder.warehouse_manager_id?.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                  <Typography variant="body1">{selectedOrder.created_by?._id || selectedOrder.created_by || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedOrder.status}
                    color={getStatusColor(selectedOrder.status)}
                    size="small"
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>Order Details</Typography>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                      <TableCell sx={{ minWidth: 150 }}>Medicine</TableCell>
                      <TableCell align="right" sx={{ minWidth: 80 }}>Quantity</TableCell>
                      <TableCell align="right" sx={{ minWidth: 100 }}>Unit Price</TableCell>
                      <TableCell align="right" sx={{ minWidth: 100 }}>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.details?.map((detail, index) => (
                      <TableRow key={index} hover>
                            <TableCell>{detail.medicine_id?.medicine_name || 'N/A'}</TableCell>
                        <TableCell align="right">{detail.quantity}</TableCell>
                        <TableCell align="right">${detail.unit_price?.toLocaleString()}</TableCell>
                        <TableCell align="right">${(detail.quantity * detail.unit_price)?.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', minWidth: 220, textAlign: 'right' }}>
                  <Typography variant="h6">
                    Total Amount: ${selectedOrder.details?.reduce((total, detail) => 
                      total + (detail.quantity * detail.unit_price), 0
                    ).toLocaleString() || 0}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ImportOrderPage; 