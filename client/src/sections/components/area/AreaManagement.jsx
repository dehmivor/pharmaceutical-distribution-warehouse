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
  Search as SearchIcon,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import useTrans from '@/hooks/useTrans';
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
  const trans = useTrans();
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
      enqueueSnackbar(trans.common.cannotLoadAreaList, { variant: 'error' });
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
    enqueueSnackbar(trans.common.createAreaSuccess, { variant: 'success' });
  };

  const handleViewClick = (area) => {
    setSelectedArea(area);
    setOpenViewDialog(true);
  };

  const handleEditSuccess = () => {
    setOpenViewDialog(false);
    fetchAreas();
    enqueueSnackbar(trans.common.updateAreaSuccess, { variant: 'success' });
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
        enqueueSnackbar(trans.common.deleteAreaSuccess, { variant: 'success' });
        setOpenDeleteDialog(false);
        setAreaToDelete(null);
        fetchAreas();
      }
    } catch (error) {
      console.error('Error deleting area:', error);
      enqueueSnackbar(error.response?.data?.message || trans.common.cannotDeleteArea, { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getLightColor = (light) => {
    switch (light) {
      case 'none':
        return 'default';
      case 'low':
        return 'warning';
      case 'medium':
        return 'info';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  const getLightLabel = (light) => {
    switch (light) {
      case 'none':
        return trans.common.lightNone;
      case 'low':
        return trans.common.lightLow;
      case 'medium':
        return trans.common.lightMedium;
      case 'high':
        return trans.common.lightHigh;
      default:
        return trans.common.unknown;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {trans.common.areaManagement}
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {trans.common.searchSortFilterArea}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />}>
          {trans.common.refresh}
        </Button>
      </Box>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <SearchIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {trans.common.search}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <TextField placeholder={trans.common.searchByAreaName} value={searchTerm} onChange={handleSearch} sx={{ minWidth: 200 }} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAddDialog(true)} sx={{ borderRadius: 2 }}>
              {trans.common.addArea}
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
                      <TableCell sx={{ fontWeight: 600 }}>{trans.common.areaName}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{trans.common.temperature}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{trans.common.humidity}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{trans.common.light}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        {trans.common.actions}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {areas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body1" color="text.secondary">
                            {trans.common.noAreaData}
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
                            {area.storage_conditions?.temperature ? `${area.storage_conditions.temperature}°C` : trans.common.unknown}
                          </TableCell>
                          <TableCell>
                            {area.storage_conditions?.humidity ? `${area.storage_conditions.humidity}%` : trans.common.unknown}
                          </TableCell>
                          <TableCell>
                            {area.storage_conditions?.light ? (
                              <Chip
                                label={getLightLabel(area.storage_conditions.light)}
                                color={getLightColor(area.storage_conditions.light)}
                                size="small"
                              />
                            ) : (
                              trans.common.unknown
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <Tooltip title={trans.common.viewDetails}>
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleViewClick(area)}
                                  sx={{ bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={trans.common.delete}>
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
                labelRowsPerPage={trans.common.rowsPerPage}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} ${trans.common.of} ${count !== -1 ? count : trans.common.moreThan} ${to}`
                }
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <AreaAddDialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} onSuccess={handleAddSuccess} />

      {/* Detail/Edit Dialog */}
      <AreaDetailDialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} area={selectedArea} onSuccess={handleEditSuccess} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>{trans.common.confirmDelete}</DialogTitle>
        <DialogContent>
          <DialogContentText>{trans.common.confirmDeleteArea?.replace('{name}', areaToDelete?.name || '')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleteLoading}>
            {trans.common.cancel}
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={20} /> : trans.common.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AreaManagement;
