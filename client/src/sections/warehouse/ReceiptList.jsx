'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
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
  Box,
  TextField,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Send as SendIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Import hooks
import { usePurchaseOrders, usePurchaseOrderActions, useExportPurchaseOrders } from '@/hooks/usePurchaseOrders';

function ReceiptList({ onReceiptSelect, onSendForApproval }) {
  // State cho filter và pagination
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // State cho dialog và notifications
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Sử dụng hooks
  const { purchaseOrders, pagination, isLoading, isError, mutate } = usePurchaseOrders({
    status: filterStatus,
    page,
    limit
  });

  const { sendForApproval, approve, reject, updateStatus } = usePurchaseOrderActions();

  const { exportToExcel, exportToPDF } = useExportPurchaseOrders();

  // Hàm helper để hiển thị thông báo
  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft':
        return 'Nháp';
      case 'pending':
        return 'Chờ duyệt';
      case 'accepted':
        return 'Đã duyệt';
      case 'cancelled':
        return 'Từ chối';
      default:
        return status;
    }
  };

  // Xử lý xem chi tiết
  const handleViewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setViewDialogOpen(true);
    onReceiptSelect && onReceiptSelect(receipt);
  };

  // Xử lý gửi duyệt
  const handleSendForApproval = async (receiptId) => {
    try {
      await sendForApproval(receiptId);
      await mutate(); // Refresh data
      showNotification('Đã gửi phiếu nhập để duyệt thành công!');
      onSendForApproval && onSendForApproval(receiptId);
    } catch (error) {
      showNotification(error.message || 'Có lỗi xảy ra khi gửi duyệt phiếu nhập', 'error');
    }
  };

  // Xử lý duyệt phiếu
  const handleApprove = async (receiptId) => {
    try {
      await approve(receiptId, 'Phiếu nhập đã được duyệt');
      await mutate();
      showNotification('Đã duyệt phiếu nhập thành công!');
    } catch (error) {
      showNotification(error.message || 'Có lỗi xảy ra khi duyệt phiếu nhập', 'error');
    }
  };

  // Xử lý từ chối phiếu
  const handleReject = async (receiptId) => {
    try {
      await reject(receiptId, 'Phiếu nhập bị từ chối');
      await mutate();
      showNotification('Đã từ chối phiếu nhập!', 'warning');
    } catch (error) {
      showNotification(error.message || 'Có lỗi xảy ra khi từ chối phiếu nhập', 'error');
    }
  };

  // Xử lý refresh data
  const handleRefresh = async () => {
    try {
      await mutate();
      showNotification('Đã làm mới dữ liệu!');
    } catch (error) {
      showNotification('Có lỗi xảy ra khi làm mới dữ liệu', 'error');
    }
  };

  // Xử lý export Excel
  const handleExportExcel = async () => {
    try {
      await exportToExcel({ status: filterStatus });
      showNotification('Đã xuất file Excel thành công!');
    } catch (error) {
      showNotification('Có lỗi xảy ra khi xuất file Excel', 'error');
    }
  };

  // Xử lý export PDF cho phiếu cụ thể
  const handleExportPDF = async (receiptId) => {
    try {
      await exportToPDF(receiptId);
      showNotification('Đã xuất file PDF thành công!');
    } catch (error) {
      showNotification('Có lỗi xảy ra khi xuất file PDF', 'error');
    }
  };

  // Xử lý thay đổi filter
  const handleFilterChange = (event) => {
    setFilterStatus(event.target.value);
    setPage(1); // Reset về trang đầu khi filter
  };

  // Hiển thị loading state
  if (isLoading) {
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Đang tải dữ liệu...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Hiển thị error state
  if (isError) {
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Có lỗi xảy ra khi tải dữ liệu: {isError.message}
          </Alert>
          <Button variant="outlined" onClick={handleRefresh} startIcon={<RefreshIcon />}>
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Tính tổng số phiếu từ data thực tế
  const totalReceipts = purchaseOrders?.length || 0;
  const totalFromPagination = pagination?.total || 0;

  // Sử dụng giá trị chính xác nhất
  const displayTotal = totalFromPagination > 0 ? totalFromPagination : totalReceipts;

  return (
    <>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Danh Sách Phiếu Nhập ({displayTotal})</Typography>
            <Box>
              <Button variant="outlined" onClick={handleExportExcel} sx={{ mr: 1 }}>
                Xuất Excel
              </Button>
              <IconButton onClick={handleRefresh} title="Làm mới">
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Filter */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Lọc theo trạng thái"
                value={filterStatus}
                onChange={handleFilterChange}
                SelectProps={{ native: true }}
              >
                <option value="all">Tất cả</option>
                <option value="draft">Nháp</option>
                <option value="pending">Chờ duyệt</option>
                <option value="accepted">Đã duyệt</option>
                <option value="cancelled">Từ chối</option>
              </TextField>
            </Grid>
          </Grid>

          {/* Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Số phiếu</TableCell>
                  <TableCell>Ngày</TableCell>
                  <TableCell>Đơn hàng</TableCell>
                  <TableCell>Nhà cung cấp</TableCell>
                  <TableCell>Tổng giá trị</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Thống kê</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary">
                        Không có dữ liệu
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell>{receipt.id}</TableCell>
                      <TableCell>{new Date(receipt.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>{receipt.orderNumber || receipt.id}</TableCell>
                      <TableCell>{receipt.supplier?.name || receipt.supplierName}</TableCell>
                      <TableCell>{(receipt.totalValue || receipt.totalAmount || 0).toLocaleString()} VNĐ</TableCell>
                      <TableCell>
                        <Chip label={getStatusText(receipt.status)} color={getStatusColor(receipt.status)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="caption" display="block">
                            Nhận: {receipt.receivedUnits || 0} | Trả: {receipt.returnedUnits || 0}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Tỷ lệ: {receipt.receivedPercentage || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleViewReceipt(receipt)} title="Xem chi tiết">
                          <ViewIcon />
                        </IconButton>

                        {receipt.status === 'draft' && (
                          <IconButton size="small" color="primary" onClick={() => handleSendForApproval(receipt.id)} title="Gửi duyệt">
                            <SendIcon />
                          </IconButton>
                        )}

                        {/* {receipt.status === 'pending' && (
                          <>
                            <IconButton size="small" color="success" onClick={() => handleApprove(receipt.id)} title="Duyệt">
                              <ApproveIcon />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleReject(receipt.id)} title="Từ chối">
                              <RejectIcon />
                            </IconButton>
                          </>
                        )} */}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
                Trang trước
              </Button>
              <Typography variant="body2" sx={{ mx: 2, alignSelf: 'center' }}>
                Trang {page} / {pagination.totalPages}
              </Typography>
              <Button disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>
                Trang sau
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* View Receipt Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi Tiết Phiếu Nhập - {selectedReceipt?.id}</DialogTitle>
        <DialogContent>
          {selectedReceipt && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Nhà cung cấp:</strong> {selectedReceipt.supplier?.name || selectedReceipt.supplierName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Tổng giá trị:</strong> {(selectedReceipt.totalValue || 0).toLocaleString()} VNĐ
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Trạng thái:</strong> {getStatusText(selectedReceipt.status)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Người tạo:</strong> {selectedReceipt.createdBy?.name || selectedReceipt.createdBy}
              </Typography>
              {/* Thêm các thông tin chi tiết khác */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedReceipt && (
            <Button onClick={() => handleExportPDF(selectedReceipt.id)} variant="outlined">
              Xuất PDF
            </Button>
          )}
          <Button onClick={() => setViewDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar open={notification.open} autoHideDuration={6000} onClose={() => setNotification({ ...notification, open: false })}>
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default ReceiptList;
