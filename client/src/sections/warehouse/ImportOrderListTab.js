'use client';
import React, { useState, useCallback, useEffect } from 'react';
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

import useImportOrders from '@/hooks/useImportOrders'; // Adjust the import path

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
  const [createReceiptDialog, setCreateReceiptDialog] = useState({ open: false, order: null });

  const pagination = {
    totalPages: Math.ceil(purchaseOrders.length / 10) || 1
  };

  console.log('Purchase Orders:', purchaseOrders);

  // Fetch data on component mount and when filters change
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

  // Update the mutate function to refetch data
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

  // Filter orders client-side if needed (you might want to handle this server-side)
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

  const updateStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${backendUrl}/api/import-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update status: ${errorText}`);
      }

      // Refetch data after update
      await mutate();
    } catch (error) {
      console.error('Update status failed:', error);
      throw error;
    }
  };

  const sendForApproval = async (orderId) => {
    await updateStatus(orderId, 'pending');
  };

  const approve = async (orderId, notes) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${backendUrl}/api/import-orders/${orderId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to approve order: ${errorText}`);
      }

      await mutate();
    } catch (error) {
      console.error('Approve failed:', error);
      throw error;
    }
  };

  const reject = async (orderId, notes) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${backendUrl}/api/import-orders/${orderId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to reject order: ${errorText}`);
      }

      await mutate();
    } catch (error) {
      console.error('Reject failed:', error);
      throw error;
    }
  };

  const exportToExcel = async (params) => {
    try {
      const token = localStorage.getItem('auth-token');
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${backendUrl}/api/import-orders/export/excel?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export to Excel');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'purchase-orders.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export to Excel failed:', error);
      throw error;
    }
  };

  const exportToPDF = async (orderId) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${backendUrl}/api/import-orders/${orderId}/export/pdf`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export to PDF');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `purchase-order-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export to PDF failed:', error);
      throw error;
    }
  };

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

  const handleActionConfirm = async () => {
    try {
      const { type, order } = actionDialog;

      switch (type) {
        case 'submit':
          await sendForApproval(order._id); // Use _id instead of id
          break;
        case 'approve':
          await approve(order._id, notes);
          break;
        case 'reject':
          await reject(order._id, notes);
          break;
        default:
          break;
      }
      setActionDialog({ open: false, type: '', order: null });
    } catch (error) {
      console.error('Action failed:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleCreateReceipt = (order) => {
    setCreateReceiptDialog({ open: true, order });
    handleMenuClose();
  };

  const handleCreateReceiptConfirm = async () => {
    try {
      const { order } = createReceiptDialog;
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${backendUrl}/api/receipts/from-purchase-order/${order._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Không thể tạo đơn nhập hàng: ${errorText}`);
      }

      const result = await response.json();
      await mutate(); // Refetch data
      setCreateReceiptDialog({ open: false, order: null });
    } catch (error) {
      console.error('Create receipt failed:', error);
      // Show error message to user
    }
  };

  const handleExport = async (type) => {
    try {
      if (type === 'excel') {
        await exportToExcel({ status: statusFilter });
      } else if (type === 'pdf' && selectedOrder) {
        await exportToPDF(selectedOrder._id);
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
        Danh sách phiếu nhập
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

          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => handleExport('excel')} disabled={isLoading}>
            Xuất Excel
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              /* Handle create new purchase order */
            }}
          >
            Tạo đơn mới
          </Button>
        </Box>
      </Box>

      {/* Purchase Orders Table */}
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
                // Tính tổng tiền từ details
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
            Bạn có muốn tạo đơn nhập hàng từ đơn mua{' '}
            <strong>{createReceiptDialog.order?.orderNumber || createReceiptDialog.order?._id}</strong>?
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
