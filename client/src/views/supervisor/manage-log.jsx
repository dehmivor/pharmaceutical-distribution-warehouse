// components/ManageLog.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, IconButton,
  MenuItem, Paper, Snackbar, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow,
  TextField, Typography, Stack
} from '@mui/material';
import { Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export default function ManageLog() {
  const router = useRouter();

  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [snackbar, setSnackbar]       = useState({ open: false, message: '', severity: 'error' });
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount]   = useState(0);

  // Fetch logs from backend
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleSearchClick = () => {
    // In the future you could set filters here before refetch
    fetchLogs();
  };

  const handleReset = () => {
    // clear any additional filters you add, then refetch
    fetchLogs();
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
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
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Top Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Location Log Management</Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track location changes
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Actions */}
      <Box component={Paper} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearchClick}
          >
            Search
          </Button>
          <Button variant="outlined" onClick={handleReset}>
            Reset
          </Button>
        </Stack>
      </Box>

      {/* Logs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Location</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Order ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No log entries available.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map(log => {
                // trim last 4 chars
                const locId  = log.location_id?._id?.slice(-4)  || '----';
                const userId = log.ware_house_id?._id?.slice(-4) || '----';
                // pick the non-null order id
                const orderId = (
                  log.import_order_id ||
                  log.export_order_id ||
                  log.inventory_check_order_id ||
                  {}
                ).toString().slice(-4);

                return (
                  <TableRow key={log._id} hover>
                    <TableCell>{locId}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.type}
                        size="small"
                        color={log.type === 'add' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{log.quantity}</TableCell>
                    <TableCell>{orderId}</TableCell>
                    <TableCell>{userId}</TableCell>
                    <TableCell>
                      {new Date(log.updated_at).toLocaleString()}
                    </TableCell>
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
