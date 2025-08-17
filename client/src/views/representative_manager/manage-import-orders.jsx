'use client';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  TablePagination
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import StatusChangeDialog from '@/components/StatusChangeDialog';
import { useRole } from '@/contexts/RoleContext';
import useTrans from '@/hooks/useTrans';

import { sendError } from 'next/dist/server/api-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const RepresentativeManagerImportOrders = () => {
  const { user, userRole, isLoading } = useRole();
  const trans = useTrans();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusDialog, setStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    contract_type: '',
    created_by: ''
  });

  // Add applied filters state to separate current filters from applied ones
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    contract_type: '',
    created_by: ''
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    status: [],
    contract_type: [],
    created_by: []
  });

  const [contracts, setContracts] = useState([]);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [contractMedicines, setContractMedicines] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  
  // Store original data for filtering
  const [allOrdersData, setAllOrdersData] = useState([]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      console.log('Fetching from:', `${backendUrl}/api/import-orders`);
      console.log('Auth headers:', getAuthHeaders());
      
      const response = await axios.get(`${backendUrl}/api/import-orders`, {
        headers: getAuthHeaders(),
        timeout: 10000 // 10 seconds timeout
      });
      
      console.log('API Response:', response.data);

      if (response.data.success) {
        const allOrders = response.data.data || [];
        console.log('All import orders:', allOrders);
        
        // Store original data for filtering
        setAllOrdersData(allOrders);
        
        // Apply current filters to the new data
        applyFiltersToData(allOrders);
        
        // Generate filter options from data
        const statusOptions = [...new Set(allOrders.map(order => order.status))];
        const contractTypeOptions = [...new Set(allOrders.map(order => order.contract_id?.contract_type).filter(Boolean))];
        const createdByOptions = [...new Set(allOrders.map(order => order.created_by?.email).filter(Boolean))];
        
        setFilterOptions({
          status: statusOptions,
          contract_type: contractTypeOptions,
          created_by: createdByOptions.map(email => ({ email }))
        });
      } else {
        throw new Error(response.data.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      let errorMsg = trans.representativeManagerImportOrders.messages.failedToFetch;

      if (error.code === 'ECONNABORTED') {
        errorMsg = trans.representativeManagerImportOrders.messages.requestTimeout;
      } else if (error.code === 'ERR_NETWORK') {
        errorMsg = trans.representativeManagerImportOrders.messages.networkError;
      } else if (error.response) {
        errorMsg = error.response.data?.error || error.response.statusText;
      } else if (error.message) {
        errorMsg = error.message;
      }

      setError(errorMsg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, appliedFilters]);

  const fetchContracts = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/contract?partner_type=Supplier&status=active`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setContracts(response.data.data.contracts || []);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  }, []);

  // Fetch active contract medicines including annexes
  const fetchContractMedicines = useCallback(async (contractId) => {
    if (!contractId) {
      setContractMedicines([]);
      return;
    }
    
    try {
      setLoadingMedicines(true);
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/contract/${contractId}/medicines`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setContractMedicines(response.data.data || []);
      } else {
        setContractMedicines([]);
      }
    } catch (error) {
      console.error('Error fetching contract medicines:', error);
      setContractMedicines([]);
    } finally {
      setLoadingMedicines(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchContracts();
  }, []); // Only run once on mount

  // Apply filters when page or rowsPerPage changes
  useEffect(() => {
    if (allOrdersData.length > 0) {
      applyFiltersToData();
    }
  }, [page, rowsPerPage, appliedFilters]);

  const handleStatusChange = useCallback(async () => {
    if (!selectedOrder || !selectedOrder._id || !selectedOrder.nextStatus) return;

    const newStatus = selectedOrder.nextStatus;

    try {
      setUpdatingStatus(true);
      setError('');

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.patch(
        `${backendUrl}/api/import-orders/${selectedOrder._id}/status`,
        { status: newStatus },
        {
          headers: getAuthHeaders(),
          timeout: 10000 // 10 seconds timeout
        }
      );

      if (response.data.success) {
        setSuccess(`${trans.representativeManagerImportOrders.messages.statusUpdateSuccess} ${newStatus}`);
        setStatusDialog(false);
        setSelectedOrder(null);
        fetchOrders(); // Refresh the list


      } else {
        throw new Error(response.data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      let errorMsg = trans.representativeManagerImportOrders.messages.failedToUpdateStatus;

      if (error.code === 'ECONNABORTED') {
        errorMsg = trans.representativeManagerImportOrders.messages.requestTimeout;
      } else if (error.code === 'ERR_NETWORK') {
        errorMsg = trans.representativeManagerImportOrders.messages.networkError;
      } else if (error.response) {
        errorMsg = error.response.data?.error || error.response.statusText;
      } else if (error.message) {
        errorMsg = error.message;
      }

      setError(errorMsg);
    } finally {
      setUpdatingStatus(false);
    }
  }, [selectedOrder, fetchOrders]);

  const handleOpenStatusDialog = useCallback((orderWithNextStatus) => {
    setSelectedOrder(orderWithNextStatus);
    setStatusDialog(true);
  }, []);

  const handleCloseStatusDialog = useCallback(() => {
    setStatusDialog(false);
    setSelectedOrder(null);
  }, []);

  const handleViewDetails = useCallback(async (order) => {
    setSelectedOrderForDetails(order);
    setDetailsDialog(true);
    
    // Fetch contract medicines when viewing details
    if (order.contract_id?._id) {
      await fetchContractMedicines(order.contract_id._id);
    }
  }, [fetchContractMedicines]);

  const handleCloseDetailsDialog = useCallback(() => {
    setDetailsDialog(false);
    setSelectedOrderForDetails(null);
  }, []);

  // Check if order can be edited by representative manager
  const canEditOrder = (order) => {
    // Representative Manager can only edit draft orders
    return order.status === 'draft';
  };

  // Check if order is locked (cannot be edited)
  const isOrderLocked = (order) => {
    // Orders are locked after becoming delivered or subsequent statuses
    const lockedStatuses = ['delivered', 'checked', 'arranged', 'completed'];
    return lockedStatuses.includes(order.status);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'delivered':
        return 'info';
      case 'checked':
        return 'warning';
      case 'arranged':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    try {
      return `${Number(value).toLocaleString('en-US')} VND`;
    } catch (error) {
      return '-';
    }
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
    // Remove auto page reset - only reset when applying filters
  };

  // Apply filters to existing data without calling API
  const applyFiltersToData = (dataToFilter = allOrdersData) => {
    // Client-side filtering using appliedFilters
    let filteredOrders = dataToFilter.filter((order) => {
      const matchesSearch = !appliedFilters.search || 
        order._id?.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
        order.contract_id?.partner_id?.name?.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
        order.contract_id?.contract_code?.toLowerCase().includes(appliedFilters.search.toLowerCase());
      
      const matchesStatus = !appliedFilters.status || order.status === appliedFilters.status;
      const matchesContractType = !appliedFilters.contract_type || order.contract_id?.contract_type === appliedFilters.contract_type;
      const matchesCreatedBy = !appliedFilters.created_by || order.created_by?.email === appliedFilters.created_by;
      
      return matchesSearch && matchesStatus && matchesContractType && matchesCreatedBy;
    });

    // Client-side pagination
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    setOrders(paginatedOrders);
    setTotalCount(filteredOrders.length);
    console.log('Filtered orders:', filteredOrders);
    console.log('Paginated orders:', paginatedOrders);
  };

  // Apply filters when search button is clicked
  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(0); // Reset to first page when applying new filters
    // Apply filters to existing data
    applyFiltersToData();
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

  // Clear all filters
  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      status: '',
      contract_type: '',
      created_by: ''
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(0);
    // Apply empty filters to existing data
    setTimeout(() => applyFiltersToData(), 0);
  };

  if (loading || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  console.log('user.role:', user.role);
  console.log(
    'orders:',
    orders.map((o) => ({ id: o._id, status: o.status }))
  );

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 600 }}>
        {trans.representativeManagerImportOrders.title}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
        {trans.representativeManagerImportOrders.description}
      </Typography>
      
      {/* Filters */}
      <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <FilterIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {trans.representativeManagerImportOrders.filters.title}
            </Typography>
          </Box>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={trans.representativeManagerImportOrders.filters.search}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                variant="outlined"
                size="medium"
                placeholder={trans.representativeManagerImportOrders.filters.searchPlaceholder}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="medium">
                <InputLabel>{trans.representativeManagerImportOrders.filters.status}</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label={trans.representativeManagerImportOrders.filters.status}
                >
                  <MenuItem value="">{trans.representativeManagerImportOrders.filters.allStatus}</MenuItem>
                  {filterOptions?.status?.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="medium">
                <InputLabel>{trans.representativeManagerImportOrders.filters.contractType}</InputLabel>
                <Select
                  value={filters.contract_type}
                  onChange={(e) => handleFilterChange('contract_type', e.target.value)}
                  label={trans.representativeManagerImportOrders.filters.contractType}
                >
                  <MenuItem value="">{trans.representativeManagerImportOrders.filters.allContractTypes}</MenuItem>
                  {filterOptions?.contract_type?.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type === 'economic' ? trans.representativeManagerImportOrders.filters.economic : type === 'principal' ? trans.representativeManagerImportOrders.filters.principal : type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="medium">
                <InputLabel>{trans.representativeManagerImportOrders.filters.createdBy}</InputLabel>
                <Select
                  value={filters.created_by}
                  onChange={(e) => handleFilterChange('created_by', e.target.value)}
                  label={trans.representativeManagerImportOrders.filters.createdBy}
                >
                  <MenuItem value="">{trans.representativeManagerImportOrders.filters.allUsers}</MenuItem>
                  {filterOptions?.created_by?.map((user) => (
                    <MenuItem key={user.email} value={user.email}>
                      {user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                onClick={applyFilters}
                fullWidth
                sx={{ height: '56px' }}
                startIcon={<SearchIcon />}
              >
                {trans.common.search || 'Search'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchOrders}
                disabled={loading}
                fullWidth
                sx={{ height: '56px' }}
              >
                {trans.representativeManagerImportOrders.filters.refresh}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                fullWidth
                sx={{ height: '56px' }}
              >
                {trans.common.clear || 'Clear'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {/* Orders Table */}
      <Card sx={{ border: '1px solid #e0e0e0' }}>
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid #e0e0e0',
            bgcolor: 'grey.50'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {trans.representativeManagerImportOrders.table.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {trans.representativeManagerImportOrders.table.totalOrders} {totalCount}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>{trans.representativeManagerImportOrders.table.orderId}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{trans.representativeManagerImportOrders.table.supplier}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{trans.representativeManagerImportOrders.table.status}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{trans.representativeManagerImportOrders.table.createdBy}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{trans.representativeManagerImportOrders.table.createdDate}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{trans.representativeManagerImportOrders.table.totalAmount}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>{trans.representativeManagerImportOrders.table.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">{loading ? trans.representativeManagerImportOrders.table.loadingOrders : trans.representativeManagerImportOrders.table.noOrders}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  console.log(order._id, order.status, user.role, canEditOrder(order));
                  return (
                    <TableRow key={order._id} hover>
                      <TableCell>{order._id}</TableCell>
                                             <TableCell>{order.contract_id?.partner_id?.name || trans.common.na}</TableCell>
                      <TableCell>
                        <Chip label={order.status?.toUpperCase()} color={getStatusColor(order.status)} size="small" />
                      </TableCell>
                                             <TableCell>{order.created_by?.email || trans.common.na}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={1} justifyContent="center">
                          {/* Only representative_manager can see Approve/Cancel buttons when order is draft */}
                          {userRole === 'representative_manager' && canEditOrder(order) && (
                            <>
                              <Button
                                size="small"
                                color="success"
                                variant="outlined"
                                onClick={() =>
                                  handleOpenStatusDialog({
                                    _id: order._id,
                                    status: order.status,
                                    nextStatus: 'approved'
                                  })
                                }
                              >
                                {trans.representativeManagerImportOrders.actions.approve}
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                onClick={() =>
                                  handleOpenStatusDialog({
                                    _id: order._id,
                                    status: order.status,
                                    nextStatus: 'rejected' // Ensure it's always 'rejected'
                                  })
                                }
                              >
                                {trans.representativeManagerImportOrders.actions.reject}
                              </Button>
                            </>
                          )}
                          {isOrderLocked(order) && <Chip label={trans.representativeManagerImportOrders.table.locked} color="error" size="small" variant="outlined" />}
                          <IconButton size="small" color="info" title={trans.representativeManagerImportOrders.actions.viewDetails} onClick={() => handleViewDetails(order)}>
                            <ViewIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
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
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid #e0e0e0',
            bgcolor: 'grey.50'
          }}
        />
      </Card>
      {/* Status Change Dialog */}
      <StatusChangeDialog
        open={statusDialog}
        onClose={handleCloseStatusDialog}
        onConfirm={handleStatusChange}
        currentStatus={selectedOrder?.status}
        orderId={selectedOrder?._id}
        userRole={userRole}
        loading={updatingStatus}
        nextStatus={selectedOrder?.nextStatus}
      />

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onClose={handleCloseDetailsDialog} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>{trans.representativeManagerImportOrders.details.title}</DialogTitle>
        <DialogContent>
          {selectedOrderForDetails && (
            <Box sx={{ mt: 2 }}>
              {/* Basic Info */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {trans.representativeManagerImportOrders.details.orderId}
                    </Typography>
                    <Typography variant="body2">{selectedOrderForDetails._id}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {trans.representativeManagerImportOrders.details.contract}
                    </Typography>
                    <Typography variant="body2">{selectedOrderForDetails.contract_id?.contract_code}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {trans.representativeManagerImportOrders.details.contractType}
                    </Typography>
                    <Chip
                      label={selectedOrderForDetails.contract_id?.contract_type === 'principal' ? trans.representativeManagerImportOrders.filters.principal : trans.representativeManagerImportOrders.filters.economic}
                      color={selectedOrderForDetails.contract_id?.contract_type === 'principal' ? 'primary' : 'secondary'}
                      size="small"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {trans.representativeManagerImportOrders.details.status}
                    </Typography>
                    <Chip
                      label={selectedOrderForDetails.status?.toUpperCase()}
                      color={getStatusColor(selectedOrderForDetails.status)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {trans.representativeManagerImportOrders.details.totalAmount}
                    </Typography>
                    <Typography variant="body2">{formatCurrency(selectedOrderForDetails.total_amount)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {trans.representativeManagerImportOrders.details.activeAnnexes}
                    </Typography>
                    <Typography variant="body2">
                      {selectedOrderForDetails.contract_id?.annexes?.filter(a => a.status === 'active').length || 0}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Comparison Tables */}
              <Grid container spacing={3}>
                {/* Import Order Table */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    {trans.representativeManagerImportOrders.details.importOrderItems}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{trans.representativeManagerImportOrders.details.medicine}</TableCell>
                          <TableCell align="right">{trans.representativeManagerImportOrders.details.quantity}</TableCell>
                          <TableCell align="right">{trans.representativeManagerImportOrders.details.unitPrice}</TableCell>
                          <TableCell align="right">{trans.representativeManagerImportOrders.details.total}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrderForDetails.details?.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell>
                                                             {detail.medicine_id?.medicine_name || trans.common.na}
                               <br />
                               <Typography variant="caption" color="text.secondary">
                                 {detail.medicine_id?.license_code || trans.common.na}
                               </Typography>
                            </TableCell>
                            <TableCell align="right">{detail.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(detail.unit_price)}</TableCell>
                            <TableCell align="right">{formatCurrency((detail.quantity || 0) * (detail.unit_price || 0))}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: 'grey.100' }}>
                          <TableCell colSpan={3}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {trans.representativeManagerImportOrders.details.total}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(
                                selectedOrderForDetails.details?.reduce(
                                  (sum, detail) => sum + (detail.quantity || 0) * (detail.unit_price || 0),
                                  0
                                )
                              )}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Contract Table */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    {trans.representativeManagerImportOrders.details.activeContractItems}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{trans.representativeManagerImportOrders.details.medicine}</TableCell>
                          <TableCell align="right">{trans.representativeManagerImportOrders.details.quantity}</TableCell>
                          <TableCell align="right">{trans.representativeManagerImportOrders.details.unitPrice}</TableCell>
                          <TableCell align="right">{trans.representativeManagerImportOrders.details.source}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loadingMedicines ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography color="text.secondary">{trans.representativeManagerImportOrders.details.loadingContractMedicines}</Typography>
                            </TableCell>
                          </TableRow>
                        ) : contractMedicines.length > 0 ? (
                          contractMedicines.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                                               {item.medicine_id?.medicine_name || trans.common.na}
                               <br />
                               <Typography variant="caption" color="text.secondary">
                                 {item.medicine_id?.license_code || trans.common.na}
                               </Typography>
                              </TableCell>
                              <TableCell align="right">{item.quantity || item.min_order_quantity || trans.common.na}</TableCell>
                              <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={item.source || trans.representativeManagerImportOrders.details.contractSource} 
                                  color={item.source === 'ANNEX' ? 'warning' : 'success'} 
                                  size="small" 
                                  variant="outlined" 
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography color="text.secondary">{trans.representativeManagerImportOrders.details.noContractMedicines}</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>

              {/* Annexes Information */}
              {selectedOrderForDetails.contract_id?.annexes?.filter(a => a.status === 'active').length > 0 && (
                <Paper sx={{ p: 2, mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {trans.representativeManagerImportOrders.details.activeAnnexesInfo}
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedOrderForDetails.contract_id.annexes
                      .filter(annex => annex.status === 'active')
                      .map((annex, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Box sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f8f9fa' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {trans.representativeManagerImportOrders.details.annex}: {annex.annex_code}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {trans.representativeManagerImportOrders.details.signed}: {formatDate(annex.signed_date)}
                            </Typography>
                            {annex.medicine_changes && (
                              <Box sx={{ mt: 1 }}>
                                {annex.medicine_changes.add_items?.length > 0 && (
                                  <Typography variant="body2" color="success.main">
                                    + {trans.representativeManagerImportOrders.details.added}: {annex.medicine_changes.add_items.length} {trans.representativeManagerImportOrders.details.medicines}
                                  </Typography>
                                )}
                                {annex.medicine_changes.remove_items?.length > 0 && (
                                  <Typography variant="body2" color="error.main">
                                    - {trans.representativeManagerImportOrders.details.removed}: {annex.medicine_changes.remove_items.length} {trans.representativeManagerImportOrders.details.medicines}
                                  </Typography>
                                )}
                                {annex.medicine_changes.update_prices?.length > 0 && (
                                  <Typography variant="body2" color="warning.main">
                                    ~ {trans.representativeManagerImportOrders.details.updated}: {annex.medicine_changes.update_prices.length} {trans.representativeManagerImportOrders.details.prices}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      ))}
                  </Grid>
                </Paper>
              )}


            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
          <Button onClick={handleCloseDetailsDialog} variant="outlined" sx={{ minWidth: 120 }}>
            {trans.representativeManagerImportOrders.details.close}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RepresentativeManagerImportOrders;
