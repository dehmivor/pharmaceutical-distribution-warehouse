'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';

// Dữ liệu mẫu hợp đồng nhà cung cấp
const mockContracts = [
  {
    id: 1,
    supplierName: 'Công ty Dược ABC',
    contractNumber: 'CT001',
    startDate: '2024-01-01',
    endDate: '2025-01-01',
    value: 500000000,
    status: 'Đang hiệu lực',
  },
  {
    id: 2,
    supplierName: 'Công ty Dược XYZ',
    contractNumber: 'CT002',
    startDate: '2023-06-01',
    endDate: '2024-06-01',
    value: 300000000,
    status: 'Hết hiệu lực',
  },
];

export default function ContractPage() {
  const [contracts, setContracts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    supplierName: '',
    contractNumber: '',
    startDate: '',
    endDate: '',
    value: '',
    status: 'Đang hiệu lực',
  });

  useEffect(() => {
    setContracts(mockContracts);
  }, []);

  const handleOpen = () => {
    setForm({
      supplierName: '',
      contractNumber: '',
      startDate: '',
      endDate: '',
      value: '',
      status: 'Đang hiệu lực',
    });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setContracts([
      ...contracts,
      { ...form, id: contracts.length + 1, value: Number(form.value) },
    ]);
    setOpen(false);
  };

  return (
    <Box maxWidth={1000} mx="auto" mt={4}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Quản lý hợp đồng nhà cung cấp
        </Typography>
        <Button variant="contained" color="primary" onClick={handleOpen} sx={{ mb: 2 }}>
          Thêm hợp đồng mới
        </Button>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>Tên nhà cung cấp</TableCell>
              <TableCell>Số hợp đồng</TableCell>
              <TableCell>Ngày bắt đầu</TableCell>
              <TableCell>Ngày kết thúc</TableCell>
              <TableCell>Giá trị (VNĐ)</TableCell>
              <TableCell>Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts.map((c, idx) => (
              <TableRow key={c.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{c.supplierName}</TableCell>
                <TableCell>{c.contractNumber}</TableCell>
                <TableCell>{c.startDate}</TableCell>
                <TableCell>{c.endDate}</TableCell>
                <TableCell>{c.value.toLocaleString()}</TableCell>
                <TableCell>{c.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Thêm hợp đồng nhà cung cấp</DialogTitle>
        <DialogContent>
          <form id="contract-form" onSubmit={handleSubmit}>
            <TextField
              label="Tên nhà cung cấp"
              name="supplierName"
              value={form.supplierName}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Số hợp đồng"
              name="contractNumber"
              value={form.contractNumber}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Ngày bắt đầu"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Ngày kết thúc"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Giá trị (VNĐ)"
              name="value"
              type="number"
              value={form.value}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Trạng thái"
              name="status"
              value={form.status}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button type="submit" form="contract-form" variant="contained">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}