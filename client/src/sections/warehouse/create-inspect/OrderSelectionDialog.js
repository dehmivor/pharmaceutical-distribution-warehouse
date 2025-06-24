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
  CircularProgress
} from '@mui/material';
import { Search, Refresh } from '@mui/icons-material';
import OrderTable from './OrderTable';

const OrderSelectionDialog = ({ open, onClose, orders, loading, searchTerm, onSearchChange, onSelectOrder, onRefresh }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Chọn Đơn Nhập ({orders.length} đơn hàng)
          <IconButton onClick={onRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Tìm kiếm theo mã đơn hàng hoặc nhà cung cấp..."
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
          <OrderTable orders={orders} onSelectOrder={onSelectOrder} searchTerm={searchTerm} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderSelectionDialog;
