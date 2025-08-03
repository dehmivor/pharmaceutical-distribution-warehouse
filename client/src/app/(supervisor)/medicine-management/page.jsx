'use client';

import { Box, Typography, Grid, Card, CardContent, Paper, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useRouter } from 'next/navigation';

// @assets
import {
  IconPill,
  IconDatabase,
  IconSearch,
  IconSettings,
  IconHelp,
  IconInfoCircle,
  IconArrowRight,
  IconCheck,
  IconAlertTriangle
} from '@tabler/icons-react';

export default function MedicineManagementPage() {
  const router = useRouter();

  const medicineManagementFeatures = [
    {
      title: 'Medicine Database',
      description: 'Comprehensive medicine information and inventory',
      icon: IconDatabase,
      color: '#1976d2',
      url: '/sp-manage-medicines',
      features: ['Add new medicines', 'Update medicine information', 'Manage medicine categories', 'Track medicine inventory']
    },
    {
      title: 'Medicine Search',
      description: 'Search and filter medicines efficiently',
      icon: IconSearch,
      color: '#2e7d32',
      features: ['Search by medicine name', 'Filter by category', 'Advanced search options', 'Quick medicine lookup']
    }
  ];

  const medicineGuidelines = [
    {
      title: 'Medicine Safety',
      icon: IconCheck,
      color: '#2e7d32',
      guidelines: ['Verify medicine authenticity', 'Check expiration dates', 'Proper storage conditions', 'Safety protocols']
    },
    {
      title: 'Quality Control',
      icon: IconAlertTriangle,
      color: '#ed6c02',
      guidelines: ['Quality assurance checks', 'Batch tracking', 'Compliance monitoring', 'Documentation requirements']
    }
  ];

  const supportInfo = [
    {
      title: 'Medicine Management Guide',
      description: 'Learn how to effectively manage medicines',
      icon: IconHelp,
      items: ['Read the medicine management manual', 'Watch tutorial videos', 'Contact pharmacy department', 'Check medicine guidelines']
    },
    {
      title: 'Best Practices',
      description: 'Follow these guidelines for effective medicine management',
      icon: IconSettings,
      items: ['Regular inventory checks', 'Proper documentation', 'Safety compliance', 'Quality assurance']
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
          Medicine Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
          Manage medicines, inventory, and quality control
        </Typography>
      </Paper>

      {/* Management Features */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Management Features
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {medicineManagementFeatures.map((feature, index) => {
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

      {/* Medicine Guidelines */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Medicine Guidelines & Safety
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {medicineGuidelines.map((guideline, index) => {
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
