'use client';
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';

// Sample batchId, replace with dynamic value in a real application
const BATCH_ID = '685a5e26c832ad11bcaa5fdd';

export default function UpdatePackageLocation() {
  const [packages, setPackages] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [areasLoading, setAreasLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    areaId: '',
    bay: '',
    row: '',
    column: ''
  });

  // Fetch areas from backend
  const fetchAreas = async () => {
    setAreasLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/areas');
      if (!res.ok) throw new Error('Failed to fetch areas');
      const data = await res.json();
      setAreas(data);
    } catch (error) {
      console.error('Error fetching areas:', error);
      alert('Không thể tải danh sách khu vực. Vui lòng thử lại.');
    } finally {
      setAreasLoading(false);
    }
  };

  // Fetch packages by batchId
  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/packages/by-batch/${BATCH_ID}`);
      if (!res.ok) throw new Error('Failed to fetch packages');
      const data = await res.json();
      const mapped = data.map((item, idx) => ({
        id: item._id,
        packageCode: `TH-${idx + 1}`,
        batchCode: item.batch_id?.batch_code || '',
        drugName: item.batch_id?.medicine_id?.medicine_name || '',
        location: item.location_id
          ? `${item.location_id.area_id.name}-${item.location_id.bay}-${item.location_id.row}-${item.location_id.column}`
          : '',
        status: item.location_id ? 'Đã xếp' : 'Chưa xếp'
      }));
      setPackages(mapped);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchAreas();
  }, []);

  const handleOpen = (pkg) => {
    setSelected(pkg);

    // Parse existing location if available
    if (pkg.location) {
      const parts = pkg.location.split('-');
      if (parts.length === 4) {
        const [areaName, bay, row, column] = parts;
        const area = areas.find((a) => a.name === areaName);
        setForm({
          areaId: area?._id || '',
          bay,
          row,
          column
        });
      } else {
        setForm({
          areaId: '',
          bay: '',
          row: '',
          column: ''
        });
      }
    } else {
      setForm({
        areaId: '',
        bay: '',
        row: '',
        column: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelected(null);
    setForm({
      areaId: '',
      bay: '',
      row: '',
      column: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Update package location
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selected) return;

    // Validate form
    if (!form.areaId || !form.bay || !form.row || !form.column) {
      alert('Vui lòng điền đầy đủ thông tin vị trí.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/packages/${selected.id}/location-detailed`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaId: form.areaId,
          bay: form.bay,
          row: form.row,
          column: form.column
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update location');
      }

      // Reload data after successful update
      await fetchPackages();
      handleClose();
      alert('Cập nhật vị trí thành công!');
    } catch (error) {
      console.error('Error updating location:', error);
      alert(`Cập nhật vị trí thất bại: ${error.message || 'Vui lòng thử lại.'}`);
    }
  };

  // Check if all packages have locations assigned
  const allFilled = packages.length > 0 && packages.every((pkg) => pkg.status === 'Đã xếp');

  return (
    <Box maxWidth={1200} mx="auto" mt={4}>
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
            {allFilled && <Chip label="Tất cả thùng đã được xếp vào vị trí" color="success" sx={{ mb: 2 }} />}
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
                      <Chip label={pkg.status} color={pkg.status === 'Đã xếp' ? 'success' : 'warning'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Button variant="contained" size="small" onClick={() => handleOpen(pkg)}>
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

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Cập nhật vị trí thùng</DialogTitle>
        <DialogContent>
          <form id="update-location-form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Khu vực</InputLabel>
                  <Select name="areaId" value={form.areaId} onChange={handleChange} label="Khu vực" disabled={areasLoading}>
                    {areas.map((area) => (
                      <MenuItem key={area._id} value={area._id}>
                        {area.name} {area.description && `- ${area.description}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={4}>
                <TextField label="Bay" name="bay" value={form.bay} onChange={handleChange} fullWidth required helperText="Ví dụ: 01" />
              </Grid>

              <Grid item xs={4}>
                <TextField label="Hàng" name="row" value={form.row} onChange={handleChange} fullWidth required helperText="Ví dụ: 01" />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  label="Cột"
                  name="column"
                  value={form.column}
                  onChange={handleChange}
                  fullWidth
                  required
                  helperText="Ví dụ: 01"
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button type="submit" form="update-location-form" variant="contained" disabled={areasLoading}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
