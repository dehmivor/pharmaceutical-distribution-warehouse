import { Chip } from '@mui/material';
import useTrans from '@/hooks/useTrans';

const OrderStatusChip = ({ status }) => {
  const trans = useTrans();

  const statusConfig = {
    pending: { label: trans.common.waitingImport, color: 'warning' },
    confirmed: { label: trans.common.confirmed, color: 'info' },
    partial: { label: trans.common.partialImport, color: 'info' },
    completed: { label: trans.common.completed, color: 'success' },
    cancelled: { label: trans.common.cancelled, color: 'error' }
  };

  const config = statusConfig[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" />;
};

export default OrderStatusChip;
