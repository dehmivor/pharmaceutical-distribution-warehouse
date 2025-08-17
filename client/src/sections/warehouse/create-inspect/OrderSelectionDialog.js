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
import useTrans from '@/hooks/useTrans';

const OrderSelectionDialog = ({ open, onClose, orders, loading, searchTerm, onSearchChange, onSelectOrder, onRefresh }) => {
  const trans = useTrans();

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
            <Typography variant="h6">
              {trans.common.selectImportOrder} ({validOrders.length} {trans.common.orders})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {trans.common.selectImportOrderDesc}
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
          placeholder={trans.common.searchByOrderContractSupplier}
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
        <Button onClick={onClose}>{trans.common.cancel}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderSelectionDialog;
