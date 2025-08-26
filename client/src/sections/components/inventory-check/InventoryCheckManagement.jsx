'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField
} from '@mui/material';
import { Visibility as ViewIcon, Add as AddIcon, Cancel as CancelIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import axios from 'axios';
import { useRole } from '@/contexts/RoleContext';
import useTrans from '@/hooks/useTrans';
import InventoryCheckAddDialog from './InventoryCheckAddDialog';
import InventoryCheckDetailDialog from './InventoryCheckDetailDialog';

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

const InventoryCheckManagement = () => {
  const trans = useTrans();
  const { userRole, isLoading } = useRole();
  const [inventoryCheckOrders, setInventoryCheckOrders] = useState([]);
  const [warehouseManagers, setWarehouseManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    startDate: null,
    endDate: null,
    warehouse_manager_id: ''
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    status: []
  });

  // Dialog states
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedInventoryCheckOrder, setSelectedInventoryCheckOrder] = useState(null);

  // Cancel confirmation dialog
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch inventory check orders
  const fetchInventoryCheckOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== '' && value !== null && value !== undefined))
      });

      // Convert dates to ISO string if they exist
      if (filters.startDate) {
        params.set('startDate', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        params.set('endDate', filters.endDate.toISOString());
      }

      const response = await axiosInstance.get(`/api/inventory-check-orders?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setInventoryCheckOrders(response.data.data.inventoryCheckOrders);
        setFilterOptions(response.data.filterOptions);
        setTotalCount(response.data.data.pagination.total);
      }
    } catch (error) {
      setError('Lỗi khi tải danh sách phiếu kiểm kê');
      console.error('Error fetching inventory check orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch warehouse managers
  const fetchWarehouseManagers = async () => {
    try {
      const response = await axiosInstance.get('/api/supervisor/users?role=warehouse_manager&status=active', {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setWarehouseManagers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching warehouse managers:', error);
    }
  };

  const handleAddInventoryCheckOrderSuccess = () => {
    setOpenAddDialog(false);
    setSuccess(trans.common.createInventoryCheckSuccess);
    fetchInventoryCheckOrders();
  };

  const handleUpdateInventoryCheckOrderSuccess = () => {
    setOpenViewDialog(false);
    setSuccess(trans.common.updateInventoryCheckSuccess);
    fetchInventoryCheckOrders();
  };

  // Handle cancel inventory check order
  const handleCancelClick = (order) => {
    setOrderToCancel(order);
    setOpenCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!orderToCancel) return;

    setCancelling(true);
    try {
      const response = await axiosInstance.put(
        `/api/inventory-check-orders/${orderToCancel._id}`,
        { status: 'cancelled' },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setSuccess(trans.common.cancelInventoryCheckSuccess);
        setTimeout(() => setSuccess(''), 3000);
        fetchInventoryCheckOrders(); // Refresh the list
      } else {
        setError(response.data.message || trans.common.cancelInventoryCheckFailed);
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Cancel inventory check order error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi hủy phiếu kiểm kê';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setCancelling(false);
      setOpenCancelDialog(false);
      setOrderToCancel(null);
    }
  };

  const handleCancelClose = () => {
    setOpenCancelDialog(false);
    setOrderToCancel(null);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
    setPage(0); // Reset to first page when filter changes
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    // Return status as is (English)
    return status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  useEffect(() => {
    if (!isLoading) {
      fetchWarehouseManagers();
    }
  }, [isLoading]);

  useEffect(() => {
    fetchInventoryCheckOrders();
    fetchWarehouseManagers();
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Quản Lý Phiếu Kiểm Kê
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {trans.common.inventoryCheckList}
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
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="medium" sx={{ maxWidth: 200 }}>
                <InputLabel>{trans.common.status}</InputLabel>
                <Select
                  value={filters.status}
                  placeholder="Select Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label={trans.common.status}
                  renderValue={(selected) => (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selected || trans.common.all}
                    </span>
                  )}
                  sx={{ width: 200 }}
                >
                  {filterOptions?.status?.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                  <MenuItem value="">{trans.common.all}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="medium" sx={{ maxWidth: 200 }}>
                <InputLabel>Warehouse Manager</InputLabel>
                <Select
                  value={filters.warehouse_manager_id}
                  type="text"
                  onChange={(e) => handleFilterChange('warehouse_manager_id', e.target.value)}
                  label="Warehouse Manager"
                  placeholder="Select Warehouse Manager"
                  renderValue={(selected) => {
                    const manager = warehouseManagers.find((m) => m._id === selected);
                    return (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {manager ? manager.email : trans.common.all}
                      </span>
                    );
                  }}
                  sx={{ width: 200 }}
                >
                  <MenuItem value="">{trans.common.all}</MenuItem>
                  {warehouseManagers.map((manager) => (
                    <MenuItem key={manager._id} value={manager._id}>
                      {manager.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Từ ngày"
                type="date"
                value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange('startDate', value ? new Date(value) : null);
                }}
                InputLabelProps={{
                  shrink: true // Để label không bị chồng với giá trị ngày
                }}
                fullWidth
                size="medium"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Đến ngày"
                type="date"
                value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange('endDate', value ? new Date(value) : null);
                }}
                InputLabelProps={{
                  shrink: true
                }}
                fullWidth
                size="medium"
              />
            </Grid>
            {userRole === 'supervisor' && (
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  fullWidth
                  size="small"
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
                  Tạo phiếu
                </Button>
              </Grid>
            )}
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
            Danh Sách Phiếu Kiểm Kê
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tổng cộng {totalCount} phiếu kiểm kê
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>{trans.common.inventoryCheckDate}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Warehouse Manager</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Người tạo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{trans.common.status}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {trans.common.actions}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryCheckOrders.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{formatDate(order.inventory_check_date)}</TableCell>
                  <TableCell>
                    <Chip label={order.warehouse_manager_id?.email || 'N/A'} size="small" variant="outlined" color="primary" />
                  </TableCell>
                  <TableCell>
                    <Chip label={order.created_by?.email || 'N/A'} size="small" variant="outlined" color="secondary" />
                  </TableCell>
                  <TableCell>
                    <Chip label={getStatusLabel(order.status)} size="small" color={getStatusColor(order.status)} variant="filled" />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title={trans.common.viewDetails}>
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => {
                            setSelectedInventoryCheckOrder(order);
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

                      {/* Cancel button - only show for pending or processing status */}
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <Tooltip title={trans.common.cancelTicket}>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleCancelClick(order)}
                            sx={{
                              bgcolor: 'error.50',
                              '&:hover': { bgcolor: 'error.100' }
                            }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`}
        />
      </Card>

      {/* Add Dialog */}
      {openAddDialog && (
        <InventoryCheckAddDialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          onSuccess={handleAddInventoryCheckOrderSuccess}
          warehouseManagers={warehouseManagers}
        />
      )}

      {/* Detail/Edit Dialog */}
      {openViewDialog && selectedInventoryCheckOrder && (
        <InventoryCheckDetailDialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          inventoryCheckOrder={selectedInventoryCheckOrder}
          onSuccess={handleUpdateInventoryCheckOrderSuccess}
          warehouseManagers={warehouseManagers}
          isViewMode={true}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={openCancelDialog} onClose={handleCancelClose} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            bgcolor: 'error.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <CancelIcon />
          {trans.common.confirmCancelOrder}
        </DialogTitle>
        <DialogContent sx={{ pt: 5 }}>
          <DialogContentText sx={{ mt: 5 }}>Bạn có chắc chắn muốn hủy phiếu kiểm kê này không?</DialogContentText>
          {orderToCancel && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Thông tin phiếu kiểm kê:
              </Typography>
              <Typography variant="body2">
                {trans.common.cancelOrderDetails
                  .replace('{date}', formatDate(orderToCancel.inventory_check_date))
                  .replace('{manager}', orderToCancel.warehouse_manager?.email || 'N/A')
                  .replace('{status}', getStatusLabel(orderToCancel.status))}
              </Typography>
              <Typography variant="body2">• Warehouse Manager: {orderToCancel.warehouse_manager_id?.email}</Typography>
              <Typography variant="body2"></Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCancelClose} disabled={cancelling} sx={{ textTransform: 'none' }}>
            {trans.common.cancel}
          </Button>
          <Button onClick={handleCancelConfirm} disabled={cancelling} variant="contained" color="error" sx={{ textTransform: 'none' }}>
            {cancelling ? trans.common.cancelling : trans.common.confirmCancel}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryCheckManagement;
