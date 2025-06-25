import { Chip } from '@mui/material';

const OrderStatusChip = ({ status }) => {
  const statusConfig = {
    pending: { label: 'Chờ nhập', color: 'warning' },
    confirmed: { label: 'Đã xác nhận', color: 'info' },
    partial: { label: 'Nhập một phần', color: 'info' },
    completed: { label: 'Hoàn thành', color: 'success' },
    cancelled: { label: 'Đã hủy', color: 'error' }
  };

  const config = statusConfig[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" />;
};

export default OrderStatusChip;
