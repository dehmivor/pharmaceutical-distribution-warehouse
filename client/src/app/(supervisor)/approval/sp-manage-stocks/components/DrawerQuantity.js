'use client';
import React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function DrawerQuantity() {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setOpen(open);
  };

  return (
    <div>
      <Button onClick={toggleDrawer(true)}>Open Drawer</Button>
      <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
          <Typography variant="h6" sx={{ p: 2 }}>
            Quantity Details
          </Typography>
          {/* Add your quantity details here */}
        </Box>
      </Drawer>
    </div>
  );
}
