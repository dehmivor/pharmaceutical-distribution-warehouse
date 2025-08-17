'use client';
import {
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import useImportOrders from '@/hooks/useImportOrders'; // Adjust the import path
import useTrans from '@/hooks/useTrans';

export default function PurchaseOrderListTab() {
  const trans = useTrans();
  // Replace mock state with the custom hook
  const { orders: purchaseOrders, loading: isLoading, error: isError, fetchOrders } = useImportOrders();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', order: null });
  const [notes, setNotes] = useState('');

  const pagination = {
    totalPages: Math.ceil(purchaseOrders.length / 10) || 1
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchOrders({
        page,
        limit: 10,
        filters: {
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(searchKeyword && { search: searchKeyword })
        }
      });
    };

    fetchData();
  }, [page, statusFilter, searchKeyword, fetchOrders]);

  const mutate = useCallback(async () => {
    await fetchOrders({
      page,
      limit: 10,
      filters: {
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchKeyword && { search: searchKeyword })
      }
    });
  }, [page, statusFilter, searchKeyword, fetchOrders]);
  const filteredOrders = purchaseOrders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      !searchKeyword ||
      order._id?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      order.orderNumber?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      order.created_by?.email?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      order.supplier?.toLowerCase().includes(searchKeyword.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    const statusColors = {
      draft: 'default',
      delivered: 'warning',
      approved: 'success',
      checked: 'info',
      arranged: 'primary',
      completed: 'success',
      cancelled: 'error'
    };
    return statusColors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      draft: trans.common.draft,
      delivered: trans.common.delivered,
      approved: trans.common.approved,
      arranged: trans.common.arranged,
      checked: trans.common.checked
    };
    return statusLabels[status] || status;
  };

  const handleMenuClick = (event, order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleActionClick = (type, order) => {
    setActionDialog({ open: true, type, order });
    setNotes('');
    handleMenuClose();
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  if (isError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {trans.common.errorLoadingData}: {isError}
        </Alert>
        <Button onClick={mutate} variant="outlined">
          {trans.common.tryAgain}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {trans.common.importReceiptList}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{trans.common.status}</InputLabel>
            <Select value={statusFilter} label={trans.common.status} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="all">{trans.common.allStatuses}</MenuItem>
              <MenuItem value="draft">{trans.common.draft}</MenuItem>
              <MenuItem value="delivered">{trans.common.delivered}</MenuItem>
              <MenuItem value="approved">{trans.common.approved}</MenuItem>
              <MenuItem value="checked">{trans.common.checked}</MenuItem>
              <MenuItem value="arranged">{trans.common.arranged}</MenuItem>
              <MenuItem value="completed">{trans.common.completed}</MenuItem>
              <MenuItem value="cancelled">{trans.common.cancelled}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder={trans.common.search}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={trans.common.refresh}>
            <IconButton onClick={() => mutate()} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button variant="outlined" startIcon={<FileDownloadIcon />} disabled={isLoading}>
            {trans.common.exportExcel}
          </Button>

          <Button variant="contained" startIcon={<AddIcon />}>
            {trans.common.sendToWarehouse}
          </Button>
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{trans.common.orderNumber}</TableCell>
              <TableCell>{trans.common.contractCode}</TableCell>
              <TableCell>{trans.common.supplierName}</TableCell>
              <TableCell>{trans.common.totalAmount}</TableCell>
              <TableCell>{trans.common.status}</TableCell>
              <TableCell>{trans.common.itemCount}</TableCell>
              <TableCell>{trans.common.receiptCount}</TableCell>
              <TableCell align="center">{trans.common.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {trans.common.noImportOrders}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const totalAmount = order.details?.reduce((sum, detail) => sum + detail.quantity * detail.unit_price, 0) || 0;

                return (
                  <TableRow key={order._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {order._id?.slice(-8).toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.supplier_contract_id?.contract_code || trans.common.na}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.supplier_contract_id?.supplier_id?.name || trans.common.na}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {totalAmount.toLocaleString('vi-VN')} ₫
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={getStatusLabel(order.status)} color={getStatusColor(order.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.details?.length || 0} {trans.common.items}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {' '}
                      <Typography variant="body2">
                        {order.details?.length || 0} {trans.common.receipts}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={(e) => handleMenuClick(e, order)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={pagination.totalPages} page={page} onChange={handlePageChange} color="primary" />
        </Box>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem>{trans.common.viewDetails}</MenuItem>
        <MenuItem>{trans.common.exportPDF}</MenuItem>
      </Menu>
    </Box>
  );
}
