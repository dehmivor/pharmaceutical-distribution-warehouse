'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  Alert
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';


const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const axiosInstance = axios.create({
  withCredentials: true
});


  const todayStr = new Date().toISOString().slice(0, 10);



const InventoryCheckAddDialog = ({ open, onClose, onSuccess, warehouseManagers = [] }) => {
  const trans = useTrans();
  const [formData, setFormData] = useState({
    warehouse_manager_id: '',
    inventory_check_date: null,
    notes: ''
  });


  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        warehouse_manager_id: '',
        inventory_check_date: null,
        notes: ''
      });
      setErrors({});
      setSubmitError('');
    }
  }, [open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.warehouse_manager_id) {
      newErrors.warehouse_manager_id = trans.common.warehouseManagerRequired || 'Warehouse manager là bắt buộc';
    }

    if (!formData.inventory_check_date) {
      newErrors.inventory_check_date = trans.common.inventoryCheckDateRequired;
    }

    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = 'Ghi chú không được vượt quá 1000 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setSubmitError('');

    try {
      const payload = {
        warehouse_manager_id: formData.warehouse_manager_id,
        inventory_check_date: new Date(formData.inventory_check_date).toISOString(),
        notes: formData.notes
      };

      const response = await axiosInstance.post('/api/inventory-check-orders', payload, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        onSuccess(response.data.data);
        onClose();
      } else {
        setSubmitError(response.data.message || 'Tạo phiếu kiểm kê thất bại');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi tạo phiếu kiểm kê';
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{trans.common.addNewInventoryCheck || 'Tạo Phiếu Kiểm Kê'}</DialogTitle>

      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {/* Warehouse Manager */}
        <FormControl fullWidth margin="normal" error={!!errors.warehouse_manager_id}>
          <Select
            value={formData.warehouse_manager_id}
            onChange={(e) => handleChange('warehouse_manager_id', e.target.value)}
            disabled={loading}
            displayEmpty
          >
            <MenuItem value="">{trans.common.selectWarehouseManager || 'Chọn quản lý kho'}</MenuItem>
            {warehouseManagers.map((manager) => (
              <MenuItem key={manager._id} value={manager._id}>
                {manager.email}
              </MenuItem>
            ))}
          </Select>
          {errors.warehouse_manager_id && <FormHelperText>{errors.warehouse_manager_id}</FormHelperText>}
        </FormControl>

        {/* Inventory Check Date */}
        <TextField
          margin="normal"
          fullWidth
          label={trans.common.inventoryCheckDate || "Inventory Check Date"}
          type="date"
          value={formData.inventory_check_date ? formData.inventory_check_date.split("T")[0] : ""}
          onChange={(e) => handleChange("inventory_check_date", e.target.value)}
          disabled={loading}
          error={!!errors.inventory_check_date}
          helperText={errors.inventory_check_date}
          InputLabelProps={{ shrink: true }}
          inputProps={{
            min: todayStr // <-- disallow selecting dates before today
          }}
        />

        {/* Notes */}
        <TextField
          margin="normal"
          fullWidth
          multiline
          rows={4}
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          error={!!errors.notes}
          helperText={errors.notes || `${formData.notes.length}/1000`}
          disabled={loading}
          placeholder={trans.common.notesPlaceholder || 'Nhập ghi chú...'}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {trans.common.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
          color="primary"
        >
          {loading ? trans.common.creating || 'Đang tạo...' : trans.common.createInventoryCheck || 'Tạo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryCheckAddDialog;
