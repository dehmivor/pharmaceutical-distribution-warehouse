'use client';
import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import WarehouseMonitoring from '../components/WarehouseMonitoring';
import DeviceManagement from '../components/DeviceManagement';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  },
  typography: {
    h4: {
      fontWeight: 600
    }
  }
});

const Dashboard = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
          Pharmaceutical Distribution Dashboard
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <WarehouseMonitoring />
          <DeviceManagement />
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Dashboard;
