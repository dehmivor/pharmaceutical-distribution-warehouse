'use client';
import { Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Stack
} from '@mui/material';
import Menu from '@mui/material/Menu';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const getStatusColor = (status) =>
  ({
    draft: 'default',
    approved: 'success',
    delivered: 'info',
    checked: 'warning',
    arranged: 'primary',
    completed: 'success',
    cancelled: 'error'
  })[status] || 'default';

export default function ManageImportOrders() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | internal | regular
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOrder, setMenuOrder] = useState(null);

  // paging
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const handleMenuOpen = (e, order) => {
    setAnchorEl(e.currentTarget);
    setMenuOrder(order);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOrder(null);
  };

  const fetchOrders = async (customPage = null, customRowsPerPage = null, customDate = null, customStatus = null, customType = null) => {
    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const currentPage = customPage !== null ? customPage : page;
      const currentLimit = customRowsPerPage !== null ? customRowsPerPage : rowsPerPage;
      const currentDate = customDate !== null ? customDate : filterDate;
      const currentStatus = customStatus !== null ? customStatus : filterStatus;
      const currentType = customType !== null ? customType : filterType;

      const currentStatusParams = currentStatus ? [currentStatus] : ['delivered', 'arranged'];

      const queryParams = new URLSearchParams();

      // Add pagination params (convert to 1-based for backend)
      queryParams.append('page', (currentPage + 1).toString());
      queryParams.append('limit', currentLimit.toString());

      if (currentDate) {
        queryParams.append('createdAt', currentDate);
      }

      currentStatusParams.forEach((status) => {
        queryParams.append('status', status);
      });

      const queryString = queryParams.toString();
      const url = `${backendUrl}/api/import-orders${queryString ? `?${queryString}` : ''}`;

      const resp = await axios.get(url, {
        headers: getAuthHeaders()
      });

      if (resp.data.success) {
        const responseData = resp.data.data || [];
        // Apply client-side type filter
        let filtered = responseData;
        if (currentType === 'internal') filtered = responseData.filter((o) => !o.contract_id);
        else if (currentType === 'regular') filtered = responseData.filter((o) => !!o.contract_id);

        setOrders(filtered);

        const pag = resp.data.pagination;
        setTotalCount(pag?.total ?? filtered.length);
      } else {
        throw new Error(resp.data.error || 'Failed to load orders');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(undefined, undefined, undefined, undefined, filterType);
  }, [page, rowsPerPage, filterDate, filterStatus, filterType]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleSearchClick = () => {
    setPage(0);
    fetchOrders(0, rowsPerPage, filterDate, filterStatus, filterType);
  };

  const handleRefresh = () => {
    fetchOrders(page, rowsPerPage, filterDate, filterStatus, filterType);
  };

  const handleReset = () => {
    setFilterDate('');
    setFilterStatus('');
    setFilterType('all');
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', height: '50vh', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Error Snackbar */}
      {error && (
        <Snackbar open={Boolean(error)} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Import Orders Management
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Manage and track import orders for the warehouse
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
          Refresh
        </Button>
      </Box>

      <Box component={Paper} sx={{ p: 2, mb: 3 }} elevation={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            label="Import Date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            fullWidth
            select
            label="Trạng thái"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="small"
          >
            <MenuItem value="">Tất cả</MenuItem>
            {['delivered', 'arranged'].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            size="small"
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="internal">Internal</MenuItem>
            <MenuItem value="regular">Regular</MenuItem>
          </TextField>

          <Button fullWidth variant="contained" onClick={handleSearchClick} startIcon={<SearchIcon />}>
            Search
          </Button>
          <Button fullWidth variant="outlined" onClick={handleReset}>
            Reset
          </Button>
        </Stack>
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Import Date</TableCell>
              <TableCell>Contract Code</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Manager Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No orders available.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o._id} hover>
                  <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{o.contract_id?.contract_code || '—'}</TableCell>
                  <TableCell>{o.contract_id?.partner_id?.name || '—'}</TableCell>
                  <TableCell>{o.warehouse_manager_id?.email || '—'}</TableCell>
                  <TableCell>
                    <Chip label={o.status} color={getStatusColor(o.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={(e) => handleMenuOpen(e, o)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {!!menuOrder?.contract_id && (
          <MenuItem
            onClick={() => {
              router.push(`/wh-create-inspections/with-import-ord/${menuOrder?._id}`);
              handleMenuClose();
            }}
          >
            Create Inspection
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            // Internal orders have no contract_id, navigate to the new internal WH page
            if (!menuOrder?.contract_id) {
              router.push(`/wh-internal-import-orders/${menuOrder?._id}`);
            } else {
              router.push(`/wh-import-orders/${menuOrder?._id}`);
            }
            handleMenuClose();
          }}
        >
          Detail
        </MenuItem>
      </Menu>
    </Box>
  );
}
