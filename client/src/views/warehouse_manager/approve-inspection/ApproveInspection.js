'use client';
import {
  Box,
  Button,
  List,
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
import { useState, useEffect } from 'react';
import useInspection from '@/hooks/useInspection';

function ApproveInspection() {
  const { fetchInspectionForApprove, loading, error } = useInspection();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy data từ API (dạng mảng inspection)
        const data = await fetchInspectionForApprove();

        // Nhóm inspection theo import_order_id
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

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const selectedOrder = orders.find((o) => o.importOrder._id === selectedOrderId);

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
