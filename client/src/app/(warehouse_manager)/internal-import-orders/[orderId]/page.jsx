'use client';
import { useParams } from 'next/navigation';
import InternalImportOrderDetail from '../../../../views/warehouse-manager/internal-import-order-detail';

const InternalImportOrderDetailPage = () => {
  const params = useParams();
  const orderId = params.orderId;

  return <InternalImportOrderDetail orderId={orderId} />;
};

export default InternalImportOrderDetailPage;
