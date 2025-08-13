'use client';
import { Refresh } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

function StripePartialPayment({ clientSecret, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!stripe || !elements) return;

    setLoading(true);
    const cardElement = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement
      }
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else if (paymentIntent.status === 'succeeded') {
      onSuccess();
    }
  };

  return (
    <Box>
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4'
                }
              },
              invalid: {
                color: '#9e2146'
              }
            }
          }}
        />
        <Stack direction="row" spacing={2} mt={2}>
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
          <Button variant="contained" color="primary" type="submit" disabled={!stripe || loading}>
            {loading ? 'Đang xử lý...' : 'Thanh toán'}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

function ManageBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBills, setSelectedBills] = useState([]);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [partialAmount, setPartialAmount] = useState(null);
  const [loadingPaymentId, setLoadingPaymentId] = useState(null);
  const [openMultiPaymentDialog, setOpenMultiPaymentDialog] = useState(false);
  const [multiPaymentAmounts, setMultiPaymentAmounts] = useState({});
  const [clientSecret, setClientSecret] = useState(null);
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    setPage(0);
  }, [filterType, filterStatus, searchText, sortOrder]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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

  const handleSelectBill = (billId) => {
    setSelectedBills((prev) => (prev.includes(billId) ? prev.filter((id) => id !== billId) : [...prev, billId]));
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIds = filteredBills.map((bill) => bill._id);
      setSelectedBills(allIds);
    } else {
      setSelectedBills([]);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'partial':
        return 'success';
      case 'overdue':
        return 'error';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'default';
      default:
        return 'draft';
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetail = (data) => {
    setDetailData(data);
    setPartialAmount(calcAmount(data.details));
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setDetailData(null);
    setPartialAmount(null);
    setClientSecret(null);
    setShowStripePayment(false);
  };

  const handlePartialPayment = async (bill) => {
    if (!partialAmount || partialAmount <= 0) {
      setError('Vui lòng nhập số tiền thanh toán hợp lệ.');
      return;
    }
    setLoadingPaymentId(bill._id);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const { data } = await axios.post(
        `${backendUrl}/api/stripe/payment-intent`,
        {
          billId: bill._id,
          amount: Math.round(partialAmount)
        },
        { headers: getAuthHeaders() }
      );

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowStripePayment(true);
      } else {
        setError('Không nhận được client secret thanh toán.');
      }
    } catch (error) {
      setError('Có lỗi khi tạo PaymentIntent, vui lòng thử lại.');
    } finally {
      setLoadingPaymentId(null);
    }
  };

  const onPartialPaymentSuccess = () => {
    setError(null);
    alert('Thanh toán thành công!');
    handleCloseDetail();
    fetchBills();
  };

  const handleStripePaymentSingle = async (bill) => {
    setLoadingPaymentId(bill._id);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const amount = Math.round(calcAmount(bill.details)); // Convert to cents
      const successUrl = window.location.origin + '/success';
      const cancelUrl = window.location.origin + '/not-found';

      const { data } = await axios.post(
        `${backendUrl}/api/stripe/payments/${bill._id}`,
        {
          billId: bill._id,
          amount,
          paymentType: bill.type.toLowerCase(),
          successUrl,
          cancelUrl
        },
        { headers: getAuthHeaders() }
      );

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Không thể tạo phiên thanh toán Stripe.');
      }
    } catch (error) {
      setError('Có lỗi khi kết nối thanh toán. Vui lòng thử lại sau.');
    } finally {
      setLoadingPaymentId(null);
    }
  };

  const handleOpenMultiPaymentDialog = () => {
    const amounts = {};
    selectedBills.forEach((id) => {
      const bill = bills.find((b) => b._id === id);
      amounts[id] = calcAmount(bill.details);
    });
    setMultiPaymentAmounts(amounts);
    setOpenMultiPaymentDialog(true);
  };

  const handleCloseMultiPaymentDialog = () => {
    setOpenMultiPaymentDialog(false);
    setClientSecret(null);
    setShowStripePayment(false);
  };

  const handleMultiPaymentAmountChange = (billId, value) => {
    setMultiPaymentAmounts((prev) => ({
      ...prev,
      [billId]: value
    }));
  };

  const handleConfirmMultiPayment = async () => {
    setLoadingPaymentId('multi');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const successUrl = window.location.origin + '/success';
      const cancelUrl = window.location.origin + '/not-found';
      const billIds = selectedBills;
      let amount = 0;
      billIds.forEach((id) => {
        amount += Number(multiPaymentAmounts[id]) || 0;
      });
      if (amount <= 0) {
        setError('Tổng số tiền thanh toán không hợp lệ.');
        setLoadingPaymentId(null);
        return;
      }
      const firstBill = bills.find((b) => b._id === billIds[0]);
      const paymentType = firstBill?.type?.toLowerCase() || 'import';
      const { data } = await axios.post(
        `${backendUrl}/api/stripe/payments/multi`,
        {
          billIds,
          amount, // No *100 for VND
          paymentType,
          successUrl,
          cancelUrl
        },
        { headers: getAuthHeaders() }
      );
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Không thể tạo phiên thanh toán cho nhiều hóa đơn.');
      }
    } catch (error) {
      setError('Có lỗi khi kết nối thanh toán nhiều hóa đơn. Vui lòng thử lại sau.');
    } finally {
      setLoadingPaymentId(null);
    }
  };

  const getMedicineDetailsString = (bill) => {
    if (bill.import_order_id?.details?.length > 0) {
      return bill.import_order_id.details
        .map((d) => {
          const med = d.medicine_id;
          return med ? `${med.medicine_name || 'N/A'} (${med.license_code || 'N/A'})` : 'N/A';
        })
        .join(', ');
    }
    if (bill.export_order_id?.details?.length > 0) {
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

  const getDisplayDate = (bill) => {
    if (bill.createdAt) return formatDate(bill.createdAt);
    if (bill.payment_date) return formatDate(bill.payment_date);
    return 'N/A';
  };

  const renderDetailMedicines = (detailData) => {
    if (detailData.import_order_id?.details?.length > 0) {
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
    if (detailData.export_order_id?.details?.length > 0) {
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

  const filteredBills = bills
    .filter((bill) => {
      if (filterType !== 'ALL' && bill.type !== filterType) return false;
      if (filterStatus !== 'ALL' && bill.status !== filterStatus) return false;

      if (searchText.trim() !== '') {
        const lowerSearch = searchText.toLowerCase();
        const voucherMatch = bill.voucher_code?.toLowerCase().includes(lowerSearch);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Bills Management
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Pay bill and search, sort, filter bill with status, type, date
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchBills}>
          Refresh
        </Button>
      </Box>

      <Box component={Paper} sx={{ p: 2, mb: 2 }} elevation={1}>
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

          <Button
            size="small"
            variant="contained"
            color="secondary"
            disabled={selectedBills.length === 0 || loadingPaymentId !== null}
            onClick={handleOpenMultiPaymentDialog}
          >
            {loadingPaymentId === 'multi' ? 'Đang xử lý...' : `Thanh toán (${selectedBills.length}) hóa đơn`}
          </Button>
        </Stack>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell padding="checkbox" sx={{ fontWeight: 600 }}>
                <Checkbox
                  indeterminate={selectedBills.length > 0 && selectedBills.length < filteredBills.length}
                  checked={filteredBills.length > 0 && selectedBills.length === filteredBills.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Label</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Mã hóa đơn</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Loại</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Ngày tạo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Chi tiết thuốc (Mã thuốc)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Tổng tiền (VNĐ)
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              filteredBills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((bill) => (
                <TableRow key={bill._id}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedBills.includes(bill._id)} onChange={() => handleSelectBill(bill._id)} />
                  </TableCell>
                  <TableCell>{bill.type.slice(0, 3) || 'N/A'}</TableCell>
                  <TableCell>{bill.voucher_code ? bill.voucher_code.slice(0, 6) : bill._id.slice(0, 6)}</TableCell>
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
                      onClick={() => handleOpenDetail(bill)}
                      disabled={loadingPaymentId === bill._id}
                    >
                      Thanh toán (partial)
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleStripePaymentSingle(bill)}
                      disabled={loadingPaymentId === bill._id}
                    >
                      Thanh toán 1 lần
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
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
          {showStripePayment && clientSecret ? (
            <Elements stripe={stripePromise}>
              <StripePartialPayment
                clientSecret={clientSecret}
                onSuccess={onPartialPaymentSuccess}
                onCancel={() => {
                  setShowStripePayment(false);
                  setClientSecret(null);
                }}
              />
            </Elements>
          ) : (
            detailData && (
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

                <TextField
                  label="Số tiền thanh toán (VNĐ)"
                  type="number"
                  fullWidth
                  value={partialAmount || ''}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value || 0);
                    if (val < 0) val = 0;
                    const maxAmount = calcAmount(detailData.details);
                    if (val > maxAmount) val = maxAmount;
                    setPartialAmount(val);
                  }}
                  inputProps={{ min: 0, max: calcAmount(detailData.details) }}
                  sx={{ mt: 2 }}
                  helperText="Bạn có thể thanh toán toàn bộ hoặc một phần hóa đơn này."
                />
              </>
            )
          )}
        </DialogContent>
        {!showStripePayment && (
          <DialogActions>
            <Button onClick={handleCloseDetail} disabled={loadingPaymentId !== null}>
              Đóng
            </Button>
            <Button
              onClick={() => handlePartialPayment(detailData)}
              variant="contained"
              disabled={loadingPaymentId !== null || !partialAmount || partialAmount <= 0}
            >
              {loadingPaymentId === detailData?._id ? 'Đang xử lý...' : 'Thanh toán'}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      <Dialog open={openMultiPaymentDialog} onClose={handleCloseMultiPaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Thanh toán nhiều hóa đơn (gom tổng)</DialogTitle>
        <DialogContent dividers>
          {showStripePayment && clientSecret ? (
            <Elements stripe={stripePromise}>
              <StripePartialPayment
                clientSecret={clientSecret}
                onSuccess={() => {
                  alert('Thanh toán nhiều hóa đơn thành công!');
                  setOpenMultiPaymentDialog(false);
                  fetchBills();
                }}
                onCancel={() => {
                  setShowStripePayment(false);
                  setClientSecret(null);
                }}
              />
            </Elements>
          ) : (
            selectedBills.map((billId) => {
              const bill = bills.find((b) => b._id === billId);
              const maxAmount = calcAmount(bill.details);
              return (
                <Box key={billId} sx={{ mb: 2 }}>
                  <Typography mb={3} variant="subtitle1">{`Mã hóa đơn: ${bill.voucher_code || bill._id}`}</Typography>
                  <TextField
                    type="number"
                    label="Số tiền thanh toán (VNĐ)"
                    value={multiPaymentAmounts[billId] || ''}
                    onChange={(e) => {
                      let val = parseFloat(e.target.value || 0);
                      if (val < 0) val = 0;
                      if (val > maxAmount) val = maxAmount;
                      handleMultiPaymentAmountChange(billId, val);
                    }}
                    inputProps={{ min: 0, max: maxAmount }}
                    fullWidth
                  />
                  <Typography variant="caption" color="text.secondary">
                    Tổng tiền: {maxAmount.toLocaleString()} VNĐ
                  </Typography>
                </Box>
              );
            })
          )}
        </DialogContent>
        {!showStripePayment && (
          <DialogActions>
            <Button onClick={handleCloseMultiPaymentDialog} disabled={loadingPaymentId === 'multi'}>
              Hủy
            </Button>
            <Button onClick={handleConfirmMultiPayment} variant="contained" disabled={loadingPaymentId === 'multi'}>
              Xác nhận thanh toán
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}

export default ManageBills;
