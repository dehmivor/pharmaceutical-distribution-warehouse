'use client';
import useUsers from '@/hooks/useUser';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
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
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

// Import icons từ @mui/icons-material
import {
  BarChart as BarChartIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  SupervisorAccount as SupervisorIcon,
  Warehouse as WarehouseIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useMemo, useState } from 'react';

function ContentSection({ activeTab }) {
  const theme = useTheme();
  const { users, loading, error, refetch } = useUsers();

  // State cho permission management
  const [permissionDialog, setPermissionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [isManager, setIsManager] = useState(false);

  // ✅ Filter users theo role
  const { supervisorUsers, representativeUsers, warehouseUsers } = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];

    return {
      supervisorUsers: safeUsers.filter((user) => user?.role === 'supervisor'),
      representativeUsers: safeUsers.filter((user) => user?.role === 'representative'),
      warehouseUsers: safeUsers.filter((user) => user?.role === 'warehouse')
    };
  }, [users]);

  // ✅ Permission functions
  const handleOpenPermissionDialog = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsManager(user.is_manager);
    setPermissionDialog(true);
  };

  const handleClosePermissionDialog = () => {
    setPermissionDialog(false);
    setSelectedUser(null);
    setNewRole('');
    setIsManager(false);
  };

  const handleUpdatePermission = async () => {
    try {
      // TODO: Implement API call to update user permissions
      console.log('Updating permissions for user:', selectedUser._id, {
        role: newRole,
        is_manager: isManager
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh data
      refetch();
      handleClosePermissionDialog();
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
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
                      <IconButton size="small" color="primary" sx={{ borderRadius: 2 }} onClick={() => handleOpenPermissionDialog(user)}>
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

  // ✅ Permission Management Component
  const PermissionManagement = () => {
    const allUsers = [...supervisorUsers, ...representativeUsers, ...warehouseUsers];

    const roleStats = {
      supervisor: supervisorUsers.length,
      representative: representativeUsers.length,
      warehouse: warehouseUsers.length,
      managers: allUsers.filter((user) => user.is_manager).length
    };

    return (
      <Box>
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
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2 }}>Đang tải dữ liệu người dùng...</Typography>
      </Box>
    );
  }

  return (
    <div>
      {/* Tab 0: User Management */}
      {activeTab === 0 && (
        <Box sx={{ width: '100%', minHeight: '100vh', p: 3 }}>
          <Grid container spacing={3}>
            {/* Supervisors Column */}
            <Grid item xs={12} sm={6} md={3}>
              <Accordion
                defaultExpanded
                sx={{
                  height: 'fit-content',
                  '&:before': { display: 'none' },
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: theme.shadows[3],
                  border: `2px solid ${theme.palette.primary.main}20`
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: theme.palette.primary.main + '10',
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center'
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SupervisorIcon color="primary" />
                    <Typography variant="h6" fontWeight={600} color="primary">
                      Supervisors
                    </Typography>
                    <Chip label={supervisorUsers.length} size="small" color="primary" sx={{ ml: 1 }} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, maxHeight: '70vh', overflow: 'auto' }}>
                  <UserTable users={supervisorUsers} sectionName="Supervisors" />
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Representatives Column */}
            <Grid item xs={12} sm={6} md={3}>
              <Accordion
                defaultExpanded
                sx={{
                  height: 'fit-content',
                  '&:before': { display: 'none' },
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: theme.shadows[3],
                  border: `2px solid ${theme.palette.secondary.main}20`
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: theme.palette.secondary.main + '10',
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center'
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PersonAddIcon color="secondary" />
                    <Typography variant="h6" fontWeight={600} color="secondary">
                      Representatives
                    </Typography>
                    <Chip label={representativeUsers.length} size="small" color="secondary" sx={{ ml: 1 }} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, maxHeight: '70vh', overflow: 'auto' }}>
                  <UserTable users={representativeUsers} sectionName="Representatives" />
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Warehouse Column */}
            <Grid item xs={12} sm={6} md={3}>
              <Accordion
                defaultExpanded
                sx={{
                  height: 'fit-content',
                  '&:before': { display: 'none' },
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: theme.shadows[3],
                  border: `2px solid ${theme.palette.info.main}20`
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: theme.palette.info.main + '10',
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center'
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <WarehouseIcon color="info" />
                    <Typography variant="h6" fontWeight={600} color="info">
                      Warehouse
                    </Typography>
                    <Chip label={warehouseUsers.length} size="small" color="info" sx={{ ml: 1 }} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, maxHeight: '70vh', overflow: 'auto' }}>
                  <UserTable users={warehouseUsers} sectionName="Warehouse" />
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Summary/Statistics Column */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: 'fit-content',
                  borderRadius: 3,
                  boxShadow: theme.shadows[3],
                  border: `2px solid ${theme.palette.success.main}20`
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    color="success.main"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <BarChartIcon sx={{ mr: 1 }} />
                    Summary
                  </Typography>

                  <Stack spacing={2}>
                    {/* Total Users */}
                    <Paper sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
                      <Typography variant="h4" fontWeight={700} color="primary" align="center">
                        {supervisorUsers.length + representativeUsers.length + warehouseUsers.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center">
                        Total Users
                      </Typography>
                    </Paper>

                    {/* Role Distribution */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Role Distribution
                      </Typography>

                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip icon={<SupervisorIcon />} label="Supervisors" size="small" color="primary" variant="outlined" />
                          <Typography variant="body2" fontWeight={600}>
                            {supervisorUsers.length}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip icon={<PersonAddIcon />} label="Representatives" size="small" color="secondary" variant="outlined" />
                          <Typography variant="body2" fontWeight={600}>
                            {representativeUsers.length}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip icon={<WarehouseIcon />} label="Warehouse" size="small" color="info" variant="outlined" />
                          <Typography variant="body2" fontWeight={600}>
                            {warehouseUsers.length}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {/* Manager Count */}
                    <Paper sx={{ p: 2, bgcolor: theme.palette.warning.light + '20', borderRadius: 2 }}>
                      <Typography variant="h5" fontWeight={600} color="warning.dark" align="center">
                        {[...supervisorUsers, ...representativeUsers, ...warehouseUsers].filter((user) => user.is_manager).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center">
                        Managers
                      </Typography>
                    </Paper>

                    {/* Quick Actions */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Quick Actions
                      </Typography>
                      <Stack spacing={1}>
                        <Button variant="outlined" size="small" startIcon={<PersonAddIcon />} fullWidth>
                          Add User
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<SecurityIcon />} fullWidth>
                          Manage Permissions
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<RefreshIcon />} fullWidth onClick={refetch}>
                          Refresh Data
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab 1: Permission Management */}
      {activeTab === 1 && <PermissionManagement />}

      {/* Permission Dialog */}
      <Dialog open={permissionDialog} onClose={handleClosePermissionDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1 }} />
          Update User Permissions
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                User: <strong>{selectedUser.email}</strong>
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Role</InputLabel>
                <Select value={newRole} label="Role" onChange={(e) => setNewRole(e.target.value)}>
                  <MenuItem value="supervisor">Supervisor</MenuItem>
                  <MenuItem value="representative">Representative</MenuItem>
                  <MenuItem value="warehouse">Warehouse</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={<Switch checked={isManager} onChange={(e) => setIsManager(e.target.checked)} color="primary" />}
                label="Manager Privileges"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermissionDialog}>Cancel</Button>
          <Button onClick={handleUpdatePermission} variant="contained">
            Update Permissions
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ContentSection;
