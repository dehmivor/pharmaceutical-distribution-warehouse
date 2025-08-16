import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Divider,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Security as SecurityIcon,
  Close as CloseIcon,
  Warehouse as WarehouseIcon,
  Person as PersonIcon,
  SupervisorAccount as SupervisorIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import useTrans from '@/hooks/useTrans';

export default function PermissionDialog({ open, onClose, user, onUpdate }) {
  const trans = useTrans();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
    is_manager: false,
    status: ''
  });
  const [errors, setErrors] = useState({});

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role || '',
        is_manager: user.is_manager || false,
        status: user.status || ''
      });
      setErrors({});
    }
  }, [user]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onUpdate(user._id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'supervisor':
        return <SupervisorIcon fontSize="small" />;
      case 'representative':
        return <PersonIcon fontSize="small" />;
      case 'representative_manager':
        return <PersonIcon fontSize="small" />;
      case 'warehouse':
        return <WarehouseIcon fontSize="small" />;
      case 'warehouse_manager':
        return <WarehouseIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'supervisor':
        return 'Supervisor';
      case 'representative':
        return 'Representative';
      case 'representative_manager':
        return 'Representative Manager';
      case 'warehouse':
        return 'Warehouse Staff';
      case 'warehouse_manager':
        return 'Warehouse Manager';
      default:
        return role || 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }} disableEscapeKeyDown={loading}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Update User Permissions
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {/* User Info Display */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            User Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={500}>
                Email: <span style={{ fontWeight: 'normal' }}>{user.email}</span>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={500}>
                Current Role:
                <Chip label={getRoleDisplayName(user.role)} size="small" sx={{ ml: 1 }} icon={getRoleIcon(user.role)} />
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={500}>
                Current Status:
                <Chip label={user.status} size="small" color={getStatusColor(user.status)} sx={{ ml: 1 }} />
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight={500}>
                Manager:
                <Chip label={user.is_manager ? 'Yes' : 'No'} size="small" color={user.is_manager ? 'primary' : 'default'} sx={{ ml: 1 }} />
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Form Fields */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" error={!!errors.role}>
              <InputLabel>New Role</InputLabel>
              <Select value={formData.role} onChange={(e) => handleFormChange('role', e.target.value)} label="New Role" disabled={loading}>
                <MenuItem value="supervisor">
                  <Box display="flex" alignItems="center" gap={1}>
                    <SupervisorIcon fontSize="small" />
                    Supervisor
                  </Box>
                </MenuItem>
                <MenuItem value="representative">
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" />
                    Representative
                  </Box>
                </MenuItem>
                <MenuItem value="representative_manager">
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon fontSize="small" />
                    Representative Manager
                  </Box>
                </MenuItem>
                <MenuItem value="warehouse">
                  <Box display="flex" alignItems="center" gap={1}>
                    <WarehouseIcon fontSize="small" />
                    Warehouse Staff
                  </Box>
                </MenuItem>
                <MenuItem value="warehouse_manager">
                  <Box display="flex" alignItems="center" gap={1}>
                    <WarehouseIcon fontSize="small" />
                    Warehouse Manager
                  </Box>
                </MenuItem>
              </Select>
              {errors.role && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {errors.role}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" error={!!errors.status}>
              <InputLabel>New Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
                label="New Status"
                disabled={loading}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
              {errors.status && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {errors.status}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_manager}
                  onChange={(e) => handleFormChange('is_manager', e.target.checked)}
                  disabled={loading}
                />
              }
              label="Is Manager"
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Grant manager privileges to this user
            </Typography>
          </Grid>
        </Grid>

        {/* Warning Alert */}
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> Changing user roles and permissions may affect their access to system features. Please ensure the new
            permissions are appropriate for the user's responsibilities.
          </Typography>
        </Alert>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" startIcon={<CancelIcon />} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
          disabled={loading}
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
          }}
        >
          {loading ? 'Updating...' : 'Update Permissions'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
