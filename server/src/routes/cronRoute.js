const express = require('express');
const router = express.Router();
const { cronController } = require('../controllers');

router.post('/check-expired-medicines', cronController.checkExpiredMedicines);
router.post('/check-medicines-below-stock', cronController.checkMedicinesBelowStock);
router.post('/check-bills-due-date', cronController.checkBillsDueDate);

module.exports = router;
