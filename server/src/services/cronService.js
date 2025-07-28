const cron = require('node-cron');
const mongoose = require('mongoose');
const { getNotificationById } = require('./notificationService');
const { User, Batch, Notification } = require('../models'); // Đã định nghĩa model

// Tạo notification cho user theo userId và data
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

// Gửi thông báo cho supervisors với danh sách batch và tháng hết hạn
const notifyBatches = async (batchList, months) => {
  if (!batchList || batchList.length === 0) return;

  try {
    const supervisors = await User.find({ role: 'supervisor' }).select('_id');
    if (!supervisors.length) {
      console.log('Không tìm thấy user có role supervisor để gửi thông báo');
      return;
    }

    // Tạo danh sách Promise gửi notification song song
    const allNotifications = [];

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
        allNotifications.push(createNotificationForUser(sup._id, notificationData));
      }
    }

    await Promise.all(allNotifications);
  } catch (error) {
    console.error('Lỗi khi gửi thông báo batch:', error);
  }
};

// Lấy batch hết hạn dưới 6 tháng kể từ refDate
const getBatchesExpiredUnder6Months = async (refDate) => {
  const endDate = new Date(refDate);
  endDate.setMonth(endDate.getMonth() + 6);

  const batches = await Batch.find({
    expiry_date: { $gte: refDate, $lt: endDate },
  }).populate('medicine_id');

  return batches;
};

// Lấy batch hết hạn khoảng 6-7, 7-8, 8-9 tháng
const getBatchesExpiringAtIntervals = async (refDate) => {
  const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const start6 = addMonths(refDate, 6);
  const end6 = addMonths(refDate, 7);

  const start7 = addMonths(refDate, 7);
  const end7 = addMonths(refDate, 8);

  const start8 = addMonths(refDate, 8);
  const end8 = addMonths(refDate, 9);

  const sixMonths = await Batch.find({
    expiry_date: { $gte: start6, $lt: end6 },
  }).populate('medicine_id');

  const sevenMonths = await Batch.find({
    expiry_date: { $gte: start7, $lt: end7 },
  }).populate('medicine_id');

  const eightMonths = await Batch.find({
    expiry_date: { $gte: start8, $lt: end8 },
  }).populate('medicine_id');

  return { sixMonths, sevenMonths, eightMonths };
};

// Cronjob chạy hàng ngày lúc 8h
cron.schedule('0 8 * * *', async () => {
  console.log('Bắt đầu chạy cronjob kiểm tra batch sắp hết hạn');

  try {
    const refDate = new Date();

    const expiredUnder6Months = await getBatchesExpiredUnder6Months(refDate);
    await notifyBatches(expiredUnder6Months, '<6');

    const batchesByInterval = await getBatchesExpiringAtIntervals(refDate);
    await notifyBatches(batchesByInterval.sixMonths, 6);
    await notifyBatches(batchesByInterval.sevenMonths, 7);
    await notifyBatches(batchesByInterval.eightMonths, 8);

    console.log('Cronjob kiểm tra batch hết hạn đã hoàn tất');
  } catch (error) {
    console.error('Lỗi khi chạy cronjob:', error);
  }
});

module.exports = {
  createNotificationForUser,
  notifyBatches,
  getBatchesExpiredUnder6Months,
  getBatchesExpiringAtIntervals,
  cron,
};
