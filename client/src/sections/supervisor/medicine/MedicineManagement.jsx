'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Chip,
  Alert,
  Card,
  CardContent,
  Toolbar,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon
} from '@mui/icons-material';
import axios from 'axios';
import MedicineDetailDialog from './MedicineDetailDialog'; // Import the detail dialog component
import MedicineEditDialog from './MedicineEditDialog'; // Import the edit dialog component
import MedicineAddDialog from './MedicineAddDialog';

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

const MedicineManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    license_code: '',
    category: ''
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    category: []
  });

  // Dialog states
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch medicines
  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      });

      const response = await axiosInstance.get(`/api/medicine?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setMedicines(response.data.data.medicines);
        setTotalCount(response.data.data.pagination.total);
      }
    } catch (error) {
      setError('Lỗi khi tải danh sách thuốc');
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await axiosInstance.get(`/api/medicine/filter-options`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setFilterOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleUpdateMedicine = async (updatedMedicine) => {
    if (!updatedMedicine || !updatedMedicine._id) {
      setError('Không tìm thấy ID thuốc để cập nhật');
      return;
    }

    try {
      const response = await axiosInstance.put(`/api/medicine/${updatedMedicine._id}`, updatedMedicine, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setSuccess('Cập nhật thuốc thành công');
        setOpenEditDialog(false);
        setSelectedMedicine(null);
        fetchMedicines();
      } else {
        setError(response.data.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error('Update medicine error:', err);
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || 'Lỗi khi cập nhật thuốc');
    }
  };

  // Handle add medicine success
  const handleAddMedicineSuccess = () => {
    setSuccess('Thêm thuốc mới thành công');
    fetchMedicines(); // Refresh the list
  };

  // Delete medicine
  const handleDeleteMedicine = async () => {
    try {
      const response = await axios.delete(`/api/medicine/${selectedMedicine._id}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setSuccess('Xóa thuốc thành công');
        setOpenDeleteDialog(false);
        setSelectedMedicine(null);
        fetchMedicines();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Lỗi khi xóa thuốc');
    }
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
    setPage(0); // Reset to first page when filtering
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, [page, rowsPerPage, filters]);

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          Quản Lý Thuốc
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý danh sách thuốc và thông tin chi tiết
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <FilterIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Bộ Lọc Tìm Kiếm
            </Typography>
          </Box>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Số đăng ký"
                value={filters.license_code}
                onChange={(e) => handleFilterChange('license_code', e.target.value)}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="medium" sx={{ maxWidth: 300 }}>
                <InputLabel>Danh mục</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  label="Danh mục"
                  renderValue={(selected) => (
                    <Tooltip title={selected}>
                      <span
                        style={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {selected || 'Tất cả'}
                      </span>
                    </Tooltip>
                  )}
                  sx={{
                    width: 300
                  }}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {filterOptions?.category?.map((cate) => (
                    <MenuItem key={cate} value={cate} title={cate}>
                      {cate}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', ml: 'auto' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddDialog(true)}
                sx={{
                  bgcolor: 'success.main',
                  '&:hover': {
                    bgcolor: 'success.dark'
                  },
                  px: 3,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Thêm thuốc mới
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ border: '1px solid #e0e0e0' }}>
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid #e0e0e0',
            bgcolor: 'grey.50'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Danh Sách Thuốc
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tổng cộng {totalCount} thuốc
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Tên thuốc</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Số đăng ký</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Danh mục</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Đơn vị đo</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Hành động
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medicines.map((medicine) => (
                <TableRow key={medicine._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{medicine.medicine_name}</TableCell>
                  <TableCell>
                    <Chip label={medicine.license_code} size="small" variant="outlined" color="primary" />
                  </TableCell>
                  <TableCell
                    sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    title={medicine.category}
                  >
                    <Chip label={medicine.category} size="small" color="secondary" variant="outlined" />
                  </TableCell>
                  <TableCell>{medicine.unit_of_measure}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => {
                            setSelectedMedicine(medicine);
                            setOpenViewDialog(true);
                          }}
                          sx={{
                            bgcolor: 'primary.50',
                            '&:hover': { bgcolor: 'primary.100' }
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          color="secondary"
                          size="small"
                          onClick={() => {
                            setSelectedMedicine(medicine);
                            setOpenEditDialog(true);
                          }}
                          sx={{
                            bgcolor: 'secondary.50',
                            '&:hover': { bgcolor: 'secondary.100' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Xóa">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => {
                            setSelectedMedicine(medicine);
                            setOpenDeleteDialog(true);
                          }}
                          sx={{
                            bgcolor: 'error.50',
                            '&:hover': { bgcolor: 'error.100' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
          sx={{
            borderTop: '1px solid #e0e0e0',
            bgcolor: 'grey.50'
          }}
        />
      </Card>

      <MedicineDetailDialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} medicine={selectedMedicine} />

      <MedicineEditDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        medicine={selectedMedicine}
        onSubmit={handleUpdateMedicine}
        categoryOptions={filterOptions.category}
      />

      <MedicineAddDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={handleAddMedicineSuccess}
        filterOptions={filterOptions}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        sx={{
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 2,
            px: 3
          }}
        >
          <DeleteIcon sx={{ fontSize: 24 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Xác Nhận Xóa
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Bạn có chắc chắn muốn xóa thuốc này không?
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: 'error.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'error.200'
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
              {selectedMedicine?.medicine_name}
            </Typography>
            <Typography variant="caption" color="error.main">
              Hành động này không thể hoàn tác!
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            borderTop: '1px solid #e0e0e0',
            bgcolor: 'grey.50'
          }}
        >
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            variant="outlined"
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleDeleteMedicine}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #c62828 0%, #d32f2f 100%)'
              }
            }}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicineManagement;
