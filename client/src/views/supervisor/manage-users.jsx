'use client';
import ContentSection from '@/sections/supervisor/activate-account/ContentSection';
import HeaderSection from '@/sections/supervisor/activate-account/HeaderSection';
import TableSection from '@/sections/supervisor/activate-account/TableSection';
import { Box, Container } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import AddUserDialog from '@/sections/supervisor/activate-account/AddUserDialog';
import UserManagement from '@/sections/supervisor/activate-account/UserManagementTab';
import axios from 'axios';

function ManageUsers() {
  const theme = useTheme();
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

  // Hàm mở dialog
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

  // Hàm validate và submit (bạn có thể copy logic validate từ UserManagementTab cũ sang đây)
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const validateForm = () => {
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
  };
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
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
      if (response.status === 201) {
        // Hiển thị thông báo thành công nếu muốn
        handleCloseAddUser();
        // Có thể gọi refetch user list ở đây nếu cần
      } else {
        // Hiển thị thông báo lỗi nếu muốn
        alert(response.data.message || 'Failed to create user');
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Failed to create user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <HeaderSection />
      <Container maxWidth={true} sx={{ py: { xs: 2, md: 3 } }}>
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
