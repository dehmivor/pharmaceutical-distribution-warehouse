'use client';

import { Box, Typography, Grid, Card, CardContent, Paper, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useRouter } from 'next/navigation';

// @assets
import {
  IconClipboardCheck,
  IconClipboardList,
  IconSearch,
  IconSettings,
  IconHelp,
  IconInfoCircle,
  IconArrowRight,
  IconCheck,
  IconAlertTriangle
} from '@tabler/icons-react';

export default function InventoryManagementPage() {
  const router = useRouter();

  const inventoryManagementFeatures = [
    {
      title: 'Inventory Check',
      description: 'Perform comprehensive inventory checks',
      icon: IconClipboardCheck,
      color: '#1976d2',
      url: '/sp-inventory-check-management',
      features: ['Schedule inventory checks', 'Perform physical counts', 'Compare with system data', 'Generate discrepancy reports']
    },
    {
      title: 'Inventory Reports',
      description: 'Generate detailed inventory reports',
      icon: IconClipboardList,
      color: '#2e7d32',
      features: ['Stock level reports', 'Movement history', 'Expiry date tracking', 'Value calculations']
    }
  ];

  const inventoryGuidelines = [
    {
      title: 'Check Procedures',
      icon: IconCheck,
      color: '#2e7d32',
      guidelines: ['Follow standard procedures', 'Verify item locations', 'Check item conditions', 'Document all findings']
    },
    {
      title: 'Quality Assurance',
      icon: IconAlertTriangle,
      color: '#ed6c02',
      guidelines: ['Verify item authenticity', 'Check expiration dates', 'Assess item quality', 'Report damaged items']
    }
  ];

  const supportInfo = [
    {
      title: 'Inventory Management Guide',
      description: 'Learn how to effectively manage inventory',
      icon: IconHelp,
      items: ['Read the inventory manual', 'Watch tutorial videos', 'Contact warehouse manager', 'Check inventory guidelines']
    },
    {
      title: 'Best Practices',
      description: 'Follow these guidelines for effective inventory management',
      icon: IconSettings,
      items: ['Regular inventory checks', 'Proper documentation', 'Quality control', 'System synchronization']
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
          Inventory Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
          Manage inventory checks, reports, and quality control
        </Typography>
      </Paper>

      {/* Management Features */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Management Features
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {inventoryManagementFeatures.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <Grid item xs={12} md={6} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '50%',
                        bgcolor: `${feature.color}15`,
                        mr: 2
                      }}
                    >
                      <IconComponent size={24} color={feature.color} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {feature.description}
                  </Typography>

                  <List dense>
                    {feature.features.map((item, itemIndex) => (
                      <ListItem key={itemIndex} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <IconArrowRight size={16} color={feature.color} />
                        </ListItemIcon>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>

                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="button"
                      sx={{
                        color: feature.color,
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => router.push(feature.url)}
                    >
                      Access {feature.title} →
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Inventory Guidelines */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Inventory Guidelines & Procedures
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {inventoryGuidelines.map((guideline, index) => {
          const IconComponent = guideline.icon;
          return (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '50%',
                        bgcolor: `${guideline.color}15`,
                        mr: 2
                      }}
                    >
                      <IconComponent size={24} color={guideline.color} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {guideline.title}
                    </Typography>
                  </Box>

                  <List dense>
                    {guideline.guidelines.map((item, itemIndex) => (
                      <ListItem key={itemIndex} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <IconCheck size={16} color={guideline.color} />
                        </ListItemIcon>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Support Information */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Support & Guidance
      </Typography>
      <Grid container spacing={3}>
        {supportInfo.map((info, index) => {
          const IconComponent = info.icon;
          return (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconComponent size={24} color="#666" style={{ marginRight: 12 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {info.title}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {info.description}
                  </Typography>

                  <List dense>
                    {info.items.map((item, itemIndex) => (
                      <ListItem key={itemIndex} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <IconArrowRight size={16} color="#666" />
                        </ListItemIcon>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
