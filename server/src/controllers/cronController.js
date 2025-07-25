const cronService = require('../services/cronService'); // hoặc đường dẫn đúng chứa getBatchesExpiringAtIntervals
const { sendNotification } = require('../utils/notification');

const checkExpiredMedicines = async (req, res) => {
  try {
    const refDate = req.query.date ? new Date(req.query.date) : new Date();

    const batchesByInterval = await cronService.getBatchesExpiringAtIntervals(refDate);

    const notifyGroup = (batchList, months) => {
      batchList.forEach((batch) => {
        const medName = batch.medicine_id?.medicine_name || 'Unknown medicine';
        const expiryDate = batch.expiry_date.toDateString();

        sendNotification(
          `Thông báo: Batch ${batch.batch_code} của thuốc ${medName} sẽ hết hạn sau khoảng ${months} tháng, ngày hết hạn: ${expiryDate}`,
        );
      });
    };

    notifyGroup(batchesByInterval.sixMonths, 6);
    notifyGroup(batchesByInterval.sevenMonths, 7);
    notifyGroup(batchesByInterval.eightMonths, 8);

    return res.status(200).json({
      success: true,
      message: 'Đã kiểm tra và gửi thông báo cho các batch sắp hết hạn theo 6,7,8 tháng.',
      data: batchesByInterval,
    });
  } catch (error) {
    console.error('Lỗi checkBatchExpiries:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra batchs hết hạn.',
      error: error.message,
    });
  }
};

module.exports = {
  checkExpiredMedicines,
};
