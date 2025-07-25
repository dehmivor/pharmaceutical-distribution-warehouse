const cron = require('node-cron');
const mongoose = require('mongoose');
const { getBatchesExpiringAtIntervals } = require('./services/batchService');
const Notification = require('./models/Notification');
const User = require('./models/User');
const { getNotificationById } = require('./notificationService');

const createNotificationForUser = async (userId, notificationData) => {
  try {
    if (!userId) throw new Error('User ID is required');
    if (!notificationData.title || !notificationData.message)
      throw new Error('Title and message are required');

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const notification = new Notification({
      recipient_id: userId,
      sender_id: notificationData.sender_id || null,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'info',
      priority: notificationData.priority || 'normal',
      status: 'unread',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await notification.save();

    return await getNotificationById(notification._id);
  } catch (error) {
    console.error('Error creating notification:', error.message);
    throw error;
  }
};

const notifyBatches = async (batchList, months) => {
  if (!batchList || batchList.length === 0) return;

  try {
    const supervisors = await User.find({ role: 'supervisor' }).select('_id');
    if (!supervisors.length) {
      console.log('Không tìm thấy user có role supervisor để gửi thông báo');
      return;
    }

    for (const batch of batchList) {
      const medName = batch.medicine_id?.medicine_name || 'Unknown medicine';
      const expiryDate = batch.expiry_date.toDateString();

      const notificationData = {
        title: 'Thông báo Batch thuốc sắp hết hạn',
        message: `Batch ${batch.batch_code} của thuốc ${medName} sẽ hết hạn sau khoảng ${months} tháng (ngày hết hạn: ${expiryDate})`,
        type: 'expiry_alert',
        priority: 'high',
      };

      for (const sup of supervisors) {
        await createNotificationForUser(sup._id, notificationData);
      }
    }
  } catch (error) {
    console.error('Lỗi khi gửi thông báo batch:', error);
  }
};

cron.schedule('0 8 * * *', async () => {
  console.log('Bắt đầu chạy cronjob kiểm tra batch sắp hết hạn');

  try {
    const batchesByInterval = await getBatchesExpiringAtIntervals(new Date());

    await notifyBatches(batchesByInterval.sixMonths, 6);
    await notifyBatches(batchesByInterval.sevenMonths, 7);
    await notifyBatches(batchesByInterval.eightMonths, 8);

    console.log('Cronjob kiểm tra batch hết hạn đã hoàn tất');
  } catch (error) {
    console.error('Lỗi khi chạy cronjob:', error);
  }
});

module.exports = cron;
