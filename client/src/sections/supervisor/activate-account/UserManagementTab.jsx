'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Search as SearchIcon
} from '@mui/icons-material';

import { useTheme } from '@mui/material/styles';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';

function UserManagement({ onOpenPermissionDialog, onOpenAddUser }) {
  const theme = useTheme();
  const trans = useTrans();
  const { users, loading, error, refetch } = useUsers();

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Filtered users state (after applying filter on search)
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Pagination states for Status filtered list
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Initialize filteredUsers when users data is loaded or updated
  useEffect(() => {
    if (users) {
      setFilteredUsers(users);
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

    if (filterRole) {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    if (filterStatus) {
      filtered = filtered.filter((user) => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
    setPage(0);
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get users for current page (only when filtering by status show pagination)
  const pagedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Group filtered users by role only if not filtering by status or role
  const groupedUsers = useMemo(() => {
    if (filterRole) {
      return { [filterRole]: filteredUsers };
    }

    if (filterStatus) {
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
        return trans.userManagementTab.supervisor;
      case 'representative':
        return trans.userManagementTab.representative;
      case 'representative_manager':
        return trans.userManagementTab.representativeManager;
      case 'warehouse':
        return trans.userManagementTab.warehouseStaff;
      case 'warehouse_manager':
        return trans.userManagementTab.warehouseManager;
      default:
        return role || trans.common.unknown;
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

  if (loading) {
    return (
      <ComponentsWrapper>
        <PresentationCard title={trans.userManagement.loading || 'Loading Users'}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress size={40} />
            <Typography sx={{ ml: 2 }} variant="body2" color="text.secondary">
              {trans.userManagement.loading}
            </Typography>
          </Box>
        </PresentationCard>
      </ComponentsWrapper>
    );
  }

  if (error) {
    return (
      <ComponentsWrapper title="Error">
        <PresentationCard title={trans.userManagement.error || 'Error Loading Users'}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {trans.userManagement.error}: {error}
          </Alert>
          <Button onClick={refetch} variant="outlined" startIcon={<RefreshIcon />}>
            {trans.userManagement.retry}
          </Button>
        </PresentationCard>
      </ComponentsWrapper>
    );
  }

  const UserTable = ({ users, sectionName }) => {
    const trans = useTrans();
    if (!Array.isArray(users) || users.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
          {trans.userManagementTab.noUsersInSection.replace('sectionName', sectionName)}
        </Typography>
      );
    }

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>{trans.userManagementTab.email}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{trans.userManagementTab.role}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{trans.userManagementTab.status}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{trans.userManagementTab.manager}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{trans.userManagementTab.created}</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{trans.userManagementTab.actions}</TableCell>
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
                    label={user.status === 'active' ? trans.userManagementTab.active : user.status === 'pending' ? trans.userManagementTab.pending : trans.userManagementTab.inactive}
                    color={user.status === 'active' ? 'success' : user.status === 'pending' ? 'warning' : 'default'}
                    size="small"
                    variant="filled"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_manager ? trans.userManagementTab.yes : trans.userManagementTab.no}
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
    <Stack pl={3} pr={3} spacing={3}>
      <PresentationCard title={trans.userManagementTab.title}>
        <Typography variant="body2" color="text.secondary">
          {trans.userManagementTab.description}
        </Typography>
        <Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={4}>
              <TextField
                size="small"
                fullWidth
                placeholder={trans.userManagementTab.searchPlaceholder}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <Select
                size="small"
                fullWidth
                displayEmpty
                value={filterRole}
                placeholder={trans.userManagementTab.filterByRole}
                onChange={(e) => setFilterRole(e.target.value)}
                renderValue={(selected) => selected || trans.userManagementTab.filterByRole}
              >
                <MenuItem value="">{trans.userManagementTab.allRoles}</MenuItem>
                <MenuItem value="supervisor">{trans.userManagementTab.supervisor}</MenuItem>
                <MenuItem value="representative">{trans.userManagementTab.representative}</MenuItem>
                <MenuItem value="representative_manager">{trans.userManagementTab.representativeManager}</MenuItem>
                <MenuItem value="warehouse">{trans.userManagementTab.warehouseStaff}</MenuItem>
                <MenuItem value="warehouse_manager">{trans.userManagementTab.warehouseManager}</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <Select
                size="small"
                fullWidth
                displayEmpty
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                renderValue={(selected) => selected || trans.userManagementTab.filterByStatus}
              >
                <MenuItem value="">{trans.userManagementTab.allStatuses}</MenuItem>
                <MenuItem value="active">{trans.userManagementTab.active}</MenuItem>
                <MenuItem value="pending">{trans.userManagementTab.pending}</MenuItem>
                <MenuItem value="inactive">{trans.userManagementTab.inactive}</MenuItem>
              </Select>
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
                  background: 'linear-gradient(45deg, #59GBD3 30%, #83PA3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
                }}
              >
                {trans.userManagementTab.search}
              </Button>
            </Grid>

            {/* Refresh Button */}
            <Grid item xs={6} sm={2} md={2}>
              <Button
                size="small"
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  refetch();
                  setSearchText('');
                  setFilterRole('');
                  setFilterStatus('');
                  setFilteredUsers(users || []);
                  setPage(0);
                  setRowsPerPage(10);
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
        {!filterRole && !filterStatus && (
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
      {filterStatus ? (
        <PresentationCard title={`${trans.userManagementTab.usersWithStatus} "${filterStatus}"`}>
          <UserTable users={pagedUsers} />
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage={trans.common.rowsPerPage}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${trans.common.of} ${count}`}
          />
        </PresentationCard>
      ) : filterRole ? (
        // If filtering by role - show only that role card
        <PresentationCard title={getRoleDisplayName(filterRole)}>
          <UserTable users={groupedUsers[filterRole]} sectionName={getRoleDisplayName(filterRole)} />
        </PresentationCard>
      ) : (
        // No filters: show all roles cards
        <>
          <PresentationCard title={trans.userManagementTab.supervisors}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {trans.userManagementTab.supervisorDescription}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <UserTable users={groupedUsers?.supervisor} sectionName={trans.userManagementTab.supervisors} />
          </PresentationCard>

          <PresentationCard title={trans.userManagementTab.representativeManagers}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {trans.userManagementTab.representativeManagerDescription}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <UserTable users={groupedUsers?.representative_manager} sectionName={trans.userManagementTab.representativeManagers} />
          </PresentationCard>

          <PresentationCard title={trans.userManagementTab.representatives}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {trans.userManagementTab.representativeDescription}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <UserTable users={groupedUsers?.representative} sectionName={trans.userManagementTab.representatives} />
          </PresentationCard>

          <PresentationCard title={trans.userManagementTab.warehouseStaff}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {trans.userManagementTab.warehouseStaffDescription}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <UserTable users={groupedUsers?.warehouse} sectionName={trans.userManagementTab.warehouseStaff} />
          </PresentationCard>

          <PresentationCard title={trans.userManagementTab.warehouseManagers}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {trans.userManagementTab.warehouseManagerDescription}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <UserTable users={groupedUsers?.warehouse_manager} sectionName={trans.userManagementTab.warehouseManagers} />
          </PresentationCard>
        </>
      )}
    </Stack>
  );
}

export default UserManagement;
