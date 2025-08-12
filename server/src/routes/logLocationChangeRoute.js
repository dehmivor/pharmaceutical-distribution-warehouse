const express = require('express');
const router = express.Router();
const logLocationChangeController = require('../controllers/logLocationChangeController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Apply authentication middleware to all routes
router.use(authenticate);



// Get all location log
router.get(
  '/',
  authorize([
    'supervisor'
  ]),
  logLocationChangeController.getLogLocationChanges,
);

router.get(
  '/:license_code/getHistoryLast6Months',
  authorize([
    'representative',
    'representative_manager',
  ]),
  logLocationChangeController.getHistoryLast6Months,
);

module.exports = router;
