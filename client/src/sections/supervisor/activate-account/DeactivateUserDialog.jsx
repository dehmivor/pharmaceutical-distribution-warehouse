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
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  useTheme
} from '@mui/material';
import {
  Block as BlockIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import useTrans from '@/hooks/useTrans';

const getLevelColor = (role) => {
  switch (role) {
    case 'supervisor':
      return 'error';
    case 'representative':
      return 'warning';
    case 'representative_manager':
      return 'primary';
    case 'warehouse':
      return 'info';
    case 'warehouse_manager':
      return 'primary';
    default:
      return 'default';
  }
};

export default function DeactivateUserDialog({ open, onClose, user, onDeactivate }) {
  const theme = useTheme();
  const trans = useTrans();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: ''
  });
  const [errors, setErrors] = useState({});

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        status: 'inactive'
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

    // Status validation
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
      await onDeactivate(user._id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setLoading(false);
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

  const getStatusDisplayName = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'pending':
        return 'Pending';
      default:
        return status || 'Unknown';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }} disableEscapeKeyDown={loading}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Deactivate User Account
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {/* User Account Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            User Account Information
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={2}>
              <Avatar
                sx={{
                  width: { xs: 24, sm: 32, md: 40 },
                  height: { xs: 24, sm: 32, md: 40 },
                  bgcolor: theme.palette[getLevelColor(user.role)]?.main || 'grey'
                }}
                alt={user.email}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: { xs: '0.6rem', sm: '0.75rem', md: '0.875rem' }
                  }}
                >
                  {(user.email && user.email.charAt(0).toUpperCase()) || '?'}
                </Typography>
              </Avatar>
            </Grid>
            <Grid item xs={12} sm={10}>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={500}>
                    Email: <span style={{ fontWeight: 'normal' }}>{user.email}</span>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={500}>
                    Role:
                    <Chip label={getRoleDisplayName(user.role)} size="small" sx={{ ml: 1 }} />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={500}>
                    Current Status:
                    <Chip
                      label={getStatusDisplayName(user.status)}
                      size="small"
                      color={user.status === 'active' ? 'success' : user.status === 'pending' ? 'warning' : 'error'}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>

        {/* Form Fields */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" error={!!errors.status}>
              <InputLabel>New Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
                label="New Status"
                disabled={loading}
              >
                <MenuItem value="active">
                  <Chip label="Active" size="small" color="success" />
                </MenuItem>
                <MenuItem value="inactive">
                  <Chip label="Inactive" size="small" color="error" />
                </MenuItem>
              </Select>
              {errors.status && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {errors.status}
                </Typography>
              )}
            </FormControl>
          </Grid>
        </Grid>

        {/* Warning Alert */}
        <Alert severity="warning" sx={{ mt: 3 }} icon={<WarningIcon />}>
          <Typography variant="body2">
            <strong>Warning:</strong> Changing user status will affect their access to the system. You can activate, deactivate, or set
            users to pending status.
          </Typography>
        </Alert>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Processing...' : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
