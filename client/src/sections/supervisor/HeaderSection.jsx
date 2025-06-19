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
      <Paper
        elevation={1}
        sx={{
          backgroundColor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backdropFilter: 'blur(8px)'
        }}
      >
        <Container maxWidth={false} sx={{ py: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'flex-start' }}
            spacing={2}
          >
            <Box>
              <Typography
                variant="h4"
                gutterBottom
                fontWeight={700}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.75rem', md: '2.125rem' }
                }}
              >
                Manage User
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: { xs: '100%', md: '600px' } }}>
                Administer and oversee user accounts and privileges within the platform
              </Typography>
            </Box>
            {/* <AddUserButton onCreateUser={handleCreateUser} /> */}
          </Stack>
        </Container>
      </Paper>

      {/* Modal hiển thị form
      <Dialog
        open={showCreateForm}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: '400px'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            fontWeight: 600,
            fontSize: '1.25rem'
          }}
        >
          {getModalTitle()}
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              color: (theme) => theme.palette.grey[500]
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 3 }}>
          {selectedUserType === 'warehouse' && (
            <div>
              <Typography variant="body1">
                <NewWarehouseForm onClose={handleCloseModal} />
              </Typography>
            </div>
          )}
          {selectedUserType === 'representative' && <NewRepresentativeForm onClose={handleCloseModal} />}
          {selectedUserType === 'delivery' && (
            <div>
              <Typography variant="body1">
                <NewDeliveryForm onClose={handleCloseModal} />
              </Typography>
            </div>
          )}
          {selectedUserType === 'supplier' && (
            <div>
              <Typography variant="body1">
                <NewSupplierForm onClose={handleCloseModal} />
              </Typography>
            </div>
          )}
        </DialogContent>
      </Dialog> */}
    </div>
  );
}

export default HeaderSection;
