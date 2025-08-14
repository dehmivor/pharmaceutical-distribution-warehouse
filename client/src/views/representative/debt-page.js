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
  Chip,
  TextField,
  TableSortLabel,
  Stack
} from '@mui/material';
import axios from 'axios';
import ModalConfirm from '../general/ModalConfirm';
import { enqueueSnackbar } from 'notistack';
import { useTrans } from '@/hooks/useTrans';

const getStatusColor = (status) => {
  switch (status) {
    case 'OVERDUE':
      return 'error';
    case 'PAID':
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'CANCELED':
      return 'default';
    default:
      return 'default';
  }
};

const calcAmount = (details) => {
  if (!details || details.length === 0) return 0;
  return details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString();
};

// Lấy chuỗi mã thuốc ( ưu tiên import_order_id.details, export_order_id.details, fallback bill.details )
const getMedicineDetailsString = (bill, maxLength = 100) => {
  let medArr = [];
  if (bill.import_order_id?.details?.length) {
    medArr = bill.import_order_id.details.map((d) =>
      d.medicine_id ? `${d.medicine_id.medicine_name || 'N/A'} (${d.medicine_id.license_code || 'N/A'})` : 'N/A'
    );
  } else if (bill.export_order_id?.details?.length) {
    medArr = bill.export_order_id.details.map((d) =>
      d.medicine_id ? `${d.medicine_id.medicine_name || 'N/A'} (${d.medicine_id.license_code || 'N/A'})` : 'N/A'
    );
  } else if (bill.details?.length) {
    medArr = bill.details.map((d) => d.medicine_lisence_code || 'N/A');
  }

  const fullString = medArr.join(', ');
  if (fullString.length > maxLength) return fullString.slice(0, maxLength) + '...';
  return fullString || 'N/A';
};

// Hiển thị chi tiết thuốc trong dialog
const renderDetailMedicines = (detailData) => {
  if (!detailData) return null;

  if (detailData.import_order_id?.details?.length > 0) {
    return detailData.import_order_id.details.map((d) => {
      const med = d.medicine_id;
      return (
        <TableRow key={d._id}>
          <TableCell>{med?.medicine_name || 'N/A'}</TableCell>
          <TableCell>{med?.license_code || 'N/A'}</TableCell>
          <TableCell>{d.quantity}</TableCell>
          <TableCell>{d.unit_price?.toLocaleString() || 'N/A'}</TableCell>
          <TableCell>{(d.quantity * (d.unit_price || 0)).toLocaleString()}</TableCell>
        </TableRow>
      );
    });
  }
  if (detailData.export_order_id?.details?.length > 0) {
    return detailData.export_order_id.details.map((d) => {
      const med = d.medicine_id;
      return (
        <TableRow key={d._id}>
          <TableCell>{med?.medicine_name || 'N/A'}</TableCell>
          <TableCell>{med?.license_code || 'N/A'}</TableCell>
          <TableCell>{d.quantity}</TableCell>
          <TableCell>{d.unit_price?.toLocaleString() || 'N/A'}</TableCell>
          <TableCell>{(d.quantity * (d.unit_price || 0)).toLocaleString()}</TableCell>
        </TableRow>
      );
    });
  }
  if (detailData.details?.length > 0) {
    return detailData.details.map((d) => (
      <TableRow key={d._id}>
        <TableCell>{d.medicine_lisence_code || 'N/A'}</TableCell>
        <TableCell>-</TableCell>
        <TableCell>{d.quantity}</TableCell>
        <TableCell>{d.unit_price?.toLocaleString() || 'N/A'}</TableCell>
        <TableCell>{(d.quantity * (d.unit_price || 0)).toLocaleString()}</TableCell>
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

const DebtPage = () => {
  const { trans } = useTrans();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [billIdToDelete, setBillIdToDelete] = useState(null);

  // Filters
  const [filterQuarter, setFilterQuarter] = useState('');
  const [filterVoucherCode, setFilterVoucherCode] = useState('');
  const [filterMedicineCode, setFilterMedicineCode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Sorting
  const [orderBy, setOrderBy] = useState('payment_date');
  const [order, setOrder] = useState('desc');

  // Detail dialog
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${backendUrl}/api/bills`, {
          headers: { 'Content-Type': 'application/json' }
        });
        setBills(res.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || err.message || trans.debt.errorLoadingData);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  const getQuarter = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    const month = date.getMonth() + 1;
    if (month >= 1 && month <= 3) return trans.debt.quarter1;
    if (month >= 4 && month <= 6) return trans.debt.quarter2;
    if (month >= 7 && month <= 9) return trans.debt.quarter3;
    return trans.debt.quarter4;
  };

  // Filters applied on bills with memoization
  const filteredBills = useMemo(() => {
    return bills
      .filter((b) => (tab === 0 ? b.type === 'IMPORT' : b.type === 'EXPORT'))
      .filter((b) => (filterQuarter ? getQuarter(b.payment_date) === filterQuarter : true))
      .filter((b) => (filterVoucherCode ? b.voucher_code?.toLowerCase().includes(filterVoucherCode.toLowerCase()) : true))
      .filter((b) =>
        filterMedicineCode ? b.details.some((d) => d.medicine_lisence_code?.toLowerCase().includes(filterMedicineCode.toLowerCase())) : true
      )
      .filter((b) => (filterStatus ? b.status === filterStatus : true));
  }, [bills, tab, filterQuarter, filterVoucherCode, filterMedicineCode, filterStatus]);

  // Sorting
  const sortedBills = useMemo(() => {
    const sorted = [...filteredBills];
    sorted.sort((a, b) => {
      let aValue, bValue;
      switch (orderBy) {
        case 'party_name':
          aValue = tab === 0 ? a.import_order_id?.supplier_name || '' : a.export_order_id?.customer_name || '';
          bValue = tab === 0 ? b.import_order_id?.supplier_name || '' : b.export_order_id?.customer_name || '';
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
          aValue = '';
          bValue = '';
      }
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredBills, orderBy, order, tab]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleOpenDetail = (bill) => {
    setDetailData(bill);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setDetailData(null);
  };

  // Lấy toàn bộ mã thuốc có trong bills để dùng cho filter
  const allMedicineCodes = useMemo(() => {
    const codes = bills.flatMap((b) => b.details.map((d) => d.medicine_lisence_code));
    return [...new Set(codes.filter((c) => c))];
  }, [bills]);

  const quarters = ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'];
  // Lấy trạng thái có trong dữ liệu bills hoặc bạn có thể dùng cố định danh sách này
  const statusOptions = [...new Set(bills.map((b) => b.status).filter(Boolean))];

  if (loading) return <Typography>Đang tải dữ liệu...</Typography>;
  if (error) return <Typography color="error">Lỗi: {error}</Typography>;

  const openDeleteConfirm = (id) => {
    setBillIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!billIdToDelete) return;
    setLoadingDelete(true);
    try {
      // gọi API xóa
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await axios.delete(`${backendUrl}/api/bills/${billIdToDelete}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.status === 200) {
        setBills((prev) => prev.filter((b) => b._id !== billIdToDelete));
        enqueueSnackbar('Xóa hóa đơn thành công!', { variant: 'success' });
      } else {
        enqueueSnackbar('Xóa hóa đơn thất bại!', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Lỗi khi xóa hóa đơn: ' + (error.response?.data?.error || error.message), { variant: 'error' });
    } finally {
      setLoadingDelete(false);
      setDeleteConfirmOpen(false);
      setBillIdToDelete(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Quản lý hóa đơn tạo từ phiếu xuất
      </Typography>

      <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} sx={{ mb: 3 }}>
        <Tab label="Hóa đơn nhập" />
        <Tab label="Hóa đơn xuất" />
      </Tabs>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" mb={2}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Quý</InputLabel>
          <Select value={filterQuarter} label="Quý" onChange={(e) => setFilterQuarter(e.target.value)}>
            <MenuItem value="Tất cả">Tất cả</MenuItem>
            {quarters.map((q) => (
              <MenuItem key={q} value={q}>
                {q}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Mã thuốc</InputLabel>
          <Select value={filterMedicineCode} label="Mã thuốc" onChange={(e) => setFilterMedicineCode(e.target.value)} displayEmpty>
            <MenuItem value="Tất cả">Tất cả</MenuItem>
            {allMedicineCodes.map((code) => (
              <MenuItem key={code} value={code}>
                {code}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Mã phiếu"
          value={filterVoucherCode}
          onChange={(e) => setFilterVoucherCode(e.target.value)}
          sx={{ minWidth: 150 }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select value={filterStatus} label="Trạng thái" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="Tất cả">Tất cả</MenuItem>
            {statusOptions.map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

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
              <TableCell sx={{ whiteSpace: 'normal', maxWidth: 200, wordBreak: 'break-word' }}>Mã thuốc</TableCell>
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
                    {tab === 0 ? bill.import_order_id?.supplier_name || 'N/A' : bill.export_order_id?.customer_name || 'N/A'}
                  </TableCell>

                  <TableCell title={bill.voucher_code || bill._id}>
                    {bill.voucher_code?.length > 10 ? bill.voucher_code.slice(0, 10) + '...' : bill.voucher_code || bill._id.slice(0, 10)}
                  </TableCell>

                  <TableCell sx={{ whiteSpace: 'normal', maxWidth: 250, wordBreak: 'break-word' }} title={getMedicineDetailsString(bill)}>
                    {getMedicineDetailsString(bill, 80)}
                  </TableCell>

                  <TableCell align="right">{calcAmount(bill.details).toLocaleString()}</TableCell>

                  <TableCell>{bill.payment_date ? formatDate(bill.payment_date) : 'N/A'}</TableCell>

                  <TableCell>
                    <Chip label={bill.status} color={getStatusColor(bill.status)} size="small" />
                  </TableCell>

                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => {
                          setBillIdToDelete(bill._id);
                          setDeleteConfirmOpen(true);
                        }}
                        disabled={loadingDelete}
                      >
                        Xóa
                      </Button>

                      <Button size="small" variant="outlined" onClick={() => handleOpenDetail(bill)}>
                        Xem chi tiết
                      </Button>
                    </Stack>
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
                <strong>Mã phiếu:</strong> {detailData.voucher_code || detailData._id}
              </Typography>
              <Typography>
                <strong>Loại phiếu:</strong> {detailData.type}
              </Typography>
              <Typography>
                <strong>Ngày thanh toán:</strong> {detailData.payment_date ? formatDate(detailData.payment_date) : 'N/A'}
              </Typography>
              <Typography>
                <strong>Trạng thái:</strong> <Chip label={detailData.status} color={getStatusColor(detailData.status)} size="small" />
              </Typography>

              {detailData.type === 'IMPORT' && detailData.import_order_id && (
                <>
                  <Typography sx={{ mt: 2 }}>
                    <strong>Thông tin nhà cung cấp:</strong> {detailData.import_order_id.supplier_name || 'N/A'}
                  </Typography>
                  {detailData.import_order_id.details?.length > 0 && (
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
                  {detailData.export_order_id.details?.length > 0 && (
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
                  {detailData.details?.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell>{d.medicine_lisence_code || 'N/A'}</TableCell>
                      <TableCell>{d.quantity}</TableCell>
                      <TableCell>{d.unit_price?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell>{(d.quantity * (d.unit_price || 0)).toLocaleString()}</TableCell>
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

      <ModalConfirm
        open={deleteConfirmOpen}
        title="Xác nhận xóa hóa đơn"
        content="Bạn có chắc chắn muốn xóa hóa đơn này?"
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        loading={loadingDelete}
      />
    </Box>
  );
};

export default DebtPage;
