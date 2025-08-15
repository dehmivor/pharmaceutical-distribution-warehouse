'use client';
import { useState, useCallback } from 'react'; // thêm useCallback
import AddUserDialog from '@/sections/supervisor/activate-account/AddUserDialog';
import HeaderSection from '@/sections/supervisor/activate-account/HeaderSection';
import { Box } from '@mui/material';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';
import UserManagement from '@/sections/supervisor/activate-account/UserManagementTab';

function ManageUsers() {
  const trans = useTrans();

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

  const handleOpenPermissionDialog = useCallback((user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsManager(user.is_manager);
    setPermissionDialog(true);
  }, []);

  const handleOpenAddUser = () => setOpenAddUserDialog(true);
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
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';

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
        handleCloseAddUser();
        // TODO: refetch user list here
      } else {
        alert(response.data.message || trans.messages.failedCreateUser);
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message || trans.messages.failedCreateUserRetry);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <HeaderSection />
      <UserManagement onOpenPermissionDialog={handleOpenPermissionDialog} onOpenAddUser={handleOpenAddUser} />
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
    </Box>
  );
}

export default ManageUsers;
