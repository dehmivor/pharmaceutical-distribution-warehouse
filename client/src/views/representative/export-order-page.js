'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip, TextField, Grid, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
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

  useEffect(() => {
    fetchOrders();
    fetchContracts();
  }, []);

  useEffect(() => {
    if (formData.contract_id) {
      fetchContractMedicines(formData.contract_id);
    } else {
      setContractMedicines([]);
    }
  }, [formData.contract_id]);

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

  const fetchContracts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/contract?status=active`, { headers: getAuthHeaders() });
      setContracts(response.data.data.contracts || []);
    } catch (error) {
      setError('Failed to load contracts');
    }
  };

  const fetchContractMedicines = async (contractId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/contract/${contractId}`, { headers: getAuthHeaders() });
      setContractMedicines(response.data.data?.items || []);
    } catch (error) {
      setContractMedicines([]);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...formData.details];
    // Nếu field là quantity, map sang expected_quantity và đảm bảo là số
    if (field === 'quantity') {
      newDetails[index]['expected_quantity'] = Number(value);
    } else {
      newDetails[index][field] = value;
    }
    // Nếu chọn thuốc thì tự động lấy đơn giá từ contract
    if (field === 'medicine_id') {
      const selectedMedicine = contractMedicines.find((med) => med.medicine_id._id === value);
      if (selectedMedicine) {
        newDetails[index].unit_price = selectedMedicine.unit_price || 0;
      }
    }
    setFormData((prev) => ({ ...prev, details: newDetails }));
  };

  const addDetail = () => {
    setFormData((prev) => ({ ...prev, details: [...prev.details, { medicine_id: '', expected_quantity: 0, unit_price: 0 }] }));
  };

  const removeDetail = (index) => {
    setFormData((prev) => ({ ...prev, details: prev.details.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      // Loại bỏ created_by và warehouse_manager_id nếu có trong formData
      const { created_by, warehouse_manager_id, ...payload } = formData;
      payload.details = payload.details.map((d) => ({
        medicine_id: d.medicine_id,
        expected_quantity: Number(d.expected_quantity),
        unit_price: Number(d.unit_price)
      }));
      await axios.post(
        `${API_BASE_URL}/api/export-orders`,
        payload,
        { headers: getAuthHeaders() }
      );
      setSuccess('Export order created successfully');
      setOpenForm(false);
      setFormData({ contract_id: '', details: [] });
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
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id} hover>
                <TableCell>{order.contract_id?.contract_code || 'N/A'}</TableCell>
                <TableCell><Chip label={order.status} size="small" /></TableCell>
                <TableCell>{order.created_by?.email || 'N/A'}</TableCell>
                <TableCell>{order.warehouse_manager_id?.email || 'N/A'}</TableCell>
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
                      {contractMedicines.map((med) => (
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
    </Box>
  );
}

export default ExportOrderPage; 