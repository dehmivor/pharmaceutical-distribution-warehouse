// components/ManageLog.js
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  MenuItem
} from '@mui/material';
import { Refresh as RefreshIcon, Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';

// Remove debounce hook - not needed since we only search on button click
// const useDebounce = (value, delay) => {
//   const [debouncedValue, setDebouncedValue] = useState(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);

//   return debouncedValue;
// };

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export default function ManageLog() {
  const trans = useTrans();
  // logs + paging
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // pending inputs
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [worker, setWorker] = useState('');
  const [order, setOrder] = useState('');
  const [area, setArea] = useState('All area');
  const [bay, setBay] = useState('');
  const [row, setRow] = useState('');
  const [column, setColumn] = useState('');

  // applied filters
  const [apStartDate, setApStartDate] = useState('');
  const [apEndDate, setApEndDate] = useState('');
  const [apWorker, setApWorker] = useState('');
  const [apOrder, setApOrder] = useState('');
  const [apArea, setApArea] = useState('');
  const [apBay, setApBay] = useState('');
  const [apRow, setApRow] = useState('');
  const [apColumn, setApColumn] = useState('');

  // areas dropdown
  const [areas, setAreas] = useState([]);

  // Remove debounced values - not needed since we only search on button click
  // const debouncedWorker = useDebounce(worker, 500);
  // const debouncedOrder = useDebounce(order, 500);

  // Check if filters have changed
  const hasFilterChanges = useMemo(() => {
    // If no filters are applied yet, allow searching to show all logs
    const noFiltersApplied = Object.values({
      apStartDate,
      apEndDate,
      apWorker,
      apOrder,
      apArea,
      apBay,
      apRow,
      apColumn
    }).every((val) => !val);

    if (noFiltersApplied) {
      // Allow search if any filter has a value
      return Object.values({
        startDate,
        endDate,
        worker,
        order,
        area,
        bay,
        row,
        column
      }).some((val) => val && val !== 'All area');
    }

    // Check if current filter values differ from applied filter values
    return (
      startDate !== apStartDate ||
      endDate !== apEndDate ||
      worker !== apWorker ||
      order !== apOrder ||
      area !== apArea ||
      bay !== apBay ||
      row !== apRow ||
      column !== apColumn
    );
  }, [
    startDate,
    endDate,
    worker,
    order,
    area,
    bay,
    row,
    column,
    apStartDate,
    apEndDate,
    apWorker,
    apOrder,
    apArea,
    apBay,
    apRow,
    apColumn
  ]);

  // Remove auto-search - filters will only be applied when search button is clicked
  // useEffect(() => {
  //   if (debouncedWorker !== apWorker && debouncedWorker !== '') {
  //     setApWorker(debouncedWorker);
  //     setPage(0);
  //   }
  // }, [debouncedWorker, apWorker]);

  // useEffect(() => {
  //   if (debouncedOrder !== apOrder && debouncedOrder !== '') {
  //     setApOrder(debouncedOrder);
  //     setPage(0);
  //   }
  // }, [debouncedOrder, apOrder]);

  // fetch areas once
  useEffect(() => {
    axios
      .get('/api/areas', { headers: getAuthHeaders() })
      .then((res) => {
        if (res.data.success) {
          setAreas(res.data.data.areas);
        }
      })
      .catch(() => {});
  }, []);

  // fetch logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Build query parameters
    const queryParams = {
      page: (page + 1).toString(),
      limit: rowsPerPage.toString()
    };

    // Only add filters if they have values
    if (apStartDate) queryParams.startDate = apStartDate;
    if (apEndDate) queryParams.endDate = apEndDate;
    if (apWorker) queryParams.localPart = apWorker;
    if (apOrder) queryParams.order = apOrder;
    if (apArea) queryParams.areaId = apArea;
    if (apBay) queryParams.bay = apBay;
    if (apRow) queryParams.row = apRow;
    if (apColumn) queryParams.column = apColumn;

    const qs = new URLSearchParams(queryParams).toString();

    console.log('🔍 Fetching logs with query:', queryParams);

    try {
      const { data } = await axios.get(`/api/log-location-changes?${qs}`, {
        headers: getAuthHeaders()
      });

      if (data.success) {
        setOrders(data.data || []);
        setTotalCount(data.total || 0);
        console.log('🔍 Logs fetched successfully:', {
          count: data.data?.length || 0,
          total: data.total || 0
        });
      } else {
        throw new Error(data.error || trans.logs.failedToLoad);
      }
    } catch (err) {
      console.error('❌ Error fetching logs:', err);
      const errorMessage = err.response?.data?.error || err.message || trans.logs.failedToLoad;
      setError(errorMessage);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, apStartDate, apEndDate, apWorker, apOrder, apArea, apBay, apRow, apColumn]);

  // Apply filters function
  const applyFilters = () => {
    // Validate date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date');
      return;
    }

    // Validate location coordinates - if any coordinate is provided, all must be provided
    const hasPartialLocation = [area, bay, row, column].some((val) => val);
    const hasAllLocation = [area, bay, row, column].every((val) => val);

    if (hasPartialLocation && !hasAllLocation) {
      setError('Please provide all location coordinates (Area, Bay, Row, Column) or none');
      return;
    }

    // Clear any previous errors
    setError(null);

    // Apply all pending filters (including empty values to clear previous filters)
    setApStartDate(startDate);
    setApEndDate(endDate);
    setApWorker(worker);
    setApOrder(order);
    setApArea(area);
    setApBay(bay);
    setApRow(row);
    setApColumn(column);

    // Reset to first page when applying new filters
    setPage(0);

    console.log('🔍 Filters applied:', {
      startDate,
      endDate,
      worker,
      order,
      area,
      bay,
      row,
      column
    });
  };

  // Clear all filters function
  const clearFilters = () => {
    // Clear both pending & applied filters
    setStartDate('');
    setEndDate('');
    setWorker('');
    setOrder('');
    setArea('');
    setBay('');
    setRow('');
    setColumn('');
    setApStartDate('');
    setApEndDate('');
    setApWorker('');
    setApOrder('');
    setApArea('');
    setApBay('');
    setApRow('');
    setApColumn('');

    // Clear any errors
    setError(null);

    // Reset to first page
    setPage(0);

    console.log('🔍 All filters cleared');
  };

  // Handle individual filter changes with validation
  const handleFilterChange = (field, value) => {
    // Clear error when user starts typing
    if (error) setError(null);

    switch (field) {
      case 'startDate':
        setStartDate(value);
        // Clear end date if it's before new start date
        if (endDate && value && new Date(value) > new Date(endDate)) {
          setEndDate('');
        }
        break;
      case 'endDate':
        setEndDate(value);
        break;
      case 'worker':
        setWorker(value);
        break;
      case 'order':
        setOrder(value);
        break;
      case 'area':
        setArea(value);
        // Clear other location fields when area changes
        if (!value) {
          setBay('');
          setRow('');
          setColumn('');
        }
        break;
      case 'bay':
        setBay(value);
        break;
      case 'row':
        setRow(value);
        break;
      case 'column':
        setColumn(value);
        break;
      default:
        break;
    }
  };

  // initial & on-change
  useEffect(() => {
    // Only fetch logs if there are no active filters, or if filters have been applied
    // This prevents unnecessary API calls on initial load
    if (
      Object.values({
        apStartDate,
        apEndDate,
        apWorker,
        apOrder,
        apArea,
        apBay,
        apRow,
        apColumn
      }).every((val) => !val)
    ) {
      // No filters applied, fetch initial data
      fetchLogs();
    }
  }, []); // Empty dependency array - only run once on mount

  // Fetch logs when filters or pagination changes
  useEffect(() => {
    // Only fetch if there are active filters or if we're on a page other than 0
    if (
      Object.values({
        apStartDate,
        apEndDate,
        apWorker,
        apOrder,
        apArea,
        apBay,
        apRow,
        apColumn
      }).some((val) => val) ||
      page > 0
    ) {
      fetchLogs();
    }
  }, [page, rowsPerPage, apStartDate, apEndDate, apWorker, apOrder, apArea, apBay, apRow, apColumn]);

  // handlers
  const handleRefresh = () => fetchLogs();
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>

      {/* Top Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Box>
          <Typography variant="h4">{trans.logs.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {trans.common.manageLocationChanges}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
          {trans.logs.refresh}
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label={trans.common.startDate}
            type="date"
            value={startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label={trans.common.endDate}
            type="date"
            value={endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: startDate || undefined }}
          />
          <TextField fullWidth label={trans.common.worker} value={worker} onChange={(e) => handleFilterChange('worker', e.target.value)} />
          <TextField fullWidth label={trans.logs.order} value={order} onChange={(e) => handleFilterChange('order', e.target.value)} />
          <TextField fullWidth select label={trans.common.area} value={area} onChange={(e) => handleFilterChange('area', e.target.value)}>
            <MenuItem value="All area">{trans.common.allAreas}</MenuItem>
            {areas.map((a) => (
              <MenuItem key={a._id} value={a._id}>
                {a.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField fullWidth label={trans.common.bay} value={bay} onChange={(e) => handleFilterChange('bay', e.target.value)} />
          <TextField fullWidth label={trans.common.row} value={row} onChange={(e) => handleFilterChange('row', e.target.value)} />
          <TextField fullWidth label={trans.common.column} value={column} onChange={(e) => handleFilterChange('column', e.target.value)} />

          <Button
            fullWidth
            size="small"
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={applyFilters}
            disabled={!hasFilterChanges}
            color={hasFilterChanges ? 'primary' : 'default'}
            sx={{
              ...(Object.values({
                apStartDate,
                apEndDate,
                apWorker,
                apOrder,
                apArea,
                apBay,
                apRow,
                apColumn
              }).every((val) => !val) && {})
            }}
          >
            {Object.values({
              apStartDate,
              apEndDate,
              apWorker,
              apOrder,
              apArea,
              apBay,
              apRow,
              apColumn
            }).every((val) => !val)
              ? 'Search'
              : hasFilterChanges
                ? trans.logs.search
                : 'No changes to apply'}
          </Button>
          <Button size="small" fullWidth variant="outlined" onClick={clearFilters} startIcon={<ClearIcon />}>
            {trans.common.reset}
          </Button>
        </Stack>
      </Paper>

      {/* Active Filters Summary */}
      {(apStartDate || apEndDate || apWorker || apOrder || apArea || apBay || apRow || apColumn) && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Active Filters:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {apStartDate && (
              <Chip label={`From: ${new Date(apStartDate).toLocaleDateString()}`} size="small" color="primary" variant="outlined" />
            )}
            {apEndDate && (
              <Chip label={`To: ${new Date(apEndDate).toLocaleDateString()}`} size="small" color="primary" variant="outlined" />
            )}
            {apWorker && <Chip label={`Worker: ${apWorker}`} size="small" color="secondary" variant="outlined" />}
            {apOrder && <Chip label={`Order: ${apOrder}`} size="small" color="secondary" variant="outlined" />}
            {apArea && (
              <Chip label={`Area: ${areas.find((a) => a._id === apArea)?.name || apArea}`} size="small" color="info" variant="outlined" />
            )}
            {apBay && <Chip label={`Bay: ${apBay}`} size="small" color="info" variant="outlined" />}
            {apRow && <Chip label={`Row: ${apRow}`} size="small" color="info" variant="outlined" />}
            {apColumn && <Chip label={`Column: ${apColumn}`} size="small" color="info" variant="outlined" />}
          </Stack>
        </Paper>
      )}

      {/* Results Table */}
      <TableContainer component={Paper} sx={{ position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: 'rgba(255,255,255,0.7)',
              zIndex: 1
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Results Summary */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            {Object.values({
              apStartDate,
              apEndDate,
              apWorker,
              apOrder,
              apArea,
              apBay,
              apRow,
              apColumn
            }).every((val) => !val)
              ? 'No filters applied. Click "Search" to view log entries.'
              : `Showing ${orders.length} of ${totalCount} log entries${loading ? ' (loading...)' : ''}`}
          </Typography>
        </Box>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{trans.common.area}</TableCell>
              <TableCell>{trans.common.type}</TableCell>
              <TableCell>{trans.common.quantity}</TableCell>
              <TableCell>{trans.common.batch}</TableCell>
              <TableCell>{trans.common.orderId}</TableCell>
              <TableCell>{trans.common.user}</TableCell>
              <TableCell>{trans.common.at}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : Object.values({
                      apStartDate,
                      apEndDate,
                      apWorker,
                      apOrder,
                      apArea,
                      apBay,
                      apRow,
                      apColumn
                    }).every((val) => !val) ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography color="text.secondary" gutterBottom>
                        No filters applied
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Use the filters above and click "Search" to view log entries
                      </Typography>
                    </Box>
                  ) : (
                    <Typography color="text.secondary">
                      {totalCount === 0 ? 'No log entries found' : 'No log entries match the current filters'}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              orders.map((log) => {
                try {
                  const locId = log.location || '----';
                  const userLoc = log.ware_house_id?.email?.split('@')[0] || '----';
                  const orderId = (log.import_order_id || log.export_order_id || log.inventory_check_order_id || {}).toString().slice(-4);
                  const batchTxt = log.batch ? `${log.batch.batch_code}: ${log.batch.medicine_id?.medicine_name}` : '—';

                  return (
                    <TableRow key={log._id} hover>
                      <TableCell>{locId}</TableCell>
                      <TableCell>
                        <Chip label={log.type} size="small" color={log.type === 'add' ? 'success' : 'error'} />
                      </TableCell>
                      <TableCell>{log.quantity}</TableCell>
                      <TableCell>{batchTxt}</TableCell>
                      <TableCell>{orderId}</TableCell>
                      <TableCell>{userLoc}</TableCell>
                      <TableCell>{log.updated_at ? new Date(log.updated_at).toLocaleString() : '----'}</TableCell>
                    </TableRow>
                  );
                } catch (rowError) {
                  console.warn('⚠️ Error rendering log row:', log._id, rowError);
                  return (
                    <TableRow key={log._id || 'error'}>
                      <TableCell colSpan={7} align="center" color="error">
                        Error displaying log entry
                      </TableCell>
                    </TableRow>
                  );
                }
              })
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
          disabled={loading}
        />
      </TableContainer>
    </Box>
  );
}
