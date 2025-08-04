// Notification helper - Templates cho các action phổ biến
import { useNotificationContext } from '@/contexts/NotificationContext';

// Hook để sử dụng notification templates
export const useNotificationTemplates = () => {
  const { sendNotificationToUser, sendNotificationToRole, currentUser } = useNotificationContext();

  // Notification cho user được tạo
  const notifyUserCreated = async (userId, createdByUserId) => {
    try {
      await sendNotificationToUser(userId, {
        title: 'Tài khoản mới được tạo',
        message: 'Tài khoản của bạn đã được tạo thành công. Vui lòng kiểm tra email để lấy thông tin đăng nhập.',
        type: 'system',
        priority: 'medium',
        action_url: '/auth/login',
        badge_icon: 'user-created.png'
      });
    } catch (error) {
      console.error('Error sending user created notification:', error);
    }
  };

  // Notification cho import order được tạo
  const notifyImportOrderCreated = async (orderId, createdByUserId) => {
    try {
      // Gửi notification cho supervisor
      await sendNotificationToRole('supervisor', {
        title: 'Đơn hàng nhập mới',
        message: `Có đơn hàng nhập mới #${orderId} cần được duyệt.`,
        type: 'document',
        priority: 'high',
        action_url: `/supervisor/sp-import-orders`,
        badge_icon: 'import.png'
      });
    } catch (error) {
      console.error('Error sending import order created notification:', error);
    }
  };

  // Notification cho import order được approve
  const notifyImportOrderApproved = async (orderId, recipientId) => {
    try {
      await sendNotificationToUser(recipientId, {
        title: 'Đơn hàng nhập được duyệt',
        message: `Đơn hàng nhập #${orderId} đã được duyệt thành công.`,
        type: 'document',
        priority: 'medium',
        action_url: `/representative/rp-import-orders`,
        badge_icon: 'approved.png'
      });
    } catch (error) {
      console.error('Error sending import order approved notification:', error);
    }
  };

  // Notification cho import order bị reject
  const notifyImportOrderRejected = async (orderId, recipientId, reason = '') => {
    try {
      await sendNotificationToUser(recipientId, {
        title: 'Đơn hàng nhập bị từ chối',
        message: `Đơn hàng nhập #${orderId} đã bị từ chối.${reason ? ` Lý do: ${reason}` : ''}`,
        type: 'document',
        priority: 'high',
        action_url: `/representative/rp-import-orders`,
        badge_icon: 'rejected.png'
      });
    } catch (error) {
      console.error('Error sending import order rejected notification:', error);
    }
  };

  // Notification cho export order được tạo
  const notifyExportOrderCreated = async (orderId, createdByUserId) => {
    try {
      // Gửi notification cho warehouse manager
      await sendNotificationToRole('warehouse_manager', {
        title: 'Đơn hàng xuất mới',
        message: `Có đơn hàng xuất mới #${orderId} cần được xử lý.`,
        type: 'document',
        priority: 'high',
        action_url: `/warehouse-manager/wm-export-orders`,
        badge_icon: 'export.png'
      });
    } catch (error) {
      console.error('Error sending export order created notification:', error);
    }
  };

  // Notification cho contract được tạo
  const notifyContractCreated = async (contractId, createdByUserId) => {
    try {
      // Gửi notification cho representative
      await sendNotificationToRole('representative', {
        title: 'Hợp đồng mới được tạo',
        message: `Hợp đồng #${contractId} đã được tạo thành công.`,
        type: 'document',
        priority: 'medium',
        action_url: `/representative/rp-manage-contracts`,
        badge_icon: 'contract.png'
      });
    } catch (error) {
      console.error('Error sending contract created notification:', error);
    }
  };

  // Notification cho medicine được thêm vào kho
  const notifyMedicineAdded = async (medicineId, quantity, addedByUserId) => {
    try {
      // Gửi notification cho warehouse manager
      await sendNotificationToRole('warehouse_manager', {
        title: 'Thuốc mới được thêm vào kho',
        message: `Đã thêm ${quantity} đơn vị thuốc mới vào kho.`,
        type: 'inventory',
        priority: 'medium',
        action_url: `/warehouse-manager/wm-inventory`,
        badge_icon: 'medicine.png'
      });
    } catch (error) {
      console.error('Error sending medicine added notification:', error);
    }
  };

  // Notification cho inventory check
  const notifyInventoryCheck = async (checkId, checkedByUserId) => {
    try {
      // Gửi notification cho supervisor
      await sendNotificationToRole('supervisor', {
        title: 'Kiểm kê kho đã hoàn thành',
        message: `Đợt kiểm kê kho #${checkId} đã được hoàn thành.`,
        type: 'inventory',
        priority: 'medium',
        action_url: `/supervisor/sp-inventory-check-management`,
        badge_icon: 'inventory-check.png'
      });
    } catch (error) {
      console.error('Error sending inventory check notification:', error);
    }
  };

  // Notification cho bill được tạo
  const notifyBillCreated = async (billId, createdByUserId) => {
    try {
      // Gửi notification cho supervisor
      await sendNotificationToRole('supervisor', {
        title: 'Hóa đơn mới được tạo',
        message: `Hóa đơn #${billId} đã được tạo và cần được duyệt.`,
        type: 'document',
        priority: 'high',
        action_url: `/supervisor/sp-bill-management`,
        badge_icon: 'bill.png'
      });
    } catch (error) {
      console.error('Error sending bill created notification:', error);
    }
  };

  // Notification cho location được thêm
  const notifyLocationAdded = async (locationId, addedByUserId) => {
    try {
      // Gửi notification cho supervisor
      await sendNotificationToRole('supervisor', {
        title: 'Địa điểm mới được thêm',
        message: `Địa điểm mới đã được thêm vào hệ thống.`,
        type: 'location',
        priority: 'low',
        action_url: `/supervisor/sp-location-management`,
        badge_icon: 'location.png'
      });
    } catch (error) {
      console.error('Error sending location added notification:', error);
    }
  };

  // Notification cho system alert
  const notifySystemAlert = async (title, message, priority = 'medium') => {
    try {
      // Gửi notification cho tất cả users
      await sendNotificationToRole('all', {
        title,
        message,
        type: 'system_alert',
        priority,
        action_url: null,
        badge_icon: 'system-alert.png'
      });
    } catch (error) {
      console.error('Error sending system alert notification:', error);
    }
  };

  return {
    notifyUserCreated,
    notifyImportOrderCreated,
    notifyImportOrderApproved,
    notifyImportOrderRejected,
    notifyExportOrderCreated,
    notifyContractCreated,
    notifyMedicineAdded,
    notifyInventoryCheck,
    notifyBillCreated,
    notifyLocationAdded,
    notifySystemAlert
  };
};
