'use client';

import { Box, Typography, Grid, Card, CardContent, CardActionArea, Paper, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';

// @assets
import {
  IconUsers,
  IconDatabaseExport,
  IconPill,
  IconReceipt,
  IconClipboardCheck,
  IconMapPin,
  IconContract,
  IconFileImport,
  IconFileExport,
  IconUser,
  IconDashboard,
  IconMap,
  IconBuildingStore,
  IconTruck
} from '@tabler/icons-react';

export default function SupervisorHomePage() {
  const router = useRouter();

  const supervisorSections = [
    {
      title: 'User & Role Management',
      description: 'Manage users and their roles in the system',
      icon: IconUsers,
      color: '#1976d2',
      url: '/user-management',
      subItems: [{ title: 'Manage Users', icon: IconUser, url: '/sp-manage-users' }]
    },
    {
      title: 'Order Management',
      description: 'Import and export order management',
      icon: IconDatabaseExport,
      color: '#2e7d32',
      url: '/order-management',
      subItems: [
        { title: 'Import Orders', icon: IconFileImport, url: '/sp-import-orders' },
        { title: 'Export Orders', icon: IconFileExport, url: '/sp-export-orders' }
      ]
    },
    {
      title: 'Medicine Management',
      description: 'Manage medicines and inventory',
      icon: IconPill,
      color: '#ed6c02',
      url: '/medicine-management',
      subItems: [{ title: 'Manage Medicines', icon: IconPill, url: '/sp-manage-medicines' }]
    },
    {
      title: 'Bill Management',
      description: 'Manage bills and financial records',
      icon: IconReceipt,
      color: '#9c27b0',
      url: '/bill-management',
      subItems: [
        { title: 'Manage Bills', icon: IconReceipt, url: '/sp-manage-bills' },
        { title: 'View Dashboard Bills', icon: IconDashboard, url: '/sp-view-dashboard-bills' }
      ]
    },
    {
      title: 'Inventory Management',
      description: 'Inventory check and management',
      icon: IconClipboardCheck,
      color: '#d32f2f',
      url: '/inventory-management',
      subItems: [{ title: 'Inventory Check Orders', icon: IconClipboardCheck, url: '/sp-inventory-check-management' }]
    },
    {
      title: 'Location Management',
      description: 'Manage areas and locations',
      icon: IconMapPin,
      color: '#1565c0',
      url: '/location-management',
      subItems: [
        { title: 'Manage Areas', icon: IconMapPin, url: '/sp-area-management' },
        { title: 'Manage Locations', icon: IconMap, url: '/sp-location-management' }
      ]
    },
    {
      title: 'Contract Management',
      description: 'Manage retailer and supplier contracts',
      icon: IconContract,
      color: '#7b1fa2',
      url: '/contract-management',
      subItems: [
        { title: 'Retailer Contracts', icon: IconBuildingStore, url: '/sp-retailer-contracts' },
        { title: 'Supplier Contracts', icon: IconTruck, url: '/sp-supplier-contracts' }
      ]
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
          Supervisor Dashboard
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
          Welcome to the supervisor management section. Select a category to manage.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {supervisorSections.map((section, index) => {
          const IconComponent = section.icon;
          return (
            <Grid item xs={12} sm={6} lg={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardActionArea sx={{ height: '100%', p: 3 }} onClick={() => router.push(section.url)}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                        p: 2,
                        borderRadius: '50%',
                        bgcolor: `${section.color}15`,
                        width: 80,
                        height: 80,
                        mx: 'auto'
                      }}
                    >
                      <IconComponent size={40} color={section.color} />
                    </Box>

                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                      {section.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                      {section.description}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                        Available Actions:
                      </Typography>
                      {section.subItems.map((item, itemIndex) => {
                        const ItemIcon = item.icon;
                        return (
                          <Box key={itemIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <ItemIcon size={16} color={section.color} style={{ marginRight: 8 }} />
                            <Typography variant="caption" color="text.secondary">
                              {item.title}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
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
