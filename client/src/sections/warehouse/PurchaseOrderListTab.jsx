import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { usePurchaseOrders, usePurchaseOrderActions, useExportPurchaseOrders } from '@/hooks/usePurchaseOrders';

export default function PurchaseOrderListTab() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', order: null });
  const [notes, setNotes] = useState('');
  const [createReceiptDialog, setCreateReceiptDialog] = useState({ open: false, order: null });

  // Hooks
  const { purchaseOrders, pagination, isLoading, isError, mutate } = usePurchaseOrders({
    status: statusFilter,
    page,
    limit: 10
  });

  const { updateStatus, sendForApproval, approve, reject } = usePurchaseOrderActions();

  const { exportToExcel, exportToPDF } = useExportPurchaseOrders();

  // Status color mapping
  const getStatusColor = (status) => {
    const statusColors = {
      draft: 'default',
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      completed: 'info'
    };
    return statusColors[status] || 'default';
  };

  // Status label mapping
  const getStatusLabel = (status) => {
    const statusLabels = {
      draft: 'Nháp',
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      completed: 'Hoàn thành'
    };
    return statusLabels[status] || status;
  };

  // Handle menu actions
  const handleMenuClick = (event, order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  // Handle action dialogs
  const handleActionClick = (type, order) => {
    setActionDialog({ open: true, type, order });
    setNotes('');
    handleMenuClose();
  };

  const handleActionConfirm = async () => {
    try {
      const { type, order } = actionDialog;

      switch (type) {
        case 'submit':
          await sendForApproval(order.id);
          break;
        case 'approve':
          await approve(order.id, notes);
          break;
        case 'reject':
          await reject(order.id, notes);
          break;
        default:
          break;
      }

      // Refresh data
      mutate();
      setActionDialog({ open: false, type: '', order: null });
    } catch (error) {
      console.error('Action failed:', error);
      // Có thể thêm toast notification ở đây
    }
  };

  // Handle create receipt
  const handleCreateReceipt = (order) => {
    setCreateReceiptDialog({ open: true, order });
    handleMenuClose();
  };

  const handleCreateReceiptConfirm = async () => {
    try {
      const { order } = createReceiptDialog;

      // Tạo đơn nhập hàng từ đơn mua
      // Gọi API tạo receipt từ purchase order
      const response = await fetch(`/api/receipts/from-purchase-order/${order.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tạo đơn nhập hàng');
      }

      const result = await response.json();

      // Refresh data và đóng dialog
      mutate();
      setCreateReceiptDialog({ open: false, order: null });

      // Có thể chuyển hướng đến trang chi tiết đơn nhập
      // hoặc hiển thị thông báo thành công
    } catch (error) {
      console.error('Create receipt failed:', error);
      // Hiển thị thông báo lỗi
    }
  };

  // Handle export
  const handleExport = async (type) => {
    try {
      if (type === 'excel') {
        await exportToExcel({ status: statusFilter });
      } else if (type === 'pdf' && selectedOrder) {
        await exportToPDF(selectedOrder.id);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
    handleMenuClose();
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (isError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Có lỗi xảy ra khi tải dữ liệu: {isError.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Danh sách đơn mua
      </Typography>

      {/* Filter and Actions Bar */}
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
              <MenuItem value="pending">Chờ duyệt</MenuItem>
              <MenuItem value="approved">Đã duyệt</MenuItem>
              <MenuItem value="rejected">Từ chối</MenuItem>
              <MenuItem value="completed">Hoàn thành</MenuItem>
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
            <IconButton onClick={() => mutate()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => handleExport('excel')}>
            Xuất Excel
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              /* Handle create new purchase order */
            }}
          >
            Tạo đơn mua
          </Button>
        </Box>
      </Box>

      {/* Purchase Orders Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã đơn</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Người tạo</TableCell>
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
            ) : purchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Không có đơn mua nào
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              purchaseOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {order._id}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    <Chip label={getStatusLabel(order.status)} color={getStatusColor(order.status)} size="small" />
                  </TableCell>
                  <TableCell>{order.created_by?.email}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, order)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={pagination.totalPages} page={page} onChange={handlePageChange} color="primary" />
        </Box>
      )}

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            /* View details */
          }}
        >
          Xem chi tiết
        </MenuItem>

        {selectedOrder?.status === 'draft' && <MenuItem onClick={() => handleActionClick('submit', selectedOrder)}>Gửi duyệt</MenuItem>}

        {selectedOrder?.status === 'pending' && (
          <>
            <MenuItem onClick={() => handleActionClick('approve', selectedOrder)}>Duyệt đơn</MenuItem>
            <MenuItem onClick={() => handleActionClick('reject', selectedOrder)}>Từ chối</MenuItem>
          </>
        )}

        {selectedOrder?.status === 'approved' && (
          <MenuItem onClick={() => handleCreateReceipt(selectedOrder)} sx={{ color: 'primary.main' }}>
            <ReceiptIcon sx={{ mr: 1, fontSize: 20 }} />
            Tạo đơn nhập
          </MenuItem>
        )}

        <MenuItem onClick={() => handleExport('pdf')}>Xuất PDF</MenuItem>
      </Menu>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, type: '', order: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionDialog.type === 'submit' && 'Xác nhận gửi duyệt'}
          {actionDialog.type === 'approve' && 'Xác nhận duyệt đơn'}
          {actionDialog.type === 'reject' && 'Xác nhận từ chối'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {actionDialog.type === 'submit' && 'Bạn có chắc chắn muốn gửi đơn này để duyệt?'}
            {actionDialog.type === 'approve' && 'Bạn có chắc chắn muốn duyệt đơn mua này?'}
            {actionDialog.type === 'reject' && 'Bạn có chắc chắn muốn từ chối đơn mua này?'}
          </Typography>

          {(actionDialog.type === 'approve' || actionDialog.type === 'reject') && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Ghi chú"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú (tùy chọn)"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, type: '', order: null })}>Hủy</Button>
          <Button onClick={handleActionConfirm} variant="contained" color={actionDialog.type === 'reject' ? 'error' : 'primary'}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Receipt Dialog */}
      <Dialog open={createReceiptDialog.open} onClose={() => setCreateReceiptDialog({ open: false, order: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo đơn nhập hàng</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Bạn có muốn tạo đơn nhập hàng từ đơn mua <strong>{createReceiptDialog.order?.orderNumber}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Đơn nhập hàng sẽ được tạo với các sản phẩm từ đơn mua này.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateReceiptDialog({ open: false, order: null })}>Hủy</Button>
          <Button onClick={handleCreateReceiptConfirm} variant="contained" color="primary">
            Tạo đơn nhập
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
