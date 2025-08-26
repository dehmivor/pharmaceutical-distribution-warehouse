const express = require('express');
const router = express.Router();
const { cronController } = require('../controllers');
const { runRemindersNow } = require('../cron/reminderEmailJob');

router.post('/check-expired-medicines', cronController.checkExpiredMedicines);
router.post('/check-medicines-below-stock', cronController.checkMedicinesBelowStock);
router.post('/check-bills-due-date', cronController.checkBillsDueDate);

// Test route để gửi reminder emails ngay lập tức
router.post('/test-reminder-emails', async (req, res) => {
  try {
    const result = await runRemindersNow();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing reminder emails',
      error: error.message,
    });
  }
});

router.post('/delete-old-notifications', cronController.deleteOldNotifications);
router.post('/notify-supervisors-alerts', cronController.notifySupervisors);

module.exports = router;
