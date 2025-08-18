const cronService = require('../services/cronService');

const checkExpiredMedicines = async (req, res) => {
  try {
    console.log('checkExpiredMedicines called with query:', req.query);
    const refDate = req.query.date ? new Date(req.query.date) : new Date();

    console.log('Reference date:', refDate);

    const expiredUnder6Months = await cronService.getBatchesExpiredUnder6Months(refDate);
    console.log('Expired under 6 months count:', expiredUnder6Months.length);

    const batchesByInterval = await cronService.getBatchesExpiringAtIntervals(refDate);
    console.log('Batches by interval:', {
      sixMonths: batchesByInterval.sixMonths?.length || 0,
      sevenMonths: batchesByInterval.sevenMonths?.length || 0,
      eightMonths: batchesByInterval.eightMonths?.length || 0,
    });

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
