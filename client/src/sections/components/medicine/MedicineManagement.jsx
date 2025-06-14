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
  InputAdornment
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import axios from 'axios';
import MedicineDetailDialog from './MedicineDetailDialog'; // Import the detail dialog component

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';


const MedicineManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    medicine_name: '',
    category: '',
    dosage_form: '',
    target_customer: '',
    unit_of_measure: ''
  });
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    dosage_forms: [],
    target_customers: [],
    units_of_measure: []
  });
  
  // Dialog states
  const [openViewDialog, setOpenViewDialog] = useState(false);
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
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });
      
      const response = await axios.get(`${API_BASE_URL}/medicine?${params}`);
      
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
      const response = await axios.get(`${API_BASE_URL}/medicine/filter-options`);
      if (response.data.success) {
        setFilterOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Delete medicine
  const handleDeleteMedicine = async () => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/medicine/${selectedMedicine._id}`);
      
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
    setFilters(prev => ({
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
      <Typography variant="h4" gutterBottom>
        Quản lý Thuốc
      </Typography>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Bộ lọc
          </Typography>
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Tên thuốc"
                value={filters.medicine_name}
                onChange={(e) => handleFilterChange('medicine_name', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Danh mục"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="dosage-form-label">Dạng bào chế</InputLabel>
                <Select
                  labelId="dosage-form-label"
                  value={filters.dosage_form}
                  onChange={(e) => handleFilterChange('dosage_form', e.target.value)}
                  label="Dạng bào chế"
                  sx={{ minWidth: 150 }} // Ensure minimum width for label visibility
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {filterOptions.dosage_forms.map((form) => (
                    <MenuItem key={form} value={form}>{form}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="target-customer-label">Đối tượng KH</InputLabel>
                <Select
                  labelId="target-customer-label"
                  value={filters.target_customer}
                  onChange={(e) => handleFilterChange('target_customer', e.target.value)}
                  label="Đối tượng KH"
                  sx={{ minWidth: 150 }} // Ensure minimum width for label visibility
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {filterOptions.target_customers.map((customer) => (
                    <MenuItem key={customer} value={customer}>{customer}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="unit-of-measure-label">Đơn vị đo</InputLabel>
                <Select
                  labelId="unit-of-measure-label"
                  value={filters.unit_of_measure}
                  onChange={(e) => handleFilterChange('unit_of_measure', e.target.value)}
                  label="Đơn vị đo"
                  sx={{ minWidth: 150 }} // Ensure minimum width for label visibility
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {filterOptions.units_of_measure.map((unit) => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
          <Typography
            sx={{ flex: '1 1 100%' }}
            variant="h6"
            component="div"
          >
            Danh sách thuốc
          </Typography>
        </Toolbar>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên thuốc</TableCell>
                <TableCell>Mã thuốc</TableCell>
                <TableCell>Danh mục</TableCell>
                <TableCell>Dạng bào chế</TableCell>
                <TableCell>Đối tượng KH</TableCell>
                <TableCell>Đơn vị đo</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medicines.map((medicine) => (
                <TableRow key={medicine._id}>
                  <TableCell>{medicine.medicine_name}</TableCell>
                  <TableCell>{medicine.medicine_code}</TableCell>
                  <TableCell>{medicine.category}</TableCell>
                  <TableCell>
                    <Chip label={medicine.dosage_form} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={medicine.target_customer} size="small" color="primary" />
                  </TableCell>
                  <TableCell>{medicine.unit_of_measure}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => {
                        setSelectedMedicine(medicine);
                        setOpenViewDialog(true);
                      }}
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setSelectedMedicine(medicine);
                        setOpenDeleteDialog(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
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
        />
      </Paper>

      <MedicineDetailDialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        medicine={selectedMedicine}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa thuốc "{selectedMedicine?.medicine_name}" không?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
          <Button onClick={handleDeleteMedicine} color="error" variant="contained">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicineManagement;