'use client';
import { Refresh, Search } from '@mui/icons-material';
import {
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
import useTrans from '@/hooks/useTrans';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { enqueueSnackbar } from 'notistack';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};
const parseFormattedNumber = (str) => {
  if (!str) return 0;
  // Loại bỏ dấu phẩy thousands separator và khoảng trắng
  // Giữ nguyên dấu chấm thập phân nếu có
  const cleanStr = str.toString().replace(/[,\s]/g, '');

  // Kiểm tra nếu là định dạng Việt Nam (dùng dấu chấm cho thousands separator)
  // Ví dụ: "800.000" -> 800000, "800.000,5" -> 800000.5
  const parts = cleanStr.split(',');
  if (parts.length <= 2) {
    // Nếu có dấu phẩy thì đó là phần thập phân
    if (parts.length === 2) {
      const integerPart = parts[0].replace(/\./g, ''); // Loại bỏ dấu chấm thousands
      const decimalPart = parts[1];
      return parseFloat(`${integerPart}.${decimalPart}`);
    } else {
      // Không có dấu phẩy, kiểm tra xem dấu chấm là thousands hay decimal
      // Nếu có nhiều hơn 3 chữ số sau dấu chấm cuối -> thousands separator
      const dotParts = cleanStr.split('.');
      if (dotParts.length > 1) {
        const lastPart = dotParts[dotParts.length - 1];
        if (lastPart.length === 3 && dotParts.length > 1) {
          // Có thể là thousands separator (ví dụ: 800.000)
          return parseInt(cleanStr.replace(/\./g, ''));
        } else {
          // Có thể là decimal (ví dụ: 800.5)
          return parseFloat(cleanStr);
        }
      }
      return parseFloat(cleanStr);
    }
  }

  return parseFloat(cleanStr.replace(/\./g, ''));
};

// Cải thiện hàm formatNumber để nhất quán
const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  // Làm tròn và định dạng với dấu chấm thousands separator (định dạng VN)
  return Math.round(num).toLocaleString('vi-VN');
};

function StripePartialPayment({ clientSecret, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

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
      enqueueSnackbar(error.message, { variant: 'error' });
    } else if (paymentIntent.status === 'succeeded') {
      onSuccess();
    }
  };

  return (
    <Box>
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
            {trans.common.cancel}
          </Button>
          <Button variant="contained" color="primary" type="submit" disabled={!stripe || loading}>
            {loading ? trans.bills.paymentProcessing : trans.bills.payment}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

function ManageBills() {
  const trans = useTrans();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBills, setSelectedBills] = useState([]);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [partialAmount, setPartialAmount] = useState(0);
  const [loadingPaymentId, setLoadingPaymentId] = useState(null);
  const [openMultiPaymentDialog, setOpenMultiPaymentDialog] = useState(false);
  const [multiPaymentAmounts, setMultiPaymentAmounts] = useState({});
  const [clientSecret, setClientSecret] = useState(null);
  const [showStripePayment, setShowStripePayment] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Applied filter states (for search functionality)
  const [appliedFilterType, setAppliedFilterType] = useState('ALL');
  const [appliedFilterStatus, setAppliedFilterStatus] = useState('ALL');
  const [appliedSearchText, setAppliedSearchText] = useState('');
  const [appliedSortOrder, setAppliedSortOrder] = useState('desc');

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const hideSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    setPage(0);
  }, [appliedFilterType, appliedFilterStatus, appliedSearchText, appliedSortOrder]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/bills`, {
        headers: getAuthHeaders()
      });
      setBills(response.data.data || []);
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Lỗi khi tải dữ liệu hóa đơn', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleSearch = () => {
    setAppliedFilterType(filterType);
    setAppliedFilterStatus(filterStatus);
    setAppliedSearchText(searchText);
    setAppliedSortOrder(sortOrder);
  };

  const handleSelectBill = (billId) => {
    const bill = bills.find((b) => b._id === billId);

    // Kiểm tra trạng thái hóa đơn trước khi cho phép chọn
    if (bill.status === 'completed') {
      enqueueSnackbar('Hóa đơn này đã được thanh toán hoàn tất, không thể chọn để thanh toán.', { variant: 'warning' });
      return;
    }

    if (bill.status === 'cancelled') {
      enqueueSnackbar('Hóa đơn này đã bị hủy, không thể chọn để thanh toán.', { variant: 'error' });
      return;
    }

    // Kiểm tra loại hóa đơn
    if (bill.type === 'EXPORT') {
      enqueueSnackbar('Đơn xuất không thể thanh toán, chỉ có thể xem trạng thái thanh toán của khách hàng.', { variant: 'info' });
      return;
    }

    setSelectedBills((prev) => (prev.includes(billId) ? prev.filter((id) => id !== billId) : [...prev, billId]));
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      // Chỉ chọn hóa đơn có thể thanh toán (không phải completed, cancelled, hoặc EXPORT)
      const payableBills = filteredBills.filter(
        (bill) => bill.status !== 'completed' && bill.status !== 'cancelled' && bill.type !== 'EXPORT'
      );
      const allIds = payableBills.map((bill) => bill._id);
      setSelectedBills(allIds);

      // Hiển thị thông báo nếu có hóa đơn không thể thanh toán
      const nonPayableBills = filteredBills.filter(
        (bill) => bill.status === 'completed' || bill.status === 'cancelled' || bill.type === 'EXPORT'
      );
      if (nonPayableBills.length > 0) {
        const exportCount = nonPayableBills.filter((b) => b.type === 'EXPORT').length;
        const statusCount = nonPayableBills.filter((b) => b.type !== 'EXPORT').length;

        let message = '';
        if (exportCount > 0 && statusCount > 0) {
          message = `${exportCount} đơn xuất không thể thanh toán, ${statusCount} hóa đơn không thể thanh toán (đã hoàn tất hoặc bị hủy)`;
        } else if (exportCount > 0) {
          message = `${exportCount} đơn xuất không thể thanh toán, chỉ có thể xem trạng thái thanh toán của khách hàng`;
        } else {
          message = `${statusCount} hóa đơn không thể thanh toán (đã hoàn tất hoặc bị hủy)`;
        }

        enqueueSnackbar(message, { variant: 'info' });
      }
    } else {
      setSelectedBills([]);
    }
  };

  const calcAmount = (details) => {
    if (!details || details.length === 0) return 0;
    return details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);
  };

  // Thêm hàm tính số tiền còn lại cần thanh toán
  const calcRemainingAmount = (bill) => {
    const totalAmount = calcAmount(bill.details);
    const amountPaid = bill.amountPaid || 0;
    const remaining = Math.max(0, totalAmount - amountPaid);

    console.log('Remaining amount calculation:', {
      billId: bill._id,
      totalAmount,
      amountPaid,
      remaining,
      unit: 'VND'
    });

    return remaining;
  };

  // Thêm hàm tính tổng tiền đã thanh toán
  const calcAmountPaid = (bill) => {
    // Đảm bảo amountPaid luôn là VND
    const amountPaid = bill.amountPaid || 0;

    // FIX: Loại bỏ logic convert sai - amountPaid trong DB đã là VND
    // Không cần chia cho 100 nữa
    return amountPaid;
  };

  // FIX: Thêm hàm validate payment amount
  const validatePaymentAmount = (amount, bill) => {
    if (!amount || amount <= 0) {
      return { isValid: false, error: 'Số tiền thanh toán phải lớn hơn 0' };
    }

    if (amount < 12500) {
      return { isValid: false, error: 'Stripe yêu cầu số tiền thanh toán tối thiểu là 12,500VND' };
    }

    const remainingAmount = calcRemainingAmount(bill);
    if (amount > remainingAmount) {
      return { isValid: false, error: `Số tiền thanh toán không được vượt quá số tiền còn lại: ${remainingAmount.toLocaleString()} VND` };
    }

    return { isValid: true };
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
        return 'error';
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
    const totalAmount = calcAmount(data.details);
    setPartialAmount(calcRemainingAmount(data));
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setDetailData(null);
    setPartialAmount('');
    setClientSecret(null);
    setShowStripePayment(false);
  };

  const handlePartialPayment = async (bill) => {
    console.log('Debug partialAmount:', partialAmount, typeof partialAmount);
    const amount = partialAmount; // partialAmount giờ là số thực
    if (!amount || amount <= 0) {
      enqueueSnackbar('Vui lòng nhập số tiền thanh toán hợp lệ.', { variant: 'error' });
      return;
    }

    // FIX: Sử dụng validation function mới
    const validation = validatePaymentAmount(amount, bill);
    if (amount < 12500) {
      enqueueSnackbar('Stripe yêu cầu số tiền thanh toán tối thiểu là 12,500VND', { variant: 'warning' });
      return;
    }
    if (!validation.isValid) {
      enqueueSnackbar(validation.error, { variant: 'error' });
      return;
    }

    // Kiểm tra loại hóa đơn
    if (bill.type === 'EXPORT') {
      enqueueSnackbar('Đơn xuất không thể thanh toán, chỉ có thể xem trạng thái thanh toán của khách hàng.', { variant: 'info' });
      return;
    }

    // Kiểm tra trạng thái hóa đơn
    if (bill.status === 'completed') {
      enqueueSnackbar('Hóa đơn này đã được thanh toán hoàn tất, không thể thanh toán thêm.', { variant: 'warning' });
      return;
    }

    if (bill.status === 'cancelled') {
      enqueueSnackbar('Hóa đơn này đã bị hủy, không thể thanh toán.', { variant: 'error' });
      return;
    }

    console.log('Payment validation passed:', {
      billId: bill._id,
      amount,
      remainingAmount: calcRemainingAmount(bill),
      unit: 'VND'
    });

    setLoadingPaymentId(bill._id);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const successUrl = window.location.origin + '/success';
      const cancelUrl = window.location.origin + '/not-found';

      const { data } = await axios.post(
        `${backendUrl}/api/stripe/payments/${bill._id}`,
        {
          billId: bill._id,
          amount: Math.round(amount), // FIX: Đảm bảo số tiền được làm tròn chính xác
          paymentType: bill.type.toLowerCase(),
          successUrl,
          cancelUrl
        },
        { headers: getAuthHeaders() }
      );

      if (data.url) {
        window.location.href = data.url;
      } else {
        enqueueSnackbar('Không thể tạo phiên thanh toán Stripe.', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Có lỗi khi tạo PaymentIntent, vui lòng thử lại.', { variant: 'error' });
    } finally {
      setLoadingPaymentId(null);
    }
  };

  const onPartialPaymentSuccess = () => {
    enqueueSnackbar('Thanh toán thành công!', { variant: 'success' });
    handleCloseDetail();
    fetchBills();
  };

  const handleStripePaymentSingle = async (bill) => {
    // Kiểm tra loại hóa đơn
    if (bill.type === 'EXPORT') {
      enqueueSnackbar('Đơn xuất không thể thanh toán, chỉ có thể xem trạng thái thanh toán của khách hàng.', { variant: 'info' });
      return;
    }

    // Kiểm tra trạng thái hóa đơn
    if (bill.status === 'completed') {
      enqueueSnackbar('Hóa đơn này đã được thanh toán hoàn tất, không thể thanh toán thêm.', { variant: 'warning' });
      return;
    }

    if (bill.status === 'cancelled') {
      enqueueSnackbar('Hóa đơn này đã bị hủy, không thể thanh toán.', { variant: 'error' });
      return;
    }
    const totalAmount = calcAmount(bill.details);
    const amountPaid = bill.amountPaid || 0;
    const remaining = Math.max(0, totalAmount - amountPaid);
    if (remaining < 12500) {
      enqueueSnackbar('Stripe yêu cầu số tiền thanh toán tối thiểu là 12,500VND', { variant: 'warning' });
      return; // Dừng ngay, không gọi API
    }

    setLoadingPaymentId(bill._id);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const successUrl = window.location.origin + '/success';
      const cancelUrl = window.location.origin + '/not-found';

      const { data } = await axios.post(
        `${backendUrl}/api/stripe/payments/${bill._id}`,
        {
          billId: bill._id,
          amount: remaining,
          paymentType: bill.type.toLowerCase(),
          successUrl,
          cancelUrl
        },
        { headers: getAuthHeaders() }
      );

      if (data.url) {
        window.location.href = data.url;
      } else {
        enqueueSnackbar('Không thể tạo phiên thanh toán Stripe.', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Có lỗi khi kết nối thanh toán. Vui lòng thử lại sau.', { variant: 'error' });
    } finally {
      setLoadingPaymentId(null);
    }
  };

  const handleOpenMultiPaymentDialog = () => {
    // Kiểm tra trạng thái của tất cả hóa đơn được chọn
    const invalidBills = [];
    selectedBills.forEach((id) => {
      const bill = bills.find((b) => b._id === id);
      if (bill.type === 'EXPORT') {
        invalidBills.push({ id, type: 'EXPORT', message: 'đơn xuất không thể thanh toán' });
      } else if (bill.status === 'completed') {
        invalidBills.push({ id, status: 'completed', message: 'đã được thanh toán hoàn tất' });
      } else if (bill.status === 'cancelled') {
        invalidBills.push({ id, status: 'cancelled', message: 'đã bị hủy' });
      }
    });

    if (invalidBills.length > 0) {
      const billMessages = invalidBills.map((b) => `${b.message}`).join(', ');
      enqueueSnackbar(`Không thể thanh toán: ${billMessages}.`, { variant: 'error' });
      return;
    }

    // FIX: Khởi tạo số tiền thanh toán cho từng hóa đơn
    const amounts = {};
    selectedBills.forEach((id) => {
      const bill = bills.find((b) => b._id === id);
      const remainingAmount = calcRemainingAmount(bill);
      // Khởi tạo với số tiền còn lại cần trả (có thể thanh toán toàn bộ hoặc một phần)
      amounts[id] = formatNumber(remainingAmount);
    });

    console.log('Initializing multi-payment amounts:', {
      selectedBills,
      amounts,
      unit: 'VND'
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
    const bill = bills.find((b) => b._id === billId);
    const maxAmount = calcRemainingAmount(bill);

    // Chỉ cho phép số, dấu chấm và dấu phẩy
    const cleanValue = value.replace(/[^0-9.,]/g, '');
    const numericValue = parseFormattedNumber(cleanValue);

    console.log('Multi-payment input debug:', {
      billId,
      rawInput: value,
      cleanValue,
      parsedValue: numericValue,
      maxAmount,
      unit: 'VND'
    });

    // Validation
    const validation = validatePaymentAmount(numericValue, bill);
    if (!validation.isValid && numericValue > 0) {
      enqueueSnackbar(validation.error, { variant: 'error' });
      return;
    }

    if (numericValue <= maxAmount && numericValue >= 0) {
      setMultiPaymentAmounts((prev) => ({
        ...prev,
        [billId]: formatNumber(numericValue) // Lưu dạng formatted
      }));
    } else if (numericValue > maxAmount) {
      enqueueSnackbar(`Số tiền không được vượt quá ${formatNumber(maxAmount)} VND`, { variant: 'warning' });
    }
  };

  const handleConfirmMultiPayment = async () => {
    setLoadingPaymentId('multi');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const successUrl = window.location.origin + '/success';
      const cancelUrl = window.location.origin + '/not-found';
      const billIds = selectedBills;

      const invalidBills = [];
      billIds.forEach((id) => {
        const bill = bills.find((b) => b._id === id);
        if (bill.type === 'EXPORT') {
          invalidBills.push({ id, type: 'EXPORT', message: 'đơn xuất không thể thanh toán' });
        } else if (bill.status === 'completed') {
          invalidBills.push({ id, status: 'completed', message: 'đã được thanh toán hoàn tất' });
        } else if (bill.status === 'cancelled') {
          invalidBills.push({ id, status: 'cancelled', message: 'đã bị hủy' });
        }
      });

      if (invalidBills.length > 0) {
        const billMessages = invalidBills.map((b) => `${b.message}`).join(', ');
        enqueueSnackbar(`Không thể thanh toán: ${billMessages}.`, { variant: 'error' });
        setLoadingPaymentId(null);
        return;
      }

      let totalPaymentAmount = 0;
      let totalRemainingAmount = 0;

      // FIX: Tính toán chính xác tổng tiền thanh toán và tổng tiền còn lại
      for (const id of billIds) {
        const bill = bills.find((b) => b._id === id);
        const billPaymentAmount = parseFormattedNumber(multiPaymentAmounts[id]) || 0;

        // FIX: Sử dụng validation function mới
        const validation = validatePaymentAmount(billPaymentAmount, bill);
        if (!validation.isValid) {
          enqueueSnackbar(`Hóa đơn ${bill.voucher_code || bill._id.slice(0, 6)}: ${validation.error}`, { variant: 'error' });
          setLoadingPaymentId(null);
          return;
        }

        totalPaymentAmount += billPaymentAmount;
        totalRemainingAmount += calcRemainingAmount(bill);
      }

      if (totalPaymentAmount <= 0) {
        enqueueSnackbar('Tổng số tiền thanh toán không hợp lệ.', { variant: 'error' });
        setLoadingPaymentId(null);
        return;
      }

      console.log('Multi-payment validation:', {
        billIds,
        totalPaymentAmount,
        totalRemainingAmount,
        unit: 'VND',
        individualAmounts: billIds.map((id) => ({
          billId: id,
          paymentAmount: parseFormattedNumber(multiPaymentAmounts[id]) || 0,
          remainingAmount: calcRemainingAmount(bills.find((b) => b._id === id))
        }))
      });

      const firstBill = bills.find((b) => b._id === billIds[0]);
      const paymentType = firstBill?.type?.toLowerCase() || 'import';
      const { data } = await axios.post(
        `${backendUrl}/api/stripe/payments/multi`,
        {
          billIds,
          amount: totalPaymentAmount, // FIX: Gửi tổng tiền thanh toán chính xác
          paymentType: 'import',
          successUrl,
          cancelUrl
        },
        { headers: getAuthHeaders() }
      );
      if (data.url) {
        window.location.href = data.url;
      } else {
        enqueueSnackbar('Không thể tạo phiên thanh toán cho nhiều hóa đơn.', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Có lỗi khi kết nối thanh toán nhiều hóa đơn. Vui lòng thử lại sau.', { variant: 'error' });
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
          {trans.common.noMedicineDetails}
        </TableCell>
      </TableRow>
    );
  };

  const filteredBills = bills
    .filter((bill) => {
      if (appliedFilterType !== 'ALL' && bill.type !== appliedFilterType) return false;
      if (appliedFilterStatus !== 'ALL' && bill.status !== appliedFilterStatus) return false;

      if (appliedSearchText.trim() !== '') {
        const lowerSearch = appliedSearchText.toLowerCase();
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
      return appliedSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  // Calculate total amount for multi-payment
  const calculateMultiPaymentTotal = () => {
    const total = Object.entries(multiPaymentAmounts).reduce((sum, [billId, amount]) => {
      const numericAmount = parseFormattedNumber(amount) || 0;

      console.log('Multi-payment total calculation detail:', {
        billId,
        formattedAmount: amount,
        parsedAmount: numericAmount,
        runningSum: sum + numericAmount
      });

      return sum + numericAmount;
    }, 0);

    console.log('Multi-payment total final:', {
      amounts: multiPaymentAmounts,
      total,
      formattedTotal: formatNumber(total),
      unit: 'VND'
    });

    return total;
  };

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
            {trans.bills.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {trans.bills.description}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchBills}>
          {trans.bills.refresh}
        </Button>
      </Box>

      <Box component={Paper} sx={{ p: 2, mb: 2 }} elevation={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{trans.common.type}</InputLabel>
            <Select label={trans.common.type} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <MenuItem value="ALL">{trans.common.all}</MenuItem>
              <MenuItem value="IMPORT">IMPORT</MenuItem>
              <MenuItem value="EXPORT">EXPORT</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select label="Trạng thái" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="ALL">Tất cả</MenuItem>
              <MenuItem value="pending">PENDING</MenuItem>
              <MenuItem value="completed">COMPLETED</MenuItem>
              <MenuItem value="cancelled">CANCELLED</MenuItem>
              <MenuItem value="partial">PAID</MenuItem>
              <MenuItem value="overdue">OVERDUE</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label={trans.common.search}
            placeholder={`${trans.common.billCode}, ${trans.common.medicineCode}`}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{trans.common.sortByDate}</InputLabel>
            <Select label={trans.common.sortByDate} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <MenuItem value="desc">{trans.common.newestFirst}</MenuItem>
              <MenuItem value="asc">{trans.common.oldestFirst}</MenuItem>
            </Select>
          </FormControl>

          <Button size="small" variant="contained" color="primary" startIcon={<Search />} onClick={handleSearch}>
            Tìm kiếm
          </Button>

          <Button
            size="small"
            variant="contained"
            color="secondary"
            disabled={
              selectedBills.length === 0 ||
              loadingPaymentId !== null ||
              selectedBills.some((id) => {
                const bill = bills.find((b) => b._id === id);
                return bill.status === 'completed' || bill.status === 'cancelled' || bill.type === 'EXPORT';
              })
            }
            onClick={handleOpenMultiPaymentDialog}
            title={
              selectedBills.some((id) => {
                const bill = bills.find((b) => b._id === id);
                return bill.status === 'completed' || bill.status === 'cancelled' || bill.type === 'EXPORT';
              })
                ? 'Một số hóa đơn không thể thanh toán (đã hoàn tất, bị hủy hoặc là đơn xuất)'
                : ''
            }
          >
            {loadingPaymentId === 'multi'
              ? trans.common.processing
              : `${trans.common.payment} (${selectedBills.length}) ${trans.common.multiPaymentBills}`}
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
              <TableCell sx={{ fontWeight: 600 }}>{trans.bills.tableHeaders.billCode}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{trans.bills.tableHeaders.type}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{trans.bills.tableHeaders.status}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{trans.bills.tableHeaders.createdDate}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{trans.bills.tableHeaders.medicineDetails}</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                {trans.bills.tableHeaders.totalAmount}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{trans.bills.tableHeaders.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  {trans.bills.noData}
                </TableCell>
              </TableRow>
            ) : (
              filteredBills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((bill) => (
                <TableRow key={bill._id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedBills.includes(bill._id)}
                      onChange={() => handleSelectBill(bill._id)}
                      disabled={bill.status === 'completed' || bill.status === 'cancelled' || bill.type === 'EXPORT'}
                      title={
                        bill.type === 'EXPORT'
                          ? 'Đơn xuất không thể thanh toán, chỉ có thể xem trạng thái thanh toán của khách hàng'
                          : bill.status === 'completed'
                            ? 'Hóa đơn đã được thanh toán hoàn tất'
                            : bill.status === 'cancelled'
                              ? 'Hóa đơn đã bị hủy'
                              : ''
                      }
                    />
                  </TableCell>
                  <TableCell>{bill.voucher_code ? bill.voucher_code.slice(0, 6) : bill._id.slice(0, 6)}</TableCell>
                  <TableCell>{bill.type || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={
                        bill.status === 'cancelled'
                          ? 'Thanh toán thất bại'
                          : bill.status === 'completed'
                            ? 'Đã thanh toán'
                            : bill.status === 'pending'
                              ? 'Đang chờ'
                              : bill.status === 'partial'
                                ? 'Thanh toán một phần'
                                : bill.status
                      }
                      color={getStatusColor(bill.status)}
                      title={
                        bill.status === 'cancelled'
                          ? 'Hóa đơn này đã bị hủy do thanh toán thất bại'
                          : bill.status === 'completed'
                            ? 'Hóa đơn này đã được thanh toán hoàn tất'
                            : bill.status === 'pending'
                              ? 'Hóa đơn này đang chờ thanh toán'
                              : bill.status === 'partial'
                                ? 'Hóa đơn này đã được thanh toán một phần'
                                : ''
                      }
                    />
                  </TableCell>
                  <TableCell>{getDisplayDate(bill)}</TableCell>
                  <TableCell
                    sx={{
                      whiteSpace: 'normal',
                      maxWidth: 200,
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
                  <TableCell align="right">
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tổng: {formatNumber(calcAmount(bill.details))} VNĐ
                      </Typography>
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        Còn lại: {formatNumber(calcRemainingAmount(bill))} VNĐ
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {bill.type === 'EXPORT' ? (
                      // Đối với đơn xuất, chỉ hiển thị button Detail để xem trạng thái thanh toán
                      <Button
                        size="small"
                        variant="outlined"
                        color="info"
                        onClick={() => handleOpenDetail(bill)}
                        title="Xem trạng thái thanh toán của khách hàng"
                      >
                        Detail
                      </Button>
                    ) : (
                      // Đối với đơn nhập, hiển thị các button thanh toán
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          sx={{ mr: 1 }}
                          onClick={() => handleOpenDetail(bill)}
                          disabled={loadingPaymentId === bill._id || bill.status === 'completed' || bill.status === 'cancelled'}
                          title={
                            bill.status === 'completed'
                              ? 'Hóa đơn đã được thanh toán hoàn tất'
                              : bill.status === 'cancelled'
                                ? 'Hóa đơn đã bị hủy'
                                : ''
                          }
                        >
                          Thanh toán 1 phần
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          onClick={() => handleStripePaymentSingle(bill)}
                          disabled={loadingPaymentId === bill._id || bill.status === 'completed' || bill.status === 'cancelled'}
                          title={
                            bill.status === 'completed'
                              ? 'Hóa đơn đã được thanh toán hoàn tất'
                              : bill.status === 'cancelled'
                                ? 'Hóa đơn đã bị hủy'
                                : ''
                          }
                        >
                          Thanh toán toàn bộ
                        </Button>
                      </>
                    )}
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

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={hideSnackbar}>
        <Box
          sx={{
            backgroundColor:
              snackbar.severity === 'error'
                ? '#f44336'
                : snackbar.severity === 'success'
                  ? '#4caf50'
                  : snackbar.severity === 'warning'
                    ? '#ff9800'
                    : '#2196f3',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          {snackbar.message}
        </Box>
      </Snackbar>

      <Dialog open={openDetail} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle>{detailData?.type === 'EXPORT' ? 'Chi tiết đơn xuất - Trạng thái thanh toán' : 'Chi tiết hóa đơn'}</DialogTitle>
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
                  <strong>{trans.common.billCodeLabel}:</strong> {detailData.voucher_code || detailData._id}
                </Typography>
                <Typography>
                  <strong>{trans.common.type}:</strong> {detailData.type}
                </Typography>
                <Typography>
                  <strong>{trans.common.createdDate}:</strong> {getDisplayDate(detailData)}
                </Typography>
                <Typography>
                  <strong>{trans.common.status}:</strong> {detailData.status}
                </Typography>

                {detailData.type === 'EXPORT' ? (
                  // Đối với đơn xuất, hiển thị thông tin trạng thái thanh toán của khách hàng
                  <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.50', borderRadius: 1 }}>
                    <Typography variant="h6" color="info.main" gutterBottom>
                      Trạng thái thanh toán của khách hàng
                    </Typography>
                    <Typography>Đây là đơn xuất, bạn chỉ có thể xem trạng thái thanh toán của khách hàng.</Typography>
                    <Typography sx={{ mt: 1 }}>
                      <strong>Trạng thái hiện tại:</strong>{' '}
                      {detailData.status === 'cancelled'
                        ? 'Thanh toán thất bại'
                        : detailData.status === 'completed'
                          ? 'Đã thanh toán'
                          : detailData.status}
                    </Typography>
                  </Box>
                ) : (
                  // Đối với đơn nhập, hiển thị chi tiết thuốc và form thanh toán
                  <>
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
                    <Typography>
                      <strong>Đã thanh toán:</strong> {calcAmountPaid(detailData).toLocaleString()} VNĐ
                    </Typography>
                    <Typography color="primary" fontWeight="bold">
                      <strong>Số tiền còn lại:</strong> {calcRemainingAmount(detailData).toLocaleString()} VNĐ
                    </Typography>

                    <TextField
                      label="Số tiền thanh toán (VNĐ)"
                      fullWidth
                      value={formatNumber(partialAmount)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9,\s]/g, '');
                        const numericValue = parseFormattedNumber(value);
                        console.log('Input value:', e.target.value, 'Parsed:', numericValue);
                        const maxAmount = calcRemainingAmount(detailData);
                        if (numericValue <= maxAmount && numericValue > 0) {
                          setPartialAmount(numericValue); // Lưu số thực, không phải chuỗi
                        }
                      }}
                      sx={{ mt: 2 }}
                      helperText={`Số tiền: ${partialAmount} VNĐ - Bạn có thể thanh toán toàn bộ hoặc một phần số tiền còn lại (${formatNumber(calcRemainingAmount(detailData))} VNĐ).`}
                    />
                  </>
                )}
              </>
            )
          )}
        </DialogContent>
        {!showStripePayment && detailData?.type !== 'EXPORT' && (
          <DialogActions>
            <Button onClick={handleCloseDetail} disabled={loadingPaymentId !== null}>
              {trans.common.close}
            </Button>
            <Button
              onClick={() => handlePartialPayment(detailData)}
              variant="contained"
              disabled={loadingPaymentId !== null || !partialAmount || partialAmount <= 0}
            >
              {loadingPaymentId === detailData?._id ? trans.common.processing : trans.common.payment}
            </Button>
          </DialogActions>
        )}
        {!showStripePayment && detailData?.type === 'EXPORT' && (
          <DialogActions>
            <Button onClick={handleCloseDetail}>Đóng</Button>
          </DialogActions>
        )}
      </Dialog>

      <Dialog open={openMultiPaymentDialog} onClose={handleCloseMultiPaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{trans.common.multiPaymentTitle}</DialogTitle>
        <DialogContent dividers>
          {showStripePayment && clientSecret ? (
            <Elements stripe={stripePromise}>
              <StripePartialPayment
                clientSecret={clientSecret}
                onSuccess={() => {
                  showSnackbar('Thanh toán nhiều hóa đơn thành công!', 'success');
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
            <>
              {selectedBills.map((billId) => {
                const bill = bills.find((b) => b._id === billId);
                const maxAmount = calcRemainingAmount(bill);
                return (
                  <Box key={billId} sx={{ mb: 2 }}>
                    <Typography mb={1} variant="subtitle1">{`Mã hóa đơn: ${bill.voucher_code || bill._id}`}</Typography>
                    <TextField
                      label="Số tiền thanh toán (VNĐ)"
                      disabled
                      value={multiPaymentAmounts[billId] || ''}
                      onChange={(e) => {
                        // FIX: Chỉ cho phép số và dấu phẩy, không cho phép khoảng trắng
                        const value = e.target.value.replace(/[^0-9,]/g, '');
                        const numericValue = parseFormattedNumber(value);
                        console.log('Input value:', e.target.value, 'Parsed:', numericValue);
                        if (numericValue <= maxAmount && numericValue > 0) {
                          handleMultiPaymentAmountChange(billId, formatNumber(numericValue));
                        }
                      }}
                      fullWidth
                      helperText={`Số tiền: ${multiPaymentAmounts[billId] || '0'} VNĐ / Số tiền còn lại: ${formatNumber(maxAmount)} VNĐ`}
                    />
                  </Box>
                );
              })}
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6" align="center">
                  <strong>Tổng cộng thanh toán: {calculateMultiPaymentTotal().toLocaleString()} VNĐ</strong>
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        {!showStripePayment && (
          <DialogActions>
            <Button onClick={handleCloseMultiPaymentDialog} disabled={loadingPaymentId === 'multi'}>
              {trans.common.cancel}
            </Button>
            <Button
              onClick={handleConfirmMultiPayment}
              variant="contained"
              disabled={loadingPaymentId === 'multi' || calculateMultiPaymentTotal() <= 0}
            >
              {loadingPaymentId === 'multi' ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}

export default ManageBills;
