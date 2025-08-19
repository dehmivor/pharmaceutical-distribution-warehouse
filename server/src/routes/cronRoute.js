const express = require('express');
const router = express.Router();
const { cronController } = require('../controllers');

router.post('/check-expired-medicines', cronController.checkExpiredMedicines);
router.post('/check-medicines-below-stock', cronController.checkMedicinesBelowStock);

module.exports = router;
