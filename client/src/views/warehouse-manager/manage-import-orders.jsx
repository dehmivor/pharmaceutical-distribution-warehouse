'use client';
import { Refresh as RefreshIcon, Search as SearchIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import Menu from '@mui/material/Menu';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const trans = useTrans();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [filterDate, setFilterDate] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('all');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterType, setFilterType] = useState('all'); // all | internal | regular
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOrder, setMenuOrder] = useState(null);

  // Internal order dialog states
  const [openInternalDialog, setOpenInternalDialog] = useState(false);
  const [internalOrderLoading, setInternalOrderLoading] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [internalOrderDetails, setInternalOrderDetails] = useState([{ medicine_id: '', quantity: 1 }]);

  // paging
  const [page, setPage] = useState(1); // 1-based
  const [rowsPerPage, setRowsPerPage] = useState(5);
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

  // Fetch medicines for internal order
  const fetchMedicines = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/medicine/all/v1`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setMedicines(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  // Create internal import order
  const createInternalOrder = async () => {
    setInternalOrderLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // Filter out empty medicine selections
      const validDetails = internalOrderDetails.filter((detail) => detail.medicine_id && detail.quantity > 0);

      if (validDetails.length === 0) {
        throw new Error(trans.manageImportOrders.pleaseAddMedicine);
      }

      // Backend sẽ tự động set warehouse_manager_id và created_by
      // Không cần gửi orderData vì endpoint internal sẽ tự xử lý

      const response = await axios.post(
        `${backendUrl}/api/import-orders/internal`,
        {
          orderDetails: validDetails
        },
        {
          headers: getAuthHeaders()
        }
      );

      if (response.data.success) {
        setSuccess(trans.manageImportOrders.internalOrderCreatedSuccess);
        setOpenInternalDialog(false);
        setInternalOrderDetails([{ medicine_id: '', quantity: 1 }]);
        fetchOrders({ page: 1, limit: rowsPerPage }); // Refresh the list
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setInternalOrderLoading(false);
    }
  };

  // Handle internal order detail changes
  const handleInternalDetailChange = (index, field, value) => {
    const newDetails = [...internalOrderDetails];
    newDetails[index][field] = value;
    setInternalOrderDetails(newDetails);
  };

  // Add new medicine row
  const addMedicineRow = () => {
    setInternalOrderDetails([...internalOrderDetails, { medicine_id: '', quantity: 1 }]);
  };

  // Remove medicine row
  const removeMedicineRow = (index) => {
    if (internalOrderDetails.length > 1) {
      const newDetails = internalOrderDetails.filter((_, i) => i !== index);
      setInternalOrderDetails(newDetails);
    }
  };

  const fetchOrders = useCallback(
    async (opts) => {
      const { page: p = 1, limit: l = rowsPerPage, importDate, assigned, status, type } = opts;

      setLoading(true);
      setError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const params = { page: p, limit: l };
        if (importDate) params.createdAt = importDate;
        if (status && status !== 'All Status') params.status = status;

        if (assigned === 'unassigned') {
          params.warehouse_manager_id = '0';
        } else if (assigned === 'self') {
          params.warehouse_manager_id = userId;
        } else if (assigned === 'all') {
        }

        const resp = await axios.get(`${backendUrl}/api/import-orders`, {
          headers: getAuthHeaders(),
          params
        });

        if (resp.data.success) {
          const raw = resp.data.data || [];
          let filtered = raw;
          if (type === 'internal') {
            filtered = raw.filter((o) => !o.contract_id);
          } else if (type === 'regular') {
            filtered = raw.filter((o) => !!o.contract_id);
          }
          setOrders(filtered);
          setTotalCount(resp.data.pagination?.total ?? filtered.length);
        } else {
          throw new Error(resp.data.error || trans.manageImportOrders.failedToLoadOrders);
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        setOrders([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [rowsPerPage, userId]
  );

  useEffect(() => {
    fetchOrders({
      page,
      limit: rowsPerPage,
      importDate: filterDate,
      assigned: filterAssigned,
      status: filterStatus,
      type: filterType
    });
  }, [page, rowsPerPage, filterType]);

  // Load medicines when dialog opens
  useEffect(() => {
    if (openInternalDialog) {
      fetchMedicines();
    }
  }, [openInternalDialog]);

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
      status: filterStatus,
      type: filterType
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
            {trans.manageImportOrders.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {trans.manageImportOrders.description}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenInternalDialog(true)} color="primary">
            {trans.manageImportOrders.createInternalOrder}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchOrders({ page: 1, limit: rowsPerPage })}
            disabled={loading}
          >
            {trans.manageImportOrders.refresh}
          </Button>
        </Stack>
      </Box>

      {/* ─── Filters ───────────────────────────────────── */}
      <Box component={Paper} sx={{ p: 2, mb: 3 }} elevation={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            label={trans.manageImportOrders.importDate}
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            fullWidth
            select
            label={trans.manageImportOrders.assignedTo}
            value={filterAssigned}
            onChange={(e) => setFilterAssigned(e.target.value)}
            size="small"
          >
            <MenuItem value="self">{trans.manageImportOrders.myOrders}</MenuItem>
            <MenuItem value="unassigned">{trans.manageImportOrders.unassigned}</MenuItem>
            <MenuItem value="all">{trans.manageImportOrders.all}</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label={trans.manageImportOrders.type}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            size="small"
          >
            <MenuItem value="all">{trans.manageImportOrders.allTypes}</MenuItem>
            <MenuItem value="internal">{trans.manageImportOrders.internal}</MenuItem>
            <MenuItem value="regular">{trans.manageImportOrders.regular}</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label={trans.manageImportOrders.status}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="small"
          >
            <MenuItem value="All Status">{trans.manageImportOrders.allStatus}</MenuItem>
            {['draft', 'approved', 'rejected', 'delivered', 'checked', 'arranged', 'completed', 'cancelled'].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <Button fullWidth size="small" variant="contained" onClick={handleSearchClick} startIcon={<SearchIcon />}>
            {trans.manageImportOrders.search}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => {
              setFilterDate('');
              setFilterAssigned('all');
              setFilterStatus('All Status');
              setFilterType('all');
              setPage(1);
              fetchOrders({ page: 1, limit: rowsPerPage, type: 'all' });
            }}
          >
            {trans.manageImportOrders.reset}
          </Button>
        </Stack>
      </Box>

      {/* table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{trans.manageImportOrders.importDateCol}</TableCell>
              <TableCell>{trans.manageImportOrders.typeCol}</TableCell>
              <TableCell>{trans.manageImportOrders.contractCode}</TableCell>
              <TableCell>{trans.manageImportOrders.supplier}</TableCell>
              <TableCell>{trans.manageImportOrders.managerEmail}</TableCell>
              <TableCell>{trans.manageImportOrders.statusCol}</TableCell>
              <TableCell>{trans.manageImportOrders.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {trans.manageImportOrders.noOrdersAvailable}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o._id} hover>
                  <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {o.contract_id ? (
                      <Chip label={trans.manageImportOrders.regular} color="primary" size="small" variant="outlined" />
                    ) : (
                      <Chip label={trans.manageImportOrders.internal} color="warning" size="small" />
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
            // Check if this is an internal order (no contract_id)
            if (!menuOrder?.contract_id) {
              // Internal order - go to internal order detail page
              router.push(`/internal-import-orders/${menuOrder?._id}`);
            } else {
              // Regular order - go to regular order detail page
              router.push(`/wm-import-orders/${menuOrder?._id}`);
            }
            handleMenuClose();
          }}
        >
          {trans.manageImportOrders.orderDetail}
        </MenuItem>
      </Menu>

      {/* Internal Order Dialog */}
      <Dialog open={openInternalDialog} onClose={() => setOpenInternalDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div">
            {trans.manageImportOrders.createInternalImportOrder}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {trans.manageImportOrders.createInternalOrderDescription}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {trans.manageImportOrders.orderDetails}
            </Typography>
            {internalOrderDetails.map((detail, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{trans.manageImportOrders.medicine}</InputLabel>
                    <Select
                      value={detail.medicine_id}
                      onChange={(e) => handleInternalDetailChange(index, 'medicine_id', e.target.value)}
                      label={trans.manageImportOrders.medicine}
                    >
                      {medicines.map((medicine) => (
                        <MenuItem key={medicine._id} value={medicine._id}>
                          {medicine.medicine_name} ({medicine.license_code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label={trans.manageImportOrders.quantity}
                    type="number"
                    size="small"
                    value={detail.quantity}
                    onChange={(e) => handleInternalDetailChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton onClick={() => removeMedicineRow(index)} disabled={internalOrderDetails.length === 1} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            <Button variant="outlined" onClick={addMedicineRow} sx={{ mt: 1 }}>
              {trans.manageImportOrders.addMedicine}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInternalDialog(false)}>{trans.manageImportOrders.cancel}</Button>
          <Button onClick={createInternalOrder} variant="contained" disabled={internalOrderLoading}>
            {internalOrderLoading ? <CircularProgress size={20} /> : trans.manageImportOrders.createOrder}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
