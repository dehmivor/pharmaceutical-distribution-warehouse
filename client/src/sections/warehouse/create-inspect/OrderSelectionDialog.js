import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Box,
  IconButton,
  CircularProgress,
  Typography
} from '@mui/material';
import { Search, Refresh } from '@mui/icons-material';
import OrderTable from './OrderTable';

const OrderSelectionDialog = ({ open, onClose, orders, loading, searchTerm, onSearchChange, onSelectOrder, onRefresh }) => {
  // Filter orders based on search term
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const orderCode = order._id?.slice(-8).toLowerCase() || '';
    const contractCode = order.supplier_contract_id?.contract_code?.toLowerCase() || '';
    const supplierName = order.supplier_contract_id?.supplier_id?.name?.toLowerCase() || '';

    return orderCode.includes(searchLower) || contractCode.includes(searchLower) || supplierName.includes(searchLower);
  });

  // Filter out orders with null supplier_contract_id
  const validOrders = filteredOrders.filter((order) => order.supplier_contract_id !== null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Chọn Đơn Nhập ({validOrders.length} đơn hàng)</Typography>
            <Typography variant="body2" color="text.secondary">
              Chọn đơn nhập hàng để tạo phiếu kiểm tra
            </Typography>
          </Box>
          <IconButton onClick={onRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Tìm kiếm theo mã đơn, mã hợp đồng hoặc nhà cung cấp..."
          value={searchTerm}
          onChange={onSearchChange}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <OrderTable orders={validOrders} onSelectOrder={onSelectOrder} searchTerm={searchTerm} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderSelectionDialog;
