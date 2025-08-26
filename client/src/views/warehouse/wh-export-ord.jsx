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
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useTrans from '@/hooks/useTrans';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const getStatusColor = (status) =>
  ({
    approved: 'success',
    returned: 'info',
    rejected: 'warning',
    completed: 'success',
    cancelled: 'error'
  })[status] || 'default';

export default function ManageExportOrders() {
  const router = useRouter();
  const trans = useTrans();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // Remove trans dependency from initial state
  const [filterType, setFilterType] = useState('all'); // Add type filter
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOrder, setMenuOrder] = useState(null);

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Update filterStatus when trans is available
  useEffect(() => {
    if (trans?.common?.allStatus) {
      setFilterStatus(trans.common.allStatus);
    }
  }, [trans?.common?.allStatus]);

  const handleMenuOpen = (e, order) => {
    setAnchorEl(e.currentTarget);
    setMenuOrder(order);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOrder(null);
  };

  const fetchOrders = async (p = null, rpp = null, date = null, status = null, type = null) => {
    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const currentPage = p !== null ? p : page;
      const currentLimit = rpp !== null ? rpp : rowsPerPage;

      // Only apply filters if they are explicitly passed (from Search button)
      const currentDate = date !== null ? date : null;
      const currentStatus = status !== null ? status : null;
      const currentType = type !== null ? type : null;

      const qp = new URLSearchParams();
      qp.append('page', (currentPage + 1).toString());
      qp.append('limit', currentLimit.toString());

      // Always exclude draft status by default
      if (currentStatus && currentStatus !== (trans?.common?.allStatus || 'All Status')) {
        qp.append('status', currentStatus);
      } else {
        // Default: exclude draft, include all other statuses
        const allStatusesExceptDraft = ['approved', 'returned', 'rejected', 'completed', 'cancelled'];
        allStatusesExceptDraft.forEach((s) => qp.append('status', s));
      }

      // Only add date filter if it's provided
      if (currentDate) qp.append('createdAt', currentDate);

      const url = `${backendUrl}/api/export-orders${qp.toString() ? `?${qp.toString()}` : ''}`;
      const resp = await axios.get(url, { headers: getAuthHeaders() });

      if (!resp.data.success) {
        throw new Error(resp.data.error || trans?.common?.failedToLoadOrder || 'Failed to load order');
      }

      let data = resp.data.data || [];

      // Only apply type filtering if type filter is explicitly provided
      if (currentType === 'internal') {
        data = data.filter((o) => !o.contract_id);
      } else if (currentType === 'regular') {
        data = data.filter((o) => !!o.contract_id);
      }

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
  }, [page, rowsPerPage]); // Remove filterDate, filterStatus, filterType from dependencies

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleSearchClick = () => {
    setPage(0);
    setLoading(true); // Add loading state
    fetchOrders(0, rowsPerPage, filterDate, filterStatus, filterType);
  };

  const handleRefresh = () => {
    setLoading(true); // Add loading state
    fetchOrders(page, rowsPerPage); // Don't pass any filters, just refresh current data
  };

  const handleReset = () => {
    setFilterDate('');
    setFilterStatus(trans?.common?.allStatus || 'All Status');
    setFilterType('all');
    setPage(0);
    setLoading(true); // Add loading state
    fetchOrders(0, rowsPerPage, '', trans?.common?.allStatus || 'All Status', 'all');
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
        <Box>
          <Typography variant="h4" gutterBottom>
            {trans?.common?.exportOrdersManagement || 'Export Orders Management'}
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {trans?.common?.manageExportOrderTrackProgress || 'Manage export order, track progress and view status'}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
          {trans?.common?.refresh || 'Refresh'}
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label={trans?.common?.exportDate || 'Export Date'}
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            size="small"
            sx={{ width: 160 }}
            select
            label={trans?.common?.status || 'Status'}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value={trans?.common?.allStatus || 'All Status'}>{trans?.common?.allStatus || 'All Status'}</MenuItem>
            {['approved', 'rejected', 'cancelled'].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={trans?.common?.type || 'Type'}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            size="small"
          >
            <MenuItem value="all">{trans?.common?.allTypes || 'All Types'}</MenuItem>
            <MenuItem value="internal">{trans?.common?.internal || 'Internal'}</MenuItem>
            <MenuItem value="regular">{trans?.common?.regular || 'Regular'}</MenuItem>
          </TextField>
          <Button size="small" variant="contained" startIcon={<SearchIcon />} onClick={handleSearchClick}>
            {trans?.common?.search || 'Search'}
          </Button>
          <Button size="small" variant="outlined" onClick={handleReset}>
            {trans?.common?.reset || 'Reset'}
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{trans?.common?.exportDate || 'Export Date'}</TableCell>
              <TableCell>{trans?.common?.type || 'Type'}</TableCell>
              <TableCell>{trans?.common?.contractCode || 'Contract Code'}</TableCell>
              <TableCell>{trans?.common?.partner || 'Partner'}</TableCell>
              <TableCell>{trans?.common?.managerEmail || 'Manager Email'}</TableCell>
              <TableCell>{trans?.common?.status || 'Status'}</TableCell>
              <TableCell>{trans?.common?.actions || 'Actions'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {trans?.common?.noExportOrdersFound || 'No export orders found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o._id} hover>
                  <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {o.contract_id ? (
                      <Chip label={trans?.common?.regular || 'Regular'} color="primary" size="small" variant="outlined" />
                    ) : (
                      <Chip label={trans?.common?.internal || 'Internal'} color="warning" size="small" />
                    )}
                  </TableCell>
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
        <MenuItem
          onClick={() => {
            router.push(`/wh-export-orders/${menuOrder?._id}`);
            handleMenuClose();
          }}
        >
          {trans?.common?.detail || 'Detail'}
        </MenuItem>
      </Menu>
    </Box>
  );
}
