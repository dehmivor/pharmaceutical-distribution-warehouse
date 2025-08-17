'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import useUsers from '@/hooks/useUser';
import useTrans from '@/hooks/useTrans';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography
} from '@mui/material';

import {
  BarChart as BarChartIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  SupervisorAccount as SupervisorIcon,
  Warehouse as WarehouseIcon,
  Search as SearchIcon,
  Settings
} from '@mui/icons-material';

import { useTheme } from '@mui/material/styles';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

// Move UserTable component outside to prevent hooks error
const UserTable = ({
  users,
  sectionName,
  showPagination = false,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  totalCount,
  onOpenPermissionDialog,
  onOpenEditUserDialog,
  onOpenDeactivateUserDialog,
  getLevelColor,
  getRoleDisplayName
}) => {
  if (!Array.isArray(users) || users.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
        {sectionName ? `No users found in ${sectionName}` : 'No users found'}
      </Typography>
    );
  }

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Updated</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id || user.id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: user.avatar || user.profileImage || user.image ? 'transparent' : getLevelColor(user.role) + '.main'
                      }}
                      src={user.avatar || user.profileImage || user.image}
                      alt={user.name || user.email}
                    >
                      {!user.avatar && !user.profileImage && !user.image ? (
                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </Typography>
                      ) : null}
                    </Avatar>
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
                  <Typography variant="body2" color="text.secondary">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <IconButton size="small" color="primary" onClick={() => onOpenPermissionDialog(user)}>
                      <SecurityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="secondary" onClick={() => onOpenEditUserDialog(user)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onOpenDeactivateUserDialog(user)}>
                      <Settings fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {showPagination && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[7]}
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
        />
      )}
    </>
  );
};

function UserManagement({ onOpenPermissionDialog, onOpenEditUserDialog, onOpenDeactivateUserDialog, onOpenAddUser }) {
  const theme = useTheme();
  const trans = useTrans();
  const { users, loading, error, refetchUsers } = useUsers();

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filtered users state (after applying filter on search)
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Pagination states for Status filtered list
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Pagination states for role cards
  const [rolePage, setRolePage] = useState({
    supervisor: 0,
    representative: 0,
    representative_manager: 0,
    warehouse: 0,
    warehouse_manager: 0
  });
  const [roleRowsPerPage] = useState(5); // Fixed at 7 records per page for role cards

  // Initialize filteredUsers when users data is loaded or updated
  useEffect(() => {
    if (users && Array.isArray(users)) {
      // Only update if the users array has actually changed
      setFilteredUsers((prev) => {
        if (
          prev.length !== users.length ||
          JSON.stringify(prev.map((u) => u._id || u.id).sort()) !== JSON.stringify(users.map((u) => u._id || u.id).sort())
        ) {
          return users;
        }
        return prev;
      });
      setPage(0);
    }
  }, [users]);

  // Handle Search button clicked - apply filters
  const handleSearch = () => {
    let filtered = users || [];

    if (searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (user) => user.email?.toLowerCase().includes(searchLower) || (user.name?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    if (filterRole && filterRole !== 'all') {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter((user) => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
    setPage(0);
  };

  // Reset filters to show all users
  const handleResetFilters = () => {
    setSearchText('');
    setFilterRole('all');
    setFilterStatus('all');
    setFilteredUsers(users || []);
    setPage(0);
    setRolePage({
      supervisor: 0,
      representative: 0,
      representative_manager: 0,
      warehouse: 0,
      warehouse_manager: 0
    });
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Pagination handlers for role cards
  const handleChangeRolePage = (role, newPage) => {
    setRolePage((prev) => ({
      ...prev,
      [role]: newPage
    }));
  };

  // Get users for current page (only when filtering by status show pagination)
  const pagedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Group filtered users by role only if not filtering by status or role
  const groupedUsers = useMemo(() => {
    if (filterRole && filterRole !== 'all') {
      return { [filterRole]: filteredUsers };
    }

    if (filterStatus && filterStatus !== 'all') {
      // If filtering by status, we just show the filtered list, no grouping
      return null;
    }

    return {
      supervisor: filteredUsers.filter((u) => u.role === 'supervisor'),
      representative: filteredUsers.filter((u) => u.role === 'representative'),
      representative_manager: filteredUsers.filter((u) => u.role === 'representative_manager'),
      warehouse: filteredUsers.filter((u) => u.role === 'warehouse'),
      warehouse_manager: filteredUsers.filter((u) => u.role === 'warehouse_manager')
    };
  }, [filteredUsers, filterRole, filterStatus]);

  const getLevelColor = (role) => {
    switch (role) {
      case 'supervisor':
        return 'error';
      case 'representative':
        return 'warning';
      case 'representative_manager':
        return 'primary';
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
        return trans.userManagement?.roles?.supervisor || 'Supervisor';
      case 'representative':
        return trans.userManagement?.roles?.representative || 'Representative';
      case 'representative_manager':
        return trans.userManagement?.roles?.representativeManager || 'Representative Manager';
      case 'warehouse':
        return trans.userManagement?.roles?.warehouse || 'Warehouse Staff';
      case 'warehouse_manager':
        return trans.userManagement?.roles?.warehouseManager || 'Warehouse Manager';
      default:
        return role || trans.common?.unknown || 'Unknown';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'supervisor':
        return <SupervisorIcon fontSize="small" />;
      case 'representative':
        return <PersonAddIcon fontSize="small" />;
      case 'representative_manager':
        return <PersonAddIcon fontSize="small" />;
      case 'warehouse':
        return <WarehouseIcon fontSize="small" />;
      case 'warehouse_manager':
        return <WarehouseIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  // Expose refetch function globally for parent component to use
  useEffect(() => {
    if (refetchUsers) {
      window.refetchUsers = refetchUsers;
    }

    return () => {
      delete window.refetchUsers;
    };
  }, [refetchUsers]);

  if (loading) {
    return (
      <ComponentsWrapper>
        <PresentationCard title={trans.userManagement?.loading || 'Loading Users'}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress size={40} />
            <Typography sx={{ ml: 2 }} variant="body2" color="text.secondary">
              {trans.userManagement?.loading || 'Loading Users'}
            </Typography>
          </Box>
        </PresentationCard>
      </ComponentsWrapper>
    );
  }

  if (error) {
    return (
      <ComponentsWrapper title="Error">
        <PresentationCard title={trans.userManagement?.error || 'Error Loading Users'}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {trans.userManagement?.error || 'Error'}: {error}
          </Alert>
          <Button onClick={refetch} variant="outlined" startIcon={<RefreshIcon />}>
            {trans.userManagement?.retry || 'Retry'}
          </Button>
        </PresentationCard>
      </ComponentsWrapper>
    );
  }

  return (
    <Stack pl={3} pr={3} spacing={3}>
      <PresentationCard
        title={
          (searchText && searchText.trim() !== '') || filterRole !== 'all' || filterStatus !== 'all'
            ? `User Statistics - Filters Set (Click Search to Apply)`
            : 'User Statistics'
        }
      >
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Summary of user account with role authorization
        </Typography>
        <Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={4}>
              <TextField
                size="small"
                fullWidth
                label="Search by email or name"
                placeholder="Enter email or name to search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <TextField
                select
                size="small"
                fullWidth
                label="Filter by Role"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                variant="outlined"
                placeholder="Select role to filter"
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="supervisor">Supervisor</MenuItem>
                <MenuItem value="representative">Representative</MenuItem>
                <MenuItem value="representative_manager">Representative Manager</MenuItem>
                <MenuItem value="warehouse">Warehouse Staff</MenuItem>
                <MenuItem value="warehouse_manager">Warehouse Manager</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <TextField
                select
                size="small"
                fullWidth
                label="Filter by Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                variant="outlined"
                placeholder="Select status to filter"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>

            {/* Search Button */}
            <Grid item xs={6} sm={1} md={1}>
              <Button
                size="small"
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                sx={{
                  background:
                    (searchText && searchText.trim() !== '') || filterRole !== 'all' || filterStatus !== 'all'
                      ? 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)'
                      : 'linear-gradient(45deg, #59GBD3 30%, #83PA3 90%)',
                  boxShadow:
                    (searchText && searchText.trim() !== '') || filterRole !== 'all' || filterStatus !== 'all'
                      ? '0 3px 5px 2px rgba(255, 107, 53, .3)'
                      : '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  fontWeight: (searchText && searchText.trim() !== '') || filterRole !== 'all' || filterStatus !== 'all' ? 'bold' : 'normal'
                }}
              >
                {(searchText && searchText.trim() !== '') || filterRole !== 'all' || filterStatus !== 'all' ? 'Apply Filters' : 'Search'}
              </Button>
            </Grid>

            {/* Refresh Button */}
            <Grid item xs={6} sm={2} md={2}>
              <Button
                size="small"
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={async () => {
                  await refetchUsers();
                  handleResetFilters();
                }}
                sx={{
                  background: 'linear-gradient(45deg, #f0f0f0 30%, #e0e0e0 90%)',
                  boxShadow: '0 3px 5px 2px rgba(224, 224, 224, .3)'
                }}
              >
                {trans.userManagementTab.refresh}
              </Button>
            </Grid>

            {/* Create New User Button */}
            <Grid item xs={12} sm={2} md={2}>
              <Button
                size="small"
                fullWidth
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={onOpenAddUser}
                sx={{
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
                }}
              >
                {trans.userManagementTab.createNewUser}
              </Button>
            </Grid>
          </Grid>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {/* Show cards with stats */}
        {filterRole === 'all' && filterStatus === 'all' && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.dark', color: 'white' }}>
                <Typography variant="h4" fontWeight={700}>
                  {filteredUsers.length}
                </Typography>
                <Typography variant="body2">{trans.userManagementTab.totalUsers}</Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'error.dark', color: 'error.contrastText' }}>
                <Typography variant="h4" fontWeight={700}>
                  {groupedUsers?.supervisor?.length || 0}
                </Typography>
                <Typography variant="body2">{trans.userManagementTab.supervisors}</Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.dark', color: 'warning.contrastText' }}>
                <Typography variant="h4" fontWeight={700}>
                  {groupedUsers?.representative?.length || 0}
                </Typography>
                <Typography variant="body2">{trans.userManagementTab.representatives}</Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.dark', color: 'secondary.contrastText' }}>
                <Typography variant="h4" fontWeight={700}>
                  {groupedUsers?.representative_manager?.length || 0}
                </Typography>
                <Typography variant="body2">{trans.userManagementTab.representativeManagers}</Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'info.dark', color: 'info.contrastText' }}>
                <Typography variant="h4" fontWeight={700}>
                  {groupedUsers?.warehouse?.length || 0}
                </Typography>
                <Typography variant="body2">{trans.userManagementTab.warehouseStaff}</Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'success.dark', color: 'success.contrastText' }}>
                <Typography variant="h4" fontWeight={700}>
                  {groupedUsers?.warehouse_manager?.length || 0}
                </Typography>
                <Typography variant="body2">{trans.userManagementTab.warehouseManagers}</Typography>
              </Card>
            </Grid>
          </Grid>
        )}
      </PresentationCard>

      {/* Display user tables conditionally */}

      {/* If filtering by status - show one paginated table */}
      {filterStatus && filterStatus !== 'all' ? (
        <PresentationCard title={`Users with status "${filterStatus}"`}>
          <UserTable
            users={pagedUsers}
            sectionName={`Users with status "${filterStatus}"`}
            onOpenPermissionDialog={onOpenPermissionDialog}
            onOpenEditUserDialog={onOpenEditUserDialog}
            onOpenDeactivateUserDialog={onOpenDeactivateUserDialog}
            getLevelColor={getLevelColor}
            getRoleDisplayName={getRoleDisplayName}
          />
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage={trans.common?.rowsPerPage || 'Rows per page:'}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${trans.common?.of || 'of'} ${count}`}
          />
        </PresentationCard>
      ) : filterRole && filterRole !== 'all' ? (
        // If filtering by role - show only that role card
        <PresentationCard title={getRoleDisplayName(filterRole)}>
          <UserTable
            users={groupedUsers[filterRole]}
            onOpenPermissionDialog={onOpenPermissionDialog}
            onOpenEditUserDialog={onOpenEditUserDialog}
            onOpenDeactivateUserDialog={onOpenDeactivateUserDialog}
            getLevelColor={getLevelColor}
            getRoleDisplayName={getRoleDisplayName}
          />
        </PresentationCard>
      ) : (
        // No filters: show all roles cards
        <>
          <PresentationCard title={trans.userManagementTab.supervisors}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {trans.userManagementTab.supervisorDescription}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <UserTable
              users={groupedUsers?.supervisor?.slice(
                rolePage.supervisor * roleRowsPerPage,
                rolePage.supervisor * roleRowsPerPage + roleRowsPerPage
              )}
              onOpenPermissionDialog={onOpenPermissionDialog}
              onOpenEditUserDialog={onOpenEditUserDialog}
              onOpenDeactivateUserDialog={onOpenDeactivateUserDialog}
              getLevelColor={getLevelColor}
              getRoleDisplayName={getRoleDisplayName}
              sectionName="Supervisors"
              showPagination={true}
              page={rolePage.supervisor}
              rowsPerPage={roleRowsPerPage}
              onPageChange={(e, newPage) => handleChangeRolePage('supervisor', newPage)}
              onRowsPerPageChange={() => {}} // No change allowed, fixed at 7
              totalCount={groupedUsers?.supervisor?.length || 0}
            />
          </PresentationCard>

          <PresentationCard title={trans.userManagementTab.representativeManagers}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {trans.userManagementTab.representativeManagerDescription}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <UserTable
              users={groupedUsers?.representative_manager?.slice(
                rolePage.representative_manager * roleRowsPerPage,
                rolePage.representative_manager * roleRowsPerPage + roleRowsPerPage
              )}
              onOpenPermissionDialog={onOpenPermissionDialog}
              onOpenEditUserDialog={onOpenEditUserDialog}
              onOpenDeactivateUserDialog={onOpenDeactivateUserDialog}
              getLevelColor={getLevelColor}
              getRoleDisplayName={getRoleDisplayName}
              sectionName="Representative Managers"
              showPagination={true}
              page={rolePage.representative_manager}
              rowsPerPage={roleRowsPerPage}
              onPageChange={(e, newPage) => handleChangeRolePage('representative_manager', newPage)}
              onRowsPerPageChange={() => {}} // No change allowed, fixed at 7
              totalCount={groupedUsers?.representative_manager?.length || 0}
            />
          </PresentationCard>

          <PresentationCard title={trans.userManagementTab.representatives}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {trans.userManagementTab.representativeDescription}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <UserTable
              users={groupedUsers?.representative?.slice(
                rolePage.representative * roleRowsPerPage,
                rolePage.representative * roleRowsPerPage + roleRowsPerPage
              )}
              onOpenPermissionDialog={onOpenPermissionDialog}
              onOpenEditUserDialog={onOpenEditUserDialog}
              onOpenDeactivateUserDialog={onOpenDeactivateUserDialog}
              getLevelColor={getLevelColor}
              getRoleDisplayName={getRoleDisplayName}
              sectionName="Representatives"
              showPagination={true}
              page={rolePage.representative}
              rowsPerPage={roleRowsPerPage}
              onPageChange={(e, newPage) => handleChangeRolePage('representative', newPage)}
              onRowsPerPageChange={() => {}} // No change allowed, fixed at 7
              totalCount={groupedUsers?.representative?.length || 0}
            />
          </PresentationCard>

          <PresentationCard title={trans.userManagementTab.warehouseStaff}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {trans.userManagementTab.warehouseStaffDescription}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <UserTable
              users={groupedUsers?.warehouse?.slice(
                rolePage.warehouse * roleRowsPerPage,
                rolePage.warehouse * roleRowsPerPage + roleRowsPerPage
              )}
              onOpenPermissionDialog={onOpenPermissionDialog}
              onOpenEditUserDialog={onOpenEditUserDialog}
              onOpenDeactivateUserDialog={onOpenDeactivateUserDialog}
              getLevelColor={getLevelColor}
              getRoleDisplayName={getRoleDisplayName}
              sectionName="Warehouse Staff"
              showPagination={true}
              page={rolePage.warehouse}
              rowsPerPage={roleRowsPerPage}
              onPageChange={(e, newPage) => handleChangeRolePage('warehouse', newPage)}
              onRowsPerPageChange={() => {}} // No change allowed, fixed at 7
              totalCount={groupedUsers?.warehouse?.length || 0}
            />
          </PresentationCard>

          <PresentationCard title={trans.userManagementTab.warehouseManagers}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {trans.userManagementTab.warehouseManagerDescription}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <UserTable
              users={groupedUsers?.warehouse_manager?.slice(
                rolePage.warehouse_manager * roleRowsPerPage,
                rolePage.warehouse_manager * roleRowsPerPage + roleRowsPerPage
              )}
              onOpenPermissionDialog={onOpenPermissionDialog}
              onOpenEditUserDialog={onOpenEditUserDialog}
              onOpenDeactivateUserDialog={onOpenDeactivateUserDialog}
              getLevelColor={getLevelColor}
              getRoleDisplayName={getRoleDisplayName}
              sectionName="Warehouse Managers"
              showPagination={true}
              page={rolePage.warehouse_manager}
              rowsPerPage={roleRowsPerPage}
              onPageChange={(e, newPage) => handleChangeRolePage('warehouse_manager', newPage)}
              onRowsPerPageChange={() => {}} // No change allowed, fixed at 7
              totalCount={groupedUsers?.warehouse_manager?.length || 0}
            />
          </PresentationCard>
        </>
      )}
    </Stack>
  );
}

export default UserManagement;
