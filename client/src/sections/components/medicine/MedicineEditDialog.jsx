'use client';
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';

const RowGrid = ({ children }) => (
  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={2}>
    {children}
  </Box>
);

const MedicineEditDialog = ({ open, onClose, medicine, onSubmit, categoryOptions }) => {
  const [formValues, setFormValues] = useState({
    medicine_name: '',
    license_code: '',
    category: '',
    unit_of_measure: '',
    min_stock_threshold: '',
    max_stock_threshold: '',
    storage_conditions: {
      temperature: '',
      humidity: '',
      light: ''
    }
  });

  useEffect(() => {
    if (medicine) {
      setFormValues({
        ...medicine,
        min_stock_threshold: medicine.min_stock_threshold || '',
        max_stock_threshold: medicine.max_stock_threshold || '',
        storage_conditions: {
          temperature: medicine.storage_conditions?.temperature || '',
          humidity: medicine.storage_conditions?.humidity || '',
          light: medicine.storage_conditions?.light || ''
        }
      });
    }
  }, [medicine]);

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleStorageChange = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      storage_conditions: {
        ...prev.storage_conditions,
        [field]: value
      }
    }));
  };

  const handleSubmit = () => {
    onSubmit({
      ...formValues,
      min_stock_threshold: Number(formValues.min_stock_threshold),
      max_stock_threshold: Number(formValues.max_stock_threshold)
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cập nhật thông tin thuốc</DialogTitle>
      <DialogContent dividers>
        <RowGrid>
          <TextField
            label="Tên thuốc"
            value={formValues.medicine_name}
            onChange={(e) => handleChange('medicine_name', e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Số đăng ký"
            value={formValues.license_code}
            onChange={(e) => handleChange('license_code', e.target.value)}
            fullWidth
            required
          />
        </RowGrid>

        <RowGrid>
          <FormControl fullWidth required>
            <InputLabel>Danh mục</InputLabel>
            <Select value={formValues.category} label="Danh mục" onChange={(e) => handleChange('category', e.target.value)}>
              {categoryOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Đơn vị đo"
            value={formValues.unit_of_measure}
            onChange={(e) => handleChange('unit_of_measure', e.target.value)}
            fullWidth
            required
          />
        </RowGrid>

        <RowGrid>
          <TextField
            label="Ngưỡng tồn kho tối thiểu"
            type="number"
            value={formValues.min_stock_threshold}
            onChange={(e) => handleChange('min_stock_threshold', e.target.value)}
            fullWidth
          />
          <TextField
            label="Ngưỡng tồn kho tối đa"
            type="number"
            value={formValues.max_stock_threshold}
            onChange={(e) => handleChange('max_stock_threshold', e.target.value)}
            fullWidth
          />
        </RowGrid>

        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
          Điều kiện bảo quản
        </Typography>
        <RowGrid>
          <TextField
            label="Nhiệt độ (°C)"
            value={formValues.storage_conditions.temperature}
            onChange={(e) => handleStorageChange('temperature', e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Độ ẩm (%)"
            value={formValues.storage_conditions.humidity}
            onChange={(e) => handleStorageChange('humidity', e.target.value)}
            fullWidth
            required
          />
        </RowGrid>

        <Box mb={2}>
          <FormControl fullWidth required>
            <InputLabel>Ánh sáng</InputLabel>
            <Select
              value={formValues.storage_conditions.light}
              label="Ánh sáng"
              onChange={(e) => handleStorageChange('light', e.target.value)}
            >
              {['none', 'low', 'medium', 'high'].map((light) => (
                <MenuItem key={light} value={light}>
                  {light}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MedicineEditDialog;
