'use client'
import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

function CreateBill() {
  const [billData, setBillData] = useState({
    customerName: '',
    amount: '',
    description: '',
  });

  const handleChange = (e) => {
    setBillData({
      ...billData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Xử lý dữ liệu tạo hóa đơn ở đây
    console.log('Bill created:', billData);
  };

  return (
    <Box
      component="form"
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
      onSubmit={handleSubmit}
    >
      <Typography variant="h5" align="center">Tạo Hóa Đơn</Typography>

      <TextField
        label="Tên khách hàng"
        name="customerName"
        value={billData.customerName}
        onChange={handleChange}
        required
      />

      <TextField
        label="Số tiền"
        name="amount"
        type="number"
        value={billData.amount}
        onChange={handleChange}
        required
      />

      <TextField
        label="Mô tả"
        name="description"
        multiline
        rows={3}
        value={billData.description}
        onChange={handleChange}
      />

      <Button variant="contained" type="submit">
        Tạo hóa đơn
      </Button>
    </Box>
  );
}

export default CreateBill;
