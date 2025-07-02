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
import { useState, useCallback } from 'react';
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import UserManagement from './UserManagementTab';
import PermissionManagement from '../PermissionManagementTab';

function ContentSection({ activeTab, onOpenAddUser }) {
  const [permissionDialog, setPermissionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [isManager, setIsManager] = useState(false);

  const handleOpenPermissionDialog = useCallback((user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsManager(user.is_manager);
    setPermissionDialog(true);
  }, []);

  const handleClosePermissionDialog = () => {
    setPermissionDialog(false);
    setSelectedUser(null);
    setNewRole('');
    setIsManager(false);
  };

  const handleUpdatePermission = async () => {
    try {
      console.log('Updating permissions for user:', selectedUser._id, {
        role: newRole,
        is_manager: isManager
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      handleClosePermissionDialog();
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  return (
    <>
      <ComponentsWrapper title="System Administration">
        <PresentationCard title={activeTab === 1 ? 'Permission Management' : ''}>
          {activeTab === 0 ? (
            <UserManagement
              onOpenPermissionDialog={handleOpenPermissionDialog}
              onOpenAddUser={onOpenAddUser}
            />
          ) : (
            <PermissionManagement onOpenPermissionDialog={handleOpenPermissionDialog} />
          )}
        </PresentationCard>
      </ComponentsWrapper>

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
                  <MenuItem value="warehouse">Warehouse</MenuItem>
                  <MenuItem value="warehouse_manager">Warehouse Manager</MenuItem>
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
