'use client';
import {
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Avatar
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';

// MOCK DATA: importOrderList lấy từ file paste-2.txt
const importOrderList = [
  {
    _id: '68597d6929cc5b7ecb4fbd7d',
    status: 'completed',
    warehouse_manager_id: { email: 'kietjay1234+1@gmail.com' },
    details: [
      {
        _id: '68597d6929cc5b7ecb4fbd7e',
        medicine_id: {
          _id: '6856b322a0e688dd9478e28b',
          license_code: 'VN-12345-01',
          medicine_name: 'Paracetamol 500mg'
        },
        quantity: 20,
        unit_price: 50
      }
    ]
  },
  {
    _id: '68597e4c62c95723b56b3242',
    status: 'delivered',
    warehouse_manager_id: { email: 'danglqhe173350@fpt.edu.vn' },
    details: [
      {
        _id: '68597e4c62c95723b56b3243',
        medicine_id: {
          _id: '6856b322a0e688dd9478e28b',
          license_code: 'VN-12345-01',
          medicine_name: 'Paracetamol 500mg'
        },
        quantity: 1231,
        unit_price: 50
      },
      {
        _id: '685985ec92198dadb3403eb5',
        medicine_id: {
          _id: '6856b322a0e688dd9478e28e',
          license_code: 'VN-44444-22',
          medicine_name: 'Acyclovir 200mg'
        },
        quantity: 1,
        unit_price: 250
      },
      {
        _id: '685985f692198dadb3403ed8',
        medicine_id: {
          _id: '6856b322a0e688dd9478e28d',
          license_code: 'VN-33333-11',
          medicine_name: 'Amoxicillin 500mg'
        },
        quantity: 12323,
        unit_price: 500
      }
    ]
  },
  {
    _id: '6859812162c95723b56b32a9',
    status: 'delivered',
    warehouse_manager_id: { email: 'representative@test.com' },
    details: [
      {
        _id: '6859812162c95723b56b32aa',
        medicine_id: {
          _id: '6856b322a0e688dd9478e28b',
          license_code: 'VN-12345-01',
          medicine_name: 'Paracetamol 500mg'
        },
        quantity: 2132,
        unit_price: 50
      }
    ]
  }
  // ...Thêm các order khác tương tự ở đây nếu muốn
];

function ApproveInspection() {
  const [selectedOrderId, setSelectedOrderId] = useState(importOrderList[0]?._id || null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [orders, setOrders] = useState(importOrderList);

  // Xử lý xóa inspection (chỉ xóa trong mock, không gọi API)
  const handleDeleteInspection = (orderId, inspectionId) => {
    setOrders((prev) =>
      prev.map((order) => (order._id === orderId ? { ...order, details: order.details.filter((i) => i._id !== inspectionId) } : order))
    );
    setSnackbar({ open: true, message: 'Đã xóa phiếu kiểm kê!', severity: 'success' });
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  // Lấy order đang chọn
  const selectedOrder = orders.find((order) => order._id === selectedOrderId);

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Quản lý kiểm kê nhập kho</Typography>
        <Button variant="contained" color="primary" disabled>
          Hoàn thành kiểm tra
        </Button>
      </Box>
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
                  <ListItemText primary={`Đơn: ${order._id.slice(-6)}`} secondary={`Trạng thái: ${order.status}`} />
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
                <Typography variant="body2" color="text.secondary">
                  Tổng số mặt hàng đã kiểm kê: <b>{selectedOrder.details.length}</b>
                </Typography>
              </Box>
              <TableContainer component={Paper} elevation={3}>
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Tên thuốc</TableCell>
                      <TableCell>Mã đăng ký</TableCell>
                      <TableCell align="right">Số lượng trên phiếu</TableCell>
                      <TableCell align="right">Số lượng thực</TableCell>
                      <TableCell align="right">Đơn giá</TableCell>
                      <TableCell>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.details.map((item) => (
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
                        <TableCell align="right">123</TableCell>
                        <TableCell align="right">{item.unit_price}</TableCell>
                        <TableCell>
                          <Tooltip title="Xóa phiếu kiểm kê">
                            <IconButton color="error" size="small" onClick={() => handleDeleteInspection(selectedOrder._id, item._id)}>
                              <DeleteIcon />
                            </IconButton>
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
              Vui lòng chọn một đơn nhập để xem chi tiết
            </Typography>
          )}
        </Box>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <MuiAlert elevation={6} variant="filled" onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}

export default ApproveInspection;
