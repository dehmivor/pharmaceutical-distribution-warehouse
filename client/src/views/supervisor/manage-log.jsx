// components/ManageLog.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';

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
  const [area, setArea] = useState('');
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

    const qs = new URLSearchParams({
      page: (page + 1).toString(),
      limit: rowsPerPage.toString(),
      ...(apStartDate && { startDate: apStartDate }),
      ...(apEndDate && { endDate: apEndDate }),
      ...(apWorker && { localPart: apWorker }),
      ...(apOrder && { order: apOrder }),
      ...(apArea && { areaId: apArea }),
      ...(apBay && { bay: apBay }),
      ...(apRow && { row: apRow }),
      ...(apColumn && { column: apColumn })
    }).toString();

    try {
      const { data } = await axios.get(`/api/log-location-changes?${qs}`, {
        headers: getAuthHeaders()
      });
      if (data.success) {
        setOrders(data.data);
        setTotalCount(data.total);
      } else {
        throw new Error(data.error || trans.logs.failedToLoad);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, apStartDate, apEndDate, apWorker, apOrder, apArea, apBay, apRow, apColumn]);

  // initial & on-change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label={trans.common.startDate}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={trans.common.endDate}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: startDate || undefined }}
            />
            <TextField label={trans.common.worker} value={worker} onChange={(e) => setWorker(e.target.value)} />
            <TextField label={trans.logs.order} value={order} onChange={(e) => setOrder(e.target.value)} />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField select label={trans.common.area} value={area} onChange={(e) => setArea(e.target.value)}>
              <MenuItem value="">{trans.common.allAreas}</MenuItem>
              {areas.map((a) => (
                <MenuItem key={a._id} value={a._id}>
                  {a.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField label={trans.common.bay} value={bay} onChange={(e) => setBay(e.target.value)} />
            <TextField label={trans.common.row} value={row} onChange={(e) => setRow(e.target.value)} />
            <TextField label={trans.common.column} value={column} onChange={(e) => setColumn(e.target.value)} />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => {
                setApStartDate(startDate);
                setApEndDate(endDate);
                setApWorker(worker);
                setApOrder(order);
                setApArea(area);
                setApBay(bay);
                setApRow(row);
                setApColumn(column);
                setPage(0);
              }}
            >
              {trans.logs.search}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                // clear both pending & applied
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
                setPage(0);
              }}
            >
              {trans.common.reset}
            </Button>
          </Stack>
        </Stack>
      </Paper>

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
                  {trans.common.noLogEntries}
                </TableCell>
              </TableRow>
            ) : (
              orders.map((log) => {
                const locId = log.location || '----';
                const userLoc = log.ware_house_id?.email.split('@')[0] || '----';
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
                    <TableCell>{new Date(log.updated_at).toLocaleString()}</TableCell>
                  </TableRow>
                );
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
        />
      </TableContainer>
    </Box>
  );
}
