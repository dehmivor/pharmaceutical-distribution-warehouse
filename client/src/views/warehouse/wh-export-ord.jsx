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
    returned: 'info',
    rejected: 'warning',
    completed: 'success',
    cancelled: 'error'
  })[status] || 'default';

export default function ManageExportOrders() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOrder, setMenuOrder] = useState(null);

  // pagination
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

  const fetchOrders = async (p = null, rpp = null, date = null, status = null) => {
    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const currentPage = p !== null ? p : page;
      const currentLimit = rpp !== null ? rpp : rowsPerPage;
      const currentDate = date !== null ? date : filterDate;
      const currentStatus = status !== null ? status : filterStatus;

      // allow multiple status values if needed; here just one
      const statusParams = currentStatus ? [currentStatus] : ['approved'];

      const qp = new URLSearchParams();
      qp.append('page', (currentPage + 1).toString());
      qp.append('limit', currentLimit.toString());
      if (currentDate) qp.append('createdAt', currentDate);
      statusParams.forEach(s => qp.append('status', s));

      const url = `${backendUrl}/api/export-orders${qp.toString() ? `?${qp.toString()}` : ''}`;
      const resp = await axios.get(url, { headers: getAuthHeaders() });

      if (!resp.data.success) {
        throw new Error(resp.data.error || 'Failed to load export orders');
      }

      const data = resp.data.data || [];
      setOrders(data);

      // derive total count
      const pag = resp.data.pagination;
      setTotalCount(pag?.total ?? data.length);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, filterDate, filterStatus]);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = e => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleSearchClick = () => {
    setPage(0);
    fetchOrders(0, rowsPerPage, filterDate, filterStatus);
  };

  const handleRefresh = () => {
    fetchOrders(page, rowsPerPage, filterDate, filterStatus);
  };

  const handleReset = () => {
    setFilterDate('');
    setFilterStatus('');
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
      {error && (
        <Snackbar open autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Export Orders Management</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Export Date"
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            select
            label="Status"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            size="small"
          >
            <MenuItem value="">All</MenuItem>
            {['approved'].map(s => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearchClick}>
            Search
          </Button>
          <Button variant="outlined" onClick={handleReset}>
            Reset
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Export Date</TableCell>
              <TableCell>Contract Code</TableCell>
              <TableCell>Partner</TableCell>
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
                    No export orders found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map(o => (
                <TableRow key={o._id} hover>
                  <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{o.contract_id?.contract_code || '—'}</TableCell>
                  <TableCell>{o.contract_id?.partner_id?.name || '—'}</TableCell>
                  <TableCell>{o.warehouse_manager_id?.email || '—'}</TableCell>
                  <TableCell>
                    <Chip label={o.status} color={getStatusColor(o.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={e => handleMenuOpen(e, o)}>
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
        <MenuItem
          onClick={() => {
            router.push(`/wh-create-export-inspections/${menuOrder?._id}`);
            handleMenuClose();
          }}
        >
          Create Inspection
        </MenuItem>
        <MenuItem
          onClick={() => {
            router.push(`/update-export-location/${menuOrder?._id}`);
            handleMenuClose();
          }}
        >
          Update Location
        </MenuItem>
        <MenuItem
          onClick={() => {
            router.push(`/wh-export-orders/${menuOrder?._id}`);
            handleMenuClose();
          }}
        >
          Detail
        </MenuItem>
      </Menu>
    </Box>
  );
}
