'use client';
import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';

// Dữ liệu mẫu các thùng và vị trí
const mockPackages = [
  {
    id: 1,
    packageCode: 'TH-001',
    batchCode: 'LO-20240621-001',
    drugName: 'Paracetamol 500mg',
    currentLocation: '',
    suggestedLocation: 'A1-01-01',
    arrangedBy: '',
    arrangedAt: '',
  },
  {
    id: 2,
    packageCode: 'TH-002',
    batchCode: 'LO-20240621-002',
    drugName: 'Amoxicillin 250mg',
    currentLocation: '',
    suggestedLocation: 'A1-01-02',
    arrangedBy: '',
    arrangedAt: '',
  },
];

export default function ArrangePackagePage() {
  const [packages, setPackages] = useState(mockPackages);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    currentLocation: '',
    arrangedBy: '',
    arrangedAt: new Date().toISOString().slice(0, 10),
  });

  const handleOpen = (pkg) => {
    setSelected(pkg);
    setForm({
      currentLocation: pkg.suggestedLocation,
      arrangedBy: '',
      arrangedAt: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setPackages(packages.map(pkg =>
      pkg.id === selected.id
        ? {
            ...pkg,
            currentLocation: form.currentLocation,
            arrangedBy: form.arrangedBy,
            arrangedAt: form.arrangedAt,
          }
        : pkg
    ));
    setOpen(false);
  };

  return (
    <Box maxWidth={900} mx="auto" mt={4}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Sắp xếp thùng vào kho
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>Mã thùng</TableCell>
              <TableCell>Mã lô</TableCell>
              <TableCell>Tên thuốc</TableCell>
              <TableCell>Vị trí đề xuất</TableCell>
              <TableCell>Vị trí hiện tại</TableCell>
              <TableCell>Người sắp xếp</TableCell>
              <TableCell>Ngày sắp xếp</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {packages.map((pkg, idx) => (
              <TableRow key={pkg.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{pkg.packageCode}</TableCell>
                <TableCell>{pkg.batchCode}</TableCell>
                <TableCell>{pkg.drugName}</TableCell>
                <TableCell>{pkg.suggestedLocation}</TableCell>
                <TableCell>{pkg.currentLocation}</TableCell>
                <TableCell>{pkg.arrangedBy}</TableCell>
                <TableCell>{pkg.arrangedAt}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleOpen(pkg)}
                  >
                    Cập nhật vị trí
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Cập nhật vị trí thùng</DialogTitle>
        <DialogContent>
          <form id="arrange-form" onSubmit={handleSubmit}>
            <TextField
              label="Vị trí mới"
              name="currentLocation"
              value={form.currentLocation}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Người sắp xếp"
              name="arrangedBy"
              value={form.arrangedBy}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Ngày sắp xếp"
              name="arrangedAt"
              type="date"
              value={form.arrangedAt}
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
          <Button type="submit" form="arrange-form" variant="contained">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}