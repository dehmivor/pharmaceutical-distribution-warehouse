'use client';
import AddUserDialog from '@/sections/supervisor/activate-account/AddUserDialog';
import ContentSection from '@/sections/supervisor/activate-account/ContentSection';
import HeaderSection from '@/sections/supervisor/activate-account/HeaderSection';
import TableSection from '@/sections/supervisor/activate-account/TableSection';
import { Box, Container } from '@mui/material';
import axios from 'axios';
import { useState } from 'react';
import useTrans from '@/hooks/useTrans';

function ManageUsers() {
  const trans = useTrans();
  const [activeTab, setActiveTab] = useState(0);

  // State cho dialog và form
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Functions to open/close dialog
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

  // Validation and submit functions
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
        // Show success message if needed
        handleCloseAddUser();
        // Can call refetch user list here if needed
      } else {
        // Show error message if needed
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
      <Container maxWidth={true} sx={{ py: { xs: 2 } }}>
        <TableSection activeTab={activeTab} handleTabChange={handleTabChange} />
        <ContentSection activeTab={activeTab} onOpenAddUser={handleOpenAddUser} />
      </Container>
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
