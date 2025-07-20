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
    setLoading(true);
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

  // Tính tổng tiền theo danh sách chi tiết
  const calcAmount = (details) => {
    if (!details || details.length === 0) return 0;
    return details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);
  };

  // Định dạng ngày
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString();
  };

  // Màu trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'PAID':
        return 'success';
      case 'OVERDUE':
        return 'error';
      case 'COMPLETED':
        return 'success';
      case 'CANCELED':
        return 'default';
      default:
        return 'default';
    }
  };

  // Xử lý đổi trang, số dòng hiện thị
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

  // Thanh toán Stripe dựa theo loại bill
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

  // Lấy chuỗi mô tả thuốc trong bảng (ưu tiên import_order_id.details, export_order_id.details, fallback bill.details)
  const getMedicineDetailsString = (bill) => {
    if (bill.import_order_id && bill.import_order_id.details?.length > 0) {
      return bill.import_order_id.details
        .map((d) => {
          const med = d.medicine_id;
          return med ? `${med.medicine_name || 'N/A'} (${med.license_code || 'N/A'})` : 'N/A';
        })
        .join(', ');
    }
    if (bill.export_order_id && bill.export_order_id.details?.length > 0) {
      return bill.export_order_id.details
        .map((d) => {
          const med = d.medicine_id;
          return med ? `${med.medicine_name || 'N/A'} (${med.license_code || 'N/A'})` : 'N/A';
        })
        .join(', ');
    }
    if (bill.details?.length > 0) {
      return bill.details.map((d) => d.medicine_lisence_code).join(', ');
    }
    return 'N/A';
  };

  // Ngày hiển thị (ưu tiên createdAt, fallback payment_date)
  const getDisplayDate = (bill) => {
    if (bill.createdAt) return formatDate(bill.createdAt);
    if (bill.payment_date) return formatDate(bill.payment_date);
    return 'N/A';
  };

  // Hiển thị chi tiết thuốc trong dialog
  const renderDetailMedicines = (detailData) => {
    if (detailData.import_order_id && detailData.import_order_id.details?.length > 0) {
      return detailData.import_order_id.details.map((d) => {
        const med = d.medicine_id;
        return (
          <TableRow key={d._id}>
            <TableCell>{med ? med.medicine_name : 'N/A'}</TableCell>
            <TableCell>{med ? med.license_code : 'N/A'}</TableCell>
            <TableCell>{d.quantity}</TableCell>
            <TableCell>{d.unit_price.toLocaleString()}</TableCell>
            <TableCell>{(d.quantity * d.unit_price).toLocaleString()}</TableCell>
          </TableRow>
        );
      });
    }
    if (detailData.export_order_id && detailData.export_order_id.details?.length > 0) {
      return detailData.export_order_id.details.map((d) => {
        const med = d.medicine_id;
        return (
          <TableRow key={d._id}>
            <TableCell>{med ? med.medicine_name : 'N/A'}</TableCell>
            <TableCell>{med ? med.license_code : 'N/A'}</TableCell>
            <TableCell>{d.quantity}</TableCell>
            <TableCell>{d.unit_price.toLocaleString()}</TableCell>
            <TableCell>{(d.quantity * d.unit_price).toLocaleString()}</TableCell>
          </TableRow>
        );
      });
    }
    // fallback bill details (chỉ có mã thuốc)
    if (detailData.details?.length > 0) {
      return detailData.details.map((d) => (
        <TableRow key={d._id}>
          <TableCell>{d.medicine_lisence_code || 'N/A'}</TableCell>
          <TableCell>-</TableCell>
          <TableCell>{d.quantity}</TableCell>
          <TableCell>{d.unit_price.toLocaleString()}</TableCell>
          <TableCell>{(d.quantity * d.unit_price).toLocaleString()}</TableCell>
        </TableRow>
      ));
    }
    return (
      <TableRow>
        <TableCell colSpan={5} align="center">
          Không có chi tiết thuốc
        </TableCell>
      </TableRow>
    );
  };

  // Lọc - tìm kiếm và sắp xếp
  const filteredBills = bills
    .filter((bill) => {
      if (filterType !== 'ALL' && bill.type !== filterType) return false;
      if (filterStatus !== 'ALL' && bill.status !== filterStatus) return false;

      if (searchText.trim() !== '') {
        const lowerSearch = searchText.toLowerCase();
        const voucherMatch = bill.voucher_code?.toLowerCase().includes(lowerSearch);
        // tìm trong các mã thuốc của cả import_order, export_order hoặc bill.details
        const medicineMatchImport =
          bill.import_order_id?.details?.some((d) => d.medicine_id?.license_code?.toLowerCase().includes(lowerSearch)) ?? false;
        const medicineMatchExport =
          bill.export_order_id?.details?.some((d) => d.medicine_id?.license_code?.toLowerCase().includes(lowerSearch)) ?? false;
        const medicineMatchBill = bill.details?.some((d) => d.medicine_lisence_code?.toLowerCase().includes(lowerSearch)) ?? false;
        if (!voucherMatch && !medicineMatchImport && !medicineMatchExport && !medicineMatchBill) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.payment_date);
      const dateB = new Date(b.createdAt || b.payment_date);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
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
            <MenuItem value="PAID">PAID</MenuItem>
            <MenuItem value="OVERDUE">OVERDUE</MenuItem>
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
                  <TableCell>{bill.type || 'N/A'}</TableCell>
                  <TableCell>{bill.voucher_code ? bill.voucher_code.slice(0, 6) : bill._id ? bill._id.slice(0, 6) : 'N/A'}</TableCell>
                  <TableCell>{bill.type || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={bill.status} color={getStatusColor(bill.status)} />
                  </TableCell>
                  <TableCell>{getDisplayDate(bill)}</TableCell>
                  <TableCell
                    sx={{
                      whiteSpace: 'normal',
                      maxWidth: 120,
                      wordBreak: 'break-word',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {getMedicineDetailsString(bill)}
                  </TableCell>
                  <TableCell align="right">{calcAmount(bill.details).toLocaleString()}</TableCell>
                  <TableCell>
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
                <strong>Mã hóa đơn:</strong> {detailData.voucher_code || detailData._id}
              </Typography>
              <Typography>
                <strong>Loại:</strong> {detailData.type}
              </Typography>
              <Typography>
                <strong>Ngày tạo:</strong> {getDisplayDate(detailData)}
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
                    <TableCell>Tên thuốc</TableCell>
                    <TableCell>Mã thuốc</TableCell>
                    <TableCell>Số lượng</TableCell>
                    <TableCell>Đơn giá (VNĐ)</TableCell>
                    <TableCell>Thành tiền (VNĐ)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{renderDetailMedicines(detailData)}</TableBody>
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
