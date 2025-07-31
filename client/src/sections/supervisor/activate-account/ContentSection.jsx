'use client';
import { Security as SecurityIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography
} from '@mui/material';
import { useCallback, useState } from 'react';
import PermissionManagement from '../PermissionManagementTab';
import UserManagement from './UserManagementTab';

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
    <Stack spacing={2} title={activeTab === 1 ? 'Permission Management' : ''}>
      {activeTab === 0 ? (
        <UserManagement onOpenPermissionDialog={handleOpenPermissionDialog} onOpenAddUser={onOpenAddUser} />
      ) : (
        <PermissionManagement onOpenPermissionDialog={handleOpenPermissionDialog} />
      )}
    </Stack>
  );
}

export default ContentSection;
