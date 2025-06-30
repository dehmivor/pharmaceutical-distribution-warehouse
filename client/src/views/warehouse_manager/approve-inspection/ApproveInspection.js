'use client';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

function ApproveInspection() {
  const [data, setData] = useState({
    inspections: [],
    pagination: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchInspections = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await axios.get('http://localhost:5000/api/inspections', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setData({
        inspections: response.data.inspections,
        pagination: response.data.pagination
      });
    } catch (err) {
      setError('Không thể tải danh sách kiểm tra');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const hasInsufficientItems = (inspection) => inspection.rejected_quantity > 0 || inspection.actual_quantity === 0;

  const isFullyChecked = (inspection) => !hasInsufficientItems(inspection);

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'approved':
        return 'primary';
      case 'delivered':
        return 'secondary';
      case 'checked':
        return 'warning';
      case 'arranged':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const isOrderReadyForCompletion = (importOrderId) => {
    const orderInspections = data.inspections.filter((insp) => insp.import_order_id?._id === importOrderId);
    if (orderInspections.length === 0) return false;
    const allFullyChecked = orderInspections.every(isFullyChecked);
    const currentStatus = orderInspections[0].import_order_id.status;
    return allFullyChecked && currentStatus !== 'completed';
  };

  const handleCompleteOrder = async (importOrderId) => {
    try {
      const token = localStorage.getItem('auth-token');
      await axios.patch(
        `http://localhost:5000/api/import-orders/${importOrderId}/status`,
        { status: 'checked' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({
        open: true,
        message: `Đã chuyển trạng thái đơn nhập ${importOrderId} thành CHECKED!`,
        severity: 'success'
      });
      fetchInspections();
    } catch (error) {
      let errorMessage = error.message;
      if (error.response) {
        errorMessage = error.response.data.error || error.response.data.message;
      }
      setSnackbar({
        open: true,
        message: `Lỗi: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  const handleCompleteAll = () => {
    const uniqueImportOrders = Array.from(new Set(data.inspections.map((i) => i.import_order_id?._id))).filter(Boolean);
    let hasAny = false;
    uniqueImportOrders.forEach((importOrderId) => {
      if (isOrderReadyForCompletion(importOrderId)) {
        hasAny = true;
        handleCompleteOrder(importOrderId);
      }
    });
    if (!hasAny) {
      setSnackbar({
        open: true,
        message: 'Không có đơn nhập nào đủ điều kiện hoàn thành!',
        severity: 'warning'
      });
    }
  };

  const handleDeleteInspection = async (inspectionId) => {
    try {
      const token = localStorage.getItem('auth-token');
      await axios.delete(`http://localhost:5000/api/inspections/${inspectionId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchInspections();
      setSnackbar({
        open: true,
        message: 'Đã xóa phiếu kiểm nhập thành công!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Lỗi xóa phiếu kiểm nhập!',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Danh sách kiểm tra nhập kho</Typography>
        <Button variant="contained" color="primary" onClick={handleCompleteAll}>
          Complete inspection import
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Đơn nhập</TableCell>
              <TableCell>Lô hàng</TableCell>
              <TableCell align="right">SL thực nhận</TableCell>
              <TableCell align="right">SL loại</TableCell>
              <TableCell>Ghi chú</TableCell>
              <TableCell>Tạo bởi</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.inspections.map((inspection) => (
              <TableRow key={inspection._id} hover sx={hasInsufficientItems(inspection) ? { backgroundColor: '#fff3e0' } : {}}>
                <TableCell>
                  <Tooltip title={inspection._id}>
                    <Typography variant="body2" fontWeight="bold">
                      {inspection._id.slice(-6)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={inspection.import_order_id?.status}
                      color={getStatusColor(inspection.import_order_id?.status)}
                      size="small"
                    />
                    <Typography variant="caption">{inspection.import_order_id?._id.slice(-6)}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  {inspection.batch_id?._id ? (
                    <Stack spacing={0.5}>
                      <Typography variant="caption">{inspection.batch_id.batch_code}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {inspection.batch_id.production_date && new Date(inspection.batch_id.production_date).toLocaleDateString()}
                        {' - '}
                        {inspection.batch_id.expiry_date && new Date(inspection.batch_id.expiry_date).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  ) : (
                    <Chip label="Chưa có lô" color="warning" size="small" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography color={inspection.actual_quantity === 0 ? 'error' : 'text.primary'}>{inspection.actual_quantity}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography color={inspection.rejected_quantity > 0 ? 'error' : 'text.primary'}>
                    {inspection.rejected_quantity}
                  </Typography>
                </TableCell>
                <TableCell>{inspection.note || <i style={{ color: '#aaa' }}>Không có</i>}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{inspection.created_by?.email?.[0]?.toUpperCase() || 'S'}</Avatar>
                    <Typography variant="body2">{inspection.created_by?.email || 'Hệ thống'}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  {isFullyChecked(inspection) ? (
                    <CheckCircleIcon color="success" />
                  ) : inspection.rejected_quantity > 0 ? (
                    <ErrorIcon color="error" />
                  ) : (
                    <InfoIcon color="info" />
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip title="Xóa phiếu kiểm nhập">
                    <span>
                      <IconButton color="error" size="small" onClick={() => handleDeleteInspection(inspection._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.pagination && (
          <TablePagination
            component="div"
            count={data.pagination.total_items}
            page={data.pagination.current_page - 1}
            onPageChange={() => fetchInspections()}
            rowsPerPage={data.pagination.page_size || 10}
            rowsPerPageOptions={[10, 20, 50]}
            onRowsPerPageChange={() => fetchInspections()}
          />
        )}
      </TableContainer>

      {data.pagination && (
        <Box mt={2} display="flex" justifyContent="center">
          <Typography variant="body2">
            Trang {data.pagination.current_page} / {data.pagination.total_pages} - Tổng cộng {data.pagination.total_items} kiểm tra
          </Typography>
        </Box>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <MuiAlert elevation={6} variant="filled" onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}

export default ApproveInspection;
