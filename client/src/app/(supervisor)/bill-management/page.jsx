'use client';

import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useRouter } from 'next/navigation';

// @assets
import { IconReceipt, IconDashboard } from '@tabler/icons-react';

export default function BillManagementPage() {
  const router = useRouter();

  const billSections = [
    {
      title: 'Manage Bills',
      description: 'Manage and process bills',
      icon: IconReceipt,
      url: '/sp-manage-bills'
    },
    {
      title: 'View Dashboard Bills',
      description: 'View bill dashboard and analytics',
      icon: IconDashboard,
      url: '/sp-view-dashboard-bills'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bill Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Select a bill management option.
      </Typography>

      <Grid container spacing={3}>
        {billSections.map((section, index) => {
          const IconComponent = section.icon;
          return (
            <Grid item xs={12} sm={6} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea sx={{ height: '100%', p: 2 }} onClick={() => router.push(section.url)}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <IconComponent size={48} color="#1976d2" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" gutterBottom>
                      {section.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {section.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
