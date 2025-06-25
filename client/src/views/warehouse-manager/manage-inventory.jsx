'use client';

import { Box, Container } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';

function ManageUsers() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <Container maxWidth={true} sx={{ py: { xs: 2, md: 3 } }}>
      </Container>
    </Box>
  );
}

export default ManageUsers;
