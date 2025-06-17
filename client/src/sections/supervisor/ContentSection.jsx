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

  // ✅ Sử dụng useMemo để tối ưu và safe filtering
  const { fundOrgUsers, consultantsUsers } = useMemo(() => {
    // Đảm bảo users là array trước khi filter
    const safeUsers = Array.isArray(users) ? users : [];

    return {
      fundOrgUsers: safeUsers.filter((user) => user?.organization === 'Fund.Org'),
      consultantsUsers: safeUsers.filter((user) => user?.organization === 'Consultants')
    };
  }, [users]);

  const getLevelColor = (level) => {
    switch (level) {
      case 'Super Admin':
        return 'error';
      case 'Admin':
        return 'warning';
      case 'Manager':
        return 'info';
      default:
        return 'default';
    }
  };

  const UserTable = ({ users, sectionName }) => {
    // ✅ Kiểm tra loading state trước
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Đang tải dữ liệu...</Typography>
        </Box>
      );
    }

    // ✅ Kiểm tra error state
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

    // ✅ Kiểm tra empty state
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
                <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Level</TableCell>
                <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>
                  Account Created Date
                </TableCell>
                <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Role Created Date</TableCell>
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
                        {user.name || 'N/A'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.level || 'Unknown'}
                      color={getLevelColor(user.level)}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {user.accountCreated ? new Date(user.accountCreated).toLocaleDateString('vi-VN') : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {user.roleCreated ? new Date(user.roleCreated).toLocaleDateString('vi-VN') : 'N/A'}
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
          <Accordion
            defaultExpanded
            sx={{ mb: 2, '&:before': { display: 'none' }, borderRadius: 3, overflow: 'hidden', boxShadow: theme.shadows[2] }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600} color="primary">
                Fund.Org ({fundOrgUsers.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <UserTable users={fundOrgUsers} sectionName="Fund.Org" />
            </AccordionDetails>
          </Accordion>

          <Accordion
            defaultExpanded
            sx={{ mb: 2, '&:before': { display: 'none' }, borderRadius: 3, overflow: 'hidden', boxShadow: theme.shadows[2] }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600} color="secondary">
                Consultants ({consultantsUsers.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <UserTable users={consultantsUsers} sectionName="Consultants" />
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
