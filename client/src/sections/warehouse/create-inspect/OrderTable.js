import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, Typography, Box } from '@mui/material';

const OrderTable = ({ orders, onSelectOrder }) => {
  const getStatusLabel = (status) => {
    const statusMap = {
      draft: 'Nháp',
      approved: 'Đã duyệt',
      delivered: 'Đã giao',
      pending: 'Chờ duyệt',
      rejected: 'Từ chối'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      draft: 'default',
      approved: 'success',
      delivered: 'info',
      pending: 'warning',
      rejected: 'error'
    };
    return colorMap[status] || 'default';
  };

  const calculateTotalAmount = (details) => {
    return details?.reduce((sum, detail) => sum + detail.quantity * detail.unit_price, 0) || 0;
  };

  if (orders.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Không tìm thấy đơn nhập nào
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Mã đơn</TableCell>
            <TableCell>Mã hợp đồng</TableCell>
            <TableCell>Nhà cung cấp</TableCell>
            <TableCell>Số mặt hàng</TableCell>
            <TableCell>Tổng tiền</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Hiệu lực HĐ</TableCell>
            <TableCell align="center">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => {
            const totalAmount = calculateTotalAmount(order.details);
            const contract = order.supplier_contract_id;
            const isExpired = contract && new Date(contract.end_date) < new Date();

            return (
              <TableRow key={order._id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {order._id?.slice(-8).toUpperCase()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{contract?.contract_code || 'N/A'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{contract?.supplier_id?.name || 'N/A'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{order.details?.length || 0} mặt hàng</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {totalAmount.toLocaleString('vi-VN')} ₫
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={getStatusLabel(order.status)} color={getStatusColor(order.status)} size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color={isExpired ? 'error.main' : 'text.secondary'}>
                    {contract ? (
                      <>
                        {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                        <br />- {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                        {isExpired && (
                          <Typography variant="caption" color="error" display="block">
                            (Đã hết hạn)
                          </Typography>
                        )}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Button variant="outlined" size="small" onClick={() => onSelectOrder(order)} disabled={order.details?.length === 0}>
                    Chọn
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OrderTable;
