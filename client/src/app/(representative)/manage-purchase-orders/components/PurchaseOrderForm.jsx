"use client";
import React, { useState, useEffect } from 'react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';

export default function PurchaseOrderForm({ order, onClose }) {
  const [form, setForm] = useState({
    contract_id: order?.contract_id?._id || '',
  });
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    // Lấy danh sách contract cho dropdown
    const fetchContracts = async () => {
      try {
        const res = await fetch('/api/contracts');
        const data = await res.json();
        console.log('Contracts response:', data); // Debug log
        setContracts(data.data || []);
      } catch (err) {
        console.error('Error fetching contracts:', err); // Debug log
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
    try {
      const method = order ? 'PUT' : 'POST';
      const url = order ? `/api/purchase-orders/${order._id}` : '/api/purchase-orders';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: form.contract_id }),
      });
      onClose(true);
    } catch (err) {
      alert('Có lỗi xảy ra!');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>{order ? 'Sửa Purchase Order' : 'Tạo Purchase Order'}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            select
            label="Chọn Contract"
            name="contract_id"
            value={form.contract_id}
            onChange={handleChange}
            required
            fullWidth
            disabled={!!order}
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
        <Button type="submit" variant="contained" disabled={loading || !form.contract_id}>{order ? 'Lưu' : 'Tạo mới'}</Button>
      </DialogActions>
    </form>
  );
} 