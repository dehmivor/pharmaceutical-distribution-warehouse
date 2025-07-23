'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip, TextField, Grid, MenuItem, FormControl, InputLabel, Select, IconButton, Menu
} from '@mui/material';
import { Add as AddIcon, MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

function ExportOrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [formData, setFormData] = useState({ contract_id: '', details: [] });
  const [contracts, setContracts] = useState([]);
  const [contractMedicines, setContractMedicines] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState(null);

  // Định nghĩa lại hàm fetchOrders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/export-orders`, { headers: getAuthHeaders() });
      setOrders(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Định nghĩa lại hàm fetchContracts
  const fetchContracts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/contract?status=active`, { headers: getAuthHeaders() });
      setContracts(response.data.data.contracts || []);
    } catch (error) {
      setError('Failed to load contracts');
    }
  };

  // Lấy danh sách thuốc từ contract khi chọn contract
  const fetchContractMedicines = async (contractId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/contract/${contractId}`, { headers: getAuthHeaders() });
      const contract = response.data.data;
      setContractMedicines(contract.current_items || contract.items || []);
    } catch (error) {
      setContractMedicines([]);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchContracts();
  }, []);

  // Gọi fetchContractMedicines khi chọn contract
  useEffect(() => {
    if (formData.contract_id) {
      fetchContractMedicines(formData.contract_id);
    } else {
      setContractMedicines([]);
    }
  }, [formData.contract_id]);

  // Khi chọn contract, reset details về rỗng
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contract_id') {
      setFormData((prev) => ({ ...prev, contract_id: value, details: [] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Khi chọn thuốc, tự động fill số lượng và giá từ contract
  const handleDetailChange = (index, field, value) => {
    const newDetails = [...formData.details];
    if (field === 'medicine_id') {
      // Không cho chọn trùng thuốc
      if (newDetails.some((d, i) => d.medicine_id === value && i !== index)) return;
      const selectedMedicine = contractMedicines.find((med) => med.medicine_id._id === value);
      if (selectedMedicine) {
        newDetails[index].unit_price = selectedMedicine.unit_price || 0;
        newDetails[index].expected_quantity = selectedMedicine.quantity || 0;
      }
      newDetails[index][field] = value;
    } else if (field === 'quantity') {
      newDetails[index]['expected_quantity'] = Number(value);
    } else {
      newDetails[index][field] = value;
    }
    setFormData((prev) => ({ ...prev, details: newDetails }));
  };

  // Add Medicine: thêm dòng mới với medicine_id rỗng
  const addDetail = () => {
    setFormData((prev) => ({ ...prev, details: [...prev.details, { medicine_id: '', expected_quantity: 0, unit_price: 0 }] }));
  };

  const removeDetail = (index) => {
    setFormData((prev) => ({ ...prev, details: prev.details.filter((_, i) => i !== index) }));
  };

  // Action handlers
  const handleActionMenuOpen = (event, order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrderForAction(order);
  };

  const handleActionMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrderForAction(null);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setOpenDetails(true);
    handleActionMenuClose();
  };

  const handleEditOrder = (order) => {
    setFormData({
      contract_id: order.contract_id._id || order.contract_id,
      details: order.details.map((d) => ({
        medicine_id: typeof d.medicine_id === 'object' ? d.medicine_id._id : d.medicine_id,
        expected_quantity: d.expected_quantity,
        unit_price: d.unit_price
      }))
    });
    setSelectedOrder(order);
    setOpenEditForm(true);
    handleActionMenuClose();
  };

  const handleDeleteOrder = async (order) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      handleActionMenuClose();
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/export-orders/${order._id}`, {
        headers: getAuthHeaders()
      });
      setSuccess('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      handleActionMenuClose();
    }
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setOpenDetails(false);
  };

  const handleCloseEditForm = () => {
    setSelectedOrder(null);
    setOpenEditForm(false);
    setFormData({ contract_id: '', details: [] });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'approved':
        return 'success';
      case 'delivered':
        return 'info';
      case 'checked':
        return 'warning';
      case 'arranged':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate contract
    if (!formData.contract_id) {
      setError('Please select a contract.');
      return;
    }
    // Validate details
    if (!formData.details.length) {
      setError('Please add at least one medicine.');
      return;
    }
    // Validate từng dòng: đã chọn thuốc, không trùng thuốc, số lượng > 0
    const seen = new Set();
    for (let i = 0; i < formData.details.length; i++) {
      const d = formData.details[i];
      if (!d.medicine_id) {
        setError(`Please select a medicine for row ${i + 1}.`);
        return;
      }
      if (seen.has(d.medicine_id)) {
        setError('Duplicate medicine selected. Each medicine can only be selected once.');
        return;
      }
      seen.add(d.medicine_id);
      if (!d.expected_quantity || Number(d.expected_quantity) <= 0) {
        setError(`Quantity must be greater than 0 for row ${i + 1}.`);
        return;
      }
    }
    setFormLoading(true);
    try {
      // Loại bỏ created_by và warehouse_manager_id nếu có trong formData
      const { created_by, warehouse_manager_id, ...payload } = formData;
      payload.details = payload.details.map((d) => ({
        medicine_id: d.medicine_id,
        expected_quantity: Number(d.expected_quantity),
        unit_price: Number(d.unit_price)
      }));

      let url, method;
      if (selectedOrder) {
        url = `${API_BASE_URL}/api/export-orders/${selectedOrder._id}`;
        method = 'patch'; // PATCH cho update
      } else {
        url = `${API_BASE_URL}/api/export-orders`;
        method = 'post';
      }

      await axios({
        method,
        url,
        data: payload,
        headers: getAuthHeaders()
      });

      setSuccess(selectedOrder ? 'Export order updated successfully' : 'Export order created successfully');
      setOpenForm(false);
      setOpenEditForm(false);
      setFormData({ contract_id: '', details: [] });
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Export Orders</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenForm(true)}>
          Create Export Order
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Contract</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Warehouse Manager</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id} hover>
                <TableCell>{order.contract_id?.contract_code || 'N/A'}</TableCell>
                <TableCell><Chip label={order.status} color={getStatusColor(order.status)} size="small" /></TableCell>
                <TableCell>{order.created_by?.email || 'N/A'}</TableCell>
                <TableCell>{order.warehouse_manager_id?.email || 'N/A'}</TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => handleActionMenuOpen(e, order)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Export Order</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Contract</InputLabel>
              <Select
                name="contract_id"
                value={formData.contract_id}
                onChange={handleFormChange}
                label="Contract"
                required
              >
                {contracts.map((contract) => (
                  <MenuItem key={contract._id} value={contract._id}>
                    {contract.contract_code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Order Details</Typography>
            {formData.details.map((detail, index) => (
              <Grid container spacing={2} key={index} alignItems="center">
                <Grid item xs={5}>
                  <FormControl fullWidth>
                    <InputLabel>Medicine</InputLabel>
                    <Select
                      value={detail.medicine_id}
                      onChange={(e) => handleDetailChange(index, 'medicine_id', e.target.value)}
                      label="Medicine"
                      required
                    >
                      {contractMedicines.filter((med) =>
                        !formData.details.some((d, i) => d.medicine_id === med.medicine_id._id && i !== index)
                      ).map((med) => (
                        <MenuItem key={med.medicine_id._id} value={med.medicine_id._id}>
                          {med.medicine_id.medicine_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={detail.expected_quantity}
                    onChange={(e) => handleDetailChange(index, 'quantity', e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    label="Unit Price"
                    type="number"
                    value={detail.unit_price}
                    onChange={(e) => handleDetailChange(index, 'unit_price', e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={1}>
                  <Button color="error" onClick={() => removeDetail(index)} disabled={formData.details.length === 1}>X</Button>
                </Grid>
              </Grid>
            ))}
            <Button onClick={addDetail} sx={{ mt: 2 }}>Add Medicine</Button>
            <DialogActions>
              <Button onClick={() => setOpenForm(false)} disabled={formLoading}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={formLoading}>{formLoading ? 'Saving...' : 'Create'}</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
      </Snackbar>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => handleViewDetails(selectedOrderForAction)}>
          <VisibilityIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleEditOrder(selectedOrderForAction)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDeleteOrder(selectedOrderForAction)}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>Export Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6">Basic Information</Typography>
                  <Paper sx={{ p: 2 }}>
                    <Typography>
                      <strong>Contract:</strong> {selectedOrder.contract_id?.contract_code}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography component="span">
                        <strong>Status:</strong>
                      </Typography>
                      <Chip label={selectedOrder.status} color={getStatusColor(selectedOrder.status)} size="small" sx={{ ml: 1 }} />
                    </Box>
                    <Typography>
                      <strong>Created By:</strong> {selectedOrder.created_by?.email}
                    </Typography>
                    <Typography>
                      <strong>Warehouse Manager:</strong> {selectedOrder.warehouse_manager_id?.email}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6">Order Details</Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Medicine</TableCell>
                          <TableCell align="right">Expected Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.details?.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell>{detail.medicine_id?.medicine_name || 'N/A'}</TableCell>
                            <TableCell align="right">{detail.expected_quantity}</TableCell>
                            <TableCell align="right">{detail.unit_price?.toLocaleString()} VND</TableCell>
                            <TableCell align="right">{((detail.expected_quantity || 0) * (detail.unit_price || 0)).toLocaleString()} VND</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
          <Button onClick={handleCloseDetails} variant="outlined" sx={{ minWidth: 120 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditForm} onClose={handleCloseEditForm} maxWidth="md" fullWidth>
        <DialogTitle>Edit Export Order</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Contract</InputLabel>
              <Select
                name="contract_id"
                value={formData.contract_id}
                onChange={handleFormChange}
                label="Contract"
                required
                disabled
              >
                {contracts.map((contract) => (
                  <MenuItem key={contract._id} value={contract._id}>
                    {contract.contract_code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Order Details</Typography>
            {formData.details.map((detail, index) => (
              <Grid container spacing={2} key={index} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Medicine</InputLabel>
                    <Select
                      value={detail.medicine_id}
                      onChange={(e) => handleDetailChange(index, 'medicine_id', e.target.value)}
                      label="Medicine"
                      required
                    >
                      {contractMedicines.map((med) => (
                        <MenuItem key={med.medicine_id._id} value={med.medicine_id._id}>
                          {med.medicine_id.medicine_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={detail.expected_quantity}
                    onChange={(e) => handleDetailChange(index, 'quantity', e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Unit Price"
                    type="number"
                    value={detail.unit_price}
                    onChange={(e) => handleDetailChange(index, 'unit_price', e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button 
                    color="error" 
                    onClick={() => removeDetail(index)} 
                    disabled={formData.details.length === 1}
                    fullWidth
                  >
                    X
                  </Button>
                </Grid>
              </Grid>
            ))}
            <Button onClick={addDetail} sx={{ mt: 2 }}>Add Medicine</Button>
            <DialogActions>
              <Button onClick={handleCloseEditForm} disabled={formLoading}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={formLoading}>{formLoading ? 'Saving...' : 'Update'}</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default ExportOrderPage; 