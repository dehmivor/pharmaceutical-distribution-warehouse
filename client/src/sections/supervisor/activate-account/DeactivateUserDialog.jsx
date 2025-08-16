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
  Box,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Block as BlockIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import useTrans from '@/hooks/useTrans';

export default function DeactivateUserDialog({ open, onClose, user, onDeactivate }) {
  const trans = useTrans();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: 'inactive',
    reason: '',
    deactivationType: 'temporary'
  });
  const [errors, setErrors] = useState({});

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        status: 'inactive',
        reason: '',
        deactivationType: 'temporary'
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

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
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
      console.error('Error deactivating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'supervisor':
        return <PersonIcon fontSize="small" />;
      case 'representative':
        return <PersonIcon fontSize="small" />;
      case 'representative_manager':
        return <PersonIcon fontSize="small" />;
      case 'warehouse':
        return <PersonIcon fontSize="small" />;
      case 'warehouse_manager':
        return <PersonIcon fontSize="small" />;
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
          <BlockIcon color="error" />
          <Typography variant="h6" fontWeight={600} color="error">
            Deactivate User Account
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
            User Account Information
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
                    Name: <span style={{ fontWeight: 'normal' }}>{user.name || 'N/A'}</span>
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
                    Current Status:
                    <Chip label={user.status} size="small" color={getStatusColor(user.status)} sx={{ ml: 1 }} />
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>

        {/* Warning Alert */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> Deactivating this user account will immediately revoke their access to the system. They will not be
            able to log in or perform any actions until the account is reactivated.
          </Typography>
        </Alert>

        {/* Form Fields */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Deactivation Type</InputLabel>
              <Select
                value={formData.deactivationType}
                onChange={(e) => handleFormChange('deactivationType', e.target.value)}
                label="Deactivation Type"
                disabled={loading}
              >
                <MenuItem value="temporary">Temporary (Can be reactivated)</MenuItem>
                <MenuItem value="permanent">Permanent (Requires admin approval)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>New Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
                label="New Status"
                disabled={loading}
              >
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Reason for Deactivation"
              value={formData.reason}
              onChange={(e) => handleFormChange('reason', e.target.value)}
              error={!!errors.reason}
              helperText={errors.reason || 'Please provide a detailed reason for deactivating this account (minimum 10 characters)'}
              multiline
              rows={3}
              disabled={loading}
              variant="outlined"
              required
            />
          </Grid>
        </Grid>

        {/* Additional Info */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
          <Typography variant="body2" color="info.dark">
            <strong>What happens when a user is deactivated?</strong>
            <br />
            • User cannot log in to the system
            <br />
            • All active sessions are terminated
            <br />
            • User data is preserved but inaccessible
            <br />• Account can be reactivated by supervisors
          </Typography>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" startIcon={<CancelIcon />} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={16} /> : <BlockIcon />}
          disabled={loading}
          sx={{
            background: 'linear-gradient(45deg, #f44336 30%, #d32f2f 90%)',
            boxShadow: '0 3px 5px 2px rgba(244, 67, 54, .3)'
          }}
        >
          {loading ? 'Deactivating...' : 'Deactivate Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
