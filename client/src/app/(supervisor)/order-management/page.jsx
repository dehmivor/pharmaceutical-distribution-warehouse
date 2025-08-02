'use client';

import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useRouter } from 'next/navigation';

// @assets
import { IconFileImport, IconFileExport } from '@tabler/icons-react';

export default function OrderManagementPage() {
  const router = useRouter();

  const orderSections = [
    {
      title: 'Import Orders',
      description: 'Manage and approve import orders',
      icon: IconFileImport,
      url: '/sp-import-orders'
    },
    {
      title: 'Export Orders',
      description: 'Manage and approve export orders',
      icon: IconFileExport,
      url: '/sp-export-orders'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Order Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Select an order type to manage.
      </Typography>

      <Grid container spacing={3}>
        {orderSections.map((section, index) => {
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
