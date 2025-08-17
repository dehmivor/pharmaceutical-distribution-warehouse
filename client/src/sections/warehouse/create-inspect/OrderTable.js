import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, Typography, Box } from '@mui/material';
import useTrans from '@/hooks/useTrans';

const OrderTable = ({ orders, onSelectOrder }) => {
  const trans = useTrans();

  const getStatusLabel = (status) => {
    const statusMap = {
      draft: trans.common.draft,
      approved: trans.common.approved,
      delivered: trans.common.delivered,
      pending: trans.common.pending,
      rejected: trans.common.rejected
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
          {trans.common.noImportOrdersFound}
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>{trans.common.orderNumber}</TableCell>
            <TableCell>{trans.common.contractCode}</TableCell>
            <TableCell>{trans.common.supplierName}</TableCell>
            <TableCell>{trans.common.itemCount}</TableCell>
            <TableCell>{trans.common.totalAmount}</TableCell>
            <TableCell>{trans.common.status}</TableCell>
            <TableCell>{trans.common.contractValidity}</TableCell>
            <TableCell align="center">{trans.common.actions}</TableCell>
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
                  <Typography variant="body2">{contract?.contract_code || trans.common.na}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{contract?.supplier_id?.name || trans.common.na}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.details?.length || 0} {trans.common.items}
                  </Typography>
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
                            ({trans.common.expired})
                          </Typography>
                        )}
                      </>
                    ) : (
                      trans.common.na
                    )}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Button variant="outlined" size="small" onClick={() => onSelectOrder(order)} disabled={order.details?.length === 0}>
                    {trans.common.select}
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
