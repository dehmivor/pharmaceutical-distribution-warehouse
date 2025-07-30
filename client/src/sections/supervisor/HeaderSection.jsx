'use client';
import React, { useState } from 'react';
import { Paper, Container, Stack, Box, Typography, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AddUserButton from './AddUserButton';
import NewRepresentativeForm from './NewRepresentativeForm';
import NewWarehouseForm from './NewWarehouseForm';
import NewSupplierForm from './NewSupplierForm';
import NewDeliveryForm from './NewDeliveryForm';

function HeaderSection() {
  const theme = useTheme();

  const [selectedUserType, setSelectedUserType] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateUser = (userType) => {
    setSelectedUserType(userType);
    setShowCreateForm(true);
  };

  const handleCloseModal = () => {
    setShowCreateForm(false);
    setSelectedUserType(null);
  };

  const getModalTitle = () => {
    switch (selectedUserType) {
      case 'warehouse':
        return 'Create Warehouse User';
      case 'representative':
        return 'Create Representative User';
      case 'delivery':
        return 'Create Delivery User';
      case 'supplier':
        return 'Create Supplier User';
      default:
        return 'Create User';
    }
  };

  return (
    <div>
      <Box>
        <Typography variant="h4" gutterBottom>
          Manage User
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: { xs: '100%', md: '600px' } }}>
          Administer and oversee user accounts and privileges within the platform
        </Typography>
      </Box>
    </div>
  );
}

export default HeaderSection;
