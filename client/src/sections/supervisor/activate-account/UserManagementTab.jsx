'use client';
import useUsers from '@/hooks/useUser';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

import {
  BarChart as BarChartIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Send as SendIcon,
  SupervisorAccount as SupervisorIcon,
  Warehouse as WarehouseIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useCallback, useMemo } from 'react';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import axios from 'axios';

function UserManagement({ onOpenPermissionDialog, onOpenAddUser }) {
  const theme = useTheme();
  const { users, loading, error, refetch } = useUsers();

  const { supervisorUsers, representativeUsers, warehouseUsers, warehouseManagersUsers } = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    return {
      supervisorUsers: safeUsers.filter((user) => user?.role === 'supervisor'),
      representativeUsers: safeUsers.filter((user) => user?.role === 'representative'),
      warehouseUsers: safeUsers.filter((user) => user?.role === 'warehouse'),
      warehouseManagersUsers: safeUsers.filter((user) => user?.role === 'warehouse_manager')
    };
  }, [users]);

  const getLevelColor = (role) => {
    switch (role) {
      case 'supervisor':
        return 'error';
      case 'representative':
        return 'warning';
      case 'warehouse':
        return 'info';
      case 'warehouse_manager':
        return 'primary';
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
      case 'warehouse_manager':
        return 'Warehouse Manager';
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
      case 'warehouse_manager':
        return <WarehouseIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  if (loading) {
    return (
      <ComponentsWrapper>
        <PresentationCard title="Loading Users">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress size={40} />
            <Typography sx={{ ml: 2 }} variant="body2" color="text.secondary">
              Đang tải dữ liệu người dùng...
            </Typography>
          </Box>
        </PresentationCard>
      </ComponentsWrapper>
    );
  }

  if (error) {
    return (
      <ComponentsWrapper title="Error">
        <PresentationCard title="Error Loading Users">
          <Alert severity="error" sx={{ mb: 2 }}>
            Lỗi: {error}
          </Alert>
          <Button onClick={refetch} variant="outlined" startIcon={<RefreshIcon />}>
            Thử lại
          </Button>
        </PresentationCard>
      </ComponentsWrapper>
    );
  }

  const UserTable = ({ users, sectionName }) => {
    if (!Array.isArray(users) || users.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
          Không có người dùng nào trong {sectionName}
        </Typography>
      );
    }

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Manager</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id || user.id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>{getRoleIcon(user.role)}</Avatar>
                    <Typography variant="body2" fontWeight={500}>
                      {user.email || 'N/A'}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={getRoleDisplayName(user.role)} color={getLevelColor(user.role)} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status === 'active' ? 'Active' : user.status === 'pending' ? 'Pending' : 'Inactive'}
                    color={user.status === 'active' ? 'success' : user.status === 'pending' ? 'warning' : 'default'}
                    size="small"
                    variant="filled"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_manager ? 'Yes' : 'No'}
                    color={user.is_manager ? 'primary' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <IconButton size="small" color="primary" onClick={() => onOpenPermissionDialog(user)}>
                      <SecurityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="secondary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <ComponentsWrapper title="User Management">
      {/* Summary Statistics */}
      <PresentationCard title="User Statistics">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.dark', color: 'white' }}>
              <Typography variant="h4" fontWeight={700}>
                {supervisorUsers.length + representativeUsers.length + warehouseUsers.length}
              </Typography>
              <Typography variant="body2">Total Users</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'error.dark', color: 'error.contrastText' }}>
              <Typography variant="h4" fontWeight={700}>
                {supervisorUsers.length}
              </Typography>
              <Typography variant="body2">Supervisors</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.dark', color: 'warning.contrastText' }}>
              <Typography variant="h4" fontWeight={700}>
                {representativeUsers.length}
              </Typography>
              <Typography variant="body2">Representatives</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'info.dark', color: 'info.contrastText' }}>
              <Typography variant="h4" fontWeight={700}>
                {warehouseUsers.length}
              </Typography>
              <Typography variant="body2">Warehouse</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'info.dark', color: 'info.contrastText' }}>
              <Typography variant="h4" fontWeight={700}>
                {warehouseManagersUsers.length}
              </Typography>
              <Typography variant="body2">Warehouse Managers</Typography>
            </Card>
          </Grid>
        </Grid>
      </PresentationCard>

      {/* Quick Actions */}
      <PresentationCard title="Quick Actions">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Perform common user management tasks quickly and efficiently.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={onOpenAddUser}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
            }}
          >
            Add New User
          </Button>
          <Button variant="outlined" startIcon={<SecurityIcon />}>
            Manage Permissions
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refetch}>
            Refresh Data
          </Button>
          <Button variant="outlined" startIcon={<BarChartIcon />}>
            View Reports
          </Button>
        </Stack>
      </PresentationCard>

      {/* Supervisors Section */}
      <PresentationCard title="Supervisors">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Manage supervisor accounts and their permissions. Supervisors have elevated access to oversee operations and manage team members.
        </Typography>
        <UserTable users={supervisorUsers} sectionName="Supervisors" />
      </PresentationCard>

      {/* Representatives Section */}
      <PresentationCard title="Representatives">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Customer service representatives handle client interactions and support requests. They serve as the primary point of contact for
          customers.
        </Typography>
        <UserTable users={representativeUsers} sectionName="Representatives" />
      </PresentationCard>

      {/* Warehouse Section */}
      <PresentationCard title="Warehouse Staff">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Warehouse staff manage inventory, fulfillment, and logistics operations. They ensure accurate order processing and inventory
          management.
        </Typography>
        <UserTable users={warehouseUsers} sectionName="Warehouse" />
      </PresentationCard>

      {/* Warehouse Section */}
      <PresentationCard title="Warehouse Managers">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Warehouse managers oversee warehouse operations and ensure efficient inventory management.
        </Typography>
        <UserTable users={warehouseManagersUsers} sectionName="Warehouse Managers" />
      </PresentationCard>
    </ComponentsWrapper>
  );
}

export default UserManagement;
