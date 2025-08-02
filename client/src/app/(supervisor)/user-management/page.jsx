'use client';

import { Box, Typography, Grid, Card, CardContent, Paper, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useRouter } from 'next/navigation';

// @assets
import {
  IconUser,
  IconShield,
  IconUsers,
  IconSettings,
  IconHelp,
  IconInfoCircle,
  IconArrowRight,
  IconCheck,
  IconX
} from '@tabler/icons-react';

export default function UserManagementPage() {
  const router = useRouter();

  const userManagementFeatures = [
    {
      title: 'User Management',
      description: 'Manage system users and their accounts',
      icon: IconUser,
      color: '#1976d2',
      url: '/sp-manage-users',
      features: ['Create new user accounts', 'Edit user information', 'Deactivate user accounts', 'Reset user passwords']
    },
    {
      title: 'Role Management',
      description: 'Manage user roles and permissions',
      icon: IconShield,
      color: '#2e7d32',
      features: ['Assign roles to users', 'Create custom roles', 'Manage role permissions', 'Role-based access control']
    }
  ];

  const userRights = [
    {
      title: 'Supervisor Rights',
      icon: IconCheck,
      color: '#2e7d32',
      rights: ['Full system access', 'User management', 'Role assignment', 'System configuration']
    },
    {
      title: 'User Rights',
      icon: IconInfoCircle,
      color: '#1976d2',
      rights: ['View assigned data', 'Perform assigned tasks', 'Update personal information', 'Access help resources']
    }
  ];

  const supportInfo = [
    {
      title: 'Getting Started',
      description: 'Learn how to use the user management system',
      icon: IconHelp,
      items: ['Read the user manual', 'Watch tutorial videos', 'Contact system administrator', 'Check FAQ section']
    },
    {
      title: 'Best Practices',
      description: 'Follow these guidelines for effective user management',
      icon: IconSettings,
      items: ['Regular password updates', 'Role-based access control', 'Audit trail maintenance', 'Security compliance']
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
          User & Role Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
          Manage users, roles, and system access permissions
        </Typography>
      </Paper>

      {/* Management Features */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Management Features
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {userManagementFeatures.map((feature, index) => {
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

      {/* User Rights */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        User Rights & Permissions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {userRights.map((right, index) => {
          const IconComponent = right.icon;
          return (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '50%',
                        bgcolor: `${right.color}15`,
                        mr: 2
                      }}
                    >
                      <IconComponent size={24} color={right.color} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {right.title}
                    </Typography>
                  </Box>

                  <List dense>
                    {right.rights.map((item, itemIndex) => (
                      <ListItem key={itemIndex} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <IconCheck size={16} color={right.color} />
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
