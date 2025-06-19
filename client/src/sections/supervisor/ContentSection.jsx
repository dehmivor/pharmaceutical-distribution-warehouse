'use client';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Box,
  Typography
} from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { useState } from 'react';
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import UserManagement from './UserManagementTab';
import PermissionManagement from './PermissionManagementTab';

function ContentSection({ activeTab }) {
  // State cho permission management
  const [permissionDialog, setPermissionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [isManager, setIsManager] = useState(false);

  // Permission functions
  const handleOpenPermissionDialog = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsManager(user.is_manager);
    setPermissionDialog(true);
  };

  const handleClosePermissionDialog = () => {
    setPermissionDialog(false);
    setSelectedUser(null);
    setNewRole('');
    setIsManager(false);
  };

  const handleUpdatePermission = async () => {
    try {
      // TODO: Implement API call to update user permissions
      console.log('Updating permissions for user:', selectedUser._id, {
        role: newRole,
        is_manager: isManager
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh data would be handled by the child components
      handleClosePermissionDialog();
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  // Get tab title and content
  const getTabContent = () => {
    switch (activeTab) {
      case 0:
        return {
          component: <UserManagement onOpenPermissionDialog={handleOpenPermissionDialog} />
        };
      case 1:
        return {
          title: 'Permission Management',
          component: <PermissionManagement onOpenPermissionDialog={handleOpenPermissionDialog} />
        };
      default:
        return {
          title: '',
          component: <UserManagement onOpenPermissionDialog={handleOpenPermissionDialog} />
        };
    }
  };

  const { title, component } = getTabContent();

  return (
    <>
      <ComponentsWrapper title="System Administration">
        <PresentationCard title={title}>{component}</PresentationCard>
      </ComponentsWrapper>

      {/* Permission Dialog */}
      <Dialog open={permissionDialog} onClose={handleClosePermissionDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1 }} />
          Update User Permissions
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                User: <strong>{selectedUser.email}</strong>
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Role</InputLabel>
                <Select value={newRole} label="Role" onChange={(e) => setNewRole(e.target.value)}>
                  <MenuItem value="supervisor">Supervisor</MenuItem>
                  <MenuItem value="representative">Representative</MenuItem>
                  <MenuItem value="warehouse">Warehouse</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={<Switch checked={isManager} onChange={(e) => setIsManager(e.target.checked)} color="primary" />}
                label="Manager Privileges"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermissionDialog}>Cancel</Button>
          <Button onClick={handleUpdatePermission} variant="contained">
            Update Permissions
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ContentSection;
