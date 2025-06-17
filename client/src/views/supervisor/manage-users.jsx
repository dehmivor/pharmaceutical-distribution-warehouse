'use client';
import Loader from '@/components/Loader';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import ContentSection from '@/sections/supervisor/ContentSection';
import HeaderSection from '@/sections/supervisor/HeaderSection';
import TableSection from '@/sections/supervisor/TableSection';
import { Box, Container } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';

function ManageUsers() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const { isLoading, hasAccess } = useRouteProtection(['supervisor']);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    return <Loader />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default
      }}
    >
      <HeaderSection />

      <Container maxWidth={true} sx={{ py: { xs: 2, md: 3 } }}>
        <TableSection activeTab={activeTab} handleTabChange={handleTabChange} />
        <ContentSection activeTab={activeTab} />
      </Container>
    </Box>
  );
}

export default ManageUsers;
