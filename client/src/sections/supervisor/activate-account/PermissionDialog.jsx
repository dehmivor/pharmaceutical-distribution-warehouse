import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Divider,
  Grid,
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
  Security as SecurityIcon,
  Close as CloseIcon,
  Warehouse as WarehouseIcon,
  Person as PersonIcon,
  SupervisorAccount as SupervisorIcon,
  Save as SaveIcon
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

export default function PermissionDialog({ open, onClose, user, onUpdate }) {
  const theme = useTheme();
  const trans = useTrans();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: ''
  });
  const [errors, setErrors] = useState({});

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role || ''
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

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
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
      console.error('Error updating user role:', error);
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
          <SecurityIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Change User Permissions
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
            Current User Information
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
                  <Typography variant="body2" fontWeight={500} component="span">
                    Current Role:
                    <Chip label={getRoleDisplayName(user.role)} size="small" sx={{ ml: 1 }} icon={getRoleIcon(user.role)} />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={500} component="span">
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
        </Grid>

        {/* Warning Alert */}
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> Changing user roles will affect their access permissions throughout the system. Please ensure these
            changes are appropriate and necessary.
          </Typography>
        </Alert>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading} sx={{ minWidth: 100 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
          disabled={loading}
          sx={{
            background: 'linear-gradient(45deg, #FF9800 30%, #FFC107 90%)',
            boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)',
            minWidth: 100
          }}
        >
          {loading ? 'Updating...' : 'Update Permissions'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
