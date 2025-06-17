'use client';
import React, { useState, useMemo } from 'react';
import {
  Card,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import { Person as PersonIcon, Edit as EditIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useUsers from '@/hooks/useUser';

function ContentSection({ activeTab }) {
  const theme = useTheme();
  const { users, loading, error, refetch } = useUsers();

  // ✅ Sử dụng useMemo để tối ưu và filter theo role thay vì organization
  const { supervisorUsers, representativeUsers, warehouseUsers } = useMemo(() => {
    // Đảm bảo users là array trước khi filter
    const safeUsers = Array.isArray(users) ? users : [];

    // Debug để kiểm tra dữ liệu
    console.log('All users:', safeUsers);
    console.log('Sample user structure:', safeUsers[0]);

    return {
      supervisorUsers: safeUsers.filter((user) => user?.role === 'supervisor'),
      representativeUsers: safeUsers.filter((user) => user?.role === 'representative'),
      warehouseUsers: safeUsers.filter((user) => user?.role === 'warehouse')
    };
  }, [users]);

  // ✅ Cập nhật getLevelColor để phù hợp với role
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

  // ✅ Helper function để format role display name
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
                <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Updated Date</TableCell>
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
                        <PersonIcon fontSize="small" />
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
                    <Typography variant="body2" color="text.secondary">
                      {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton size="small" color="primary" sx={{ borderRadius: 2 }}>
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

  // ✅ Hiển thị loading state cho toàn bộ component
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
      {activeTab === 0 && (
        <Box>
          {/* Supervisor Users Section */}
          <Accordion
            defaultExpanded
            sx={{ mb: 2, '&:before': { display: 'none' }, borderRadius: 3, overflow: 'hidden', boxShadow: theme.shadows[2] }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600} color="primary">
                Supervisors ({supervisorUsers.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <UserTable users={supervisorUsers} sectionName="Supervisors" />
            </AccordionDetails>
          </Accordion>

          {/* Representative Users Section */}
          <Accordion
            defaultExpanded
            sx={{ mb: 2, '&:before': { display: 'none' }, borderRadius: 3, overflow: 'hidden', boxShadow: theme.shadows[2] }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600} color="secondary">
                Representatives ({representativeUsers.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <UserTable users={representativeUsers} sectionName="Representatives" />
            </AccordionDetails>
          </Accordion>

          {/* Warehouse Users Section */}
          <Accordion
            defaultExpanded
            sx={{ mb: 2, '&:before': { display: 'none' }, borderRadius: 3, overflow: 'hidden', boxShadow: theme.shadows[2] }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600} color="info">
                Warehouse ({warehouseUsers.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <UserTable users={warehouseUsers} sectionName="Warehouse" />
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {activeTab === 1 && (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3, boxShadow: theme.shadows[2] }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Permissions Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This section will contain permission management functionality
            </Typography>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ContentSection;
