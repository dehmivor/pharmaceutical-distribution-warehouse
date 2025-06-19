"use client";
import React, { useState, useEffect } from 'react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Alert, CircularProgress } from '@mui/material';

export default function PurchaseOrderForm({ order, onClose }) {
  const [form, setForm] = useState({
    contract_id: order?.contract_id?._id || '',
  });
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [error, setError] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth-token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  };

  useEffect(() => {
    // Lấy danh sách contract cho dropdown
    const fetchContracts = async () => {
      try {
        const res = await fetch('/api/contracts', {
          headers: getAuthHeaders()
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        setContracts(data.data || []);
      } catch (err) {
        setError('Không thể tải danh sách contracts: ' + err.message);
        setContracts([]);
      }
    };
    fetchContracts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const method = order ? 'PUT' : 'POST';
      const url = order ? `/api/purchase-orders/${order._id}` : '/api/purchase-orders';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({ contract_id: form.contract_id }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      onClose(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>{order ? 'Sửa Purchase Order' : 'Tạo Purchase Order'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            select
            label="Chọn Contract"
            name="contract_id"
            value={form.contract_id}
            onChange={handleChange}
            required
            fullWidth
            disabled={!!order || loading}
          >
            {contracts.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.contract_code || c._id}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>Hủy</Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading || !form.contract_id}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {order ? 'Lưu' : 'Tạo mới'}
        </Button>
      </DialogActions>
    </form>
  );
} 