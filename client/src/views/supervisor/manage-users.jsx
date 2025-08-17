'use client';
import useTrans from '@/hooks/useTrans';
import useUsers from '@/hooks/useUser';
import AddUserDialog from '@/sections/supervisor/activate-account/AddUserDialog';
import DeactivateUserDialog from '@/sections/supervisor/activate-account/DeactivateUserDialog';
import EditUserDialog from '@/sections/supervisor/activate-account/EditUserDialog';
import HeaderSection from '@/sections/supervisor/activate-account/HeaderSection';
import PermissionDialog from '@/sections/supervisor/activate-account/PermissionDialog';
import UserManagement from '@/sections/supervisor/activate-account/UserManagementTab';
import { Alert, Box, Snackbar, useTheme } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { useCallback, useState } from 'react';

function ManageUsers() {
  const trans = useTrans();
  const theme = useTheme();

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

  // Status Change Dialog states
  const [openStatusChangeDialog, setOpenStatusChangeDialog] = useState(false);
  const [statusChangingUser, setStatusChangingUser] = useState(null);
  const { users, loading, error, refetchUsers } = useUsers();

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

  // Handle open status change dialog
  const handleOpenStatusChangeDialog = useCallback((user) => {
    setStatusChangingUser(user);
    setOpenStatusChangeDialog(true);
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
        enqueueSnackbar('User created successfully! Activation email sent to user.', { variant: 'success' });
        handleCloseAddUser();
      } else {
        enqueueSnackbar(response.data.message || trans.messages.failedCreateUser, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || error.message || trans.messages.failedCreateUserRetry, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update permissions
  const handleUpdatePermissions = async (userId, updateData) => {
    try {
      const response = await axios.put(`${backendUrl}/api/accounts/${userId}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (response.status === 200) {
        enqueueSnackbar('User role updated successfully!', { variant: 'success' });
        await refetchUsers();
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update user role');
      }
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || error.message || 'Failed to update user role', { variant: 'error' });
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
        enqueueSnackbar('User email updated successfully!', { variant: 'success' });
        // Refetch user list to update UI
        await refetchUsers();
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update user email');
      }
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || error.message || 'Failed to update user email', { variant: 'error' });
      throw error;
    }
  };

  // Handle status change
  const handleStatusChange = async (userId, statusData) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/accounts/${userId}`,
        {
          status: statusData.status
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth-token')}`
          }
        }
      );

      if (response.status === 200) {
        enqueueSnackbar('User status updated successfully!', { variant: 'success' });
        await refetchUsers();
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update user status');
      }
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || error.message || 'Failed to update user status', { variant: 'error' });
      throw error;
    }
  };

  return (
    <Box>
      <HeaderSection />

      <UserManagement
        onOpenPermissionDialog={handleOpenPermissionDialog}
        onOpenEditUserDialog={handleOpenEditUserDialog}
        onOpenDeactivateUserDialog={handleOpenStatusChangeDialog}
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

      {/* Status Change Dialog */}
      <DeactivateUserDialog
        open={openStatusChangeDialog}
        onClose={() => setOpenStatusChangeDialog(false)}
        user={statusChangingUser}
        onDeactivate={handleStatusChange}
      />
    </Box>
  );
}

export default ManageUsers;
