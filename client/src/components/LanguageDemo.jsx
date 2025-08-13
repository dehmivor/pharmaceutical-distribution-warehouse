'use client';
import { Box, Card, CardContent, Typography, Grid, Button, Chip } from '@mui/material';
import useTrans from '@/hooks/useTrans';
import LanguageSwitcher from './LanguageSwitcher';

export default function LanguageDemo() {
  const trans = useTrans();

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              {trans.header.title}
            </Typography>
            <LanguageSwitcher />
          </Box>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {trans.header.description}
          </Typography>

          <Grid container spacing={3}>
            {/* Tabs Demo */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {trans.tabs.users}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={trans.tabs.users} color="primary" />
                <Chip label={trans.tabs.permissions} color="secondary" />
                <Chip label={trans.tabs.inventory} color="info" />
                <Chip label={trans.tabs.orders} color="success" />
                <Chip label={trans.tabs.reports} color="warning" />
              </Box>
            </Grid>

            {/* Actions Demo */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {trans.actions.add}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="contained" size="small">
                  {trans.actions.add}
                </Button>
                <Button variant="outlined" size="small">
                  {trans.actions.edit}
                </Button>
                <Button variant="outlined" color="error" size="small">
                  {trans.actions.delete}
                </Button>
              </Box>
            </Grid>

            {/* Status Demo */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {trans.status.active}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={trans.status.active} color="success" />
                <Chip label={trans.status.inactive} color="default" />
                <Chip label={trans.status.pending} color="warning" />
                <Chip label={trans.status.completed} color="success" />
              </Box>
            </Grid>

            {/* Form Demo */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {trans.form.name}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>{trans.form.name}:</strong> John Doe
                </Typography>
                <Typography variant="body2">
                  <strong>{trans.form.email}:</strong> john@example.com
                </Typography>
                <Typography variant="body2">
                  <strong>{trans.form.role}:</strong> {trans.roles.supervisor}
                </Typography>
              </Box>
            </Grid>

            {/* Messages Demo */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {trans.messages.success}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={trans.messages.success} color="success" />
                <Chip label={trans.messages.error} color="error" />
                <Chip label={trans.messages.warning} color="warning" />
                <Chip label={trans.messages.info} color="info" />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
