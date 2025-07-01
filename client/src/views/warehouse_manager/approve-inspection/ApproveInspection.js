'use client';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
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
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect } from 'react';
import useInspection from '@/hooks/useInspection';

function ApproveInspection() {
  const { fetchInspectionForApprove, loading, error } = useInspection();
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchInspectionForApprove();

        // Chuyển đổi dữ liệu API sang định dạng phù hợp với component
        const transformedOrders = data.data.map((order) => ({
          _id: order._id,
          status: order.status,
          warehouse_manager_id: { email: order.warehouse_manager?.email || '' },
          // Đảm bảo details luôn là mảng (kể cả rỗng)
          details: (order.items || []).map((item) => ({
            _id: item._id,
            medicine_id: {
              _id: item.medicine?._id || '',
              license_code: item.medicine?.license_code || '',
              medicine_name: item.medicine?.name || ''
            },
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
        }));

        setOrders(transformedOrders);
        if (transformedOrders.length > 0) {
          setSelectedOrderId(transformedOrders[0]._id);
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

  const handleDeleteInspection = (orderId, inspectionId) => {
    setOrders((prev) =>
      prev.map((order) =>
        order._id === orderId
          ? {
              ...order,
              // Đảm bảo details luôn là mảng trước khi filter
              details: (order.details || []).filter((i) => i._id !== inspectionId)
            }
          : order
      )
    );
    setSnackbar({ open: true, message: 'Đã xóa phiếu kiểm kê!', severity: 'success' });
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const selectedOrder = orders.find((order) => order._id === selectedOrderId);

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Quản lý kiểm kê nhập kho</Typography>
        <Button variant="contained" color="primary" disabled>
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
                  key={order._id}
                  selected={selectedOrderId === order._id}
                  onClick={() => setSelectedOrderId(order._id)}
                  sx={{ p: 1 }}
                >
                  <ListItem>
                    <ListItemText
                      primary={`Đơn: ${order._id.slice(-6)}`}
                      secondary={
                        <>
                          <span>Trạng thái: {order.status}</span>
                          <br />
                          <span>QL kho: {order.warehouse_manager_id?.email}</span>
                        </>
                      }
                    />
                  </ListItem>
                </ListItemButton>
              ))}
            </List>
          </Box>

          {/* Cột phải: Danh sách kiểm kê */}
          <Box flex={1}>
            {selectedOrder ? (
              <>
                <Box mb={2}>
                  <Typography variant="h6" gutterBottom>
                    Danh sách kiểm kê cho đơn {selectedOrder._id.slice(-6)}
                  </Typography>
                  {/* Sửa lỗi: Kiểm tra details tồn tại trước khi truy cập length */}
                  <Typography variant="body2" color="text.secondary">
                    Tổng số mặt hàng đã kiểm kê: <b>{selectedOrder.details?.length || 0}</b>
                  </Typography>
                </Box>
                <TableContainer component={Paper} elevation={3}>
                  <Table size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Tên thuốc</TableCell>
                        <TableCell>Mã đăng ký</TableCell>
                        <TableCell align="right">Số lượng</TableCell>
                        <TableCell align="right">Đơn giá</TableCell>
                        <TableCell>Thành tiền</TableCell>
                        <TableCell>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Sửa lỗi: Kiểm tra details tồn tại và là mảng */}
                      {selectedOrder.details && Array.isArray(selectedOrder.details) ? (
                        selectedOrder.details.map((item) => (
                          <TableRow key={item._id} hover>
                            <TableCell>
                              <Tooltip title={item._id}>
                                <Typography variant="body2" fontWeight="bold">
                                  {item._id.slice(-6)}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell>{item.medicine_id?.medicine_name || '-'}</TableCell>
                            <TableCell>{item.medicine_id?.license_code || '-'}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{item.unit_price}</TableCell>
                            <TableCell align="right">{(item.quantity * item.unit_price).toLocaleString()}</TableCell>
                            <TableCell>
                              <Tooltip title="Xóa phiếu kiểm kê">
                                <IconButton color="error" size="small" onClick={() => handleDeleteInspection(selectedOrder._id, item._id)}>
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            Không có dữ liệu kiểm kê
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" py={4}>
                {orders.length === 0 ? 'Không có đơn nhập nào' : 'Vui lòng chọn một đơn nhập để xem chi tiết'}
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
