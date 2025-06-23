'use client';
import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip } from '@mui/material';

// Dữ liệu mẫu các thùng
const mockPackages = [
  {
    id: 1,
    packageCode: 'TH-001',
    batchCode: 'LO-20240621-001',
    drugName: 'Paracetamol 500mg',
    location: '',
    status: 'Chưa xếp',
  },
  {
    id: 2,
    packageCode: 'TH-002',
    batchCode: 'LO-20240621-002',
    drugName: 'Amoxicillin 250mg',
    location: '',
    status: 'Chưa xếp',
  },
];

export default function UpdatePackageLocation() {
  const [packages, setPackages] = useState(mockPackages);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    location: '',
  });

  const handleOpen = (pkg) => {
    setSelected(pkg);
    setForm({
      location: pkg.location || '',
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
            location: form.location,
            status: form.location ? 'Đã xếp' : 'Chưa xếp',
          }
        : pkg
    ));
    setOpen(false);
  };

  // Kiểm tra tất cả đã filled
  const allFilled = packages.every(pkg => pkg.status === 'Đã xếp');

  return (
    <Box maxWidth={900} mx="auto" mt={4}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Cập nhật vị trí các thùng trong kho
        </Typography>
        {allFilled && (
          <Chip label="Tất cả thùng đã được xếp vào vị trí" color="success" sx={{ mb: 2 }} />
        )}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>Mã thùng</TableCell>
              <TableCell>Mã lô</TableCell>
              <TableCell>Tên thuốc</TableCell>
              <TableCell>Vị trí</TableCell>
              <TableCell>Trạng thái</TableCell>
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
                <TableCell>{pkg.location}</TableCell>
                <TableCell>
                  <Chip
                    label={pkg.status}
                    color={pkg.status === 'Đã xếp' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleOpen(pkg)}
                    disabled={pkg.status === 'Đã xếp'}
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
          <form id="update-location-form" onSubmit={handleSubmit}>
            <TextField
              label="Vị trí"
              name="location"
              value={form.location}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button type="submit" form="update-location-form" variant="contained">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}