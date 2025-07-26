'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Tooltip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import AreaAddDialog from './AreaAddDialog';
import AreaDetailDialog from './AreaDetailDialog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const AreaManagement = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm })
      });

      const response = await axiosInstance.get(`/api/areas?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setAreas(response.data.data.areas);
        setTotalCount(response.data.data.pagination.totalItems);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
      enqueueSnackbar('Không thể tải danh sách khu vực', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, [page, rowsPerPage, searchTerm]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddSuccess = () => {
    setOpenAddDialog(false);
    fetchAreas();
    enqueueSnackbar('Tạo khu vực thành công', { variant: 'success' });
  };

  const handleViewClick = (area) => {
    setSelectedArea(area);
    setOpenViewDialog(true);
  };

  const handleEditSuccess = () => {
    setOpenViewDialog(false);
    fetchAreas();
    enqueueSnackbar('Cập nhật khu vực thành công', { variant: 'success' });
  };

  const handleDeleteClick = (area) => {
    setAreaToDelete(area);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      const response = await axiosInstance.delete(`/api/areas/${areaToDelete._id}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        enqueueSnackbar('Xóa khu vực thành công', { variant: 'success' });
        setOpenDeleteDialog(false);
        setAreaToDelete(null);
        fetchAreas();
      }
    } catch (error) {
      console.error('Error deleting area:', error);
      enqueueSnackbar(error.response?.data?.message || 'Không thể xóa khu vực', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getLightColor = (light) => {
    switch (light) {
      case 'none': return 'default';
      case 'low': return 'warning';
      case 'medium': return 'info';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getLightLabel = (light) => {
    switch (light) {
      case 'none': return 'none';
      case 'low': return 'low';
      case 'medium': return 'medium';
      case 'high': return 'high';
      default: return 'Không xác định';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Quản Lý Khu Vực
        </Typography>
      </Box>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <SearchIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Tìm Kiếm
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <TextField
              placeholder="Tìm kiếm theo tên khu vực..."
              value={searchTerm}
              onChange={handleSearch}
              sx={{ minWidth: 200 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
              sx={{ borderRadius: 2 }}
            >
              Thêm Khu Vực
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Tên Khu Vực</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Nhiệt Độ</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Độ Ẩm</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Ánh Sáng</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Hành Động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {areas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body1" color="text.secondary">
                            Không có dữ liệu khu vực
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      areas.map((area) => (
                        <TableRow key={area._id} hover>
                          <TableCell>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {area.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {area.storage_conditions?.temperature ? `${area.storage_conditions.temperature}°C` : 'Không xác định'}
                          </TableCell>
                          <TableCell>
                            {area.storage_conditions?.humidity ? `${area.storage_conditions.humidity}%` : 'Không xác định'}
                          </TableCell>
                          <TableCell>
                            {area.storage_conditions?.light ? (
                              <Chip
                                label={getLightLabel(area.storage_conditions.light)}
                                color={getLightColor(area.storage_conditions.light)}
                                size="small"
                              />
                            ) : (
                              'Không xác định'
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <Tooltip title="Xem chi tiết">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleViewClick(area)}
                                  sx={{ bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleDeleteClick(area)}
                                  sx={{ bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Số hàng mỗi trang:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} trong ${count !== -1 ? count : `hơn ${to}`}`
                }
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <AreaAddDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Detail/Edit Dialog */}
      <AreaDetailDialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        area={selectedArea}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa khu vực "{areaToDelete?.name}" không? 
            Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleteLoading}>
            Hủy
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={20} /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AreaManagement; 