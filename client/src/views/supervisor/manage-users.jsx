'use client';
import { useState, useCallback } from 'react';
import AddUserDialog from '@/sections/supervisor/activate-account/AddUserDialog';
import PermissionDialog from '@/sections/supervisor/activate-account/PermissionDialog';
import EditUserDialog from '@/sections/supervisor/activate-account/EditUserDialog';
import DeactivateUserDialog from '@/sections/supervisor/activate-account/DeactivateUserDialog';
import HeaderSection from '@/sections/supervisor/activate-account/HeaderSection';
import { Box, Snackbar, Alert } from '@mui/material';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';
import UserManagement from '@/sections/supervisor/activate-account/UserManagementTab';

function ManageUsers() {
  const trans = useTrans();

  // Add User Dialog states
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

  // Permission Dialog states
  const [openPermissionDialog, setOpenPermissionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Edit User Dialog states
  const [openEditUserDialog, setOpenEditUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Deactivate User Dialog states
  const [openDeactivateUserDialog, setOpenDeactivateUserDialog] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState(null);

  // Snackbar states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // API base URL
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Handle open permission dialog
  const handleOpenPermissionDialog = useCallback((user) => {
    setSelectedUser(user);
    setOpenPermissionDialog(true);
  }, []);

  // Handle open edit user dialog
  const handleOpenEditUserDialog = useCallback((user) => {
    setEditingUser(user);
    setOpenEditUserDialog(true);
  }, []);

  // Handle open deactivate user dialog
  const handleOpenDeactivateUserDialog = useCallback((user) => {
    setDeactivatingUser(user);
    setOpenDeactivateUserDialog(true);
  }, []);

  // Handle open add user dialog
  const handleOpenAddUser = () => setOpenAddUserDialog(true);

  // Handle close add user dialog
  const handleCloseAddUser = () => {
    setOpenAddUserDialog(false);
    setFormData({
      email: '',
      role: 'warehouse',
      is_manager: false,
      generatePassword: true,
      customPassword: '',
      permissions: []
    });
    setFormErrors({});
    setSubmitting(false);
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = trans.messages.emailRequired;
    } else if (!validateEmail(formData.email)) {
      errors.email = trans.messages.invalidEmailFormat;
    }
    if (!formData.role) {
      errors.role = trans.messages.roleRequired;
    }
    if (!formData.generatePassword && !formData.customPassword.trim()) {
      errors.customPassword = trans.messages.passwordRequired;
    } else if (!formData.generatePassword && formData.customPassword.length < 6) {
      errors.customPassword = trans.messages.passwordMinLength;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission for add user
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/accounts/create`,
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

      if (response.status === 201) {
        showSnackbar('User created successfully! Activation email sent to user.', 'success');
        handleCloseAddUser();
        // TODO: refetch user list here
      } else {
        showSnackbar(response.data.message || trans.messages.failedCreateUser, 'error');
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || error.message || trans.messages.failedCreateUserRetry, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update user permissions
  const handleUpdatePermissions = async (userId, updateData) => {
    try {
      const response = await axios.put(`${backendUrl}/api/accounts/${userId}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (response.status === 200) {
        showSnackbar('User permissions updated successfully!', 'success');
        // TODO: refetch user list here
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update permissions');
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || error.message || 'Failed to update permissions', 'error');
      throw error;
    }
  };

  // Handle update user information
  const handleUpdateUser = async (userId, updateData) => {
    try {
      const response = await axios.put(`${backendUrl}/api/accounts/${userId}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (response.status === 200) {
        showSnackbar('User information updated successfully!', 'success');
        // TODO: refetch user list here
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update user');
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || error.message || 'Failed to update user', 'error');
      throw error;
    }
  };

  // Handle deactivate user
  const handleDeactivateUser = async (userId, deactivationData) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/accounts/${userId}`,
        {
          status: deactivationData.status,
          deactivation_reason: deactivationData.reason,
          deactivation_type: deactivationData.deactivationType
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth-token')}`
          }
        }
      );

      if (response.status === 200) {
        showSnackbar('User account deactivated successfully!', 'success');
        // TODO: refetch user list here
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to deactivate user');
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || error.message || 'Failed to deactivate user', 'error');
      throw error;
    }
  };

  return (
    <Box>
      <HeaderSection />

      <UserManagement
        onOpenPermissionDialog={handleOpenPermissionDialog}
        onOpenEditUserDialog={handleOpenEditUserDialog}
        onOpenDeactivateUserDialog={handleOpenDeactivateUserDialog}
        onOpenAddUser={handleOpenAddUser}
      />

      {/* Add User Dialog */}
      <AddUserDialog
        open={openAddUserDialog}
        onClose={handleCloseAddUser}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        submitting={submitting}
        onSubmit={handleFormSubmit}
      />

      {/* Permission Dialog */}
      <PermissionDialog
        open={openPermissionDialog}
        onClose={() => setOpenPermissionDialog(false)}
        user={selectedUser}
        onUpdate={handleUpdatePermissions}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={openEditUserDialog}
        onClose={() => setOpenEditUserDialog(false)}
        user={editingUser}
        onUpdate={handleUpdateUser}
      />

      {/* Deactivate User Dialog */}
      <DeactivateUserDialog
        open={openDeactivateUserDialog}
        onClose={() => setOpenDeactivateUserDialog(false)}
        user={deactivatingUser}
        onDeactivate={handleDeactivateUser}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ManageUsers;
