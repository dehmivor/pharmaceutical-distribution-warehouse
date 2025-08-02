const cronService = require('../services/cronService');

const checkExpiredMedicines = async (req, res) => {
  try {
    const refDate = req.query.date ? new Date(req.query.date) : new Date();

    const expiredUnder6Months = await cronService.getBatchesExpiredUnder6Months(refDate);

    const batchesByInterval = await cronService.getBatchesExpiringAtIntervals(refDate);

    return res.status(200).json({
      success: true,
      message: 'Đã kiểm tra và phân loại batch hết hạn',
      data: {
        expiredUnder6Months,
        ...batchesByInterval,
      },
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
