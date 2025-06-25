'use client';
import useUsers from '@/hooks/useUser';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';

import {
  BarChart as BarChartIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  SupervisorAccount as SupervisorIcon,
  Warehouse as WarehouseIcon,
  Close as CloseIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useMemo, useState, useCallback } from 'react';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import axios from 'axios';

function UserManagement({ onOpenPermissionDialog }) {
  const theme = useTheme();
  const { users, loading, error, refetch } = useUsers();

  // State cho Add User Dialog
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'warehouse',
    is_manager: false,
    generatePassword: true,
    customPassword: '',
    permissions: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // State cho Snackbar notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Filter users theo role
  const { supervisorUsers, representativeUsers, warehouseUsers } = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];

    return {
      supervisorUsers: safeUsers.filter((user) => user?.role === 'supervisor'),
      representativeUsers: safeUsers.filter((user) => user?.role === 'representative'),
      warehouseUsers: safeUsers.filter((user) => user?.role === 'warehouse')
    };
  }, [users]);

  // Validate email format
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Validate form data
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    if (!formData.generatePassword && !formData.customPassword.trim()) {
      errors.customPassword = 'Password is required when not auto-generating';
    } else if (!formData.generatePassword && formData.customPassword.length < 6) {
      errors.customPassword = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateEmail]);

  // Handle form input changes - Prevent any form submission[3]
  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    setFormErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Handle form submission - Prevent page reload[3][6]
  const handleFormSubmit = useCallback(
    (event) => {
      // Critical: Prevent default form submission behavior[3][6]
      event.preventDefault();
      event.stopPropagation();

      if (!validateForm()) {
        return false;
      }

      handleCreateUser();
      return false;
    },
    [validateForm]
  );

  const handleCreateUser = useCallback(async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      // Axios automatically handles JSON serialization
      const response = await axios.post(
        'http://localhost:5000/api/accounts/create',
        {
          email: formData.email.toLowerCase().trim(),
          role: formData.role,
          is_manager: formData.is_manager,
          generatePassword: formData.generatePassword,
          customPassword: formData.generatePassword ? null : formData.customPassword,
          permissions: formData.permissions,
          status: 'inactive'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth-token')}`
          }
        }
      );

      // Axios puts response data in .data property
      if (response.status === 201) {
        // Use appropriate success status
        setSnackbar({
          open: true,
          message: 'User created successfully! Activation email sent to user.',
          severity: 'success'
        });

        resetForm();
        setOpenAddUserDialog(false);
        refetch();
      } else {
        throw new Error(response.data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);

      // Axios error handling
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create user. Please try again.';

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData, submitting, refetch]);

  // Reset form function
  const resetForm = useCallback(() => {
    setFormData({
      email: '',
      role: 'warehouse',
      is_manager: false,
      generatePassword: true,
      customPassword: '',
      permissions: []
    });
    setFormErrors({});
  }, []);

  // Handle dialog close
  const handleCloseDialog = useCallback(() => {
    if (!submitting) {
      resetForm();
      setOpenAddUserDialog(false);
    }
  }, [submitting, resetForm]);

  // Handle button click (not form submission)
  const handleAddUserClick = useCallback(() => {
    setOpenAddUserDialog((state) => !state);
  }, []);

  const getLevelColor = (role) => {
    switch (role) {
      case 'supervisor':
        return 'error';
      case 'representative':
        return 'warning';
      case 'warehouse':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'supervisor':
        return 'Supervisor';
      case 'representative':
        return 'Representative';
      case 'warehouse':
        return 'Warehouse';
      default:
        return role || 'Unknown';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'supervisor':
        return <SupervisorIcon fontSize="small" />;
      case 'representative':
        return <PersonAddIcon fontSize="small" />;
      case 'warehouse':
        return <WarehouseIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  if (loading) {
    return (
      <ComponentsWrapper>
        <PresentationCard title="Loading Users">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress size={40} />
            <Typography sx={{ ml: 2 }} variant="body2" color="text.secondary">
              Đang tải dữ liệu người dùng...
            </Typography>
          </Box>
        </PresentationCard>
      </ComponentsWrapper>
    );
  }

  if (error) {
    return (
      <ComponentsWrapper title="Error">
        <PresentationCard title="Error Loading Users">
          <Alert severity="error" sx={{ mb: 2 }}>
            Lỗi: {error}
          </Alert>
          <Button onClick={refetch} variant="outlined" startIcon={<RefreshIcon />}>
            Thử lại
          </Button>
        </PresentationCard>
      </ComponentsWrapper>
    );
  }

  const UserTable = ({ users, sectionName }) => {
    if (!Array.isArray(users) || users.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
          Không có người dùng nào trong {sectionName}
        </Typography>
      );
    }

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Manager</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id || user.id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>{getRoleIcon(user.role)}</Avatar>
                    <Typography variant="body2" fontWeight={500}>
                      {user.email || 'N/A'}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={getRoleDisplayName(user.role)} color={getLevelColor(user.role)} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status === 'active' ? 'Active' : user.status === 'pending' ? 'Pending' : 'Inactive'}
                    color={user.status === 'active' ? 'success' : user.status === 'pending' ? 'warning' : 'default'}
                    size="small"
                    variant="filled"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_manager ? 'Yes' : 'No'}
                    color={user.is_manager ? 'primary' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <IconButton size="small" color="primary" onClick={() => onOpenPermissionDialog(user)}>
                      <SecurityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="secondary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Add User Dialog với form handling đúng cách[3][6]
  const AddUserDialog = () => (
    <Dialog
      open={openAddUserDialog}
      onClose={handleCloseDialog}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <PersonAddIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Add New User
          </Typography>
        </Box>
        <IconButton onClick={handleCloseDialog} size="small" sx={{ color: 'text.secondary' }} disabled={submitting}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Form với onSubmit handler để prevent reload[3][6] */}
      <form onSubmit={handleFormSubmit} noValidate>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            {/* Email Field */}
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                onKeyDown={(e) => {
                  // Prevent form submission on Enter in text fields[2]
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                error={!!formErrors.email}
                helperText={formErrors.email}
                placeholder="user@example.com"
                disabled={submitting}
                required
              />
            </Grid>

            {/* Role Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" error={!!formErrors.role}>
                <InputLabel>Role</InputLabel>
                <Select value={formData.role} onChange={(e) => handleFormChange('role', e.target.value)} label="Role" disabled={submitting}>
                  <MenuItem value="warehouse">
                    <Box display="flex" alignItems="center" gap={1}>
                      <WarehouseIcon fontSize="small" />
                      Warehouse Staff
                    </Box>
                  </MenuItem>
                  <MenuItem value="representative">
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" />
                      Representative
                    </Box>
                  </MenuItem>
                  <MenuItem value="supervisor">
                    <Box display="flex" alignItems="center" gap={1}>
                      <SupervisorIcon fontSize="small" />
                      Supervisor
                    </Box>
                  </MenuItem>
                </Select>
                {formErrors.role && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {formErrors.role}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Manager Status */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_manager}
                    onChange={(e) => handleFormChange('is_manager', e.target.checked)}
                    disabled={submitting}
                  />
                }
                label="Manager Role"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Grant management privileges to this user
              </Typography>
            </Grid>

            {/* Password Generation */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.generatePassword}
                    onChange={(e) => handleFormChange('generatePassword', e.target.checked)}
                    disabled={submitting}
                  />
                }
                label="Auto-generate Password"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                System will generate a secure password and send it via email
              </Typography>
            </Grid>

            {/* Custom Password Field */}
            {!formData.generatePassword && (
              <Grid item xs={12}>
                <TextField
                  label="Custom Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={formData.customPassword}
                  onChange={(e) => handleFormChange('customPassword', e.target.value)}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter[2]
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  error={!!formErrors.customPassword}
                  helperText={formErrors.customPassword || 'Minimum 6 characters required'}
                  disabled={submitting}
                  required
                />
              </Grid>
            )}

            {/* Info Box */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  📧 Account Activation Process:
                </Typography>
                <Typography variant="body2" component="div">
                  • User will receive an activation email with login credentials
                  <br />
                  • Email includes OTP code for account verification
                  <br />
                  • User must activate account before first login
                  <br />• Activation link expires in 24 hours
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button type="button" onClick={handleCloseDialog} disabled={submitting} sx={{ minWidth: 100 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !formData.email.trim()}
            startIcon={submitting ? <CircularProgress size={16} /> : <SendIcon />}
            sx={{ minWidth: 120 }}
          >
            {submitting ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );

  return (
    <ComponentsWrapper title="User Management">
      {/* Summary Statistics */}
      <PresentationCard title="User Statistics">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.dark', color: 'white' }}>
              <Typography variant="h4" fontWeight={700}>
                {supervisorUsers.length + representativeUsers.length + warehouseUsers.length}
              </Typography>
              <Typography variant="body2">Total Users</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'error.dark', color: 'error.contrastText' }}>
              <Typography variant="h4" fontWeight={700}>
                {supervisorUsers.length}
              </Typography>
              <Typography variant="body2">Supervisors</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.dark', color: 'warning.contrastText' }}>
              <Typography variant="h4" fontWeight={700}>
                {representativeUsers.length}
              </Typography>
              <Typography variant="body2">Representatives</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'info.dark', color: 'info.contrastText' }}>
              <Typography variant="h4" fontWeight={700}>
                {warehouseUsers.length}
              </Typography>
              <Typography variant="body2">Warehouse</Typography>
            </Card>
          </Grid>
        </Grid>
      </PresentationCard>

      {/* Quick Actions */}
      <PresentationCard title="Quick Actions">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Perform common user management tasks quickly and efficiently.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleAddUserClick}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
            }}
          >
            Add New User
          </Button>
          <Button variant="outlined" startIcon={<SecurityIcon />}>
            Manage Permissions
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refetch}>
            Refresh Data
          </Button>
          <Button variant="outlined" startIcon={<BarChartIcon />}>
            View Reports
          </Button>
        </Stack>
      </PresentationCard>

      {/* Supervisors Section */}
      <PresentationCard title="Supervisors">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Manage supervisor accounts and their permissions. Supervisors have elevated access to oversee operations and manage team members.
        </Typography>
        <UserTable users={supervisorUsers} sectionName="Supervisors" />
      </PresentationCard>

      {/* Representatives Section */}
      <PresentationCard title="Representatives">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Customer service representatives handle client interactions and support requests. They serve as the primary point of contact for
          customers.
        </Typography>
        <UserTable users={representativeUsers} sectionName="Representatives" />
      </PresentationCard>

      {/* Warehouse Section */}
      <PresentationCard title="Warehouse Staff">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Warehouse staff manage inventory, fulfillment, and logistics operations. They ensure accurate order processing and inventory
          management.
        </Typography>
        <UserTable users={warehouseUsers} sectionName="Warehouse" />
      </PresentationCard>

      {/* Add User Dialog */}
      <AddUserDialog />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
          icon={snackbar.severity === 'success' ? <CheckCircleIcon /> : undefined}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ComponentsWrapper>
  );
}

export default UserManagement;
