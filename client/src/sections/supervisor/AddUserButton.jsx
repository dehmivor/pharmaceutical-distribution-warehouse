import React, { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Add as AddIcon,
  Warehouse as WarehouseIcon,
  Person as RepresentativeIcon,
  LocalShipping as DeliveryIcon,
  Business as SupplierIcon
} from '@mui/icons-material';

function AddUserButton({ onCreateUser }) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (userType) => {
    handleClose();
    onCreateUser(userType);
  };

  const userTypes = [
    {
      type: 'warehouse',
      label: 'Warehouse',
      icon: <WarehouseIcon fontSize="small" />
    },
    {
      type: 'representative',
      label: 'Representative',
      icon: <RepresentativeIcon fontSize="small" />
    },
    {
      type: 'delivery',
      label: 'Delivery Unit',
      icon: <DeliveryIcon fontSize="small" />
    },
    {
      type: 'supplier',
      label: 'Supplier',
      icon: <SupplierIcon fontSize="small" />
    }
  ];

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleClick}
        sx={{
          px: 3,
          py: 1.5,
          borderRadius: 3,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: theme.shadows[4],
          '&:hover': {
            boxShadow: theme.shadows[8],
            transform: 'translateY(-1px)'
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        Add User
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            minWidth: 200,
            boxShadow: theme.shadows[8]
          }
        }}
      >
        {userTypes.map((userType) => (
          <MenuItem
            key={userType.type}
            onClick={() => handleMenuItemClick(userType.type)}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            <ListItemIcon>{userType.icon}</ListItemIcon>
            <ListItemText primary={userType.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default AddUserButton;
