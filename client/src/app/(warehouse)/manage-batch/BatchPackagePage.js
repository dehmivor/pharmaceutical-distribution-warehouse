'use client';
import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';

// Dữ liệu mẫu các lô và thùng
const mockBatches = [
  {
    id: 1,
    batchCode: 'LO-20240621-001',
    drugName: 'Paracetamol 500mg',
    packageCount: 10,
    createdBy: 'Nguyễn Văn A',
    createdAt: '2024-06-21',
  },
  {
    id: 2,
    batchCode: 'LO-20240621-002',
    drugName: 'Amoxicillin 250mg',
    packageCount: 8,
    createdBy: 'Nguyễn Văn B',
    createdAt: '2024-06-21',
  },
];

export default function BatchPackagePage() {
  const [batches, setBatches] = useState(mockBatches);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    batchCode: '',
    drugName: '',
    packageCount: '',
    createdBy: '',
    createdAt: new Date().toISOString().slice(0, 10),
  });

  const handleOpen = () => {
    setForm({
      batchCode: '',
      drugName: '',
      packageCount: '',
      createdBy: '',
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setBatches([
      ...batches,
      { ...form, id: batches.length + 1, packageCount: Number(form.packageCount) },
    ]);
    setOpen(false);
  };

  return (
    <Box maxWidth={900} mx="auto" mt={4}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Tạo lô và thùng đóng gói
        </Typography>
        <Button variant="contained" color="primary" onClick={handleOpen} sx={{ mb: 2 }}>
          Tạo lô mới
        </Button>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>Mã lô</TableCell>
              <TableCell>Tên thuốc</TableCell>
              <TableCell>Số thùng</TableCell>
              <TableCell>Người tạo</TableCell>
              <TableCell>Ngày tạo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {batches.map((b, idx) => (
              <TableRow key={b.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{b.batchCode}</TableCell>
                <TableCell>{b.drugName}</TableCell>
                <TableCell>{b.packageCount}</TableCell>
                <TableCell>{b.createdBy}</TableCell>
                <TableCell>{b.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Tạo lô mới</DialogTitle>
        <DialogContent>
          <form id="batch-form" onSubmit={handleSubmit}>
            <TextField
              label="Mã lô"
              name="batchCode"
              value={form.batchCode}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Tên thuốc"
              name="drugName"
              value={form.drugName}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Số thùng"
              name="packageCount"
              type="number"
              value={form.packageCount}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Người tạo"
              name="createdBy"
              value={form.createdBy}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Ngày tạo"
              name="createdAt"
              type="date"
              value={form.createdAt}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button type="submit" form="batch-form" variant="contained">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}