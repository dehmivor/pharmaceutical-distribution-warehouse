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
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const InventoryCheckAddDialog = ({
  open,
  onClose,
  onSuccess,
  warehouseManagers = []
}) => {
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate warehouse_manager_id
    if (!formData.warehouse_manager_id) {
      newErrors.warehouse_manager_id = 'Warehouse manager là bắt buộc';
    }

    // Validate inventory_check_date
    if (!formData.inventory_check_date) {
      newErrors.inventory_check_date = trans.common.inventoryCheckDateRequired;
    } else {
      // Check if date is after today
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today
      const checkDate = new Date(formData.inventory_check_date);
      checkDate.setHours(0, 0, 0, 0);
      
      if (checkDate <= today) {
        newErrors.inventory_check_date = trans.common.inventoryCheckDateMustBeAfterToday;
      }
    }

    // Validate notes length
    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = 'Ghi chú không được vượt quá 1000 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      const payload = {
        warehouse_manager_id: formData.warehouse_manager_id,
        inventory_check_date: formData.inventory_check_date.toISOString(),
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
      console.error('Create inventory check order error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi tạo phiếu kiểm kê';
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <AddIcon />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Tạo Phiếu Kiểm Kê Mới
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {trans.common.addNewInventoryCheck}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        {/* Card 1: Thông tin chính */}
        <Card sx={{ mb: 3, border: "1px solid #e0e0e0" }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon color="primary" /> Thông Tin Chính
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                      Warehouse Manager *
                    </Typography>
                  </Box>
                  <FormControl fullWidth error={!!errors.warehouse_manager_id}>
                    <Select
                      value={formData.warehouse_manager_id}
                      onChange={(e) => handleChange('warehouse_manager_id', e.target.value)}
                      disabled={loading}
                      sx={{
                        '& .MuiSelect-select': {
                          padding: '8px 12px',
                        }
                      }}
                    >
                      {warehouseManagers.map((manager) => (
                        <MenuItem key={manager._id} value={manager._id}>
                          {manager.email}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.warehouse_manager_id && (
                      <FormHelperText>{errors.warehouse_manager_id}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}>
                    <EventIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                      {trans.common.inventoryCheckDate} *
                    </Typography>
                  </Box>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                    <DatePicker
                      value={formData.inventory_check_date}
                      onChange={(date) => handleChange('inventory_check_date', date)}
                      format="dd/MM/yyyy"
                      disabled={loading}
                      minDate={new Date(new Date().setDate(new Date().getDate() + 1))} // Tomorrow
                      slotProps={{
                        textField: {
                          error: !!errors.inventory_check_date,
                          fullWidth: true,
                        },
                      }}
                    />
                    {errors.inventory_check_date && (
                      <FormHelperText sx={{ color: "error.main" }}>{errors.inventory_check_date}</FormHelperText>
                    )}
                  </LocalizationProvider>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card 2: Ghi chú */}
        <Card sx={{ mb: 3, border: "1px solid #e0e0e0" }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
              <NoteIcon color="secondary" /> Ghi Chú
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              error={!!errors.notes}
              helperText={errors.notes || `${formData.notes.length}/1000 ký tự`}
              disabled={loading}
              placeholder="Nhập ghi chú về phiếu kiểm kê..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fafafa',
                }
              }}
            />
          </CardContent>
        </Card>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          {trans.common.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            bgcolor: 'success.main',
            '&:hover': {
              bgcolor: 'success.dark'
            }
          }}
        >
          {loading ? 'Đang tạo...' : 'Tạo phiếu kiểm kê'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryCheckAddDialog; 