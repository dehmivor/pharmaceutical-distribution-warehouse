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
  const [filterAssigned, setFilterAssigned] = useState('all'); // 'self' | 'unassigned'
  const [filterStatus, setFilterStatus] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOrder, setMenuOrder] = useState(null);

  // paging
  const [page, setPage] = useState(1); // 1-based
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

  const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const userId = userData.userId;

  const fetchOrders = useCallback(
    async (opts) => {
      const { page: p = 1, limit: l = rowsPerPage, importDate, assigned, status } = opts;

      setLoading(true);
      setError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const params = { page: p, limit: l };
        if (importDate) params.createdAt = importDate;
        if (status) params.status = status;

        // map our “Assigned To” dropdown into the back‑end’s warehouse_manager_id param:
        if (assigned === 'unassigned') {
          params.warehouse_manager_id = '0';
        } else if (assigned === 'self') {
          console.log(userId);
          params.warehouse_manager_id = userId;
        }

        const resp = await axios.get(`${backendUrl}/api/import-orders`, {
          headers: getAuthHeaders(),
          params
        });

        if (resp.data.success) {
          setOrders(resp.data.data);
          // your API should return pagination.total
          setTotalCount(resp.data.pagination?.total ?? resp.data.data.length);
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
    },
    [page, rowsPerPage, filterDate, filterAssigned, filterStatus]
  );

  useEffect(() => {
    fetchOrders({
      page,
      limit: rowsPerPage,
      importDate: filterDate,
      assigned: filterAssigned,
      status: filterStatus
    });
  }, [page, rowsPerPage]);

  // … your handlers …
  const handleChangePage = (_e, newZero) => {
    setPage(newZero + 1);
  };
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(1);
  };
  const handleSearchClick = () => {
    setPage(1);
    fetchOrders({
      page: 1,
      limit: rowsPerPage,
      importDate: filterDate,
      assigned: filterAssigned,
      status: filterStatus
    });
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
      {/* Header + Refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Import Orders Management
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchOrders({ page: 1, limit: rowsPerPage })}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* ─── Filters ───────────────────────────────────── */}
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
            <MenuItem value="">Tất cả</MenuItem> {/* value rỗng nghĩa là không lọc trạng thái */}
            {['delivered', 'arranged'].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>

          <Button fullWidth variant="contained" onClick={handleSearchClick} startIcon={<SearchIcon />}>
            Search
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setFilterDate('');
              setFilterAssigned('all');
              setFilterStatus('');
              setPage(1);
              fetchOrders({ page: 1, limit: rowsPerPage });
            }}
          >
            Reset
          </Button>
        </Stack>
      </Box>

      {/* table */}
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
            {orders.filter((o) => o.status === 'delivered' || o.status === 'checked').length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No orders available.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders
                .filter((o) => o.status === 'delivered' || o.status === 'checked')
                .map((o) => (
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
          page={page - 1}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            router.push(`/wh-create-inspections/${menuOrder?._id}`);
            handleMenuClose();
          }}
        >
          Create Inspection
        </MenuItem>
        <MenuItem
          onClick={() => {
            router.push(`/update-location/${menuOrder?._id}`);
            handleMenuClose();
          }}
        >
          Update Location
        </MenuItem>
        <MenuItem
          onClick={() => {
            router.push(`/wh-import-orders/${menuOrder?._id}`);
            handleMenuClose();
          }}
        >
          Detail
        </MenuItem>
      </Menu>
    </Box>
  );
}
