'use client';

import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useRouter } from 'next/navigation';

// @assets
import { IconBuildingStore, IconTruck } from '@tabler/icons-react';

export default function ContractManagementPage() {
  const router = useRouter();

  const contractSections = [
    {
      title: 'Retailer Contracts',
      description: 'Manage contracts with retailers',
      icon: IconBuildingStore,
      url: '/sp-retailer-contracts'
    },
    {
      title: 'Supplier Contracts',
      description: 'Manage contracts with suppliers',
      icon: IconTruck,
      url: '/sp-supplier-contracts'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Contract Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Select a contract type to manage.
      </Typography>

      <Grid container spacing={3}>
        {contractSections.map((section, index) => {
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
