'use client';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { ArrowDownward as ArrowDownwardIcon, ArrowUpward as ArrowUpwardIcon } from '@mui/icons-material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
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
import Menu from '@mui/material/Menu';
import { useEffect, useState } from 'react';
import useTrans from '@/hooks/useTrans';

import axios from 'axios';
import { useRouter } from 'next/navigation';

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

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('page', String(page + 1));
      params.append('limit', String(rowsPerPage));

      if (filterStatus) params.append('status', filterStatus);
      if (filterDate) {
        const startDate = new Date(filterDate);
        const startIso = new Date(startDate.setHours(0, 0, 0, 0)).toISOString();
        const endIso = new Date(startDate.setHours(23, 59, 59, 999)).toISOString();

        params.append('startDate', startIso);
        params.append('endDate', endIso);
      }
      if (searchTerm.trim() !== '') params.append('search', searchTerm.trim());
      if (sortDirection) params.append('sortDirection', sortDirection);

      const res = await axiosInstance.get(`/api/inventory-check-orders?${params.toString()}`, {
        headers: getAuthHeaders()
      });

      if (res.data.success) {
        setOrders(res.data.data.inventoryCheckOrders || []);
        setTotalCount(res.data.data.pagination?.total || 0);
      } else {
        setError(res.data.message || trans.common.errorLoadingInventoryCheckOrders);
      }
    } catch (err) {
      console.error(err);
      setError(trans.common.errorLoadingInventoryCheckOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, filterStatus, filterDate, sortDirection]);

  const handleFilterChange = (field, value) => {
    switch (field) {
      case 'status':
        setFilterStatus(value);
        break;
      case 'date':
        setFilterDate(value);
        break;
      case 'search':
        setSearchTerm(value);
        break;
      case 'sortDirection':
        setSortDirection(value);
        break;
      default:
        break;
    }
    setPage(0);
  };

  const handleSearchClick = () => {
    // Vì đã lọc theo từng biến và fetch tự động load effect, chỉ cần fetchOrders nếu muốn gọi lại ngay
    fetchOrders();
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterDate('');
    setSortDirection('asc');
    setPage(0);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
        {trans?.checkOrders?.description || 'Manage and track inventory check orders. You can filter, search, and view details of each inventory slip.'}
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box component={Paper} sx={{ p: 2, mb: 3 }} elevation={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label={trans.common.search}
            placeholder={trans.common.search}
            value={searchTerm}
            onChange={(e) => handleFilterChange('search', e.target.value)}
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
            label={trans.common.checkDate}
            type="date"
            value={filterDate}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            fullWidth
            select
            label={trans.common.status}
            value={filterStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            size="small"
          >
            <MenuItem value="">{trans.common.all}</MenuItem>
            {statusOptions.map((s) => (
              <MenuItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
            onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          >
            {sortDirection === 'asc' ? trans.common.ascending : trans.common.descending}
          </Button>

          <Button fullWidth size="small" variant="contained" onClick={handleSearchClick} startIcon={<SearchIcon />}>
            {trans.common.search}
          </Button>
          <Button fullWidth size="small" variant="outlined" onClick={handleReset}>
            {trans.common.refresh}
          </Button>
        </Stack>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>
              <TableCell>{trans.common.inspectionId}</TableCell>
              <TableCell>{trans.common.inspectionDate}</TableCell>
              <TableCell>{trans.common.warehouseManager}</TableCell>
              <TableCell>{trans.common.createdBy}</TableCell>
              <TableCell>{trans.common.status}</TableCell>
              <TableCell>{trans.common.notes}</TableCell>
              <TableCell>{trans.common.createdDate}</TableCell>
              <TableCell>{trans.common.updatedDate}</TableCell>
              <TableCell align="center">{trans.common.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  {trans.common.noInventoryCheckOrdersFound}
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell>{order._id.slice(-6)}</TableCell>
                  <TableCell>{formatDate(order.inventory_check_date)}</TableCell>
                  <TableCell>{order.warehouse_manager_id?.email.split('@')[0] || 'N/A'}</TableCell>
                  <TableCell>{order.created_by?.email.split('@')[0] || 'N/A'}</TableCell>
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
        labelRowsPerPage={trans.common.rowsPerPage}
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} ${trans.common.of} ${count !== -1 ? count : `${trans.common.moreThan} ${to}`}`
        }
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
            router.push(`/wh-inventory/check-orders/${menuOrder?._id}`);
            handleMenuClose();
          }}
        >
          {trans.common.viewDetail}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CheckOrders;
