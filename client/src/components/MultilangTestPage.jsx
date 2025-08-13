'use client';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import useTrans from '@/hooks/useTrans';
import LanguageSwitcher from './LanguageSwitcher';
import ConnectionStatus from './ConnectionStatus';
import DashboardStats from './DashboardStats';
import Breadcrumbs from './Breadcrumbs';

export default function MultilangTestPage() {
  const trans = useTrans();

  const mockStats = {
    monthly: { importOrders: 15, exportOrders: 23 },
    weekly: { importOrders: 3, exportOrders: 7 },
    inventory: { totalMedicines: 1250, expiringMedicines: 8 }
  };

  const mockBreadcrumbs = [
    { title: trans.breadcrumbs.home, url: '/' },
    { title: trans.breadcrumbs.dashboard, url: '/dashboard' }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header với Language Switcher */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1">
          🌍 {trans.header.title}
        </Typography>
        <LanguageSwitcher />
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {trans.header.description}
      </Typography>

      <Grid container spacing={4}>
        {/* Connection Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {trans.status.active} Status
            </Typography>
            <ConnectionStatus />
          </Paper>
        </Grid>

        {/* Dashboard Stats */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {trans.header.dashboard} Statistics
            </Typography>
            <DashboardStats detailedStats={mockStats} />
          </Paper>
        </Grid>

        {/* Breadcrumbs */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {trans.breadcrumbs.home} Navigation
            </Typography>
            <Breadcrumbs data={mockBreadcrumbs} />
          </Paper>
        </Grid>

        {/* Language Keys Demo */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Available Language Keys
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  {trans.actions.add} / {trans.actions.edit} / {trans.actions.delete}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Actions: {trans.actions.add}, {trans.actions.edit}, {trans.actions.delete}, {trans.actions.save}, {trans.actions.cancel}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  {trans.status.active} / {trans.status.inactive}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {trans.status.active}, {trans.status.inactive}, {trans.status.pending}, {trans.status.completed}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  {trans.form.name} / {trans.form.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Forms: {trans.form.name}, {trans.form.email}, {trans.form.phone}, {trans.form.role}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Current Language Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'primary.50' }}>
            <Typography variant="h6" gutterBottom>
              Current Language Configuration
            </Typography>
            <Typography variant="body2">
              <strong>Active Language:</strong> {trans.header.title ? 'Tiếng Việt' : 'English'}
            </Typography>
            <Typography variant="body2">
              <strong>Sample Text:</strong> {trans.messages.success} - {trans.messages.error} - {trans.messages.warning}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
