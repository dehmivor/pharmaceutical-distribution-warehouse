'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, CircularProgress } from '@mui/material';

// Hàm lấy batchId mẫu, thực tế bạn lấy từ props, router, v.v.
const BATCH_ID = '685a5e26c832ad11bcaa5fdd'; // Thay bằng batchId thực tế

export default function UpdatePackageLocation() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    location: '',
  });

  // Gọi API lấy danh sách thùng theo batchId
  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/import-inspections/by-batch/${BATCH_ID}`)
      .then(res => res.json())
      .then(data => {
        // Chuyển đổi dữ liệu từ API về đúng định dạng FE cần
        const mapped = data.map((item, idx) => ({
          id: item._id,
          packageCode: `TH-${idx + 1}`,
          batchCode: item.batch_id?.batch_code || '',
          drugName: item.batch_id?.medicine_id?.medicine_name || '',
          location: item.location || '',
          status: item.location ? 'Đã xếp' : 'Chưa xếp',
        }));
        setPackages(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
    // TODO: Gọi API cập nhật vị trí nếu cần
  };

  // Kiểm tra tất cả đã filled
  const allFilled = packages.length > 0 && packages.every(pkg => pkg.status === 'Đã xếp');

  return (
    <Box maxWidth={900} mx="auto" mt={4}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Cập nhật vị trí các thùng trong kho
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <>
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
          </>
        )}
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