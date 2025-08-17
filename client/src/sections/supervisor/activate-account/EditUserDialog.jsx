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
  Edit as EditIcon,
  Close as CloseIcon,
  Warehouse as WarehouseIcon,
  Person as PersonIcon,
  SupervisorAccount as SupervisorIcon,
  Save as SaveIcon,
  Email as EmailIcon
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

export default function EditUserDialog({ open, onClose, user, onUpdate }) {
  const theme = useTheme();
  const trans = useTrans();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: ''
  });
  const [errors, setErrors] = useState({});

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || ''
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

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
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
      console.error('Error updating user email:', error);
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
          <EditIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Edit User Information
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
                  <Typography variant="body2" fontWeight={500} component="span">
                    Email: <span style={{ fontWeight: 'normal' }}>{user.email}</span>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={500} component="span">
                    Role:
                    <Chip label={getRoleDisplayName(user.role)} size="small" sx={{ ml: 1 }} icon={getRoleIcon(user.role)} />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={500} component="span">
                    Status:
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
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              variant="outlined"
            />
          </Grid>
        </Grid>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> You can update user email address. The change will take effect immediately.
          </Typography>
        </Alert>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
          disabled={loading}
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            minWidth: 100
          }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
