'use client';

import { Box, Typography, Grid, Card, CardContent, CardActionArea, Paper, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';
import useTrans from '@/hooks/useTrans';

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
  const trans = useTrans();

  const supervisorSections = [
    {
      title: trans.home.sections.userManagement.title,
      description: trans.home.sections.userManagement.description,
      icon: IconUsers,
      color: '#1976d2',
      url: '/user-management',
      subItems: [{ title: trans.home.sections.userManagement.manageUsers, icon: IconUser, url: '/sp-manage-users' }]
    },
    {
      title: trans.home.sections.orderManagement.title,
      description: trans.home.sections.orderManagement.description,
      icon: IconDatabaseExport,
      color: '#2e7d32',
      url: '/order-management',
      subItems: [
        { title: trans.home.sections.orderManagement.importOrders, icon: IconFileImport, url: '/sp-import-orders' },
        { title: trans.home.sections.orderManagement.exportOrders, icon: IconFileExport, url: '/sp-export-orders' }
      ]
    },
    {
      title: trans.home.sections.medicineManagement.title,
      description: trans.home.sections.medicineManagement.description,
      icon: IconPill,
      color: '#ed6c02',
      url: '/medicine-management',
      subItems: [{ title: trans.home.sections.medicineManagement.manageMedicines, icon: IconPill, url: '/sp-manage-medicines' }]
    },
    {
      title: trans.home.sections.billManagement.title,
      description: trans.home.sections.billManagement.description,
      icon: IconReceipt,
      color: '#9c27b0',
      url: '/bill-management',
      subItems: [
        { title: trans.home.sections.billManagement.manageBills, icon: IconReceipt, url: '/sp-manage-bills' },
        { title: trans.home.sections.billManagement.viewDashboardBills, icon: IconDashboard, url: '/sp-view-dashboard-bills' }
      ]
    },
    {
      title: trans.home.sections.inventoryManagement.title,
      description: trans.home.sections.inventoryManagement.description,
      icon: IconClipboardCheck,
      color: '#d32f2f',
      url: '/inventory-management',
      subItems: [
        {
          title: trans.home.sections.inventoryManagement.inventoryCheckOrders,
          icon: IconClipboardCheck,
          url: '/sp-inventory-check-management'
        }
      ]
    },
    {
      title: trans.home.sections.locationManagement.title,
      description: trans.home.sections.locationManagement.description,
      icon: IconMapPin,
      color: '#1565c0',
      url: '/location-management',
      subItems: [
        { title: trans.home.sections.locationManagement.manageAreas, icon: IconMapPin, url: '/sp-area-management' },
        { title: trans.home.sections.locationManagement.manageLocations, icon: IconMap, url: '/sp-location-management' }
      ]
    },
    {
      title: trans.home.sections.contractManagement.title,
      description: trans.home.sections.contractManagement.description,
      icon: IconContract,
      color: '#7b1fa2',
      url: '/contract-management',
      subItems: [
        { title: trans.home.sections.contractManagement.retailerManagement, icon: IconBuildingStore, url: '/sp-retailer-contracts' },
        { title: trans.home.sections.contractManagement.supplierManagement, icon: IconTruck, url: '/sp-supplier-contracts' }
      ]
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
          {trans.home.title}
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
          {trans.home.description}
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
                        {trans.home.availableActions}
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
