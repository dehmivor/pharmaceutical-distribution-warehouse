'use client';
import useInspection from '@/hooks/useInspection';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItemButton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import MuiAlert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { useEffect, useState } from 'react';

function ApproveInspection() {
  const theme = useTheme();
  const { fetchInspectionForApprove, loading, error } = useInspection();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchInspectionForApprove();

        const grouped = {};
        data.data.forEach((insp) => {
          const order = insp.import_order_id;
          if (!grouped[order._id]) {
            grouped[order._id] = {
              importOrder: order,
              inspections: []
            };
          }
          grouped[order._id].inspections.push(insp);
        });
        const ordersArr = Object.values(grouped);
        setOrders(ordersArr);
        if (ordersArr.length > 0) {
          setSelectedOrderId(ordersArr[0].importOrder._id);
        }
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Lỗi khi tải dữ liệu: ${err.message}`,
          severity: 'error'
        });
      }
    };
    fetchData();
  }, [fetchInspectionForApprove]);

  const handleCompleteOrder = async (importOrderId) => {
    // Tìm order trong state
    const order = orders.find((o) => o.importOrder._id === importOrderId);
    if (!order) {
      setSnackbar({
        open: true,
        message: 'Không tìm thấy đơn nhập!',
        severity: 'warning'
      });
      return;
    }

    // Validate: Số mặt hàng phải bằng số phiếu inspection
    const importItems = order.importOrder.details;
    const inspections = order.inspections;
    if (importItems.length !== inspections.length) {
      setSnackbar({
        open: true,
        message: 'Số mặt hàng và số phiếu kiểm kê không khớp!',
        severity: 'warning'
      });
      return;
    }

    // Validate: Số lượng thực nhập >= 90% số lượng yêu cầu với từng mặt hàng
    for (const item of importItems) {
      // Tìm inspection tương ứng với mặt hàng này
      const inspection = inspections.find(
        (insp) => (insp.medicine_id?._id || insp.medicine_id) === (item.medicine_id?._id || item.medicine_id)
      );
      if (!inspection) {
        setSnackbar({
          open: true,
          message: `Thiếu phiếu kiểm kê cho mặt hàng ${item.medicine_id?.medicine_name || item.medicine_id}`,
          severity: 'warning'
        });
        return;
      }
      if (inspection.actual_quantity < 0.9 * item.quantity) {
        setSnackbar({
          open: true,
          message: `Số lượng thực nhập của mặt hàng ${item.medicine_id?.medicine_name || item.medicine_id} chưa đạt 90% yêu cầu!`,
          severity: 'warning'
        });
        return;
      }
    }

    // Nếu qua validate, gọi API cập nhật trạng thái
    try {
      const updatedOrder = await updateImportOrderStatus(importOrderId, 'checked');

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.importOrder._id === importOrderId ? { ...order, importOrder: { ...order.importOrder, status: 'checked' } } : order
        )
      );

      setSnackbar({
        open: true,
        message: `Đơn nhập ${importOrderId.slice(-6)} đã được cập nhật trạng thái kiểm tra!`,
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Lỗi khi cập nhật trạng thái: ${err.response?.data?.error || err.message}`,
        severity: 'error'
      });
    }
  };

  const updateImportOrderStatus = async (importOrderId, status) => {
    const token = localStorage.getItem('auth-token');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';

    const response = await axios.patch(
      `${backendUrl}/api/import-orders/${importOrderId}/status`,
      { status }, // body
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data.data;
  };

  const isOrderReadyForCompletion = (order) => {
    // 1. Số mặt hàng trong importOrder (details)
    const importItems = order.importOrder.details;
    const inspections = order.inspections;

    // 2. Số lượng mặt hàng phải bằng số phiếu inspection
    if (importItems.length !== inspections.length) return false;

    // 3. Kiểm tra từng mặt hàng
    for (const item of importItems) {
      // Tìm inspection tương ứng với mặt hàng này
      const inspection = inspections.find(
        (insp) => (insp.medicine_id?._id || insp.medicine_id) === (item.medicine_id?._id || item.medicine_id)
      );
      if (!inspection) return false;

      // Số lượng thực nhập phải >= 90% số lượng yêu cầu
      if (inspection.actual_quantity < 0.9 * item.quantity) return false;

      // (Có thể thêm điều kiện khác nếu cần, ví dụ không bị loại bỏ hết)
      // if (inspection.actual_quantity === 0) return false;
    }

    return true;
  };

  const handleDeleteInspection = async (inspectionId) => {
    try {
      const token = localStorage.getItem('auth-token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';

      await axios.delete(`${backendUrl}/api/inspections/${inspectionId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOrders((prevOrders) =>
        prevOrders.map((order) => ({
          ...order,
          inspections: order.inspections.filter((insp) => insp._id !== inspectionId)
        }))
      );
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

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const getStatusProps = (status) => {
    switch (status) {
      case 'delivered':
        return {
          icon: <LocalShippingIcon color="info" fontSize="small" />,
          label: 'Đã giao',
          color: 'info'
        };
      case 'checked':
        return {
          icon: <CheckCircleIcon color="success" fontSize="small" />,
          label: 'Đã kiểm tra',
          color: 'success'
        };
      case 'pending':
        return {
          icon: <HourglassEmptyIcon color="warning" fontSize="small" />,
          label: 'Chờ xử lý',
          color: 'warning'
        };
      case 'cancelled':
        return {
          icon: <CancelIcon color="error" fontSize="small" />,
          label: 'Đã hủy',
          color: 'error'
        };
      default:
        return {
          icon: <HourglassEmptyIcon color="disabled" fontSize="small" />,
          label: status,
          color: 'default'
        };
    }
  };

  const selectedOrder = orders.find((o) => o.importOrder._id === selectedOrderId);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Quản lý kiểm kê nhập kho</Typography>
        <Button variant="contained" color="primary" onClick={() => handleCompleteOrder(selectedOrderId)} disabled={!selectedOrderId}>
          Hoàn thành kiểm tra
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box p={2} bgcolor="error.light" borderRadius={1}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <Box display="flex" gap={2} flexWrap="wrap">
          <Box minWidth={280} flexShrink={0}>
            <Typography variant="h6" mb={1}>
              Danh sách đơn nhập
            </Typography>
            <Box
              sx={{
                borderRadius: 2,
                p: 1
              }}
            >
              <List disablePadding>
                {orders.map((order, idx) => {
                  const statusProps = getStatusProps(order.importOrder.status);
                  const manager = order.importOrder.warehouse_manager_id;
                  return (
                    <Box key={order.importOrder._id}>
                      <ListItemButton
                        selected={selectedOrderId === order.importOrder._id}
                        onClick={() => setSelectedOrderId(order.importOrder._id)}
                        sx={{
                          mb: 1,
                          borderRadius: 1,
                          boxShadow: selectedOrderId === order.importOrder._id ? 2 : 0,
                          bgcolor: selectedOrderId === order.importOrder._id ? 'primary.lighter' : 'background.paper',
                          transition: 'all 0.2s',
                          p: 2,
                          alignItems: 'flex-start'
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                          {/* Icon trạng thái */}
                          {statusProps.icon}

                          {/* Thông tin chính */}
                          <Box flex={1}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              Đơn: {order.importOrder._id.slice(-6)}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                              {/* Chip trạng thái */}
                              <Chip
                                size="small"
                                label={statusProps.label}
                                color={statusProps.color}
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                              />
                              {/* Avatar QL kho */}
                              {manager && (
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Avatar sx={{ width: 22, height: 22, bgcolor: 'primary.main', fontSize: 14 }}>
                                    <PersonIcon fontSize="inherit" />
                                  </Avatar>
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {manager.email}
                                  </Typography>
                                </Stack>
                              )}
                            </Stack>
                          </Box>
                        </Stack>
                      </ListItemButton>
                      {idx < orders.length - 1 && <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mx: 1 }} />}
                    </Box>
                  );
                })}
              </List>
            </Box>
          </Box>

          {/* Cột phải: Danh sách phiếu kiểm kê (inspection) */}
          <Box flex={1}>
            {selectedOrder ? (
              <>
                <Box mb={2}>
                  <Typography variant="h6" gutterBottom>
                    Danh sách phiếu kiểm kê cho đơn {selectedOrder.importOrder._id.slice(-6)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng số phiếu kiểm kê: <b>{selectedOrder.inspections.length}</b>
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Số thứ tự</TableCell>
                        <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>
                          Inspection ID
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Tên thuốc</TableCell>
                        <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Thực nhập</TableCell>
                        <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Số loại bỏ</TableCell>
                        <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Người tạo</TableCell>
                        <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.primary.main}` }}>Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.inspections.map((insp) => (
                        <TableRow key={insp._id} hover>
                          <TableCell>{selectedOrder.inspections.indexOf(insp) + 1}</TableCell>
                          <TableCell>
                            <Tooltip title={insp._id}>
                              <Typography variant="body2" fontWeight="bold">
                                {insp._id.slice(-6)}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          {/* <TableCell>{insp.medicine_id.medicine_name}</TableCell> */}
                          <TableCell>{insp.actual_quantity}</TableCell>
                          <TableCell>{insp.rejected_quantity}</TableCell>
                          <TableCell>{insp.created_by?.email || '-'}</TableCell>
                          <TableCell>
                            <Tooltip title="Xóa phiếu kiểm nhập">
                              <span>
                                <IconButton color="error" size="small" onClick={() => handleDeleteInspection(insp._id)}>
                                  <DeleteIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" py={4}>
                {orders.length === 0 ? 'Không có đơn nhập nào' : 'Vui lòng chọn một đơn nhập để xem phiếu kiểm kê'}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} // Thêm dòng này
      >
        <MuiAlert elevation={6} variant="filled" onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>

      {selectedOrderId && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>Tiến độ kiểm kê từng mặt hàng</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {selectedOrder.importOrder.details.map((item, idx) => {
              // Tìm inspection tương ứng với mặt hàng này
              const inspection = selectedOrder.inspections.find(
                (insp) => (insp.medicine_id?._id || insp.medicine_id) === (item.medicine_id?._id || item.medicine_id)
              );
              // Tính phần trăm thực nhập
              const actual = inspection?.actual_quantity || 0;
              const percent = Math.min(100, Math.round((actual / item.quantity) * 100));
              return (
                <Box key={item._id || idx} mb={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="subtitle2">{item.medicine_id?.medicine_name || 'Mặt hàng'}</Typography>
                    <Typography variant="caption" color={percent >= 90 ? 'success.main' : 'warning.main'}>
                      {actual} / {item.quantity} ({percent}%)
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={percent}
                    color={percent >= 90 ? 'success' : 'warning'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              );
            })}
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}

export default ApproveInspection;
