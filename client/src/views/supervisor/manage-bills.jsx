'use client';
import React, { useState, useEffect } from 'react';
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
  TablePagination,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack
} from '@mui/material';
import axios from 'axios';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

function ManageBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [loadingPaymentId, setLoadingPaymentId] = useState(null);

  const [filterType, setFilterType] = useState('ALL'); // ALL, IMPORT, EXPORT
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PENDING, COMPLETED, CANCELED
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc' (theo ngày tạo)

  useEffect(() => {
    setPage(0);
  }, [filterType, filterStatus, searchText, sortOrder]);

  const fetchBills = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';
      const response = await axios.get(`${backendUrl}/api/bills`, {
        headers: getAuthHeaders()
      });
      setBills(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi tải dữ liệu hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const calcAmount = (details) => {
    if (!details || details.length === 0) return 0;
    return details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'PAID':
        return 'success';
      case 'OVERDUE':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetail = (data) => {
    setDetailData(data);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setDetailData(null);
  };

  // Hàm xử lý thanh toán Stripe (dựa theo loại bill.type)
  const handleStripePayment = async (bill) => {
    setLoadingPaymentId(bill._id);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const endpoint =
        bill.type === 'IMPORT' ? `/api/stripe/create-payment-import/${bill._id}` : `/api/stripe/create-payment-export/${bill._id}`;

      const amount = Math.round(calcAmount(bill.details));
      const successUrl = window.location.origin + '/payment-success';
      const cancelUrl = window.location.origin + '/payment-cancel';

      const response = await axios.post(`${backendUrl}${endpoint}`, {
        amount,
        successUrl,
        cancelUrl
      });

      const { url } = response.data;
      if (url) {
        window.location.href = url;
      } else {
        alert('Không thể tạo phiên thanh toán Stripe');
      }
    } catch (error) {
      console.error('Lỗi gọi Stripe:', error);
      alert('Có lỗi khi kết nối thanh toán. Vui lòng thử lại sau.');
    } finally {
      setLoadingPaymentId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Lọc, tìm kiếm, sắp xếp
  const filteredBills = bills
    .filter((bill) => {
      if (filterType !== 'ALL' && bill.type !== filterType) return false;
      if (filterStatus !== 'ALL' && bill.status !== filterStatus) return false;

      if (searchText.trim() !== '') {
        const lowerSearch = searchText.toLowerCase();
        const voucherMatch = bill.voucher_code?.toLowerCase().includes(lowerSearch);
        const medicineMatch = bill.details?.some((d) => d.medicine_lisence_code?.toLowerCase().includes(lowerSearch));
        if (!voucherMatch && !medicineMatch) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Quản lý Hóa đơn
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Loại</InputLabel>
          <Select label="Loại" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="ALL">Tất cả</MenuItem>
            <MenuItem value="IMPORT">IMPORT</MenuItem>
            <MenuItem value="EXPORT">EXPORT</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select label="Trạng thái" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="ALL">Tất cả</MenuItem>
            <MenuItem value="PENDING">PENDING</MenuItem>
            <MenuItem value="COMPLETED">COMPLETED</MenuItem>
            <MenuItem value="CANCELED">CANCELED</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Tìm kiếm"
          placeholder="Mã hóa đơn, Mã thuốc"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ minWidth: 200 }}
        />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Sắp xếp ngày tạo</InputLabel>
          <Select label="Sắp xếp ngày tạo" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <MenuItem value="desc">Mới nhất trước</MenuItem>
            <MenuItem value="asc">Cũ nhất trước</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Label</TableCell>
              <TableCell>Mã hóa đơn</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell>Chi tiết thuốc (Mã thuốc)</TableCell>
              <TableCell align="right">Tổng tiền (VNĐ)</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              filteredBills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((bill) => (
                <TableRow key={bill._id}>
                  <TableCell>{bill.type === 'IMPORT' ? 'IMPORT' : bill.type === 'EXPORT' ? 'EXPORT' : 'N/A'}</TableCell>
                  <TableCell>{bill.voucher_code || 'N/A'}</TableCell>
                  <TableCell>{bill.type || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={bill.status} color={getStatusColor(bill.status)} />
                  </TableCell>
                  <TableCell>{formatDate(bill.createdAt)}</TableCell>
                  <TableCell>{bill.details?.map((d) => d.medicine_lisence_code).join(', ') || 'N/A'}</TableCell>
                  <TableCell align="right">{calcAmount(bill.details).toLocaleString()}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      sx={{ mr: 1 }}
                      onClick={() => handleStripePayment(bill)}
                      disabled={loadingPaymentId === bill._id}
                    >
                      {loadingPaymentId === bill._id ? 'Đang xử lý...' : 'Thanh toán'}
                    </Button>

                    <Button size="small" variant="outlined" onClick={() => handleOpenDetail(bill)}>
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          count={filteredBills.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error">{error}</Alert>
        </Snackbar>
      )}

      <Dialog open={openDetail} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết hóa đơn</DialogTitle>
        <DialogContent dividers>
          {detailData && (
            <>
              <Typography>
                <strong>Mã hóa đơn:</strong> {detailData.voucher_code || 'N/A'}
              </Typography>
              <Typography>
                <strong>Loại:</strong> {detailData.type}
              </Typography>
              <Typography>
                <strong>Ngày tạo:</strong> {formatDate(detailData.createdAt)}
              </Typography>
              <Typography>
                <strong>Trạng thái:</strong> {detailData.status}
              </Typography>

              <Typography sx={{ mt: 2 }}>
                <strong>Chi tiết thuốc trong phiếu:</strong>
              </Typography>
              <Table size="small" sx={{ mb: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Mã thuốc</TableCell>
                    <TableCell>Số lượng</TableCell>
                    <TableCell>Đơn giá (VNĐ)</TableCell>
                    <TableCell>Thành tiền (VNĐ)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailData.details?.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell>{d.medicine_lisence_code || 'N/A'}</TableCell>
                      <TableCell>{d.quantity}</TableCell>
                      <TableCell>{d.unit_price.toLocaleString()}</TableCell>
                      <TableCell>{(d.quantity * d.unit_price).toLocaleString()}</TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Không có chi tiết thuốc
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <Typography>
                <strong>Tổng tiền:</strong> {calcAmount(detailData.details).toLocaleString()} VNĐ
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ManageBills;
