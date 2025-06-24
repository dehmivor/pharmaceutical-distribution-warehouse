import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Button } from '@mui/material';
import OrderStatusChip from './OrderStatusChip';

const OrderTable = ({ orders, onSelectOrder, searchTerm }) => {
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return order.order_code?.toLowerCase().includes(searchLower) || order.supplier_name?.toLowerCase().includes(searchLower);
  });

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Mã Đơn Hàng</TableCell>
            <TableCell>Nhà Cung Cấp</TableCell>
            <TableCell>Ngày Đặt</TableCell>
            <TableCell>Trạng Thái</TableCell>
            <TableCell align="right">Số Sản Phẩm</TableCell>
            <TableCell align="right">Tổng Tiền</TableCell>
            <TableCell align="center">Thao Tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <TableRow key={order._id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {order.order_code}
                  </Typography>
                </TableCell>
                <TableCell>{order.supplier_name}</TableCell>
                <TableCell>{new Date(order.order_date).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell>
                  <OrderStatusChip status={order.status} />
                </TableCell>
                <TableCell align="right">{order.details?.length || 0}</TableCell>
                <TableCell align="right">{order.total_amount?.toLocaleString('vi-VN') || 0} ₫</TableCell>
                <TableCell align="center">
                  <Button variant="contained" size="small" onClick={() => onSelectOrder(order)}>
                    Chọn
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                  {searchTerm ? 'Không tìm thấy đơn hàng nào phù hợp' : 'Không có đơn hàng nào trong hệ thống'}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OrderTable;
