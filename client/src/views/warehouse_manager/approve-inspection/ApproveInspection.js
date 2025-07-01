'use client';
import {
  Box,
  Button,
  List,
  ListItemButton,
  IconButton,
  ListItemText,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  CircularProgress
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { useState, useEffect } from 'react';
import useInspection from '@/hooks/useInspection';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

function ApproveInspection() {
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

  // Giả sử có API hoàn thành đơn nhập
  const completeImportOrder = async (importOrderId) => {
    const token = localStorage.getItem('auth-token');
    await axios.post(
      `http://localhost:5000/api/import-orders/${importOrderId}/complete`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  };

  const isOrderReadyForCompletion = (order) => {
    // Ví dụ: kiểm tra số lượng inspections
    return order.inspections.length > 0;
  };

  const handleCompleteOrder = async (importOrderId) => {
    const order = orders.find((o) => o.importOrder._id === importOrderId);
    if (!order || !isOrderReadyForCompletion(order)) {
      setSnackbar({
        open: true,
        message: 'Đơn nhập chưa đủ điều kiện hoàn thành!',
        severity: 'warning'
      });
      return;
    }
    try {
      await completeImportOrder(importOrderId);
      setSnackbar({
        open: true,
        message: `Đã hoàn thành kiểm tra cho đơn ${importOrderId.slice(-6)}!`,
        severity: 'success'
      });
      // Cập nhật lại state hoặc fetch lại dữ liệu nếu cần
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Lỗi khi hoàn thành kiểm tra: ${err.message}`,
        severity: 'error'
      });
    }
  };

  const handleCompleteAll = async () => {
    if (orders.length === 0) {
      setSnackbar({
        open: true,
        message: 'Không có đơn nhập nào để hoàn thành!',
        severity: 'warning'
      });
      return;
    }
    let hasAny = false;
    for (const order of orders) {
      if (isOrderReadyForCompletion(order)) {
        hasAny = true;
        await handleCompleteOrder(order.importOrder._id);
      }
    }
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
      // Xóa inspection khỏi state orders
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

  const selectedOrder = orders.find((o) => o.importOrder._id === selectedOrderId);

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Quản lý kiểm kê nhập kho</Typography>
        <Button variant="contained" color="primary" onClick={handleCompleteAll}>
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
          {/* Cột trái: Danh sách đơn nhập */}
          <Box minWidth={250} flexShrink={0}>
            <Typography variant="h6" mb={1}>
              Danh sách đơn nhập
            </Typography>
            <List>
              {orders.map((order) => (
                <ListItemButton
                  key={order.importOrder._id}
                  selected={selectedOrderId === order.importOrder._id}
                  onClick={() => setSelectedOrderId(order.importOrder._id)}
                  sx={{ p: 1 }}
                >
                  <ListItemText
                    primary={`Đơn: ${order.importOrder._id.slice(-6)}`}
                    secondary={
                      <>
                        <span>Trạng thái: {order.importOrder.status}</span>
                        <br />
                        <span>QL kho: {order.importOrder.warehouse_manager_id?.email || 'Không có'}</span>
                      </>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
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
                <TableContainer component={Paper} elevation={3}>
                  <Table size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell>Inspection ID</TableCell>
                        <TableCell>Thực nhập</TableCell>
                        <TableCell>Số loại bỏ</TableCell>
                        <TableCell>Người tạo</TableCell>
                        <TableCell>Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.inspections.map((insp) => (
                        <TableRow key={insp._id} hover>
                          <TableCell>
                            <Tooltip title={insp._id}>
                              <Typography variant="body2" fontWeight="bold">
                                {insp._id.slice(-6)}
                              </Typography>
                            </Tooltip>
                          </TableCell>
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

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <MuiAlert elevation={6} variant="filled" onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}

export default ApproveInspection;
