'use client';

import { ArrowDownward as ArrowDownwardIcon, ArrowUpward as ArrowUpwardIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import Menu from '@mui/material/Menu';
import { useEffect, useState } from 'react';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import useTrans from '@/hooks/useTrans';
import { useSnackbar } from 'notistack';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const statusOptions = ['pending', 'processing', 'completed', 'cancelled'];

const CheckOrders = () => {
  const router = useRouter();
  const trans = useTrans();
  const { enqueueSnackbar } = useSnackbar();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOrder, setMenuOrder] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleMenuOpen = (e, order) => {
    setAnchorEl(e.currentTarget);
    setMenuOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOrder(null);
  };

  const fetchOrders = async (customPage = null, customSortDirection = null) => {
    if (!localStorage.getItem('auth-token')) {
      setError('Bạn chưa đăng nhập hoặc token hết hạn.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      const currentPage = customPage !== null ? customPage : page;
      const currentSortDirection = customSortDirection !== null ? customSortDirection : sortDirection;

      params.append('page', String(currentPage + 1));
      params.append('limit', String(rowsPerPage));

      if (filterStatus) params.append('status', filterStatus);
      if (filterDate) {
        const startDate = new Date(filterDate);
        const startIso = new Date(startDate.setHours(0, 0, 0, 0)).toISOString();
        const endIso = new Date(startDate.setHours(23, 59, 59, 999)).toISOString();

        params.append('startDate', startIso);
        params.append('endDate', endIso);
      }
      if (searchTerm.trim() !== '') {
        params.append('searchBy', 'created_by');
        params.append('search', searchTerm.trim());
      }
      if (currentSortDirection) {
        params.append('sortBy', 'updatedAt');
        params.append('sortDirection', currentSortDirection);
      }

      const res = await axiosInstance.get(`/api/inventory-check-orders?${params.toString()}`, {
        headers: getAuthHeaders()
      });

      if (res.data.success) {
        setOrders(res.data.data.inventoryCheckOrders || []);
        setTotalCount(res.data.data.pagination?.total || 0);
      } else {
        setError(trans?.checkOrders?.errorLoadingCheckOrders || 'Error loading check orders');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải phiếu kiểm kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load lần đầu
    fetchOrders(0, 'asc');
  }, []);

  const handleFilterChange = (field, value) => {
    switch (field) {
      case 'status':
        setFilterStatus(value);
        break;
      case 'date':
        setFilterDate(value);
        break;
      case 'search by created by':
        setSearchTerm(value);
        break;
      case 'sortDirection':
        setSortDirection(value);
        break;
      default:
        break;
    }
    setPage(0);
    // Không auto fetch, chờ người dùng nhấn Search
  };

  const handleSearchClick = () => {
    setPage(0);
    fetchOrders(0);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterDate('');
    setSortDirection('asc');
    setPage(0);
    fetchOrders(0, 'asc');
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    fetchOrders(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    const newRpp = parseInt(event.target.value, 10);
    setRowsPerPage(newRpp);
    setPage(0);
    fetchOrders(0);
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');
  const formatDateTime = (d) => (d ? new Date(d).toLocaleString('vi-VN', { hour12: false }) : '');

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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {trans?.checkOrders?.title || 'List of Inventory Check Orders'}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        {trans?.checkOrders?.description ||
          'Manage and track inventory check orders. You can filter, search, and view details of each inventory slip.'}
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component={Paper} sx={{ p: 2, mb: 3 }} elevation={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label={trans?.checkOrders?.search || 'Search by created by'}
            placeholder={trans?.checkOrders?.searchPlaceholder || 'Search by Created By'}
            value={searchTerm}
            onChange={(e) => handleFilterChange('search by created by', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }}
          />
          <TextField
            fullWidth
            label={trans?.checkOrders?.inventoryDate || 'Inventory Date'}
            type="date"
            value={filterDate}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            fullWidth
            select
            label={trans?.checkOrders?.status || 'Status'}
            value={filterStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            size="small"
          >
            <MenuItem value="">{trans?.checkOrders?.all || 'All'}</MenuItem>
            {statusOptions.map((s) => (
              <MenuItem key={s} value={s}>
                {trans.checkOrders[s] || s.charAt(0).toUpperCase() + s.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
            onClick={() => {
              const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
              setSortDirection(newDirection);
              fetchOrders(0, newDirection);
            }}
          >
            {sortDirection === 'asc' ? trans?.checkOrders?.ascending || 'Ascending' : trans?.checkOrders?.descending || 'Descending'}
          </Button>

          <Button fullWidth size="small" variant="contained" onClick={handleSearchClick} startIcon={<SearchIcon />}>
            {trans?.checkOrders?.search || 'Search'}
          </Button>
          <Button fullWidth size="small" variant="outlined" onClick={handleReset}>
            {trans?.checkOrders?.refresh || 'Refresh'}
          </Button>
        </Stack>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>
              <TableCell>{trans?.checkOrders?.id || 'ID'}</TableCell>
              <TableCell>{trans?.checkOrders?.inventoryDate || 'Inventory Date'}</TableCell>
              <TableCell>{trans?.checkOrders?.warehouseManager || 'Warehouse Manager'}</TableCell>
              <TableCell>{trans?.checkOrders?.createdBy || 'Created By'}</TableCell>
              <TableCell>{trans?.checkOrders?.status || 'Status'}</TableCell>
              <TableCell>{trans?.checkOrders?.notes || 'Notes'}</TableCell>
              <TableCell>{trans?.checkOrders?.createdAt || 'Created At'}</TableCell>
              <TableCell>{trans?.checkOrders?.updatedAt || 'Updated At'}</TableCell>
              <TableCell align="center">{trans?.checkOrders?.actions || 'Actions'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                  {trans?.checkOrders?.noCheckOrders || 'No check orders found'}
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell>{order._id.slice(-6)}</TableCell>
                  <TableCell>{formatDate(order.inventory_check_date)}</TableCell>
                  <TableCell>{order.warehouse_manager_id?.email.split('@')[0] || 'N/A'}</TableCell>
                  <TableCell>{order.created_by?.email.split('@') || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={order.status} size="small" color={getStatusColor(order.status)} variant="filled" />
                  </TableCell>
                  <TableCell>{order.notes || '-'}</TableCell>
                  <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(order.updatedAt)}</TableCell>
                  <TableCell align="center" sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    <IconButton onClick={(e) => handleMenuOpen(e, order)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        labelRowsPerPage={trans?.checkOrders?.rowsPerPage || 'Rows per page'}
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            router.push(`/wm-inventory/check-orders/${menuOrder?._id}`);
            handleMenuClose();
          }}
        >
          {trans?.checkOrders?.viewDetail || 'View Detail'}
        </MenuItem>
        {menuOrder?.status === 'pending' && (
          <MenuItem
            onClick={async () => {
              try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const checkDate = new Date(menuOrder?.inventory_check_date);
                checkDate.setHours(0, 0, 0, 0);

                if (today < checkDate) {
                  const formattedDate = checkDate.toLocaleDateString('vi-VN');
                  enqueueSnackbar(`Chưa đến ngày kiểm kê (${formattedDate}).`, {
                    variant: 'warning'
                  });
                  handleMenuClose();
                  return;
                }

                // Kiểm tra xem có đợt kiểm kê nào đang xử lý không
                const checkRes = await axiosInstance.get(`/api/inventory-check-orders?status=processing&limit=1`, {
                  headers: getAuthHeaders()
                });

                if (
                  checkRes.data.success &&
                  checkRes.data.data.inventoryCheckOrders &&
                  checkRes.data.data.inventoryCheckOrders.length > 0
                ) {
                  enqueueSnackbar('Đang có đợt kiểm kê khác đang xử lý', { variant: 'info' });
                  handleMenuClose();
                  return;
                }

                // Kiểm tra và cập nhật trạng thái nếu cần
                if (menuOrder?.status?.toLowerCase() !== 'processing' && menuOrder?.status?.toLowerCase() === 'pending') {
                  const updateRes = await axiosInstance.patch(
                    `/api/inventory/check-order/${menuOrder?._id}`,
                    { status: 'processing' },
                    { headers: getAuthHeaders() }
                  );

                  if (!updateRes.data?.success || !updateRes.data.updated) {
                    enqueueSnackbar(updateRes.data?.message || 'Không thể cập nhật trạng thái đơn kiểm kê.', { variant: 'error' });
                    handleMenuClose();
                    return;
                  }
                }

                // Gọi trực tiếp API để tạo phiếu kiểm kê
                const createRes = await axiosInstance.post(
                  `/api/inventory/check-order/${menuOrder?._id}`,
                  {},
                  { headers: getAuthHeaders() }
                );

                if (createRes.data?.success) {
                  enqueueSnackbar(createRes.data?.message || 'Đã tạo phiếu kiểm kê cho tất cả vị trí.', {
                    variant: 'success'
                  });
                  // Có thể thêm logic refresh data hoặc chuyển hướng nếu cần
                  window.location.reload();
                } else {
                  enqueueSnackbar(createRes.data?.message || 'Không thể tạo phiếu kiểm kê.', {
                    variant: 'error'
                  });
                }

                handleMenuClose();
              } catch (error) {
                console.error('Lỗi khi tạo phiếu kiểm kê:', error);
                enqueueSnackbar('Lỗi khi tạo phiếu kiểm kê. Vui lòng thử lại.', { variant: 'error' });
                handleMenuClose();
              }
            }}
          >
            {trans?.checkOrders?.startCheckingInventory || 'Start Checking Inventory'}
          </MenuItem>
        )}
        {menuOrder?.status === 'completed' && <MenuItem disabled>{trans?.checkOrders?.alreadyCompleted || 'Already Completed'}</MenuItem>}
        {menuOrder?.status === 'processing' && <MenuItem disabled>{trans?.checkOrders?.inProgress || 'In Progress'}</MenuItem>}
        {menuOrder?.status === 'cancelled' && <MenuItem disabled>{trans?.checkOrders?.cancelled || 'Cancelled'}</MenuItem>}
      </Menu>
    </Box>
  );
};

export default CheckOrders;
