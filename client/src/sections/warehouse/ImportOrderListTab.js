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

export default function PurchaseOrderListTab() {
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
      draft: 'Nháp',
      delivered: 'Đã giao',
      approved: 'Đã duyệt',
      arranged: 'Đã sắp xếp',
      checked: 'Đã kiểm tra'
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
          Có lỗi xảy ra khi tải dữ liệu: {isError}
        </Alert>
        <Button onClick={mutate} variant="outlined">
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Danh sách phiếu kiểm nhập
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
            <InputLabel>Trạng thái</InputLabel>
            <Select value={statusFilter} label="Trạng thái" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="draft">Nháp</MenuItem>
              <MenuItem value="delivered">Đã giao</MenuItem>
              <MenuItem value="approved">Đã duyệt</MenuItem>
              <MenuItem value="checked">Đã kiểm tra</MenuItem>
              <MenuItem value="arranged">Đã sắp xếp</MenuItem>
              <MenuItem value="completed">Hoàn thành</MenuItem>
              <MenuItem value="cancelled">Hủy</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Tìm kiếm..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Làm mới">
            <IconButton onClick={() => mutate()} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button variant="outlined" startIcon={<FileDownloadIcon />} disabled={isLoading}>
            Xuất Excel
          </Button>

          <Button variant="contained" startIcon={<AddIcon />}>
            Gửi tới thủ kho
          </Button>
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã đơn</TableCell>
              <TableCell>Mã hợp đồng</TableCell>
              <TableCell>Nhà cung cấp</TableCell>
              <TableCell>Tổng tiền</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Số mặt hàng</TableCell>
              <TableCell>Số phiếu đã tạo</TableCell>
              <TableCell align="center">Thao tác</TableCell>
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
                    Không có đơn mua nào
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
                      <Typography variant="body2">{order.supplier_contract_id?.contract_code || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.supplier_contract_id?.supplier_id?.name || 'N/A'}</Typography>
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
                      <Typography variant="body2">{order.details?.length || 0} mặt hàng</Typography>
                    </TableCell>
                    <TableCell>
                      {' '}
                      <Typography variant="body2">{order.details?.length || 0} phiếu</Typography>
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
        <MenuItem>
          Xem chi tiết
        </MenuItem>
        <MenuItem>Xuất PDF</MenuItem>
      </Menu>
    </Box>
  );
}
