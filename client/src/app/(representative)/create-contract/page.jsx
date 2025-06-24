'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';

export default function NewContract() {
  const [form, setForm] = useState({
    contract_code: '',
    type: 'supply',
    partner_type: 'supplier',
    supplier_id: null,
    retailer_id: null,
    start_date: '',
    end_date: '',
    status: 'draft',
  });

  const [supplierQuery, setSupplierQuery] = useState('');
  const [supplierResults, setSupplierResults] = useState([]);
  const [retailerQuery, setRetailerQuery] = useState('');
  const [retailerResults, setRetailerResults] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('supplier');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  // search helper
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!supplierQuery) return setSupplierResults([]);
      try {
        const { data } = await axios.get(`/api/users/search`, { params: { role: 'supplier', q: supplierQuery } });
        setSupplierResults(data);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      }
    };
    const delay = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(delay);
  }, [supplierQuery]);

  useEffect(() => {
    const fetchRetailers = async () => {
      if (!retailerQuery) return setRetailerResults([]);
      try {
        const { data } = await axios.get(`/api/users/search`, { params: { role: 'retailer', q: retailerQuery } });
        setRetailerResults(data);
      } catch (err) {
        console.error('Error fetching retailers:', err);
      }
    };
    const delay = setTimeout(fetchRetailers, 300);
    return () => clearTimeout(delay);
  }, [retailerQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSelect = (role, user) => {
    setForm((f) => ({ ...f, [`${role}_id`]: user._id }));
    if (role === 'supplier') setSupplierQuery(user.name);
    else setRetailerQuery(user.name);
  };

  const openModal = (role) => {
    setModalType(role);
    setNewName('');
    setShowModal(true);
  };

  const handleModalSave = async () => {
    try {
      const { data } = await axios.post(`/api/${modalType}s`, { name: newName });
      handleSelect(modalType, data);
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/contracts', form);
      alert('Contract created!');
      // redirect or clear
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error creating contract');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        New Contract
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Contract Code"
              name="contract_code"
              value={form.contract_code}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select name="type" value={form.type} onChange={handleChange} label="Type">
                <MenuItem value="supply">Supply</MenuItem>
                <MenuItem value="distribution">Distribution</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Partner Type</InputLabel>
              <Select name="partner_type" value={form.partner_type} onChange={handleChange} label="Partner Type">
                <MenuItem value="supplier">Supplier</MenuItem>
                <MenuItem value="retailer">Retailer</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Supplier */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Supplier
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search supplier..."
                value={supplierQuery}
                onChange={(e) => setSupplierQuery(e.target.value)}
              />
              <Button variant="outlined" onClick={() => openModal('supplier')}>
                Add New
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {supplierResults.map((u) => (
                <Chip
                  key={u._id}
                  label={u.name}
                  color={form.supplier_id === u._id ? 'primary' : 'default'}
                  onClick={() => handleSelect('supplier', u)}
                  clickable
                />
              ))}
            </Box>
          </Grid>

          {/* Retailer */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Retailer
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search retailer..."
                value={retailerQuery}
                onChange={(e) => setRetailerQuery(e.target.value)}
              />
              <Button variant="outlined" onClick={() => openModal('retailer')}>
                Add New
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {retailerResults.map((u) => (
                <Chip
                  key={u._id}
                  label={u.name}
                  color={form.retailer_id === u._id ? 'primary' : 'default'}
                  onClick={() => handleSelect('retailer', u)}
                  clickable
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" variant="contained" size="large">
              Create Contract
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Modal for adding new supplier/retailer */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add New {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleModalSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
