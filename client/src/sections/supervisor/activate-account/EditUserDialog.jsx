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
  Chip,
  Avatar
} from '@mui/material';
import {
  Edit as EditIcon,
  Close as CloseIcon,
  Warehouse as WarehouseIcon,
  Person as PersonIcon,
  SupervisorAccount as SupervisorIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import useTrans from '@/hooks/useTrans';

export default function EditUserDialog({ open, onClose, user, onUpdate }) {
  const trans = useTrans();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '',
    is_manager: false,
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        name: user.name || '',
        role: user.role || '',
        is_manager: user.is_manager || false,
        phone: user.phone || '',
        address: user.address || ''
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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
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
      console.error('Error updating user:', error);
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
                  width: 48,
                  height: 48,
                  bgcolor: user.avatar ? 'transparent' : 'primary.main'
                }}
                src={user.avatar}
              >
                {!user.avatar && (user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase())}
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
                    <Chip label={getRoleDisplayName(user.role)} size="small" sx={{ ml: 1 }} icon={getRoleIcon(user.role)} />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={500}>
                    Status:
                    <Chip
                      label={user.status}
                      size="small"
                      color={user.status === 'active' ? 'success' : user.status === 'pending' ? 'warning' : 'error'}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={500}>
                    Manager:
                    <Chip
                      label={user.is_manager ? 'Yes' : 'No'}
                      size="small"
                      color={user.is_manager ? 'primary' : 'default'}
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
          <Grid item xs={12} sm={6}>
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

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              disabled={loading}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" error={!!errors.role}>
              <InputLabel>Role</InputLabel>
              <Select value={formData.role} onChange={(e) => handleFormChange('role', e.target.value)} label="Role" disabled={loading}>
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
            <TextField
              fullWidth
              label="Phone Number (Optional)"
              value={formData.phone}
              onChange={(e) => handleFormChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone || 'Format: +84 123 456 789'}
              disabled={loading}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address (Optional)"
              value={formData.address}
              onChange={(e) => handleFormChange('address', e.target.value)}
              multiline
              rows={2}
              disabled={loading}
              variant="outlined"
            />
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

        {/* Info Alert */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> You can update user information including email, name, role, and contact details. Changes will take
            effect immediately.
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
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
