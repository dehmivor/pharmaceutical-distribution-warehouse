'use client';
import useUsers from '@/hooks/useUser';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

import {
  AdminPanelSettings as AdminIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  SupervisorAccount as SupervisorIcon,
  Warehouse as WarehouseIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';

function PermissionManagement({ onOpenPermissionDialog }) {
  const theme = useTheme();
  const { users, loading, error, refetch } = useUsers();

  // Filter users theo role
  const { supervisorUsers, representativeUsers, warehouseUsers } = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];

    return {
      supervisorUsers: safeUsers.filter((user) => user?.role === 'supervisor'),
      representativeUsers: safeUsers.filter((user) => user?.role === 'representative'),
      warehouseUsers: safeUsers.filter((user) => user?.role === 'warehouse')
    };
  }, [users]);

  const allUsers = [...supervisorUsers, ...representativeUsers, ...warehouseUsers];

  const roleStats = {
    supervisor: supervisorUsers.length,
    representative: representativeUsers.length,
    warehouse: warehouseUsers.length,
    managers: allUsers.filter((user) => user.is_manager).length
  };

  const getLevelColor = (role) => {
    switch (role) {
      case 'supervisor':
        return 'error';
      case 'representative':
        return 'warning';
      case 'warehouse':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'supervisor':
        return 'Supervisor';
      case 'representative':
        return 'Representative';
      case 'warehouse':
        return 'Warehouse';
      default:
        return role || 'Unknown';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'supervisor':
        return <SupervisorIcon fontSize="small" />;
      case 'representative':
        return <PersonAddIcon fontSize="small" />;
      case 'warehouse':
        return <WarehouseIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  const UserTable = ({ users, sectionName }) => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Đang tải dữ liệu...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          Lỗi: {error}
          <Button onClick={refetch} sx={{ ml: 2 }} variant="outlined" size="small">
            Thử lại
          </Button>
        </Alert>
      );
    }

    if (!Array.isArray(users) || users.length === 0) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <Typography color="text.secondary">Không có người dùng nào trong {sectionName}</Typography>
        </Box>
      );
    }

    return (
      <Card sx={{ mb: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Manager</TableCell>
                <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}`, textAlign: 'center' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id || user.id} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: theme.palette.primary.main, fontSize: '0.875rem' }}>
                        {getRoleIcon(user.role)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>
                        {user.email || 'N/A'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleDisplayName(user.role)}
                      color={getLevelColor(user.role)}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status === 'active' ? 'Active' : 'Inactive'}
                      color={user.status === 'active' ? 'success' : 'default'}
                      size="small"
                      variant="filled"
                      sx={{ fontWeight: 500, borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_manager ? 'Yes' : 'No'}
                      color={user.is_manager ? 'primary' : 'default'}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton size="small" color="primary" sx={{ borderRadius: 2 }} onClick={() => onOpenPermissionDialog(user)}>
                        <SecurityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="secondary" sx={{ borderRadius: 2 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" sx={{ borderRadius: 2 }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Permission Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <SupervisorIcon sx={{ fontSize: 40, color: theme.palette.error.main, mb: 1 }} />
            <Typography variant="h4" fontWeight={600} color="error">
              {roleStats.supervisor}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supervisors
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <PersonAddIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
            <Typography variant="h4" fontWeight={600} color="warning">
              {roleStats.representative}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Representatives
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <WarehouseIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
            <Typography variant="h4" fontWeight={600} color="info">
              {roleStats.warehouse}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Warehouse
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <AdminIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
            <Typography variant="h4" fontWeight={600} color="primary">
              {roleStats.managers}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Managers
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Permission Rules */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SecurityIcon sx={{ mr: 1 }} />
            Permission Rules
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: theme.palette.error.light + '20', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} color="error" gutterBottom>
                  Supervisor Permissions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Full access to all modules
                  <br />
                  • Can manage all users
                  <br />
                  • Can assign roles
                  <br />• System administration
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: theme.palette.warning.light + '20', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} color="warning.dark" gutterBottom>
                  Representative Permissions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Customer management
                  <br />
                  • Order processing
                  <br />
                  • Report viewing
                  <br />• Limited user access
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: theme.palette.info.light + '20', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} color="info.dark" gutterBottom>
                  Warehouse Permissions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Inventory management
                  <br />
                  • Stock tracking
                  <br />
                  • Shipping operations
                  <br />• Basic reporting
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* All Users Table for Permission Management */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            User Permission Management
          </Typography>
          <UserTable users={allUsers} sectionName="All Users" />
        </CardContent>
      </Card>
    </Box>
  );
}

export default PermissionManagement;
// This file is part of the Pharmaceutical Distribution Warehouse project.
