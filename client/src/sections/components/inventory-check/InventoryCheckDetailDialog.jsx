'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Note as NoteIcon,
  Save as SaveIcon,
  Info as InfoIcon
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

const InventoryCheckDetailDialog = ({ open, onClose, inventoryCheckOrder, onSuccess, warehouseManagers = [], isViewMode = false }) => {
  const trans = useTrans();
  const [formData, setFormData] = useState({
    warehouse_manager_id: '',
    inventory_check_date: null,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Reset form when dialog opens/closes or inventoryCheckOrder changes
  useEffect(() => {
    if (open && inventoryCheckOrder) {
      setFormData({
        warehouse_manager_id: inventoryCheckOrder.warehouse_manager_id?._id || '',
        inventory_check_date: inventoryCheckOrder.inventory_check_date ? new Date(inventoryCheckOrder.inventory_check_date) : null,
        notes: inventoryCheckOrder.notes || ''
      });
      setErrors({});
      setSubmitError('');
      setIsEditing(false);
    }
  }, [open, inventoryCheckOrder]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate warehouse manager
    if (!formData.warehouse_manager_id) {
      newErrors.warehouse_manager_id = 'Vui lòng chọn warehouse manager';
    }

    // Validate inventory check date
    if (!formData.inventory_check_date) {
      newErrors.inventory_check_date = 'Vui lòng chọn ngày kiểm kê';
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

    // Validate notes (optional but if provided, check length)
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
        notes: formData.notes || undefined
      };

      const response = await axiosInstance.put(`/api/inventory-check-orders/${inventoryCheckOrder._id}`, payload, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        onSuccess();
        setIsEditing(false);
      } else {
        setSubmitError(response.data.message || trans.common.errorUpdatingInventoryCheck);
      }
    } catch (error) {
      console.error('Error updating inventory check order:', error);

      if (error.response?.data?.errors) {
        // Handle validation errors from server
        const serverErrors = {};
        error.response.data.errors.forEach((err) => {
          serverErrors[err.path] = err.msg;
        });
        setErrors(serverErrors);
      } else {
        setSubmitError(error.response?.data?.message || trans.common.errorUpdatingInventoryCheck);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          background: isViewMode
            ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
            : 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isViewMode ? <ViewIcon /> : <EditIcon />}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {isViewMode ? trans.common.inventoryCheckDetails : trans.common.editInventoryCheck}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {isViewMode ? trans.common.viewInventoryCheckInfo : trans.common.updateInventoryCheckInfo}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isViewMode && !isEditing && inventoryCheckOrder?.status === 'pending' && (
            <IconButton onClick={() => setIsEditing(true)} sx={{ color: 'white' }}>
              <EditIcon />
            </IconButton>
          )}
          <IconButton onClick={handleClose} disabled={loading} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Error Alert */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError('')}>
            {submitError}
          </Alert>
        )}

        {/* Info Alert - Cannot edit if not pending */}
        {isViewMode && !isEditing && inventoryCheckOrder?.status !== 'pending' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Chỉ có thể chỉnh sửa phiếu kiểm kê khi trạng thái là "pending"
          </Alert>
        )}

        {/* Card 1: Thông tin chính */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" /> Thông Tin Chính
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Warehouse Manager
                    </Typography>
                  </Box>
                  {isViewMode && !isEditing ? (
                    <Box
                      sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        padding: '8px 12px',
                        backgroundColor: '#fafafa',
                        minHeight: 40,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="body1">{inventoryCheckOrder?.warehouse_manager_id?.email || 'N/A'}</Typography>
                    </Box>
                  ) : (
                    <FormControl fullWidth error={!!errors.warehouse_manager_id}>
                      <Select
                        value={formData.warehouse_manager_id}
                        onChange={(e) => handleChange('warehouse_manager_id', e.target.value)}
                        disabled={loading}
                        sx={{
                          '& .MuiSelect-select': {
                            padding: '8px 12px'
                          }
                        }}
                      >
                        {warehouseManagers.map((manager) => (
                          <MenuItem key={manager._id} value={manager._id}>
                            {manager.email}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.warehouse_manager_id && <FormHelperText>{errors.warehouse_manager_id}</FormHelperText>}
                    </FormControl>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <EventIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {trans.common.inventoryCheckDate}
                    </Typography>
                  </Box>
                  {isViewMode && !isEditing ? (
                    <Box
                      sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        padding: '8px 12px',
                        backgroundColor: '#fafafa',
                        minHeight: 40,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="body1">
                        {inventoryCheckOrder?.inventory_check_date ? formatDate(inventoryCheckOrder.inventory_check_date) : 'N/A'}
                      </Typography>
                    </Box>
                  ) : (
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
                            fullWidth: true
                          }
                        }}
                      />
                      {errors.inventory_check_date && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors.inventory_check_date}</FormHelperText>
                      )}
                    </LocalizationProvider>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card 2: Thông tin hệ thống */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon color="info" /> Thông Tin Hệ Thống
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Người Tạo
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      padding: '8px 12px',
                      backgroundColor: '#fafafa',
                      minHeight: 40,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body1">{inventoryCheckOrder?.created_by?.email || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    {/* <Chip 
                      label={inventoryCheckOrder?.status} 
                      size="small" 
                      color={getStatusColor(inventoryCheckOrder?.status)}
                      variant="filled"
                    /> */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Trạng Thái
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      padding: '8px 12px',
                      backgroundColor: '#fafafa',
                      minHeight: 40,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body1">{inventoryCheckOrder?.status || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card 3: Ghi chú */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <NoteIcon color="secondary" /> Ghi Chú
            </Typography>
            {isViewMode && !isEditing ? (
              <Box
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  padding: '12px',
                  backgroundColor: '#fafafa',
                  minHeight: 60
                }}
              >
                <Typography variant="body1">{inventoryCheckOrder?.notes || 'Không có ghi chú'}</Typography>
              </Box>
            ) : (
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
                    backgroundColor: '#fafafa'
                  }
                }}
              />
            )}
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
          {trans.common.close}
        </Button>
        {isEditing && (
          <>
            <Button
              onClick={() => setIsEditing(false)}
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
              startIcon={<SaveIcon />}
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
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InventoryCheckDetailDialog;
