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
      sevenMonths: batchesByInterval.sixMonths?.length || 0,
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

// Kiểm tra thuốc có tồn kho thấp so với ngưỡng tối thiểu
const checkMedicinesBelowStock = async (req, res) => {
  try {
    console.log('checkMedicinesBelowStock called');

    // Lấy thuốc theo từng mức độ tồn kho so với ngưỡng tối thiểu
    const medicinesByLevel = await cronService.getMedicinesByStockLevel();

    // Lấy tất cả thuốc dưới ngưỡng tối thiểu
    const medicinesBelowThreshold = await cronService.getMedicinesBelowStockThreshold();

    console.log('Medicines below minimum stock threshold:', {
      critical: medicinesByLevel.criticalStock?.length || 0,
      warning: medicinesByLevel.warningStock?.length || 0,
      low: medicinesByLevel.lowStock?.length || 0,
      total: medicinesBelowThreshold?.length || 0,
    });

    return res.status(200).json({
      success: true,
      message: 'Đã kiểm tra thuốc có tồn kho thấp so với ngưỡng tối thiểu',
      data: {
        medicinesByLevel,
        medicinesBelowThreshold,
        summary: {
          critical: medicinesByLevel.criticalStock?.length || 0,
          warning: medicinesByLevel.warningStock?.length || 0,
          low: medicinesByLevel.lowStock?.length || 0,
          total: medicinesBelowThreshold?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error('Lỗi checkMedicinesBelowStock:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra thuốc có tồn kho thấp.',
      error: error.message,
    });
  }
};

// Kiểm tra hóa đơn sắp đến hạn thanh toán
const checkBillsDueDate = async (req, res) => {
  try {
    console.log('checkBillsDueDate called');

    // Lấy danh sách hóa đơn sắp đến hạn
    const billsDueDate = await cronService.getBillsDueDate();

    console.log('Bills due date summary:', billsDueDate.summary);

    return res.status(200).json({
      success: true,
      message: 'Đã kiểm tra hóa đơn sắp đến hạn thanh toán',
      data: billsDueDate,
    });
  } catch (error) {
    console.error('Lỗi checkBillsDueDate:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra hóa đơn sắp đến hạn.',
      error: error.message,
    });
  }
};

const deleteOldNotifications = async (req, res) => {
  try {
    const deletedCount = await cronService.deleteNotificationsOlderThanDays(30);
    return res.status(200).json({
      success: true,
      message: `Đã xóa ${deletedCount} notification cũ hơn 30 ngày`,
    });
  } catch (error) {
    console.error('Lỗi xóa notification cũ:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa notification cũ',
      error: error.message,
    });
  }
};

const notifySupervisors = async (req, res) => {
  const io = req.app.locals.io;
  try {
    await cronService.notifySupervisorsAboutAlerts(io);
    return res.status(200).json({
      success: true,
      message: 'Notifications for supervisors about alerts sent successfully',
    });
  } catch (error) {
    console.error('Failed to notify supervisors:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending notifications to supervisors',
      error: error.message,
    });
  }
};

module.exports = {
  checkExpiredMedicines,
  checkMedicinesBelowStock,
  checkBillsDueDate,
  deleteOldNotifications,
  notifySupervisors,
};
