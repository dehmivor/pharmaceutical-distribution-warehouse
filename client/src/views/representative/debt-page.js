'use client';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import axios from 'axios';

function DebtPage() {
  const router = useRouter();

  const [bills, setBills] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState(0);

  const [filterQuarter, setFilterQuarter] = useState('');
  const [filterMedicineCode, setFilterMedicineCode] = useState('');

  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const [loadingPayment, setLoadingPayment] = useState(false);

  const getQuarter = (dateStr) => {
    if (!dateStr) return '';
    const month = new Date(dateStr).getMonth() + 1;
    if (month >= 1 && month <= 3) return 'Quý 1';
    if (month >= 4 && month <= 6) return 'Quý 2';
    if (month >= 7 && month <= 9) return 'Quý 3';
    return 'Quý 4';
  };

  useEffect(() => {
    async function fetchBills() {
      try {
        setLoadingData(true);
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${backendUrl}/api/bills`);
        if (!res.ok) throw new Error('Failed to fetch bills');
        const data = await res.json();
        setBills(data.data || []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingData(false);
      }
    }
    fetchBills();
  }, []);

  const calcAmount = (details) => {
    if (!details || details.length === 0) return 0;
    return details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);
  };

  const filteredBills = useMemo(() => {
    let filtered = bills;
    filtered = filtered.filter((b) => (tab === 0 ? b.type === 'IMPORT' : b.type === 'EXPORT'));

    if (filterQuarter) {
      filtered = filtered.filter((b) => getQuarter(b.payment_date) === filterQuarter);
    }

    if (filterMedicineCode) {
      filtered = filtered.filter((b) =>
        b.details.some((d) => d.medicine_lisence_code.toLowerCase().includes(filterMedicineCode.toLowerCase()))
      );
    }

    return filtered;
  }, [bills, tab, filterQuarter, filterMedicineCode]);

  const quarters = ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'];

  const handleOpenDetail = (data) => {
    setDetailData(data);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setDetailData(null);
  };

  // Hàm xử lý thanh toán Stripe
 const handleStripePayment = async (type, bill) => {
  setLoadingPayment(true);
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

    const endpoint =
      type === 'chi'
        ? `/api/stripe/create-payment-import/${bill._id}`
        : `/api/stripe/create-payment-export/${bill._id}`;

    const amount = Math.round(calcAmount(bill.details));

    const successUrl = window.location.origin + '/payment-success';
    const cancelUrl = window.location.origin + '/payment-cancel';

    // PHẢI gán kết quả trả về cho biến response
    const response = await axios.post(`${backendUrl}${endpoint}`, {
      amount,
      successUrl,
      cancelUrl,
    });

    const { url } = response.data; // Lấy url từ response

    if (url) {
      window.location.href = url;
    } else {
      alert('Không thể tạo phiên thanh toán Stripe');
    }
  } catch (error) {
    console.error('Lỗi gọi Stripe:', error);
    alert('Có lỗi khi kết nối thanh toán. Vui lòng thử lại sau.');
  } finally {
    setLoadingPayment(false);
  }
};


  if (loadingData) return <Typography>Đang tải dữ liệu...</Typography>;
  if (error) return <Typography color="error">Lỗi: {error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Quản lý công nợ
      </Typography>

      <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} sx={{ mb: 3 }}>
        <Tab label="Công nợ nhập" />
        <Tab label="Công nợ xuất" />
      </Tabs>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Quý</InputLabel>
          <Select value={filterQuarter} label="Quý" onChange={(e) => setFilterQuarter(e.target.value)}>
            <MenuItem value="">Tất cả</MenuItem>
            {quarters.map((q) => (
              <MenuItem key={q} value={q}>
                {q}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Mã thuốc</InputLabel>
          <Select value={filterMedicineCode} label="Mã thuốc" onChange={(e) => setFilterMedicineCode(e.target.value)} displayEmpty>
            <MenuItem value="">Tất cả</MenuItem>
            {[...new Set(bills.flatMap((b) => b.details.map((d) => d.medicine_lisence_code)))].map((code) => (
              <MenuItem key={code} value={code}>
                {code}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{tab === 0 ? 'Nhà cung cấp' : 'Khách hàng'}</TableCell>
              <TableCell>Mã phiếu</TableCell>
              <TableCell>Mã thuốc</TableCell>
              <TableCell align="right">Tổng tiền (VNĐ)</TableCell>
              <TableCell>Ngày thanh toán</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredBills.length > 0 ? (
              filteredBills.map((bill) => (
                <TableRow key={bill._id}>
                  <TableCell>
                    {tab === 0
                      ? bill.import_order_id
                        ? bill.import_order_id._id
                        : 'N/A'
                      : bill.export_order_id
                      ? bill.export_order_id._id
                      : 'N/A'}
                  </TableCell>

                  <TableCell>{bill.voucher_code || 'N/A'}</TableCell>

                  <TableCell>{bill.details.map((d) => d.medicine_lisence_code).join(', ')}</TableCell>

                  <TableCell align="right">{calcAmount(bill.details).toLocaleString()}</TableCell>

                  <TableCell>{bill.payment_date ? new Date(bill.payment_date).toLocaleDateString() : 'N/A'}</TableCell>

                  <TableCell>{bill.status}</TableCell>

                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      sx={{ mr: 1 }}
                      onClick={() => handleStripePayment(tab === 0 ? 'chi' : 'thu', bill)}
                      disabled={loadingPayment}
                    >
                      {loadingPayment ? 'Đang xử lý...' : 'Thanh toán'}
                    </Button>

                    <Button size="small" variant="outlined" onClick={() => handleOpenDetail(bill)}>
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Không có dữ liệu phù hợp
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDetail} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết công nợ</DialogTitle>
        <DialogContent dividers>
          {detailData && (
            <>
              <Typography>
                <strong>Mã phiếu:</strong> {detailData.voucher_code || 'N/A'}
              </Typography>
              <Typography>
                <strong>Loại phiếu:</strong> {detailData.type}
              </Typography>
              <Typography>
                <strong>Ngày thanh toán:</strong>{' '}
                {detailData.payment_date ? new Date(detailData.payment_date).toLocaleDateString() : 'N/A'}
              </Typography>
              <Typography>
                <strong>Trạng thái:</strong> {detailData.status}
              </Typography>

              {detailData.import_order_id && detailData.import_order_id.details && (
                <>
                  <Typography sx={{ mt: 2 }}>
                    <strong>Chi tiết thuốc trong đơn nhập:</strong>
                  </Typography>
                  <Table size="small" sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Mã thuốc</TableCell>
                        <TableCell>Tên thuốc</TableCell>
                        <TableCell>Số lượng</TableCell>
                        <TableCell>Đơn giá (VNĐ)</TableCell>
                        <TableCell>Thành tiền (VNĐ)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailData.import_order_id.details.map((d) => (
                        <TableRow key={d._id}>
                          <TableCell>{d.medicine_id?.license_code || 'N/A'}</TableCell>
                          <TableCell>{d.medicine_id?.medicine_name || 'N/A'}</TableCell>
                          <TableCell>{d.quantity}</TableCell>
                          <TableCell>{d.unit_price.toLocaleString()}</TableCell>
                          <TableCell>{(d.quantity * d.unit_price).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}

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
                  {detailData.details.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell>{d.medicine_lisence_code}</TableCell>
                      <TableCell>{d.quantity}</TableCell>
                      <TableCell>{d.unit_price.toLocaleString()}</TableCell>
                      <TableCell>{(d.quantity * d.unit_price).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
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

export default DebtPage;
