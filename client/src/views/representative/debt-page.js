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
  Chip, // Added Chip for colored status
  TextField, // Added TextField for search
  TableSortLabel // Added TableSortLabel for sorting
} from '@mui/material';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'OVERDUE':
      return 'error';
    case 'PAID':
      return 'success';
    case 'PENDING':
      return 'warning';
    default:
      return 'CANCELLED' ? 'default' : 'primary';
  }
};

function DebtPage() {
  const router = useRouter();

  const [bills, setBills] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState(0);

  const [filterQuarter, setFilterQuarter] = useState('');
  const [filterMedicineCode, setFilterMedicineCode] = useState('');
  const [filterVoucherCode, setFilterVoucherCode] = useState(''); // New filter for voucher code
  const [filterStatus, setFilterStatus] = useState(''); // New filter for status

  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const [loadingPayment, setLoadingPayment] = useState(false);

  // Sorting state
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');

  const getQuarter = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return ''; // Handle invalid date strings
    const month = date.getMonth() + 1;
    if (month >= 1 && month <= 3) return 'Quý 1';
    if (month >= 4 && month <= 6) return 'Quý 2';
    if (month >= 7 && month <= 9) return 'Quý 3';
    return 'Quý 4';
  };

  const handleDelete = async (billId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
      return;
    }
    try {
      setLoadingPayment(true);
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await axios.delete(`${backendUrl}/api/bills/delete/${billId}`);
      if (res.status === 200) {
        setBills((prevBills) => prevBills.filter((b) => b._id !== billId));
        alert('Xóa bill thành công!');
      } else {
        alert('Xóa bill thất bại');
      }
    } catch (error) {
      alert('Lỗi khi xóa bill: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingPayment(false);
    }
  };

  useEffect(() => {
    async function fetchBills() {
      try {
        setLoadingData(true);
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/bills`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch bills');
        }
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

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredBills = useMemo(() => {
    let filtered = bills;
    filtered = filtered.filter((b) => (tab === 0 ? b.type === 'IMPORT' : b.type === 'EXPORT'));

    if (filterQuarter) {
      filtered = filtered.filter((b) => getQuarter(b.payment_date) === filterQuarter);
    }

    if (filterMedicineCode) {
      filtered = filtered.filter((b) =>
        b.details.some((d) => d.medicine_lisence_code?.toLowerCase().includes(filterMedicineCode.toLowerCase()))
      );
    }

    if (filterVoucherCode) {
      filtered = filtered.filter((b) => b.voucher_code?.toLowerCase().includes(filterVoucherCode.toLowerCase()));
    }

    if (filterStatus) {
      filtered = filtered.filter((b) => b.status === filterStatus);
    }

    return filtered;
  }, [bills, tab, filterQuarter, filterMedicineCode, filterVoucherCode, filterStatus]);

  const sortedBills = useMemo(() => {
    let sortableBills = [...filteredBills];
    if (orderBy) {
      sortableBills.sort((a, b) => {
        let aValue;
        let bValue;

        switch (orderBy) {
          case 'party_name':
            aValue = tab === 0 ? a.import_order_id?._id : a.export_order_id?._id;
            bValue = tab === 0 ? b.import_order_id?._id : b.export_order_id?._id;
            break;
          case 'voucher_code':
            aValue = a.voucher_code || '';
            bValue = b.voucher_code || '';
            break;
          case 'total_amount':
            aValue = calcAmount(a.details);
            bValue = calcAmount(b.details);
            break;
          case 'payment_date':
            aValue = a.payment_date ? new Date(a.payment_date).getTime() : 0;
            bValue = b.payment_date ? new Date(b.payment_date).getTime() : 0;
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return order === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return order === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableBills;
  }, [filteredBills, orderBy, order, tab]);

  const quarters = ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'];
  const statusOptions = ['Chưa thanh toán', 'Đã thanh toán', 'Thanh toán một phần'];

  const handleOpenDetail = (data) => {
    setDetailData(data);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setDetailData(null);
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
            {/* Flatten and get unique medicine codes from all bills' details */}
            {[...new Set(bills.flatMap((b) => b.details.map((d) => d.medicine_lisence_code)))].map((code) => (
              <MenuItem key={code} value={code}>
                {code}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Mã phiếu"
          value={filterVoucherCode}
          onChange={(e) => setFilterVoucherCode(e.target.value)}
          sx={{ minWidth: 150 }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select value={filterStatus} label="Trạng thái" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="">Tất cả</MenuItem>
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'party_name'}
                  direction={orderBy === 'party_name' ? order : 'asc'}
                  onClick={() => handleRequestSort('party_name')}
                >
                  {tab === 0 ? 'Nhà cung cấp' : 'Khách hàng'}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'voucher_code'}
                  direction={orderBy === 'voucher_code' ? order : 'asc'}
                  onClick={() => handleRequestSort('voucher_code')}
                >
                  Mã phiếu
                </TableSortLabel>
              </TableCell>
              <TableCell>Mã thuốc</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'total_amount'}
                  direction={orderBy === 'total_amount' ? order : 'asc'}
                  onClick={() => handleRequestSort('total_amount')}
                >
                  Tổng tiền (VNĐ)
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'payment_date'}
                  direction={orderBy === 'payment_date' ? order : 'asc'}
                  onClick={() => handleRequestSort('payment_date')}
                >
                  Ngày thanh toán
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleRequestSort('status')}
                >
                  Trạng thái
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedBills.length > 0 ? (
              sortedBills.map((bill) => (
                <TableRow key={bill._id}>
                  <TableCell>
                    {
                      tab === 0
                        ? bill.import_order_id?.supplier_name || 'N/A' // Assuming supplier_name is available
                        : bill.export_order_id?.customer_name || 'N/A' // Assuming customer_name is available
                    }
                  </TableCell>

                  <TableCell>{bill.voucher_code || 'N/A'}</TableCell>

                  <TableCell>{bill.details.map((d) => d.medicine_lisence_code).join(', ')}</TableCell>

                  <TableCell align="right">{calcAmount(bill.details).toLocaleString()}</TableCell>

                  <TableCell>{bill.payment_date ? new Date(bill.payment_date).toLocaleDateString() : 'N/A'}</TableCell>

                  <TableCell>
                    <Chip label={bill.status} color={getStatusColor(bill.status)} size="small" />
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="contained"
                      color="error" // Changed color to error for delete
                      sx={{ mr: 1 }}
                      disabled={loadingPayment}
                      onClick={() => handleDelete(bill._id)}
                    >
                      Xóa
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
                <strong>Ngày thanh toán:</strong> {detailData.payment_date ? new Date(detailData.payment_date).toLocaleDateString() : 'N/A'}
              </Typography>
              <Typography>
                <strong>Trạng thái:</strong> <Chip label={detailData.status} color={getStatusColor(detailData.status)} size="small" />
              </Typography>

              {/* Display details based on bill type */}
              {detailData.type === 'IMPORT' && detailData.import_order_id && (
                <>
                  <Typography sx={{ mt: 2 }}>
                    <strong>Thông tin nhà cung cấp:</strong> {detailData.import_order_id.supplier_name || 'N/A'}
                  </Typography>
                  {detailData.import_order_id.details && detailData.import_order_id.details.length > 0 && (
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
                              <TableCell>{d.unit_price?.toLocaleString() || 'N/A'}</TableCell>
                              <TableCell>{(d.quantity * (d.unit_price || 0)).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </>
              )}

              {detailData.type === 'EXPORT' && detailData.export_order_id && (
                <>
                  <Typography sx={{ mt: 2 }}>
                    <strong>Thông tin khách hàng:</strong> {detailData.export_order_id.customer_name || 'N/A'}
                  </Typography>
                  {detailData.export_order_id.details && detailData.export_order_id.details.length > 0 && (
                    <>
                      <Typography sx={{ mt: 2 }}>
                        <strong>Chi tiết thuốc trong đơn xuất:</strong>
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
                          {detailData.export_order_id.details.map((d) => (
                            <TableRow key={d._id}>
                              <TableCell>{d.medicine_id?.license_code || 'N/A'}</TableCell>
                              <TableCell>{d.medicine_id?.medicine_name || 'N/A'}</TableCell>
                              <TableCell>{d.quantity}</TableCell>
                              <TableCell>{d.unit_price?.toLocaleString() || 'N/A'}</TableCell>
                              <TableCell>{(d.quantity * (d.unit_price || 0)).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </>
              )}

              <Typography sx={{ mt: 2 }}>
                <strong>Chi tiết thuốc trong phiếu công nợ:</strong>
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
